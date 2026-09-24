import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Execute the production TypeScript engine and save sanitizer directly.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const cache = new Map();
function loadSource(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (id) => id.startsWith(".")
    ? loadSource(`${path.resolve(path.dirname(filename), id)}.ts`)
    : require(id);
  vm.runInThisContext(`(function(require, module, exports) {\n${output}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
const { advanceCombat, combatAttackProfile, combatPauseReason } = loadSource(path.join(root, "src/lib/combat-engine.ts"));
const { defaultGameState, sanitizeGameState } = loadSource(path.join(root, "src/lib/game-state.ts"));
const { activities } = loadSource(path.join(root, "src/lib/game-content.ts"));
const original = activities.find((activity) => activity.id === "scavenger-drone");
const durable = { ...original, enemy: { ...original.enemy, hull: 100_000, shields: 0, armor: 0 } };
function fixture() {
  const state = defaultGameState();
  state.lastActiveAt = 1_000;
  state.hull = state.maxHull = 100_000;
  state.shields = 0;
  state.inventory.rations = 1000;
  state.inventory.missiles = 1000;
  state.combat.activeTaskId = original.id;
  state.combat.randomSeed = 1;
  return state;
}
const hooks = {
  hitChance: () => 100,
  incomingDamage: () => 8,
  encounterCosts: () => ({}),
  availabilityReasons: () => [],
  awardVictory: (state, target) => ({
    ...state,
    credits: state.credits + 6,
    totalActions: state.totalActions + 1,
    combat: { ...state.combat, victories: { ...state.combat.victories, [target.id]: (state.combat.victories[target.id] ?? 0) + 1 } },
  }),
};
const step = (state, elapsed, target = durable, overrides = {}, options) => advanceCombat(state, target, elapsed, { ...hooks, ...overrides }, options);
const prepared = (target = durable, state = fixture(), overrides = {}) => step(state, .001, target, overrides).state;
function playerShot(state, target = durable, overrides = {}) {
  state = structuredClone(state);
  state.combat.encounter.playerCooldown = .1;
  state.combat.encounter.enemyCooldown = 100;
  return step(state, .10001, target, overrides);
}
function enemyShot(state, overrides = {}) {
  state = structuredClone(state);
  state.combat.randomSeed = 1;
  state.combat.encounter.playerCooldown = 100;
  state.combat.encounter.enemyCooldown = .1;
  return step(state, .10001, durable, overrides);
}
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-7, `${message}: ${actual} != ${expected}`);

// Weapon damage depletes enemy shields before touching enemy hull.
const shielded = { ...durable, enemy: { ...durable.enemy, shields: 26 } };
let state = prepared(shielded);
assert.equal(combatAttackProfile(state, shielded).playerDamage, 16, "Baseline weak-target laser damage");
let result = playerShot(state, shielded);
near(result.state.combat.encounter.enemyShields, 2, "First shot only depletes shields");
assert.equal(result.state.combat.encounter.enemyHull, durable.enemy.hull);
result = playerShot(result.state, shielded);
assert.equal(result.state.combat.encounter.enemyShields, 0);
near(result.state.combat.encounter.enemyHull, durable.enemy.hull - 14, "Laser shield bonus is removed before hull spill");

// Incoming hits follow the same shield/spill rule; healthy hull continues at zero shields.
state = prepared();
state.shields = 10;
result = enemyShot(state);
assert.equal(result.state.shields, 2);
assert.equal(result.state.hull, 100_000);
result = enemyShot(result.state);
assert.equal(result.state.shields, 0);
assert.equal(result.state.hull, 99_994);
assert.equal(combatPauseReason(result.state, durable, hooks), null);

// Elapsed time and 100% legacy progress cannot award a victory without hull damage.
state = prepared(original);
state.combat.progress = 100;
const noHits = { hitChance: () => 0, incomingDamage: () => 0 };
result = step(state, 100, original, noHits);
assert.equal(result.victories, 0);
assert.equal(result.state.combat.victories[original.id] ?? 0, 0);
assert.equal(result.state.combat.encounter.enemyHull, original.enemy.hull);
assert.equal(result.state.combat.encounter.enemyShields, original.enemy.shields);
assert.ok(result.state.combat.hits.some((hit) => hit.target === "enemy" && hit.miss));

// A killing hit awards exactly once, then the same target respawns after its delay.
state = prepared(original);
state.combat.encounter.enemyShields = 0;
state.combat.encounter.enemyHull = 1;
result = playerShot(state, original);
assert.equal(result.victories, 1);
assert.equal(result.state.combat.victories[original.id], 1);
assert.equal(result.state.totalActions, 1);
assert.equal(result.state.credits, state.credits + 6);
assert.equal(result.state.combat.encounter.enemyHull, 0);
result = step(result.state, .2, original);
assert.equal(result.victories, 0, "Dead enemy cannot award repeatedly during respawn delay");
assert.equal(result.state.totalActions, 1);
result = step(result.state, 1, original);
assert.equal(result.state.combat.encounter.enemyHull, original.enemy.hull);
assert.equal(result.state.combat.encounter.enemyShields, original.enemy.shields);
result.state.combat.encounter.enemyShields = 0;
result.state.combat.encounter.enemyHull = 1;
result = playerShot(result.state, original);
assert.equal(result.state.combat.victories[original.id], 2);
assert.equal(result.state.totalActions, 2);

// Supplies are reserved once per encounter; missiles are charged for every shot, including misses.
const costs = { encounterCosts: () => ({ rations: 2 }) };
state = prepared(durable, fixture(), costs);
assert.equal(state.inventory.rations, 998);
result = playerShot(state, durable, costs);
result = playerShot(result.state, durable, costs);
assert.equal(result.state.inventory.rations, 998);
state = prepared(original, fixture(), costs);
state.combat.encounter.enemyHull = 1;
state.combat.encounter.enemyShields = 0;
result = playerShot(state, original, costs);
assert.equal(result.state.inventory.rations, 998, "Victory does not charge already-paid supplies again");
result = step(result.state, 1.1, original, costs);
assert.equal(result.state.inventory.rations, 996, "The next spawned encounter pays one fresh supply cost");
state = fixture();
state.combat.weapon = "missile";
state.inventory.missiles = 2;
state = prepared(durable, state);
assert.equal(state.inventory.missiles, 2, "Initializing an encounter does not fire a missile");
result = playerShot(state, durable, noHits);
assert.equal(result.state.inventory.missiles, 1);
assert.equal(result.state.combat.encounter.enemyHull, durable.enemy.hull);
result = playerShot(result.state, durable, noHits);
assert.equal(result.state.inventory.missiles, 0);
assert.ok(combatPauseReason(result.state, durable, hooks));
const paused = structuredClone(result.state);
result = step(result.state, 20);
assert.equal(result.state.combat.encounter.enemyHull, paused.combat.encounter.enemyHull);
assert.equal(result.state.hull, paused.hull, "A paused encounter cannot silently damage the player");
const rearmed = structuredClone(result.state);
rearmed.inventory.missiles = 1;
assert.equal(combatPauseReason(rearmed, durable, hooks), null);
const rearmedShot = playerShot(rearmed, durable, noHits);
assert.equal(rearmedShot.state.inventory.missiles, 0, "Rearming resumes firing without restarting the target");
result.state.combat.weapon = "laser";
assert.equal(combatPauseReason(result.state, durable, hooks), null);
result = playerShot(result.state);
assert.ok(result.state.combat.encounter.enemyHull < durable.enemy.hull);

// Unpaid encounters wait for resources, then resume without charging multiple times.
state = fixture();
state.inventory.rations = 1;
result = step(state, 10, durable, costs);
assert.equal(result.state.inventory.rations, 1);
assert.equal(result.victories, 0);
assert.ok(combatPauseReason(result.state, durable, { ...hooks, ...costs }));
result.state.inventory.rations = 2;
result = step(result.state, .001, durable, costs);
assert.equal(result.state.inventory.rations, 0);
assert.equal(result.state.combat.encounter.suppliesPaid, true);
assert.equal(combatPauseReason(result.state, durable, { ...hooks, ...costs }), null);

state = prepared();
const inaccessible = { availabilityReasons: () => ["Wrong sector"] };
result = step(state, 30, durable, inaccessible);
assert.equal(result.state.combat.encounter.enemyHull, state.combat.encounter.enemyHull);
assert.equal(result.state.hull, state.hull);
assert.ok(combatPauseReason(result.state, durable, { ...hooks, ...inaccessible }));

// Crossing auto-retreat stops future shots, preserving the unfinished enemy until repair.
state = prepared();
state.maxHull = 100;
state.hull = 26;
state.shields = 0;
state.retreatAt = 25;
result = enemyShot(state);
assert.equal(result.state.hull, 18);
assert.ok(combatPauseReason(result.state, durable, hooks));
const retreatEnemyHull = result.state.combat.encounter.enemyHull;
result = step(result.state, 30);
assert.equal(result.state.hull, 18);
assert.equal(result.state.combat.encounter.enemyHull, retreatEnemyHull);
result.state.hull = 100;
assert.equal(combatPauseReason(result.state, durable, hooks), null);

// One offline interval must equal the same seeded battle split into live updates.
const seeded = { hitChance: () => 63, incomingDamage: () => 2 };
state = fixture();
state.combat.randomSeed = 1234567;
const offline = step(structuredClone(state), 180, original, seeded, { emitHits: false }).state;
let live = structuredClone(state);
for (let i = 0; i < 720; i++) live = step(live, .25, original, seeded, { emitHits: false }).state;
for (const field of ["hull", "shields", "credits", "totalActions"]) assert.equal(live[field], offline[field], `Partition equivalence: ${field}`);
assert.deepEqual(live.inventory, offline.inventory);
assert.deepEqual(live.combat.victories, offline.combat.victories);
assert.equal(live.combat.randomSeed, offline.combat.randomSeed);
for (const field of ["enemyHull", "enemyShields", "playerCooldown", "enemyCooldown", "spawnDelay"]) near(live.combat.encounter[field], offline.combat.encounter[field], `Partition equivalence: ${field}`);
for (const weapon of ["laser", "railgun", "missile"]) {
  state = fixture();
  state.combat.weapon = weapon;
  state.combat.stance = "aggressive";
  state.combat.randomSeed = 87654321;
  state.powerMode = "combat";
  state.equippedGear = "gearChronoDrive";
  state.mastery.combat = 500;
  const whole = step(structuredClone(state), 90, original, seeded, { emitHits: false }).state;
  let chunks = structuredClone(state);
  for (let i = 0; i < 300; i++) chunks = step(chunks, .3, original, seeded, { emitHits: false }).state;
  assert.equal(chunks.hull, whole.hull, `${weapon} partitioned incoming damage`);
  assert.equal(chunks.totalActions, whole.totalActions, `${weapon} partitioned victories`);
  assert.equal(chunks.combat.randomSeed, whole.combat.randomSeed, `${weapon} partitioned random sequence`);
  assert.equal(chunks.combat.nextHitId, whole.combat.nextHitId, `${weapon} partitioned event sequence`);
  assert.equal(chunks.inventory.missiles, whole.inventory.missiles, `${weapon} partitioned ammunition`);
  for (const field of ["enemyHull", "enemyShields", "playerCooldown", "enemyCooldown", "spawnDelay"]) near(chunks.combat.encounter[field], whole.combat.encounter[field], `${weapon} fractional partition: ${field}`);
}

// Switching targets discards the previous target's health, timers and paid supplies.
state = prepared(durable, fixture(), costs);
state.combat.encounter.enemyHull = 1;
const newTarget = { ...original, id: "test-new-target", enemy: { ...original.enemy, hull: 77, shields: 9 } };
state.combat.activeTaskId = newTarget.id;
result = step(state, .001, newTarget, costs);
assert.equal(result.state.combat.encounter.targetId, newTarget.id);
assert.equal(result.state.combat.encounter.enemyHull, 77);
assert.equal(result.state.combat.encounter.enemyShields, 9);
assert.equal(result.state.inventory.rations, 996);
assert.equal(result.victories, 0);

// Persist cooldown fractions and RNG, but never replay old floating combat text on load.
state = playerShot(prepared()).state;
state.combat.encounter.playerCooldown = .12345;
state.combat.encounter.enemyCooldown = .98765;
const restored = sanitizeGameState(JSON.parse(JSON.stringify(state)));
assert.equal(restored.combat.encounter.playerCooldown, .12345);
assert.equal(restored.combat.encounter.enemyCooldown, .98765);
assert.equal(restored.combat.randomSeed, state.combat.randomSeed);
assert.equal(restored.combat.nextHitId, state.combat.nextHitId);
assert.deepEqual(restored.combat.hits, []);
assert.equal(restored.combat.encounter.enemyHull, state.combat.encounter.enemyHull);
const continued = step(state, 20, durable, seeded, { emitHits: false }).state;
const reloaded = step(restored, 20, durable, seeded, { emitHits: false }).state;
assert.equal(reloaded.combat.randomSeed, continued.combat.randomSeed);
assert.equal(reloaded.combat.nextHitId, continued.combat.nextHitId);
assert.equal(reloaded.combat.encounter.enemyHull, continued.combat.encounter.enemyHull);
assert.equal(reloaded.hull, continued.hull);

// A defeated target loaded during its respawn delay must never award its reward twice.
state = prepared(original);
state.combat.encounter.enemyHull = 1;
state.combat.encounter.enemyShields = 0;
const defeated = playerShot(state, original).state;
const loadedDefeat = sanitizeGameState(JSON.parse(JSON.stringify(defeated)));
result = step(loadedDefeat, .25, original);
assert.equal(result.victories, 0);
assert.equal(result.state.totalActions, defeated.totalActions);
const legacy = fixture();
delete legacy.combat.encounter;
delete legacy.combat.randomSeed;
delete legacy.combat.nextHitId;
delete legacy.combat.hits;
const migrated = sanitizeGameState(legacy);
assert.equal(migrated.combat.encounter, null);
assert.ok(Number.isInteger(migrated.combat.randomSeed));
assert.deepEqual(migrated.combat.hits, []);

// Crew-bar migration keeps legacy specialists and their service records while removing editable postings.
const legacyCrewSave = defaultGameState();
legacyCrewSave.version = 5;
legacyCrewSave.crewAssignments = { mara: "diplomacy", sol: "combat" };
delete legacyCrewSave.activeCrewIds;
delete legacyCrewSave.recruitedCrewIds;
legacyCrewSave.crewXp.mara = 725;
legacyCrewSave.crewLoyalty.mara = 87;
const migratedCrew = sanitizeGameState(legacyCrewSave);
assert.equal(migratedCrew.activeCrewIds.length, 10);
assert.equal(new Set(migratedCrew.activeCrewIds).size, 10);
assert.deepEqual(migratedCrew.activeCrewIds, ["mara", "jonas", "priya", "okafor", "sol", "mei", "rook", "elias", "vega", "anya"]);
assert.equal(migratedCrew.crewXp.mara, 725);
assert.equal(migratedCrew.crewLoyalty.mara, 87);
assert.equal("crewAssignments" in migratedCrew, false);

// Recruited specialists persist in the roster and malformed duplicate active entries cannot displace slots.
const crewBarSave = sanitizeGameState({
  ...defaultGameState(),
  recruitedCrewIds: ["kest", "kest"],
  activeCrewIds: ["kest", "kest", "jonas", "priya", "okafor", "sol", "mei", "rook", "elias", "vega", "anya"],
  crewXp: { kest: 120 },
  crewLoyalty: { kest: 65 },
});
assert.equal(crewBarSave.activeCrewIds.length, 10);
assert.equal(new Set(crewBarSave.activeCrewIds).size, 10);
assert.ok(crewBarSave.recruitedCrewIds.includes("kest"));
assert.equal(crewBarSave.crewXp.kest, 120);
assert.equal(crewBarSave.crewLoyalty.kest, 65);
for (const elapsed of [-100, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
  state = prepared();
  result = step(state, elapsed);
  assert.equal(result.victories, 0);
  assert.deepEqual(result.state, state, `Invalid elapsed ${elapsed} must not advance combat`);
}
console.log("Combat engine regressions passed: damage, misses, victories, respawn, costs, retreat, deterministic offline/live steps, target changes and save migration.");
