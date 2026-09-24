export const SKILL_IDS = [
  "mining", "salvage", "botany", "engineering", "science", "combat",
  "astrogation", "drones", "metallurgy", "biochemistry", "logistics",
  "medicine", "diplomacy", "archaeology",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];
export type SkillProgress = { xp: number; level: number };
export type ActiveTask = { skillId: SkillId; activityId: string };
export type ShipModuleId = "bridge" | "cic" | "cargo" | "hydroponics" | "fabricator" | "lab" | "medbay" | "reactor" | "hangar";
export type EquipmentId = "cutter" | "exosuit" | "scanner" | "railgun" | "shield";
export type DroneId = "mining" | "salvage" | "survey" | "combat" | "cargo";
export type VehicleId = "rover" | "boardingShuttle";
export type CombatWeapon = "laser" | "railgun" | "missile";
export type CombatStance = "balanced" | "aggressive" | "defensive";
export type PowerMode = "balanced" | "industrial" | "research" | "combat" | "navigation";
export type StatusEffect = "radiation" | "hullBreach" | "sensorDisruption" | "overheating";
export type OutpostType = "mining" | "research" | "trade";
export const ACTIVE_CREW_SLOTS = 10;
export const STARTING_CREW_IDS = ["mara", "jonas", "priya", "okafor", "sol", "mei", "rook", "elias", "vega", "anya"] as const;
const KNOWN_CREW_IDS = [
  ...STARTING_CREW_IDS,
  "kest", "sable", "nadi", "dara", "miko", "iora", "soren", "tamsin", "oren", "ves",
  "brin", "yara", "tor", "linn", "garr", "cel", "pax", "aeri", "dell", "rhea",
  "nox", "thea", "quill", "kira", "unit-9",
] as const;
export type CombatEncounter = {
  targetId: string;
  enemyHull: number;
  enemyShields: number;
  playerCooldown: number;
  enemyCooldown: number;
  spawnDelay: number;
  suppliesPaid: boolean;
};
export type CombatHit = {
  id: number;
  target: "player" | "enemy";
  shieldDamage: number;
  hullDamage: number;
  miss: boolean;
  weapon: CombatWeapon | "enemy";
  age: number;
};
export type CombatState = {
  weapon: CombatWeapon;
  stance: CombatStance;
  activeTaskId: string | null;
  progress: number;
  victories: Record<string, number>;
  streak: number;
  bestStreak: number;
  lastLoot: string | null;
  encounter: CombatEncounter | null;
  randomSeed: number;
  nextHitId: number;
  hits: CombatHit[];
};

export type GameState = {
  version: 6;
  displayName: string;
  credits: number;
  skills: Record<SkillId, SkillProgress>;
  mastery: Record<SkillId, number>;
  operationMastery: Record<string, number>;
  operationCounts: Record<string, number>;
  inventory: Record<string, number>;
  equipment: Record<EquipmentId, number>;
  activeTask: ActiveTask;
  progress: number;
  totalActions: number;
  claimedObjectives: string[];
  lastActiveAt: number;
  sectorId: string;
  shipModules: Record<ShipModuleId, number>;
  activeCrewIds: string[];
  recruitedCrewIds: string[];
  crewXp: Record<string, number>;
  crewLoyalty: Record<string, number>;
  crewMorale: number;
  powerMode: PowerMode;
  outposts: Record<string, { type: OutpostType; level: number }>;
  drones: Record<DroneId, number>;
  vehicles: Record<VehicleId, number>;
  researchUnlocked: string[];
  collection: string[];
  factions: Record<string, number>;
  contractsCompleted: string[];
  factionAlly: string | null;
  missionsCompleted: string[];
  activeExpedition: { id: string; endsAt: number } | null;
  completedExpeditions: number;
  achievements: string[];
  hull: number;
  maxHull: number;
  shields: number;
  retreatAt: number;
  equippedGear: string | null;
  statusEffects: StatusEffect[];
  combat: CombatState;
  storyLog: string[];
  pendingEvent: string | null;
};

const startingInventory: Record<string, number> = {
  ferrite: 12, cobalt: 0, iridium: 0, salvage: 8, circuits: 2, algae: 0,
  rations: 4, plating: 0, powerCell: 2, data: 0, relic: 0, medicine: 2,
  catalyst: 0, navData: 0, droneParts: 0, fuelRod: 2, artefact: 0, missiles: 6,
  titanium: 0, phaseCrystal: 0, darkMatter: 0, quantumDust: 0, neutronium: 0,
  quantumCircuit: 0, ancientCore: 0, xenoFiber: 0, neuralGel: 0, quantumParts: 0,
  titaniumPlate: 0, quantumAlloy: 0, neutroniumPlate: 0, singularityCore: 0,
  genesisSeed: 0, genesisCompound: 0, voidData: 0, commandToken: 0,
  phaseFilament: 0, bioLumen: 0, voidLens: 0, sentinelCipher: 0,
  riftAlloy: 0, phaseLattice: 0, repairNanites: 0,
  gearPhaseLance: 0, gearLivingBulwark: 0, gearChronoDrive: 0, gearFoundryHeart: 0, gearStarfallCrown: 0,
};

export const MAX_SKILL_LEVEL = 100;

// Starfall's progression curve: quick qualifications at low levels, followed by
// a long exponential specialist journey. Thresholds are cumulative XP.
const XP_THRESHOLDS = Array.from({ length: MAX_SKILL_LEVEL + 1 }, (_, index) => {
  if (index <= 1) return 0;
  let total = 0;
  for (let rank = 1; rank < index; rank += 1) {
    total += Math.floor(50 + 18 * Math.pow(rank, 1.55) + 32 * Math.pow(1.11, rank));
  }
  return total;
});

export function xpForLevel(level: number) {
  const boundedLevel = Math.max(1, Math.min(MAX_SKILL_LEVEL, Math.floor(level)));
  return XP_THRESHOLDS[boundedLevel];
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (level < MAX_SKILL_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

function legacyXpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.floor(55 * Math.pow(level - 1, 1.65));
}

function legacyLevelFromXp(xp: number) {
  let level = 1;
  while (level < 99 && xp >= legacyXpForLevel(level + 1)) level += 1;
  return level;
}

function migrateSkillXp(raw: Record<string, unknown>, saveVersion: number) {
  const rawXp = boundedNumber(raw.xp, 0);
  if (saveVersion >= 4) return rawXp;

  const legacyLevel = Math.max(1, Math.min(99, boundedNumber(raw.level, legacyLevelFromXp(rawXp), 99)));
  const oldStart = legacyXpForLevel(legacyLevel);
  const oldEnd = legacyXpForLevel(legacyLevel + 1);
  const progress = Math.max(0, Math.min(1, (rawXp - oldStart) / Math.max(1, oldEnd - oldStart)));
  const newStart = xpForLevel(legacyLevel);
  const newEnd = xpForLevel(legacyLevel + 1);
  return newStart + Math.floor(progress * (newEnd - newStart));
}

export function defaultGameState(): GameState {
  const skills = Object.fromEntries(SKILL_IDS.map((id) => [id, { xp: 0, level: 1 }])) as Record<SkillId, SkillProgress>;
  const mastery = Object.fromEntries(SKILL_IDS.map((id) => [id, 0])) as Record<SkillId, number>;
  return {
    version: 6,
    displayName: "",
    credits: 180,
    skills,
    mastery,
    operationMastery: {},
    operationCounts: {},
    inventory: { ...startingInventory },
    equipment: { cutter: 1, exosuit: 1, scanner: 1, railgun: 1, shield: 1 },
    activeTask: { skillId: "mining", activityId: "ferrite-outcrop" },
    progress: 0,
    totalActions: 0,
    claimedObjectives: [],
    lastActiveAt: Date.now(),
    sectorId: "erebus",
    shipModules: { bridge: 1, cic: 1, cargo: 1, hydroponics: 1, fabricator: 1, lab: 1, medbay: 1, reactor: 1, hangar: 1 },
    activeCrewIds: [...STARTING_CREW_IDS],
    recruitedCrewIds: [...STARTING_CREW_IDS],
    crewXp: Object.fromEntries(KNOWN_CREW_IDS.map((id) => [id, 0])),
    crewLoyalty: Object.fromEntries(KNOWN_CREW_IDS.map((id) => [id, 50])),
    crewMorale: 80,
    powerMode: "balanced",
    outposts: {},
    drones: { mining: 0, salvage: 0, survey: 0, combat: 0, cargo: 0 },
    vehicles: { rover: 0, boardingShuttle: 0 },
    researchUnlocked: [],
    collection: [],
    factions: { patrol: 0, prospectors: 0, institute: 0, frontier: 0, corsairs: 0 },
    contractsCompleted: [],
    factionAlly: null,
    missionsCompleted: [],
    activeExpedition: null,
    completedExpeditions: 0,
    achievements: [],
    hull: 100,
    maxHull: 100,
    shields: 40,
    retreatAt: 25,
    equippedGear: null,
    statusEffects: [],
    combat: { weapon: "laser", stance: "balanced", activeTaskId: null, progress: 0, victories: {}, streak: 0, bestStreak: 0, lastLoot: null, encounter: null, randomSeed: 0x9e3779b9, nextHitId: 1, hits: [] },
    storyLog: ["Aethelgard docked at Erebus Station."],
    pendingEvent: null,
  };
}

function boundedNumber(value: unknown, fallback: number, max = 1_000_000_000) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.floor(value)))
    : fallback;
}

function stringList(value: unknown, max = 200) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, max) : [];
}

function numericRecord<T extends string>(value: unknown, defaults: Record<T, number>, max = 1_000_000) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, boundedNumber(input[key], fallback as number, max)])) as Record<T, number>;
}

function looseNumericRecord(value: unknown, max = 10_000_000) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(input).filter(([key]) => key.length < 100).slice(0, 500).map(([key, amount]) => [key, boundedNumber(amount, 0, max)]));
}

function crewIdList(value: unknown) {
  return Array.from(new Set(stringList(value, KNOWN_CREW_IDS.length).filter((id) => (KNOWN_CREW_IDS as readonly string[]).includes(id))));
}

function crewRecord(value: unknown, fallback: number, max: number) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(KNOWN_CREW_IDS.map((id) => [id, boundedNumber(input[id], fallback, max)]));
}

function sanitizeCrewRoster(input: Record<string, unknown>) {
  const requestedRecruits = crewIdList(input.recruitedCrewIds);
  const recruited = Array.from(new Set([...STARTING_CREW_IDS, ...requestedRecruits]));
  const requestedActive = crewIdList(input.activeCrewIds).filter((id) => recruited.includes(id));
  const active = Array.from(new Set([...requestedActive, ...STARTING_CREW_IDS.filter((id) => recruited.includes(id)), ...recruited])).slice(0, ACTIVE_CREW_SLOTS);
  return { active, recruited };
}

function sanitizeCombatEncounter(value: unknown, activeTaskId: unknown): CombatEncounter | null {
  if (!value || typeof value !== "object") return null;
  const encounter = value as Record<string, unknown>;
  if (typeof encounter.targetId !== "string" || encounter.targetId !== activeTaskId || encounter.targetId.length > 80) return null;
  const boundedSeconds = (seconds: unknown, fallback: number, maximum = 60) => typeof seconds === "number" && Number.isFinite(seconds)
    ? Math.max(0, Math.min(maximum, seconds)) : fallback;
  return {
    targetId: encounter.targetId,
    enemyHull: boundedNumber(encounter.enemyHull, 1, 1_000_000),
    enemyShields: boundedNumber(encounter.enemyShields, 0, 1_000_000),
    playerCooldown: boundedSeconds(encounter.playerCooldown, 1),
    enemyCooldown: boundedSeconds(encounter.enemyCooldown, 2.8),
    spawnDelay: boundedSeconds(encounter.spawnDelay, 0, 5),
    suppliesPaid: encounter.suppliesPaid === true,
  };
}

export function sanitizeGameState(value: unknown): GameState {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const defaults = defaultGameState();
  const legacyAlloy = boundedNumber(input.alloy, 0);
  const inventoryInput = input.inventory && typeof input.inventory === "object" ? input.inventory as Record<string, unknown> : {};
  const skillsInput = input.skills && typeof input.skills === "object" ? input.skills as Record<string, unknown> : {};
  const masteryInput = input.mastery && typeof input.mastery === "object" ? input.mastery as Record<string, unknown> : {};
  const equipmentInput = input.equipment && typeof input.equipment === "object" ? input.equipment as Record<string, unknown> : {};
  const taskInput = input.activeTask && typeof input.activeTask === "object" ? input.activeTask as Record<string, unknown> : {};
  const expeditionInput = input.activeExpedition && typeof input.activeExpedition === "object" ? input.activeExpedition as Record<string, unknown> : null;
  const combatInput = input.combat && typeof input.combat === "object" ? input.combat as Record<string, unknown> : {};
  const victoriesInput = combatInput.victories && typeof combatInput.victories === "object" ? combatInput.victories as Record<string, unknown> : {};
  const saveVersion = boundedNumber(input.version, 0, 6);
  const outpostsInput = input.outposts && typeof input.outposts === "object" ? input.outposts as Record<string, unknown> : {};

  const skills = Object.fromEntries(SKILL_IDS.map((id) => {
    const raw = skillsInput[id] && typeof skillsInput[id] === "object" ? skillsInput[id] as Record<string, unknown> : {};
    const xp = migrateSkillXp(raw, saveVersion);
    return [id, { xp, level: levelFromXp(xp) }];
  })) as Record<SkillId, SkillProgress>;
  const mastery = Object.fromEntries(SKILL_IDS.map((id) => [id, boundedNumber(masteryInput[id], 0, 1_000_000)])) as Record<SkillId, number>;
  const inventory = Object.fromEntries(Object.entries(startingInventory).map(([key, fallback]) => {
    let migratedFallback = fallback;
    if (key === "ferrite") migratedFallback += legacyAlloy;
    if (key === "powerCell" && Number(input.version ?? 0) < 3) migratedFallback = Math.max(2, boundedNumber(inventoryInput[key], 0));
    return [key, boundedNumber(inventoryInput[key], migratedFallback)];
  }));
  const rawSkillId = SKILL_IDS.includes(taskInput.skillId as SkillId) ? taskInput.skillId as SkillId : "mining";
  const legacyCombatTask = rawSkillId === "combat" && typeof taskInput.activityId === "string" ? taskInput.activityId.slice(0, 80) : null;
  const skillId: SkillId = rawSkillId === "combat" ? "mining" : rawSkillId;
  const roster = sanitizeCrewRoster(input);

  return {
    version: 6,
    displayName: typeof input.displayName === "string" ? input.displayName.trim().slice(0, 32) : "",
    credits: boundedNumber(input.credits, defaults.credits),
    skills,
    mastery,
    operationMastery: looseNumericRecord(input.operationMastery, 100),
    operationCounts: looseNumericRecord(input.operationCounts),
    inventory,
    equipment: {
      cutter: Math.max(1, boundedNumber(equipmentInput.cutter, 1, 100)),
      exosuit: Math.max(1, boundedNumber(equipmentInput.exosuit, boundedNumber(input.hullLevel, 1, 100), 100)),
      scanner: Math.max(1, boundedNumber(equipmentInput.scanner, 1, 100)),
      railgun: Math.max(1, boundedNumber(equipmentInput.railgun, 1, 100)),
      shield: Math.max(1, boundedNumber(equipmentInput.shield, 1, 100)),
    },
    activeTask: {
      skillId,
      activityId: skillId === rawSkillId && typeof taskInput.activityId === "string" && taskInput.activityId.length < 80 ? taskInput.activityId : "ferrite-outcrop",
    },
    progress: rawSkillId !== "combat" && typeof input.progress === "number" && Number.isFinite(input.progress) ? Math.max(0, Math.min(99.99, input.progress)) : 0,
    totalActions: boundedNumber(input.totalActions, boundedNumber(input.cycles, 0)),
    claimedObjectives: stringList(input.claimedObjectives, 100),
    lastActiveAt: boundedNumber(input.lastActiveAt, Date.now(), Date.now() + 60_000),
    sectorId: typeof input.sectorId === "string" ? input.sectorId.slice(0, 50) : defaults.sectorId,
    shipModules: numericRecord(input.shipModules, defaults.shipModules, 50),
    activeCrewIds: roster.active,
    recruitedCrewIds: roster.recruited,
    crewXp: crewRecord(input.crewXp, 0, 10_000_000),
    crewLoyalty: crewRecord(input.crewLoyalty, 50, 100),
    crewMorale: boundedNumber(input.crewMorale, defaults.crewMorale, 100),
    powerMode: ["balanced", "industrial", "research", "combat", "navigation"].includes(String(input.powerMode)) ? input.powerMode as PowerMode : "balanced",
    outposts: Object.fromEntries(Object.entries(outpostsInput).filter(([sectorId, value]) => ["erebus", "helix", "cinder", "orpheus", "silent"].includes(sectorId) && value && typeof value === "object").map(([sectorId, value]) => {
      const raw = value as Record<string, unknown>;
      const type = ["mining", "research", "trade"].includes(String(raw.type)) ? raw.type as OutpostType : "mining";
      return [sectorId, { type, level: Math.max(1, boundedNumber(raw.level, 1, 10)) }];
    })),
    drones: numericRecord(input.drones, defaults.drones, 100),
    vehicles: numericRecord(input.vehicles, defaults.vehicles, 20),
    researchUnlocked: stringList(input.researchUnlocked),
    collection: stringList(input.collection, 500),
    factions: numericRecord(input.factions, defaults.factions, 100),
    contractsCompleted: stringList(input.contractsCompleted, 500),
    factionAlly: typeof input.factionAlly === "string" && ["patrol", "prospectors", "institute", "frontier", "corsairs"].includes(input.factionAlly) ? input.factionAlly : null,
    missionsCompleted: stringList(input.missionsCompleted, 100),
    activeExpedition: expeditionInput && typeof expeditionInput.id === "string"
      ? { id: expeditionInput.id.slice(0, 60), endsAt: boundedNumber(expeditionInput.endsAt, Date.now(), Date.now() + 7 * 86_400_000) }
      : null,
    completedExpeditions: boundedNumber(input.completedExpeditions, 0, 1_000_000),
    achievements: stringList(input.achievements, 500),
    hull: boundedNumber(input.hull, defaults.hull, 100_000),
    maxHull: Math.max(1, boundedNumber(input.maxHull, defaults.maxHull, 100_000)),
    shields: boundedNumber(input.shields, defaults.shields, 100_000),
    retreatAt: boundedNumber(input.retreatAt, defaults.retreatAt, 90),
    equippedGear: typeof input.equippedGear === "string" ? input.equippedGear.slice(0, 80) : null,
    statusEffects: stringList(input.statusEffects, 4).filter((effect): effect is StatusEffect => ["radiation", "hullBreach", "sensorDisruption", "overheating"].includes(effect)),
    combat: {
      weapon: ["laser", "railgun", "missile"].includes(String(combatInput.weapon)) ? combatInput.weapon as CombatWeapon : "laser",
      stance: ["balanced", "aggressive", "defensive"].includes(String(combatInput.stance)) ? combatInput.stance as CombatStance : "balanced",
      activeTaskId: typeof combatInput.activeTaskId === "string" ? combatInput.activeTaskId.slice(0, 80) : legacyCombatTask,
      progress: typeof combatInput.progress === "number" && Number.isFinite(combatInput.progress)
        ? Math.max(0, Math.min(99.99, combatInput.progress))
        : legacyCombatTask && typeof input.progress === "number" && Number.isFinite(input.progress) ? Math.max(0, Math.min(99.99, input.progress)) : 0,
      victories: Object.fromEntries(Object.entries(victoriesInput).filter(([id]) => id.length < 80).slice(0, 100).map(([id, amount]) => [id, boundedNumber(amount, 0, 10_000_000)])),
      streak: boundedNumber(combatInput.streak, 0, 10_000_000),
      bestStreak: boundedNumber(combatInput.bestStreak, 0, 10_000_000),
      lastLoot: typeof combatInput.lastLoot === "string" ? combatInput.lastLoot.slice(0, 120) : null,
      encounter: sanitizeCombatEncounter(combatInput.encounter, combatInput.activeTaskId),
      randomSeed: Math.max(1, boundedNumber(combatInput.randomSeed, defaults.combat.randomSeed, 0xffffffff)),
      nextHitId: Math.max(1, boundedNumber(combatInput.nextHitId, 1, Number.MAX_SAFE_INTEGER)),
      hits: [], // Hitsplats are transient visual events; never replay them after loading a save.
    },
    storyLog: stringList(input.storyLog, 30).length ? stringList(input.storyLog, 30) : defaults.storyLog,
    pendingEvent: typeof input.pendingEvent === "string" ? input.pendingEvent.slice(0, 60) : null,
  };
}
