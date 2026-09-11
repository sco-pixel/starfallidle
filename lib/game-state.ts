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
export type CombatState = {
  weapon: CombatWeapon;
  stance: CombatStance;
  activeTaskId: string | null;
  progress: number;
  victories: Record<string, number>;
  streak: number;
  bestStreak: number;
  lastLoot: string | null;
};

export type GameState = {
  version: 4;
  credits: number;
  skills: Record<SkillId, SkillProgress>;
  mastery: Record<SkillId, number>;
  inventory: Record<string, number>;
  equipment: Record<EquipmentId, number>;
  activeTask: ActiveTask;
  progress: number;
  totalActions: number;
  claimedObjectives: string[];
  lastActiveAt: number;
  sectorId: string;
  shipModules: Record<ShipModuleId, number>;
  crewAssignments: Record<string, SkillId>;
  crewMorale: number;
  drones: Record<DroneId, number>;
  vehicles: Record<VehicleId, number>;
  researchUnlocked: string[];
  collection: string[];
  factions: Record<string, number>;
  contractsCompleted: string[];
  activeExpedition: { id: string; endsAt: number } | null;
  completedExpeditions: number;
  patrol: number;
  commandPoints: number;
  achievements: string[];
  hull: number;
  maxHull: number;
  shields: number;
  retreatAt: number;
  combat: CombatState;
  storyLog: string[];
  pendingEvent: string | null;
};

const startingInventory: Record<string, number> = {
  ferrite: 12, cobalt: 0, iridium: 0, salvage: 8, circuits: 2, algae: 0,
  rations: 4, plating: 0, powerCell: 2, data: 0, relic: 0, medicine: 2,
  catalyst: 0, navData: 0, droneParts: 0, fuelRod: 2, artefact: 0, missiles: 6,
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
    version: 4,
    credits: 180,
    skills,
    mastery,
    inventory: { ...startingInventory },
    equipment: { cutter: 1, exosuit: 1, scanner: 1, railgun: 1, shield: 1 },
    activeTask: { skillId: "mining", activityId: "ferrite-outcrop" },
    progress: 0,
    totalActions: 0,
    claimedObjectives: [],
    lastActiveAt: Date.now(),
    sectorId: "erebus",
    shipModules: { bridge: 1, cic: 1, cargo: 1, hydroponics: 1, fabricator: 1, lab: 1, medbay: 1, reactor: 1, hangar: 1 },
    crewAssignments: {
      mara: "astrogation", jonas: "engineering", priya: "science", okafor: "medicine", sol: "combat",
      mei: "botany", rook: "drones", elias: "logistics", vega: "salvage", anya: "archaeology",
    },
    crewMorale: 80,
    drones: { mining: 0, salvage: 0, survey: 0, combat: 0, cargo: 0 },
    vehicles: { rover: 0, boardingShuttle: 0 },
    researchUnlocked: [],
    collection: [],
    factions: { patrol: 0, prospectors: 0, institute: 0, frontier: 0, corsairs: 0 },
    contractsCompleted: [],
    activeExpedition: null,
    completedExpeditions: 0,
    patrol: 1,
    commandPoints: 0,
    achievements: [],
    hull: 100,
    maxHull: 100,
    shields: 40,
    retreatAt: 25,
    combat: { weapon: "laser", stance: "balanced", activeTaskId: null, progress: 0, victories: {}, streak: 0, bestStreak: 0, lastLoot: null },
    storyLog: ["Patrol 01 commissioned at Erebus Station."],
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
  const saveVersion = boundedNumber(input.version, 0, 4);

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

  return {
    version: 4,
    credits: boundedNumber(input.credits, defaults.credits),
    skills,
    mastery,
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
    crewAssignments: {
      ...defaults.crewAssignments,
      ...(input.crewAssignments && typeof input.crewAssignments === "object"
        ? Object.fromEntries(Object.entries(input.crewAssignments as Record<string, unknown>).filter(([, id]) => SKILL_IDS.includes(id as SkillId))) as Record<string, SkillId>
        : {}),
    },
    crewMorale: boundedNumber(input.crewMorale, defaults.crewMorale, 100),
    drones: numericRecord(input.drones, defaults.drones, 100),
    vehicles: numericRecord(input.vehicles, defaults.vehicles, 20),
    researchUnlocked: stringList(input.researchUnlocked),
    collection: stringList(input.collection, 500),
    factions: numericRecord(input.factions, defaults.factions, 100),
    contractsCompleted: stringList(input.contractsCompleted, 500),
    activeExpedition: expeditionInput && typeof expeditionInput.id === "string"
      ? { id: expeditionInput.id.slice(0, 60), endsAt: boundedNumber(expeditionInput.endsAt, Date.now(), Date.now() + 7 * 86_400_000) }
      : null,
    completedExpeditions: boundedNumber(input.completedExpeditions, 0, 1_000_000),
    patrol: Math.max(1, boundedNumber(input.patrol, 1, 1000)),
    commandPoints: boundedNumber(input.commandPoints, 0, 10_000),
    achievements: stringList(input.achievements, 500),
    hull: boundedNumber(input.hull, defaults.hull, 100_000),
    maxHull: Math.max(1, boundedNumber(input.maxHull, defaults.maxHull, 100_000)),
    shields: boundedNumber(input.shields, defaults.shields, 100_000),
    retreatAt: boundedNumber(input.retreatAt, defaults.retreatAt, 90),
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
    },
    storyLog: stringList(input.storyLog, 30).length ? stringList(input.storyLog, 30) : defaults.storyLog,
    pendingEvent: typeof input.pendingEvent === "string" ? input.pendingEvent.slice(0, 60) : null,
  };
}
