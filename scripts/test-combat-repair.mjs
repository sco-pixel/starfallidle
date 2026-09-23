import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Load actual game logic, without mounting React or adding test-only production exports.
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
    if (id.startsWith("@/components/")) return {};
    if (id.startsWith("@/") || id.startsWith(".")) {
      const resolved = id.startsWith("@/") ? path.join(root, "src", id.slice(2)) : path.resolve(path.dirname(filename), id);
      return loadSource(`${resolved}.ts`);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require, module, exports) {\n${output}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}

const shellPath = path.join(root, "src/game/GameShell.tsx");
const { bestRepairActivity } = loadSource(shellPath, "\nexport { bestRepairActivity };");
const { defaultGameState } = loadSource(path.join(root, "src/lib/game-state.ts"));
const plentiful = { salvage: 100, plating: 100, circuits: 100, powerCell: 100 };
function fixture(level, sectorId = "erebus", inventory = plentiful) {
  const state = defaultGameState();
  state.skills.engineering.level = level;
  state.sectorId = sectorId;
  state.inventory = { ...inventory };
  return state;
}
const selected = (state) => bestRepairActivity(state)?.id;

// Boundaries follow current content requirements, not the player's combat level.
for (const level of [1, 17]) {
  assert.equal(selected(fixture(level)), "hull-repair");
}
assert.equal(selected(fixture(18)), "armour-plating-repair");
assert.equal(selected(fixture(41, "orpheus")), "armour-plating-repair");
for (const sector of ["erebus", "helix", "cinder", "orpheus", "silent"]) {
  assert.equal(selected(fixture(42, sector)), ["orpheus", "silent"].includes(sector) ? "reactor-grid-repair" : "armour-plating-repair");
}

// Missing one top-tier supply falls back to an affordable, unlocked repair.
assert.equal(selected(fixture(42, "orpheus", { ...plentiful, powerCell: 2 })), "armour-plating-repair");
assert.equal(selected(fixture(42, "orpheus", { salvage: 2 })), "hull-repair");
assert.equal(selected(fixture(18, "erebus", { salvage: 100, plating: 1, circuits: 2 })), "hull-repair");
assert.equal(selected(fixture(1, "erebus", { salvage: 1 })), undefined);
assert.equal(selected(fixture(100, "silent", {})), undefined);

// Operation mastery discounts must be honored at every repair tier.
for (const [id, level, sector, inventory] of [
  ["hull-repair", 1, "erebus", { salvage: 1 }],
  ["armour-plating-repair", 18, "erebus", { salvage: 4, plating: 1, circuits: 1 }],
  ["reactor-grid-repair", 42, "orpheus", { plating: 4, circuits: 5, powerCell: 2 }],
]) {
  const state = fixture(level, sector, inventory);
  assert.notEqual(selected(state), id);
  state.operationMastery[id] = 50;
  assert.equal(selected(state), id);
}

// Extract the actual callback expression to verify its state transition and view behavior.
const shellSource = ts.createSourceFile(shellPath, readFileSync(shellPath, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let repairCallback;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "startBestRepair") {
    assert.ok(node.initializer && ts.isCallExpression(node.initializer));
    repairCallback = node.initializer.arguments[0];
  }
  ts.forEachChild(node, visit);
}
visit(shellSource);
assert.ok(repairCallback, "Repair action callback must exist");
const callbackCode = ts.transpileModule(`(${repairCallback.getText(shellSource)})`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
function invokeRepair(state) {
  let next = state;
  let updates = 0;
  let selectedSkill;
  let viewChanges = 0;
  const callback = vm.runInNewContext(callbackCode, {
    bestRepairActivity,
    stateRef: { current: state },
    updateState: (updater) => { next = updater(next); updates++; },
    setSelectedSkill: (skill) => { selectedSkill = skill; },
    setView: () => { viewChanges++; },
  });
  callback();
  return { next, updates, selectedSkill, viewChanges };
}
let state = fixture(42, "orpheus");
state.progress = 63;
state.combat.activeTaskId = "scavenger-drone";
state.combat.progress = 47;
let result = invokeRepair(state);
assert.equal(result.next.activeTask.activityId, "reactor-grid-repair");
assert.equal(result.next.activeTask.skillId, "engineering");
assert.equal(result.next.progress, 0);
assert.equal(result.next.combat, state.combat, "Starting repairs preserves the ongoing combat task and progress");
assert.equal(result.selectedSkill, "engineering");
assert.equal(result.viewChanges, 0, "Starting repairs stays on the combat page");

state.activeTask = { skillId: "engineering", activityId: "reactor-grid-repair" };
result = invokeRepair(state);
assert.equal(result.updates, 0, "Repeated repair clicks must not restart an already running repair");
assert.equal(result.next.progress, 63);
assert.equal(result.next, state);
assert.equal(result.viewChanges, 0);

result = invokeRepair(fixture(100, "silent", {}));
assert.equal(result.updates, 0, "Unavailable repairs leave the current training untouched");
assert.equal(result.viewChanges, 0);
console.log("Combat repair regressions passed: level/sector gates, affordability fallback, mastery discounts, progress preservation and combat-page retention.");
