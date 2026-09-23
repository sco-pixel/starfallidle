import type { Activity } from "./game-content";
import type { CombatEncounter, CombatHit, GameState } from "./game-state";

export type CombatHooks = {
  hitChance: (state: GameState, target: Activity) => number;
  incomingDamage: (state: GameState, target: Activity) => number;
  encounterCosts: (state: GameState, target: Activity) => Record<string, number>;
  awardVictory: (state: GameState, target: Activity) => GameState;
  availabilityReasons: (state: GameState, target: Activity) => string[];
};

const HIT_LIFETIME = 1.3;
const RESPAWN_SECONDS = 1;
const EPSILON = 1e-9;

/** Weapon damage comes from the player's build, never from enemy HP or a victory timer. */
export function combatAttackProfile(state: GameState, target: Activity) {
  const weapon = state.combat.weapon;
  const baseDamage = 6 + state.skills.combat.level * 2 + state.equipment.railgun * 3 + state.shipModules.cic + state.drones.combat;
  const weaponPower = weapon === "laser" ? 1 : weapon === "railgun" ? 1.8 : 2.8;
  const weakness = target.enemy?.weakness === weapon ? 1.35 : 1;
  const gearPower = state.equippedGear === "gearPhaseLance" ? 1.15 : state.equippedGear === "gearStarfallCrown" ? 1.1 : 1;
  const stance = state.combat.stance === "aggressive" ? (state.skills.combat.level >= 10 ? 0.78 : 0.83) : state.combat.stance === "defensive" ? 1.2 : 1;
  const mastery = Math.max(0.72, 1 - Math.floor(state.mastery.combat / 100) * 0.01) * ((state.operationMastery[target.id] ?? 0) >= 100 ? 0.9 : 1);
  const power = state.powerMode === "combat" ? 0.88 : 1;
  const research = state.researchUnlocked.includes("efficient-cycles") ? 0.95 : 1;
  const gearSpeed = state.equippedGear === "gearChronoDrive" ? 0.92 : state.equippedGear === "gearStarfallCrown" ? 0.96 : 1;
  const conditions = state.statusEffects.includes("overheating") ? 1.1 : state.statusEffects.includes("radiation") ? 1.05 : 1;
  return {
    playerInterval: Math.max(0.25, (weapon === "laser" ? 1 : weapon === "railgun" ? 1.8 : 2.4) * stance * mastery * power * research * gearSpeed * conditions),
    playerDamage: Math.max(1, Math.round(baseDamage * weaponPower * weakness * gearPower)),
    enemyInterval: target.enemy?.class.includes("Boss") ? 2.5 : 2.8,
  };
}

function costsForEncounter(state: GameState, target: Activity, hooks: CombatHooks) {
  // Ammunition is always charged per shot, separately from encounter supplies.
  return Object.entries(hooks.encounterCosts(state, target)).filter(([id, amount]) => id !== "missiles" && Number.isFinite(amount) && amount > 0);
}

export function combatPauseReason(state: GameState, target: Activity, hooks: CombatHooks): string | null {
  const unavailable = hooks.availabilityReasons(state, target)[0];
  if (unavailable) return unavailable;
  if (state.shields <= 0 && state.hull <= state.maxHull * state.retreatAt / 100) {
    return `Auto-retreat engaged: hull is ${state.hull}/${state.maxHull} at the ${state.retreatAt}% threshold; repair hull or lower the threshold`;
  }
  if (state.combat.weapon === "missile" && (state.inventory.missiles ?? 0) < 1) return "Missile magazine empty; replenish missiles or switch weapons";
  const encounter = state.combat.encounter;
  if (!encounter || encounter.targetId !== target.id || !encounter.suppliesPaid) {
    for (const [id, amount] of costsForEncounter(state, target, hooks)) {
      const held = state.inventory[id] ?? 0;
      if (held < amount) return `Missing ${amount - held} ${id} (${held}/${amount} ready)`;
    }
  }
  return null;
}

function freshEncounter(state: GameState, target: Activity): CombatEncounter {
  const profile = combatAttackProfile(state, target);
  return {
    targetId: target.id,
    enemyHull: target.enemy!.hull,
    enemyShields: target.enemy!.shields,
    playerCooldown: profile.playerInterval,
    enemyCooldown: profile.enemyInterval,
    spawnDelay: 0,
    suppliesPaid: false,
  };
}

/** Settle engagement entry before other systems inspect shared supplies; no clock time passes. */
export function prepareCombatEncounter(state: GameState, target: Activity, hooks: CombatHooks): GameState {
  if (state.combat.activeTaskId !== target.id || !target.enemy) return state;
  const current = state.combat.encounter;
  const needsSpawn = !current || current.targetId !== target.id || (current.enemyHull <= 0 && current.spawnDelay <= EPSILON);
  let next = needsSpawn ? { ...state, combat: { ...state.combat, encounter: freshEncounter(state, target) } } : state;
  const encounter = next.combat.encounter!;
  if (encounter.enemyHull <= 0 || encounter.suppliesPaid || combatPauseReason(next, target, hooks)) return next;
  const inventory = { ...next.inventory };
  for (const [id, amount] of costsForEncounter(next, target, hooks)) inventory[id] = (inventory[id] ?? 0) - amount;
  next = { ...next, inventory, combat: { ...next.combat, encounter: { ...encounter, suppliesPaid: true } } };
  return next;
}

/** Advance attack events in timestamp order, identically for live ticks and offline catch-up. */
export function advanceCombat(state: GameState, target: Activity, elapsedSeconds: number, hooks: CombatHooks, options: { emitHits?: boolean } = {}) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return { state, victories: 0 };
  const emitHits = options.emitHits !== false;
  let next: GameState = {
    ...state,
    inventory: { ...state.inventory },
    combat: {
      ...state.combat,
      encounter: state.combat.encounter ? { ...state.combat.encounter } : null,
      hits: emitHits ? state.combat.hits.map((hit) => ({ ...hit })) : [],
    },
  };
  let remaining = elapsedSeconds;
  let victories = 0;
  const ageHits = (seconds: number) => {
    next.combat.hits = next.combat.hits.map((hit) => ({ ...hit, age: hit.age + seconds })).filter((hit) => hit.age < HIT_LIFETIME - EPSILON);
  };
  const hit = (event: Omit<CombatHit, "id" | "age">) => {
    const id = next.combat.nextHitId;
    next.combat.nextHitId = id >= Number.MAX_SAFE_INTEGER ? 1 : id + 1;
    if (emitHits) next.combat.hits = [...next.combat.hits, { ...event, id, age: 0 }].slice(-12);
  };
  const random = () => {
    let seed = next.combat.randomSeed || 0x9e3779b9;
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    next.combat.randomSeed = seed >>> 0;
    return next.combat.randomSeed / 0x100000000;
  };
  if (next.combat.activeTaskId !== target.id || !target.enemy) {
    ageHits(remaining);
    return { state: next, victories };
  }
  next = prepareCombatEncounter(next, target, hooks);
  // Loaded HP is bounded to the current enemy definition without healing valid saved damage.
  next.combat.encounter!.enemyHull = Math.min(target.enemy.hull, next.combat.encounter!.enemyHull);
  next.combat.encounter!.enemyShields = Math.min(target.enemy.shields, next.combat.encounter!.enemyShields);

  while (remaining > EPSILON) {
    let encounter = next.combat.encounter!;
    // A defeated target has already paid its reward. Loading this state cannot pay it again.
    if (encounter.enemyHull <= 0) {
      const step = Math.min(remaining, encounter.spawnDelay);
      encounter.spawnDelay = Math.max(0, encounter.spawnDelay - step);
      remaining -= step;
      ageHits(step);
      if (encounter.spawnDelay > EPSILON) break;
      next.combat.encounter = freshEncounter(next, target);
      encounter = next.combat.encounter;
      if (remaining <= EPSILON) break;
    }
    next = prepareCombatEncounter(next, target, hooks);
    encounter = next.combat.encounter!;
    if (combatPauseReason(next, target, hooks)) break;

    const step = Math.min(remaining, encounter.playerCooldown, encounter.enemyCooldown);
    encounter.playerCooldown = Math.max(0, encounter.playerCooldown - step);
    encounter.enemyCooldown = Math.max(0, encounter.enemyCooldown - step);
    remaining -= step;
    ageHits(step);

    // Resolve player fire first on an exact tie; a destroyed enemy cannot retaliate.
    if (encounter.playerCooldown <= EPSILON) {
      const profile = combatAttackProfile(next, target);
      const weapon = next.combat.weapon;
      encounter.playerCooldown = profile.playerInterval;
      if (weapon === "missile") next.inventory.missiles = Math.max(0, (next.inventory.missiles ?? 0) - 1);
      const landed = random() * 100 < Math.max(0, Math.min(100, hooks.hitChance(next, target)));
      let shieldDamage = 0;
      let hullDamage = 0;
      if (landed) {
        const shieldMultiplier = weapon === "laser" ? 1.5 : weapon === "railgun" ? 0.7 : 1;
        shieldDamage = Math.min(encounter.enemyShields, Math.round(profile.playerDamage * shieldMultiplier));
        const hullPower = encounter.enemyShields > shieldDamage ? 0 : Math.max(0, profile.playerDamage - shieldDamage / shieldMultiplier);
        const armor = target.enemy.armor * (weapon === "railgun" ? 0.2 : weapon === "missile" ? 0.4 : 0.6);
        hullDamage = hullPower > EPSILON ? Math.min(encounter.enemyHull, Math.max(1, Math.floor(hullPower - armor))) : 0;
        encounter.enemyShields -= shieldDamage;
        encounter.enemyHull -= hullDamage;
      }
      hit({ target: "enemy", shieldDamage, hullDamage, miss: !landed, weapon });
      if (encounter.enemyHull <= 0) {
        encounter.enemyHull = 0;
        encounter.spawnDelay = RESPAWN_SECONDS;
        encounter.suppliesPaid = false;
        next = hooks.awardVictory(next, target);
        // Reward hooks may return a new state; keep our already-settled encounter and event log.
        next = { ...next, inventory: { ...next.inventory }, combat: { ...next.combat, encounter: { ...encounter }, hits: [...next.combat.hits] } };
        victories += 1;
        continue;
      }
    }
    if (encounter.enemyCooldown <= EPSILON) {
      encounter.enemyCooldown = combatAttackProfile(next, target).enemyInterval;
      const damage = Math.max(0, Math.floor(hooks.incomingDamage(next, target)));
      const shieldDamage = Math.min(next.shields, damage);
      const hullDamage = Math.min(next.hull, damage - shieldDamage);
      next.shields -= shieldDamage;
      next.hull -= hullDamage;
      hit({ target: "player", shieldDamage, hullDamage, miss: false, weapon: "enemy" });
    }
  }
  ageHits(remaining);
  // This legacy field is no longer the source of combat victories or enemy damage.
  next.combat.progress = 0;
  return { state: next, victories };
}
