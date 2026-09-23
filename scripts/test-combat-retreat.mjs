import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Exercise the actual engine functions without mounting the UI or changing public exports.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const cache = new Map();
function loadSource(filename, extraSource = "") {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = readFileSync(filename, "utf8") + extraSource;
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (id) => {
    if (id.startsWith("@/components/")) return {}; // UI imports are never invoked by these tests.
    if (id.startsWith("@/") || id.startsWith(".")) {
      const resolved = id.startsWith("@/") ? path.join(root, "src", id.slice(2)) : path.resolve(path.dirname(filename), id);
      return loadSource(`${resolved}.ts`);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require, module, exports) {\n${output}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}

const { advanceGameTime, operationPauseReasons, combatDamage, applyOffline } = loadSource(
  path.join(root, "src/game/GameShell.tsx"),
  "\nexport { advanceGameTime, operationPauseReasons, combatDamage, applyOffline };",
);
const { defaultGameState, sanitizeGameState, xpForLevel } = loadSource(path.join(root, "src/lib/game-state.ts"));
const { activities } = loadSource(path.join(root, "src/lib/game-content.ts"));
const target = activities.find((activity) => activity.id === "scavenger-drone");
const fixture = (hull = 100, shields = 40) => {
  const state = defaultGameState();
  state.maxHull = 100;
  state.hull = hull;
  state.shields = shields;
  state.retreatAt = 25;
  state.combat.activeTaskId = target.id;
  state.combat.randomSeed = 1;
  return state;
};
const paused = (state) => operationPauseReasons(state, target).some((reason) => reason.startsWith("Auto-retreat"));
const damage = combatDamage(fixture(100, 0), target);
assert.equal(damage, 2, "Fixture damage should match the observed near-threshold bug");

// The actual live callback advances quarter-second ticks. HP changes on shots, not timer completion.
let state = fixture();
for (let i = 0; i < 3; i++) state = advanceGameTime(state, .25).state;
assert.equal(state.combat.encounter.enemyHull, 30);
assert.equal(state.combat.encounter.enemyShields, 5);
assert.equal(state.combat.victories[target.id] ?? 0, 0);
let result = advanceGameTime(state, .25);
assert.equal(result.state.combat.encounter.enemyShields, 0);
assert.equal(result.state.combat.encounter.enemyHull, 19, "Real target armor and laser shield spill apply to the first hit");
assert.equal(result.combatActions, 0);
assert.equal(result.state.skills.combat.xp, 0);
assert.ok(result.state.combat.hits.some((hit) => hit.target === "enemy" && hit.shieldDamage === 5 && hit.hullDamage === 11));

// Give the enemy an imminent attack while postponing player fire to isolate defensive behavior.
function incomingFixture(hull, shields) {
  const next = advanceGameTime(fixture(hull, shields), .001).state;
  next.combat.encounter.playerCooldown = 100;
  next.combat.encounter.enemyCooldown = .1;
  return next;
}
for (const [hull, shields, expectedHull, expectedShields] of [[100, 40, 100, 38], [100, 1, 99, 0], [100, 0, 98, 0], [26, 0, 24, 0], [20, 1, 19, 0]]) {
  result = advanceGameTime(incomingFixture(hull, shields), .11);
  assert.equal(result.state.hull, expectedHull);
  assert.equal(result.state.shields, expectedShields);
  assert.equal(paused(result.state), expectedHull <= 25 && expectedShields === 0);
  if (paused(result.state)) {
    const enemyHull = result.state.combat.encounter.enemyHull;
    result = advanceGameTime(result.state, 10);
    assert.equal(result.state.hull, expectedHull, "Retreat prevents all subsequent enemy attacks");
    assert.equal(result.state.combat.encounter.enemyHull, enemyHull, "Retreat also pauses the player's weapon");
    assert.equal(result.combatActions, 0);
    assert.ok(result.skillActions > 0, "Combat retreat leaves ordinary training running");
  }
}

// A real missile kill consumes ammunition and normal supplies once, then pays real rewards once.
const raider = activities.find((activity) => activity.id === "corsair-skiff");
state = fixture();
state.sectorId = "cinder";
state.skills.combat = { level: 7, xp: xpForLevel(7) };
state.combat.activeTaskId = raider.id;
state.combat.weapon = "missile";
state = advanceGameTime(state, .001).state;
assert.equal(state.inventory.rations, 3);
state.combat.encounter.enemyHull = 1;
state.combat.encounter.enemyShields = 0;
state.combat.encounter.playerCooldown = .1;
state.combat.encounter.enemyCooldown = 100;
const beforeKill = structuredClone(state);
result = advanceGameTime(state, .11);
assert.equal(result.combatActions, 1);
assert.equal(result.state.combat.victories[raider.id], 1);
assert.equal(result.state.operationCounts[raider.id], 1);
assert.equal(result.state.skills.combat.xp, beforeKill.skills.combat.xp + raider.xp);
assert.equal(result.state.credits, beforeKill.credits + 19);
assert.equal(result.state.inventory.missiles, beforeKill.inventory.missiles - 1);
assert.equal(result.state.inventory.rations, beforeKill.inventory.rations, "Reward settlement must not charge encounter supplies twice");
assert.ok(result.state.inventory.circuits > beforeKill.inventory.circuits);
assert.equal(result.state.hull, beforeKill.hull, "Victory settlement must not apply timer-era damage");
assert.equal(result.state.shields, beforeKill.shields);
assert.equal(advanceGameTime(result.state, .2).combatActions, 0);

// Engagement entry settles the last shared ration before training gets any clock progress.
state = fixture();
state.sectorId = "cinder";
state.skills.combat = { level: 7, xp: xpForLevel(7) };
state.combat.activeTaskId = raider.id;
state.activeTask = { skillId: "diplomacy", activityId: "station-aid" };
state.inventory.rations = 1;
state.progress = 17;
assert.deepEqual(advanceGameTime(structuredClone(state), 0).state, state, "Zero elapsed time cannot charge engagement supplies");
const sharedRationBatch = advanceGameTime(structuredClone(state), 1.5, false).state;
let sharedRationLive = structuredClone(state);
for (let i = 0; i < 6; i++) sharedRationLive = advanceGameTime(sharedRationLive, .25, false).state;
assert.equal(sharedRationBatch.inventory.rations, 0);
assert.equal(sharedRationBatch.combat.encounter.suppliesPaid, true);
assert.equal(sharedRationBatch.progress, 17, "Training cannot borrow time against a ration combat already consumed");
assert.equal(sharedRationLive.progress, sharedRationBatch.progress);
assert.deepEqual(sharedRationLive.inventory, sharedRationBatch.inventory);
assert.equal(sharedRationLive.combat.encounter.enemyHull, sharedRationBatch.combat.encounter.enemyHull);
assert.equal(sharedRationBatch.operationCounts["station-aid"] ?? 0, 0);

// The same ordering applies at respawn, not only to the first engagement.
state.inventory.rations = 2;
state = advanceGameTime(state, .001, false).state;
state.combat.encounter.enemyHull = 1;
state.combat.encounter.enemyShields = 0;
state.combat.encounter.playerCooldown = .1;
state.combat.encounter.enemyCooldown = 100;
state.progress = 0;
const sharedRespawnBatch = advanceGameTime(structuredClone(state), 2, false).state;
let sharedRespawnLive = structuredClone(state);
for (let i = 0; i < 8; i++) sharedRespawnLive = advanceGameTime(sharedRespawnLive, .25, false).state;
assert.equal(sharedRespawnBatch.inventory.rations, 0);
assert.equal(sharedRespawnBatch.combat.victories[raider.id], 1);
assert.equal(sharedRespawnBatch.combat.encounter.suppliesPaid, true);
assert.ok(Math.abs(sharedRespawnBatch.progress - sharedRespawnLive.progress) < 1e-7);
assert.ok(Math.abs(sharedRespawnBatch.progress - 100 * 1.1 / 6) < 1e-7, "Training pauses exactly when the next encounter consumes the last ration");
assert.deepEqual(sharedRespawnBatch.inventory, sharedRespawnLive.inventory);

// Repairs complete on the same timeline, clear retreat, and leave repair training selected.
state = fixture(24, 0);
state.activeTask = { skillId: "engineering", activityId: "hull-repair" };
state.inventory.salvage = 100;
assert.equal(paused(state), true);
result = advanceGameTime(state, 6);
assert.ok(result.skillActions >= 1);
assert.equal(result.state.activeTask.activityId, "hull-repair");
assert.equal(result.state.combat.activeTaskId, target.id);
assert.ok(result.state.hull > 24);
assert.ok(result.state.shields > 0);
assert.equal(paused(result.state), false);
assert.ok(result.state.combat.encounter.enemyHull < target.enemy.hull, "A repair during the interval resumes combat in that same interval");
assert.ok(result.state.skills.engineering.xp > 0);

// Salvage earned during combat must unblock repair training immediately in offline and live runs.
state = fixture(80, 0);
state.activeTask = { skillId: "engineering", activityId: "hull-repair" };
state.inventory.salvage = 0;
const offlineRepair = advanceGameTime(structuredClone(state), 60, false).state;
let liveRepair = structuredClone(state);
for (let i = 0; i < 240; i++) liveRepair = advanceGameTime(liveRepair, .25, false).state;
assert.ok(offlineRepair.operationCounts["hull-repair"] > 0, "Combat salvage unblocks repair in the same offline interval");
assert.equal(offlineRepair.operationCounts["hull-repair"], liveRepair.operationCounts["hull-repair"]);
assert.deepEqual(offlineRepair.operationCounts, liveRepair.operationCounts);
assert.deepEqual(offlineRepair.inventory, liveRepair.inventory);
assert.equal(offlineRepair.hull, liveRepair.hull);
assert.equal(offlineRepair.shields, liveRepair.shields);
assert.equal(offlineRepair.combat.randomSeed, liveRepair.combat.randomSeed);
assert.equal(offlineRepair.combat.encounter.enemyHull, liveRepair.combat.encounter.enemyHull);
assert.equal(offlineRepair.activeTask.activityId, "hull-repair");

// Saved damaged targets and fractional cooldowns resume through the real simulation wrapper.
state = advanceGameTime(fixture(), 1).state;
state.combat.encounter.playerCooldown = .4;
const saved = sanitizeGameState(JSON.parse(JSON.stringify(state)));
result = advanceGameTime(saved, .2);
assert.equal(result.state.combat.encounter.enemyHull, 19, "Loading cannot heal the active enemy");
assert.equal(result.state.combat.hits.length, 0, "Loading cannot replay historical hitsplats");
result = advanceGameTime(result.state, .21);
assert.ok(result.state.combat.encounter.enemyHull < 19);
assert.ok(result.state.combat.hits.length > 0);
assert.equal(advanceGameTime(state, 10, false).state.combat.hits.length, 0);

// Cap catch-up at precisely 24 hours and compare against that exact simulated interval.
const offlineState = fixture(26, 0);
offlineState.lastActiveAt = Date.now() - 48 * 3600 * 1000;
const started = performance.now();
result = applyOffline(offlineState);
const elapsedMs = performance.now() - started;
const capped = advanceGameTime(structuredClone(offlineState), 24 * 3600, false);
assert.equal(result.report.seconds, 24 * 3600);
assert.equal(result.state.hull, capped.state.hull);
assert.deepEqual(result.state.combat.victories, capped.state.combat.victories);
assert.deepEqual(result.state.operationCounts, capped.state.operationCounts);
assert.deepEqual(result.state.inventory, capped.state.inventory);
assert.equal(result.state.combat.hits.length, 0);
assert.equal(paused(result.state), true);
assert.ok(elapsedMs < 15_000, `24-hour offline catch-up unexpectedly took ${elapsedMs.toFixed(0)}ms`);
console.log(`Combat integration regressions passed: real attacks/rewards, supplies, retreat, parallel repair, saved HP and exact 24-hour catch-up (${elapsedMs.toFixed(0)}ms).`);
