Warning: truncated output (original token count: 29856)
Total output lines: 1361

"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Atom, Biohazard, Bot, Boxes, BrainCircuit, Check, ChevronLeft, ChevronRight,
  CircleGauge, Cloud, Coins, Compass, Crosshair, Dna, FlaskConical, Gem,
  Hammer, HeartPulse, History, Landmark, LockKeyhole, Map, Medal, Orbit,
  Menu, PackageOpen, Pickaxe, Radio, Recycle, Rocket, ScrollText, Search, Shield,
  ShieldCheck, Sparkles, Star, Target, Telescope, TrendingUp, Trophy,
  UserRound, Users, Wrench, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  activities, collectionEntries, contracts, crew, droneSpecs, equipmentSpecs,
  expeditions, itemNames, researchNodes, sectors, shipModules, skillMeta, vehicleSpecs,
  storyEvents, totalLevel, type Activity as SkillActivity,
} from "@/lib/game-content";
import { missionDefinitions, uniqueGear } from "@/lib/depth-content";
import {
  MAX_SKILL_LEVEL, SKILL_IDS, defaultGameState, levelFromXp, sanitizeGameState, xpForLevel,
  type CombatStance, type CombatWeapon, type DroneId, type EquipmentId, type GameState, type OutpostType, type PowerMode, type ResearchPath, type ShipModuleId, type SkillId, type StatusEffect, type VehicleId,
} from "@/lib/game-state";

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
  }
}

type SaveStatus = "guest" | "saved" | "saving" | "error";
type ViewId = "skills" | "bank" | "sectors" | "ship" | "crew" | "combat" | "expeditions" | "contracts" | "objectives" | "research" | "collection" | "market" | "patrol" | "character" | "outposts" | "missions" | "hiscores";
type OfflineReport = { seconds: number; actions: number; activity: string; gains: Record<string, number>; xp: number };

const activityById = Object.fromEntries(activities.map((entry) => [entry.id, entry])) as Record<string, SkillActivity>;
const sectorById = Object.fromEntries(sectors.map((entry) => [entry.id, entry]));

const skillIcons: Record<SkillId, typeof Pickaxe> = {
  mining: Pickaxe, salvage: Recycle, botany: Biohazard, engineering: Wrench,
  science: FlaskConical, combat: Crosshair, astrogation: Compass, drones: Bot,
  metallurgy: Hammer, biochemistry: Dna, logistics: Boxes, medicine: HeartPulse,
  diplomacy: Users, archaeology: Landmark,
};

const itemIcons: Record<string, typeof Gem> = {
  ferrite: Pickaxe, cobalt: Gem, iridium: Sparkles, salvage: Recycle, circuits: Atom,
  algae: Biohazard, rations: PackageOpen, plating: Shield, powerCell: Zap, data: Radio,
  relic: Landmark, medicine: HeartPulse, catalyst: Dna, navData: Compass,
  droneParts: Bot, fuelRod: Rocket, artefact: Star, missiles: Target,
};

const navigation: { group: string; items: { id: ViewId; label: string; icon: typeof Map }[] }[] = [
  { group: "Vessel", items: [
    { id: "ship", label: "Cruiser", icon: Rocket }, { id: "crew", label: "Crew", icon: Users },
    { id: "combat", label: "Combat", icon: Crosshair },
  ] },
  { group: "Galaxy", items: [
    { id: "sectors", label: "Star Chart", icon: Map }, { id: "expeditions", label: "Expeditions", icon: Compass },
    { id: "contracts", label: "Contracts", icon: ScrollText }, { id: "objectives", label: "Objectives", icon: Target },
    { id: "market", label: "Market", icon: TrendingUp }, { id: "outposts", label: "Outposts", icon: Landmark },
  ] },
  { group: "Archives", items: [
    { id: "research", label: "Research", icon: BrainCircuit }, { id: "collection", label: "Collection", icon: Telescope },
    { id: "missions", label: "Missions", icon: ScrollText }, { id: "patrol", label: "Patrol Record", icon: Medal },
    { id: "hiscores", label: "Hiscores", icon: Trophy }, { id: "character", label: "Character", icon: UserRound },
  ] },
];

const equipmentCosts: Record<EquipmentId, (level: number) => Record<string, number>> = {
  cutter: (level) => ({ plating: level * 3, circuits: level * 2 }),
  exosuit: (level) => ({ plating: level * 4, powerCell: level }),
  scanner: (level) => ({ data: level * 6, circuits: level * 2 }),
  railgun: (level) => ({ plating: level * 4, circuits: level * 3 }),
  shield: (level) => ({ cobalt: level * 4, powerCell: level * 2 }),
};

const factionNames: Record<string, string> = {
  patrol: "Deep Space Patrol", prospectors: "Free Prospectors", institute: "Helix Institute",
  frontier: "Frontier Compact", corsairs: "Cinder Corsairs",
};

const achievements = [
  { id: "first-level", name: "Qualified Crew", met: (s: GameState) => totalLevel(s) >= 20 },
  { id: "deep-hold", name: "Full Cargo Hold", met: (s: GameState) => Object.values(s.inventory).reduce((a, b) => a + b, 0) >= 250 },
  { id: "pathfinder", name: "Pathfinder", met: (s: GameState) => s.sectorId === "orpheus" || s.sectorId === "silent" },
  { id: "veteran", name: "Patrol Veteran", met: (s: GameState) => s.patrol >= 2 },
  { id: "ace", name: "Void Ace", met: (s: GameState) => Object.values(s.combat.victories).reduce((a, b) => a + b, 0) >= 100 },
  { id: "untouchable", name: "Untouchable", met: (s: GameState) => s.combat.bestStreak >= 25 },
];

type Objective = { id: string; sector: string; name: string; description: string; reward: string; met: (state: GameState) => boolean; credits?: number; item?: string; amount?: number };
const objectives: Objective[] = [
  { id: "first-haul", sector: "Erebus Belt", name: "First Haul", description: "Store 25 Ferrite Ore", reward: "75 credits", met: (s) => s.inventory.ferrite >= 25, credits: 75 },
  { id: "field-engineer", sector: "Erebus Belt", name: "Field Engineer", description: "Reach Metallurgy level 5", reward: "2 Power Cells", met: (s) => s.skills.metallurgy.level >= 5, item: "powerCell", amount: 2 },
  { id: "belt-cleanup", sector: "Erebus Belt", name: "Belt Cleanup", description: "Store 80 Salvage", reward: "150 credits", met: (s) => s.inventory.salvage >= 80, credits: 150 },
  { id: "beyond-erebus", sector: "Helix Reach", name: "Beyond Erebus", description: "Chart Helix Reach", reward: "120 credits", met: (s) => s.collection.includes("chart-helix"), credits: 120 },
  { id: "quarantine-scholar", sector: "Helix Reach", name: "Quarantine Scholar", description: "Reach Science level 8", reward: "3 Bio-catalyst", met: (s) => s.skills.science.level >= 8, item: "catalyst", amount: 3 },
  { id: "adaptive-crop", sector: "Helix Reach", name: "Adaptive Crop", description: "Complete 25 Xenobotany operations", reward: "6 Medkits", met: (s) => s.mastery.botany >= 25, item: "medicine", amount: 6 },
  { id: "quarantine-secured", sector: "Helix Reach", name: "Quarantine Secured", description: "Defeat 5 Helix Security Automata", reward: "5 Circuits", met: (s) => (s.combat.victories["helix-automata"] ?? 0) >= 5, item: "circuits", amount: 5 },
  { id: "cinder-chart", sector: "Cinder Expanse", name: "Through the Fire", description: "Chart the Cinder Expanse", reward: "4 Fuel Rods", met: (s) => s.collection.includes("chart-cinder"), item: "fuelRod", amount: 4 },
  { id: "corsair-hunter", sector: "Cinder Expanse", name: "Corsair Hunter", description: "Defeat 10 Corsair Skiffs", reward: "10 Tactical Missiles", met: (s) => (s.combat.victories["corsair-skiff"] ?? 0) >= 10, item: "missiles", amount: 10 },
  { id: "frontier-envoy", sector: "Cinder Expanse", name: "Frontier Envoy", description: "Reach Diplomacy level 10", reward: "300 credits", met: (s) => s.skills.diplomacy.level >= 10, credits: 300 },
  { id: "contract-officer", sector: "Cinder Expanse", name: "Contract Officer", description: "Complete 4 faction contracts", reward: "8 Drone Parts", met: (s) => s.contractsCompleted.length >= 4, item: "droneParts", amount: 8 },
  { id: "rift-entry", sector: "Orpheus Rift", name: "Enter the Rift", description: "Chart the Orpheus Rift", reward: "500 credits", met: (s) => s.collection.includes("chart-orpheus"), credits: 500 },
  { id: "iridium-reserve", sector: "Orpheus Rift", name: "Iridium Reserve", description: "Store 25 Iridium", reward: "6 Alloy Plating", met: (s) => s.inventory.iridium >= 25, item: "plating", amount: 6 },
  { id: "rift-historian", sector: "Orpheus Rift", name: "Rift Historian", description: "Reach Archaeology level 12", reward: "4 Relic Fragments", met: (s) => s.skills.archaeology.level >= 12, item: "relic", amount: 4 },
  { id: "veteran-away-team", sector: "Orpheus Rift", name: "Veteran Away Team", description: "Complete 3 expeditions", reward: "750 credits", met: (s) => s.completedExpeditions >= 3, credits: 750 },
  { id: "silent-arrival", sector: "Silent Systems", name: "The Long Silence", description: "Chart the Silent Systems", reward: "12 Power Cells", met: (s) => s.collection.includes("chart-silent"), item: "powerCell", amount: 12 },
  { id: "combat-command", sector: "Silent Systems", name: "Combat Command", description: "Reach Combat level 20", reward: "15 Tactical Missiles", met: (s) => s.skills.combat.level >= 20, item: "missiles", amount: 15 },
  { id: "machine-archive", sector: "Silent Systems", name: "Machine Archive", description: "Store 3 Ancient Artefacts", reward: "1,000 credits", met: (s) => s.inventory.artefact >= 3, credits: 1000 },
  { id: "dreadnought-fall", sector: "Silent Systems", name: "Dreadnought Fall", description: "Defeat a Silent Dreadnought", reward: "2 Ancient Artefacts", met: (s) => (s.combat.victories["silent-dreadnought"] ?? 0) >= 1, item: "artefact", amount: 2 },
  { id: "away-team", sector: "Patrol", name: "Away Team", description: "Complete an expedition", reward: "4 Drone Parts", met: (s) => s.completedExpeditions >= 1, item: "droneParts", amount: 4 },
  { id: "archivist", sector: "Patrol", name: "Archivist", description: "Record 8 discoveries", reward: "300 credits", met: (s) => s.collection.length >= 8, credits: 300 },
  { id: "space-superiority", sector: "Patrol", name: "Space Superiority", description: "Win 25 hostile encounters", reward: "8 Tactical Missiles", met: (s) => Object.values(s.combat.victories).reduce((a, b) => a + b, 0) >= 25, item: "missiles", amount: 8 },
];

const marketGoods = ["ferrite", "cobalt", "salvage", "algae", "rations", "circuits", "plating", "powerCell", "data", "medicine", "fuelRod"];
const marketBase: Record<string, number> = {
  ferrite: 4, cobalt: 9, salvage: 6, algae: 5, rations: 8, circuits: 18,
  plating: 24, powerCell: 30, data: 14, medicine: 22, fuelRod: 45,
};

function fmt(value: number) { return Math.floor(value).toLocaleString(); }
function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  return `${Math.max(0, Math.floor(seconds))}s`;
}
function itemsText(items: Record<string, number>) {
  const entries = Object.entries(items);
  return entries.length ? entries.map(([id, amount]) => `${amount} ${itemNames[id] ?? id}`).join(" · ") : "No cargo";
}
function listText(values: string[]) {
  if (values.length < 2) return values[0] ?? "an eligible sector";
  return values.length === 2 ? `${values[0]} or ${values[1]}` : `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
}
function canAfford(state: GameState, costs: Record<string, number> = {}) {
  return Object.entries(costs).every(([id, amount]) => (state.inventory[id] ?? 0) >= amount);
}
function outpostDevelopment(state: GameState, sectorId: string, type: OutpostType) {
  const existing = state.outposts[sectorId];
  const converting = Boolean(existing && existing.type !== type);
  const level = existing ? (converting ? existing.level : existing.level + 1) : 1;
  const starterCost = { salvage: 10, circuits: 2 };
  const specialistCosts: Record<OutpostType, Record<string, number>> = {
    mining: { plating: level * 4, circuits: level * 3 },
    research: { circuits: level * 4, data: level * 8 },
    trade: { plating: level * 3, navData: level * 5 },
  };
  const items = !existing && level === 1 ? starterCost : specialistCosts[type];
  const credits = (converting ? 400 : 250) * level;
  return { existing, converting, level, items, credits };
}
function spend(inventory: Record<string, number>, costs: Record<string, number>) {
  const next = { ...inventory };
  Object.entries(costs).forEach(([id, amount]) => { next[id] = (next[id] ?? 0) - amount; });
  return next;
}
function addItems(inventory: Record<string, number>, rewards: Record<string, number>, multiplier = 1) {
  const next = { ...inventory };
  Object.entries(rewards).forEach(([id, amount]) => { next[id] = Math.max(0, (next[id] ?? 0) + amount * multiplier); });
  return next;
}
function crewCount(state: GameState, skillId: SkillId) {
  return Object.values(state.crewAssignments).filter((id) => id === skillId).length;
}
const weaponNames = { laser: "Pulse Laser", railgun: "Kinetic Railgun", missile: "Guided Missiles" } as const;
const stanceNames = { balanced: "Balanced", aggressive: "Aggressive", defensive: "Defensive" } as const;
function combatHitChance(state: GameState, activity: SkillActivity) {
  if (!activity.enemy) return 100;
  const weaponTracking = state.combat.weapon === "missile" ? 18 : state.combat.weapon === "laser" ? 7 : -3;
  const training = Math.floor(state.skills.combat.level / 2) + (state.skills.combat.level >= 5 ? 5 : 0);
  const systems = state.equipment.railgun * 2 + state.shipModules.cic + state.drones.combat;
  const gear = state.equippedGear === "gearPhaseLance" ? 12 : state.equippedGear === "gearStarfallCrown" ? 6 : 0;
  const disruption = state.statusEffects.includes("sensorDisruption") ? -8 : 0;
  const path = state.researchPath === "military" ? 6 : 0;
  return Math.max(45, Math.min(99, 78 + weaponTracking + training + systems + gear + disruption + path - activity.enemy.evasion));
}
function combatMatchup(state: GameState, activity: SkillActivity) {
  if (!activity.enemy) return { hitChance: 100, weakness: false, time: 1 };
  const weakness = activity.enemy.weakness === state.combat.weapon;
  const defense = state.combat.weapon === "laser" ? activity.enemy.shields : state.combat.weapon === "railgun" ? activity.enemy.armor : activity.enemy.evasion;
  const weaponSpeed = state.combat.weapon === "laser" ? 0.9 : state.combat.weapon === "missile" ? 1.06 : 1;
  const stanceSpeed = state.combat.stance === "aggressive" ? (state.skills.combat.level >= 10 ? 0.78 : 0.83) : state.combat.stance === "defensive" ? 1.2 : 1;
  const matchup = weakness ? 0.76 : 1 + defense / 180;
  const hitChance = combatHitChance(state, activity);
  return { hitChance, weakness, time: weaponSpeed * stanceSpeed * matchup * (100 / hitChance) };
}
function actionSeconds(state: GameState, activity: SkillActivity) {
  const research = state.researchUnlocked.includes("efficient-cycles") ? 0.95 : 1;
  const mastery = Math.max(0.72, 1 - Math.floor(state.mastery[activity.skillId] / 100) * 0.01) * ((state.operationMastery[activity.id] ?? 0) >= 100 ? 0.9 : 1);
  const weapon = activity.skillId === "combat" ? Math.max(0.72, 1 - (state.equipment.railgun - 1) * 0.025) * combatMatchup(state, activity).time : 1;
  const powerSkills: Record<PowerMode, SkillId[]> = { balanced: [], industrial: ["engineering", "metallurgy", "drones"], research: ["science", "archaeology", "botany", "biochemistry", "medicine"], combat: ["combat"], navigation: ["astrogation", "logistics", "diplomacy"] };
  const power = state.powerMode !== "balanced" && powerSkills[state.powerMode].includes(activity.skillId) ? 0.88 : 1;
  const path = (state.researchPath === "industrial" && ["engineering", "metallurgy"].includes(activity.skillId)) || (state.researchPath === "exploration" && ["science", "astrogation", "archaeology"].includes(activity.skillId)) || (state.researchPath === "xenotechnology" && ["botany", "biochemistry", "medicine"].includes(activity.skillId)) ? 0.92 : 1;
  const gear = state.equippedGear === "gearChronoDrive" ? 0.92 : state.equippedGear === "gearStarfallCrown" ? 0.96 : 1;
  const effects = state.statusEffects.includes("overheating") ? 1.1 : state.statusEffects.includes("radiation") ? 1.05 : 1;
  return Math.max(1, activity.seconds * research * mastery * weapon * power * path * gear * effects);
}
function outputBonus(state: GameState, activity: SkillActivity) {
  const skillId = activity.skillId;
  let bonus = Math.floor(crewCount(state, skillId) / 2);
  bonus += crew.reduce((total, member) => {
    const level = crewLevel(state.crewXp[member.id] ?? 0);
    return total + (state.crewAssignments[member.id] === skillId && member.specialties.includes(skillId) ? 1 + Math.floor((level - 1) / 20) : 0);
  }, 0);
  bonus += Math.floor(state.mastery[skillId] / 250);
  if ((state.operationMastery[activity.id] ?? 0) >= 100) bonus += 1;
  if (skillId === "mining") bonus += Math.floor((state.equipment.cutter - 1) / 2) + Math.floor(state.drones.mining / 2);
  if (skillId === "salvage") bonus += Math.floor((state.equipment.cutter - 1) / 2) + Math.floor(state.drones.salvage / 2);
  if (skillId === "science" || skillId === "botany") bonus += Math.floor((state.equipment.scanner - 1) / 2);
  if ((skillId === "botany" || skillId === "biochemistry") && state.researchUnlocked.includes("xeno-adaptation")) bonus += 1;
  if (skillId === "logistics") bonus += Math.floor(state.drones.cargo / 2);
  if (state.outposts[state.sectorId]?.type === "mining" && ["mining", "salvage"].includes(skillId)) bonus += state.outposts[state.sectorId].level;
  if (state.outposts[state.sectorId]?.type === "research" && ["science", "archaeology"].includes(skillId)) bonus += state.outposts[state.sectorId].level;
  if (state.equippedGear === "gearFoundryHeart" && ["engineering", "metallurgy", "drones"].includes(skillId)) bonus += 2;
  if (state.equippedGear === "gearStarfallCrown") bonus += 1;
  if (state.researchUnlocked.includes("starfall-doctrine")) bonus += Math.floor(state.commandPoints / 5);
  return bonus;
}
function combatDamage(state: GameState, activity: SkillActivity) {
  if (!activity.damage) return 0;
  const mitigation = state.equipment.shield * 2 + state.equipment.exosuit + state.drones.combat * 2 + state.shipModules.cic;
  const protocol = state.researchUnlocked.includes("sentinel-protocol") && activity.id === "void-sentinel" ? 0.8 : 1;
  const stance = state.combat.stance === "aggressive" ? 1.25 : state.combat.stance === "defensive" ? 0.68 : 1;
  const veteran = state.skills.combat.level >= 15 ? 0.9 : 1;
  const bossAnalysis = state.researchUnlocked.includes("boss-analysis") && activity.enemy?.class.includes("Boss") ? 0.85 : 1;
  const unique = state.equippedGear === "gearLivingBulwark" ? 0.85 : state.equippedGear === "gearStarfallCrown" ? 0.925 : 1;
  const breach = state.statusEffects.includes("hullBreach") ? 1.18 : 1;
  return Math.max(1, Math.floor((activity.damage - mitigation) * protocol * stance * veteran * bossAnalysis * unique * breach));
}
function activityCosts(state: GameState, activity: SkillActivity) {
  const costs = { ...(activity.consumes ?? {}) };
  if ((state.operationMastery[activity.id] ?? 0) >= 50) Object.keys(costs).forEach((id) => { costs[id] = Math.max(0, costs[id] - 1); });
  if (activity.skillId === "combat" && state.combat.weapon === "missile") costs.missiles = (costs.missiles ?? 0) + 1;
  return costs;
}
function activityAvailable(state: GameState, activity: SkillActivity) {
  return !activity.sectors || activity.sectors.includes(state.sectorId);
}
function operationPauseReasons(state: GameState, activity: SkillActivity) {
  const reasons: string[] = [];
  if (state.skills[activity.skillId].level < activity.level) reasons.push(`Requires ${skillMeta[activity.skillId].name} level ${activity.level}; current level is ${state.skills[activity.skillId].level}`);
  if (!activityAvailable(state, activity)) {
    const destinations = (activity.sectors ?? []).map((id) => sectorById[id]?.name ?? id);
    reasons.push(`Wrong sector: travel to ${listText(destinations)}`);
  }
  for (const [id, needed] of Object.entries(activityCosts(state, activity))) {
    const held = state.inventory[id] ?? 0;
    if (held < needed) reasons.push(`Missing ${needed - held} ${itemNames[id] ?? id} (${held}/${needed} ready)`);
  }
  if (activity.skillId === "combat" && !state.shields && state.hull <= state.maxHull * state.retreatAt / 100) {
    reasons.push(`Auto-retreat engaged: hull is ${state.hull}/${state.maxHull} at the ${state.retreatAt}% threshold; repair hull or lower the threshold`);
  }
  return reasons;
}
function missionReady(state: GameState, id: string) {
  switch (id) {
    case "signal-in-static": return state.collection.length >= 12 && state.skills.science.level >= 15;
    case "broken-convoy": return state.contractsCompleted.length >= 8 && (state.combat.victories["corsair-skiff"] ?? 0) >= 10;
    case "rift-echo": return state.completedExpeditions >= 4 && state.skills.astrogation.level >= 35;
    case "machine-language": return ["science", "diplomacy", "archaeology"].every((skill) => state.skills[skill as SkillId].level >= 50);
    case "foundry-war": return (state.combat.victories["boss-sentinel-foundry"] ?? 0) >= 1 && Boolean(state.outposts.silent);
    case "starfall-protocol": return (state.combat.victories["boss-machine-intelligence"] ?? 0) >= 1 && totalLevel(state) >= 1000;
    default: return false;
  }
}
function applyAchievements(state: GameState) {
  const earned = achievements.filter((entry) => entry.met(state)).map((entry) => entry.id);
  return { ...state, achievements: Array.from(new Set([...state.achievements, ...earned])) };
}
function completeActions(state: GameState, activity: SkillActivity, requested: number) {
  if (state.skills[activity.skillId].level < activity.level) return { state, count: 0 };
  let count = Math.max(0, Math.floor(requested));
  const queuedBatch = activity.skillId !== "combat" && state.productionQueue[0]?.activityId === activity.id ? state.productionQueue[0] : null;
  if (queuedBatch) count = Math.min(count, queuedBatch.remaining);
  const costs = activityCosts(state, activity);
  for (const [id, amount] of Object.entries(costs)) count = Math.min(count, Math.floor((state.inventory[id] ?? 0) / amount));
  const damage = combatDamage(state, activity);
  if (damage) {
    const safeHull = state.maxHull * (state.retreatAt / 100);
    count = Math.min(count, Math.max(0, Math.floor((state.hull - safeHull + state.shields) / damage)));
  }
  if (!count || !activityAvailable(state, activity)) return { state, count: 0 };

  let inventory = spend(state.inventory, Object.fromEntries(Object.entries(costs).map(([id, amount]) => [id, amount * count])));
  const bonus = outputBonus(state, activity);
  inventory = addItems(inventory, Object.fromEntries(Object.entries(activity.produces).map(([id, amount]) => [id, (amount + bonus) * count])));
  const skillXp = state.skills[activity.skillId].xp + activity.xp * count;
  const mastery = state.mastery[activity.skillId] + count;
  const previousOperationCount = state.operationCounts[activity.id] ?? 0;
  const operationCount = previousOperationCount + count;
  const previousOperationMastery = state.operationMastery[activity.id] ?? 0;
  const operationMastery = Math.min(100, previousOperationMastery + count);
  const rareDiscovery = previousOperationCount < 250 && operationCount >= 250 ? `rare-${activity.id}` : null;
  let collection = activity.collectionId ? Array.from(new Set([...state.collection, activity.collectionId])) : state.collection;
  if (rareDiscovery) collection = Array.from(new Set([...collection, rareDiscovery]));
  const absorbed = Math.min(state.shields, damage * count);
  let shields = state.shields - absorbed;
  let hull = Math.max(0, state.hull - Math.max(0, damage * count - absorbed));
  let morale = state.crewMorale;
  const factions = { ...state.factions };
  if (activity.id === "hull-repair") hull = Math.min(state.maxHull, hull + (18 + (state.researchUnlocked.includes("autonomous-repair") ? 8 : 0)) * count);
  if (activity.id === "hull-repair") shields = Math.min(40 + state.equipment.shield * 10, shields + 6 * count);
  if (activity.skillId === "medicine") morale = Math.min(100, morale + 2 * count);
  if (activity.skillId === "diplomacy") factions.frontier = Math.min(100, factions.frontier + count);
  const totalActionsAfter = state.totalActions + count;
  const crossedEvent = Math.floor(totalActionsAfter / 40) > Math.floor(state.totalActions / 40);
  const nextEvent = crossedEvent && !state.pendingEvent ? (totalActionsAfter % 80 < 40 ? "escapePod" : "cargoNoise") : state.pendingEvent;

  let combat = state.combat;
  let statusEffects = [...state.statusEffects];
  if (activity.skillId === "combat" && activity.enemy) {
    const previous = combat.victories[activity.id] ?? 0;
    const victories = previous + count;
    const rareInterval = Math.max(2, activity.enemy.rareEvery - (operationMastery >= 100 ? Math.ceil(activity.enemy.rareEvery * 0.1) : 0));
    const rareCount = Math.floor(victories / rareInterval) - Math.floor(previous / rareInterval);
    if (rareCount > 0) inventory = addItems(inventory, activity.enemy.rareDrop, rareCount);
    const streak = combat.streak + count;
    combat = { ...combat, victories: { ...combat.victories, [activity.id]: victories }, streak, bestStreak: Math.max(combat.bestStreak, streak), lastLoot: rareCount > 0 ? itemsText(activity.enemy.rareDrop) : combat.lastLoot };
    const priorVictories = Object.values(combat.victories).reduce((sum, value) => sum + value, 0) - count;
    if (Math.floor((priorVictories + count) / 25) > Math.floor(priorVictories / 25)) {
      const effects: StatusEffect[] = ["radiation", "hullBreach", "sensorDisruption", "overheating"];
      const effect = effects[Math.floor((priorVictories + count) / 25) % effects.length];
      if (!statusEffects.includes(effect)) statusEffects.push(effect);
    }
  } else if (activity.id === "hull-repair") combat = { ...combat, streak: 0 };
  if (activity.skillId === "medicine") statusEffects = statusEffects.filter((effect) => effect !== "radiation");
  if (activity.skillId === "engineering") statusEffects = statusEffects.filter((effect) => effect !== "hullBreach");
  if (activity.skillId === "science") statusEffects = statusEffects.filter((effect) => effect !== "sensorDisruption");
  if (activity.skillId === "metallurgy") statusEffects = statusEffects.filter((effect) => effect !== "overheating");
  const assignedCrew = Object.entries(state.crewAssignments).filter(([, skill]) => skill === activity.skillId).map(([id]) => id);
  const crewXp = { ...state.crewXp };
  const crewLoyalty = { ...state.crewLoyalty };
  assignedCrew.forEach((id) => {
    const crewGain = Math.floor(count * (state.researchUnlocked.includes("neural-cultures") ? 1.25 : 1));
    crewXp[id] = (crewXp[id] ?? 0) + crewGain;
    crewLoyalty[id] = Math.min(100, (crewLoyalty[id] ?? 50) + Math.floor(crewGain / 100));
  });
  let productionQueue = state.productionQueue;
  let activeTask = state.activeTask;
  if (queuedBatch) {
    const remaining = queuedBatch.remaining - count;
    productionQueue = remaining > 0 ? [{ ...queuedBatch, remaining }, ...state.productionQueue.slice(1)] : state.productionQueue.slice(1);
    if (remaining <= 0 && productionQueue[0]) {
      const nextActivity = activityById[productionQueue[0].activityId];
      if (nextActivity && nextActivity.skillId !== "combat") activeTask = { skillId: nextActivity.skillId, activityId: nextActivity.id };
    }
  }
  let storyLog = state.storyLog;
  if (activity.enemy?.class.includes("Boss") && (state.combat.victories[activity.id] ?? 0) === 0) storyLog = [`Boss defeated: ${activity.name}.`, ...storyLog].slice(0, 100);
  if (previousOperationMastery < 100 && operationMastery >= 100) storyLog = [`Mastered operation: ${activity.name}.`, ...storyLog].slice(0, 100);
  if (rareDiscovery) storyLog = [`Rare discovery recorded during ${activity.name}.`, ...storyLog].slice(0, 100);
  const bountyMultiplier = activity.skillId === "combat" && state.skills.combat.level >= 20 ? 1.2 : 1;
  const tradeOutpost = state.outposts[state.sectorId]?.type === "trade" ? 1 + state.outposts[state.sectorId].level * 0.04 : 1;
  const next = applyAchievements({
    ...state,
    credits: state.credits + Math.floor(((activity.credits ?? 0) + (activity.skillId === "combat" ? state.equipment.railgun : 0)) * count * bountyMultiplier * tradeOutpost),
    inventory,
    skills: { ...state.skills, [activity.skillId]: { xp: skillXp, level: levelFromXp(skillXp) } },
    mastery: { ...state.mastery, [activity.skillId]: mastery },
    operationMastery: { ...state.operationMastery, [activity.id]: operationMastery },
    operationCounts: { ...state.operationCounts, [activity.id]: operationCount },
    totalActions: totalActionsAfter,
    collection,
    hull,
    shields: Math.min(40 + state.equipment.shield * 10, shields + (activity.skillId === "engineering" ? 3 * count : 0)),
    combat,
    statusEffects,
    crewXp,
    crewLoyalty,
    productionQueue,
    activeTask,
    crewMorale: morale,
    factions,
    pendingEvent: nextEvent,
    storyLog,
    lastActiveAt: Date.now(),
  });
  return { state: next, count };
}
function applyOffline(state: GameState) {
  const cap = (12 + state.patrol * 2 + state.commandPoints) * 3600;
  const elapsed = Math.min(cap, Math.max(0, (Date.now() - state.lastActiveAt) / 1000));
  const beforeInventory = state.inventory;
  const beforeXp = Object.values(state.skills).reduce((sum, skill) => sum + skill.xp, 0);
  const firstActivity = activityById[state.activeTask.activityId] ?? activities[0];
  let next = state;
  let remainingSeconds = elapsed;
  let skillActions = 0;
  const offlineActivities: string[] = [];
  for (let batch = 0; batch < 9; batch += 1) {
    const activity = activityById[next.activeTask.activityId] ?? activities[0];
    if (!offlineActivities.includes(activity.name)) offlineActivities.push(activity.name);
    const seconds = actionSeconds(next, activity);
    const available = remainingSeconds + next.progress / 100 * seconds;
    const requested = Math.floor(available / seconds);
    if (!requested) { next = { ...next, progress: Math.min(99.9, available / seconds * 100) }; break; }
    const previousId = activity.id;
    const result = completeActions(next, activity, requested);
    skillActions += result.count;
    const leftover = Math.max(0, available - result.count * seconds);
    const advancedQueue = result.state.activeTask.activityId !== previousId;
    next = result.state;
    if (advancedQueue) { next = { ...next, progress: 0 }; remainingSeconds = leftover; continue; }
    next = { ...next, progress: result.count < requested ? 0 : Math.min(99.9, leftover / seconds * 100) };
    break;
  }
  let combatActions = 0;
  const combatActivity = next.combat.activeTaskId ? activityById[next.combat.activeTaskId] : null;
  if (combatActivity?.skillId === "combat") {
    const combatSeconds = actionSeconds(next, combatActivity);
    const combatRequested = Math.floor((elapsed + next.combat.progress / 100 * combatSeconds) / combatSeconds);
    const combatResult = completeActions(next, combatActivity, combatRequested);
    combatActions = combatResult.count;
    const combatProgress = combatResult.count < combatRequested ? 0 : Math.min(99.9, ((elapsed + next.combat.progress / 100 * combatSeconds - combatResult.count * combatSeconds) / combatSeconds) * 100);
    next = { ...combatResult.state, combat: { ...combatResult.state.combat, progress: combatProgress } };
  }
  const gains: Record<string, number> = {};
  Object.entries(next.inventory).forEach(([id, amount]) => {
    const gain = amount - (beforeInventory[id] ?? 0);
    if (gain > 0) gains[id] = gain;
  });
  const totalActions = skillActions + combatActions;
  const skillLabel = offlineActivities.length > 1 ? `${offlineActivities[0]} + ${offlineActivities.length - 1} queued batches` : firstActivity.name;
  const activityLabel = combatActions && combatActivity ? `${skillLabel} + ${combatActivity.name}` : skillLabel;
  return {
    state: { ...next, lastActiveAt: Date.now() },
    report: elapsed >= 30 && totalActions ? { seconds: elapsed, actions: totalActions, activity: activityLabel, gains, xp: Object.values(next.skills).reduce((sum, skill) => sum + skill.xp, 0) - beforeXp } : null,
  };
}
function completeExpedition(state: GameState) {
  if (!state.activeExpedition || state.activeExpedition.endsAt > Date.now()) return state;
  const expedition = expeditions.find((entry) => entry.id === state.activeExpedition?.id);
  if (!expedition) return { ...state, activeExpedition: null };
  return applyAchievements({
    ...state,
    inventory: addItems(state.inventory, expedition.reward),
    collection: Array.from(new Set([...state.collection, expedition.collection])),
    activeExpedition: null,
    completedExpeditions: state.completedExpeditions + 1,
    crewMorale: Math.min(100, state.crewMorale + 3),
    storyLog: [`${expedition.name} completed successfully.`, ...state.storyLog].slice(0, 30),
    lastActiveAt: Date.now(),
  });
}

function hasMeaningfulGuestProgress(state: GameState) {
  return state.totalActions > 0 || state.patrol > 1 || state.completedExpeditions > 0 ||
    state.missionsCompleted.length > 0 || state.collection.length > 0 ||
    SKILL_IDS.some((id) => state.skills[id].xp > 0);
}

export function GameShell({ initialState, signedIn, saveAvailable, hasCloudSave, accountId, accountName, accountEmail, signInPath, signOutPath }: { initialState: GameState; signedIn: boolean; saveAvailable: boolean; hasCloudSave: boolean; accountId: string | null; accountName: string; accountEmail: string | null; signInPath: string; signOutPath: string }) {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<ViewId>("skills");
  const [selectedSkill, setSelectedSkill] = useState<SkillId>(initialState.activeTask.skillId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(signedIn && saveAvailable ? "saved" : signedIn ? "error" : "guest");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(null);
  const [guestImport, setGuestImport] = useState<GameState | null>(null);
  const [now, setNow] = useState(initialState.lastActiveAt);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef(false);
  const cloudSaveEnabled = useRef(false);
  const cloudSignedIn = signedIn;
  const cloudSaveAvailable = saveAvailable;
  const activeAccountId = accountId;
  const activeAccountName = accountName;
  const activeAccountEmail = accountEmail;
  useEffect(() => { stateRef.current = state; }, [state]);

  const persist = useCallback(async (next: GameState) => {
    if (!cloudSignedIn || !cloudSaveAvailable || !cloudSaveEnabled.current) return;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...next, lastActiveAt: Date.now() }), keepalive: true,
      });
      if (!response.ok) throw new Error("Save failed");
      pendingSave.current = false;
      setSaveStatus("saved");
    } catch { setSaveStatus("error"); }
  }, [cloudSaveAvailable, cloudSignedIn]);

  const queueSave = useCallback((next: GameState) => {
    if (!cloudSignedIn || !cloudSaveAvailable) return;
    pendingSave.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(next), 700);
  }, [cloudSaveAvailable, cloudSignedIn, persist]);

  const updateState = useCallback((updater: (current: GameState) => GameState) => {
    setState((current) => {
      const next = updater(current);
      stateRef.current = next;
      queueSave(next);
      return next;
    });
  }, [queueSave]);

  /* eslint-disable react-hooks/set-state-in-effect -- hydration imports browser-only guest state into the live game. */
  useEffect(() => {
    let base = initialState;
    if (!cloudSignedIn) {
      try {
        const parsed = JSON.parse(localStorage.getItem("starfall-idle-save-v5") ?? localStorage.getItem("starfall-idle-save-v4") ?? localStorage.getItem("starfall-idle-save-v3") ?? localStorage.getItem("starfall-idle-save-v2") ?? "null");
        if (parsed) base = sanitizeGameState(parsed);
      } catch {}
    } else {
      const marker = activeAccountId ? `starfall-idle-guest-import-v1:${activeAccountId}` : null;
      try {
        const parsed = JSON.parse(localStorage.getItem("starfall-idle-save-v5") ?? localStorage.getItem("starfall-idle-save-v4") ?? localStorage.getItem("starfall-idle-save-v3") ?? localStorage.getItem("starfall-idle-save-v2") ?? "null");
        const candidate = parsed ? sanitizeGameState(parsed) : null;
        if (candidate && hasMeaningfulGuestProgress(candidate) && marker && !localStorage.getItem(marker)) {
          // The prompt intentionally blocks cloud writes until the player chooses a save.
          cloudSaveEnabled.current = false;
          setGuestImport(candidate);
        } else cloudSaveEnabled.current = true;
      } catch { cloudSaveEnabled.current = true; }
    }
    base = completeExpedition(base);
    const result = applyOffline(base);
    // Hydration is where a guest save and its offline simulation become the live client state.
    setState(result.state);
    stateRef.current = result.state;
    setSelectedSkill(result.state.activeTask.skillId);
    setOfflineReport(result.report);
    setHydrated(true);
    if (result.report) queueSave(result.state);
  }, [activeAccountId, cloudSignedIn, initialState, queueSave]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const resolveGuestImport = (useGuest: boolean) => {
    const marker = activeAccountId ? `starfall-idle-guest-import-v1:${activeAccountId}` : null;
    if (marker) {
      try { localStorage.setItem(marker, useGuest ? "imported" : "kept-cloud"); } catch {}
    }
    const guestResult = useGuest && guestImport ? applyOffline(completeExpedition(guestImport)) : null;
    const chosen = guestResult?.state ?? stateRef.current;
    if (guestResult) {
      setState(chosen);
      stateRef.current = chosen;
      setSelectedSkill(chosen.activeTask.skillId);
      setOfflineReport(guestResult.report);
    }
    cloudSaveEnabled.current = true;
    setGuestImport(null);
    void persist(chosen);
  };

  useEffect(() => {
    if (!hydrated || cloudSignedIn) return;
    const saveGuest = () => {
      try { localStorage.setItem("starfall-idle-save-v5", JSON.stringify({ ...stateRef.current, lastActiveAt: Date.now() })); } catch {}
    };
    const timer = setInterval(saveGuest, 3000);
    document.addEventListener("visibilitychange", saveGuest);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", saveGuest); saveGuest(); };
  }, [cloudSignedIn, hydrated]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setState((current) => {
        let next = completeExpedition(current);
        let completed = false;
        const activity = activityById[next.activeTask.activityId] ?? activities[0];
        if (!operationPauseReasons(next, activity).length) {
          const progress = next.progress + 100 / (actionSeconds(next, activity) * 4);
          if (progre…9856 tokens truncated…].name} output` : `General post: ${skillMeta[assignment].name}`}</strong><span>{specialist ? member.perk : "Move this specialist to a marked native discipline to activate their personal output bonus."}</span></div>
        <div className="crew-progress"><div><span>Service XP · {fmt(xp)}</span><span>{level >= 50 ? "Veteran rank" : `${fmt(Math.max(0, nextLevelAt - xp))} XP to level ${level + 1}`}</span></div><Progress value={Math.max(0, Math.min(100, levelProgress))} /><div><span>Loyalty</span><span>{loyalty}%</span></div><Progress value={loyalty} /></div>
        <label className="crew-posting"><span>Posting</span><Select value={assignment} onValueChange={(value) => onAssign(member.id, value as SkillId)}><SelectTrigger aria-label={`Assignment for ${member.name}`}><SelectValue /></SelectTrigger><SelectContent>{SKILL_IDS.map((id) => <SelectItem key={id} value={id}>{skillMeta[id].name}{member.specialties.includes(id) ? " · specialist" : ""}</SelectItem>)}</SelectContent></Select></label>
      </article>;
    })}</div>
  </>;
}

function DroneView({ state, onBuild, onBuildVehicle }: { state: GameState; onBuild: (id: DroneId) => void; onBuildVehicle: (id: VehicleId) => void }) {
  return <><div className="section-label"><p className="eyebrow">AUTONOMOUS CRAFT</p><h2>Drone Swarms</h2></div><div className="module-grid">{(Object.entries(droneSpecs) as [DroneId, typeof droneSpecs[DroneId]][]).map(([id, drone]) => <article key={id} className="module-card panel"><span><Bot /></span><div><p className="eyebrow">ACTIVE UNITS · {state.drones[id]}</p><h3>{drone.name}</h3><p>{drone.description}</p><small>{itemsText(drone.cost)}</small></div><Button disabled={!canAfford(state, drone.cost)} onClick={() => onBuild(id)}>Fabricate</Button></article>)}</div><div className="section-label"><p className="eyebrow">HANGAR VEHICLES</p><h2>Surface & Boarding Craft</h2></div><div className="module-grid">{(Object.entries(vehicleSpecs) as [VehicleId, typeof vehicleSpecs[VehicleId]][]).map(([id, vehicle]) => <article key={id} className="module-card panel"><span><Rocket /></span><div><p className="eyebrow">READY · {state.vehicles[id]}</p><h3>{vehicle.name}</h3><p>{vehicle.description}</p><small>{itemsText(vehicle.cost)}</small></div><Button disabled={!canAfford(state, vehicle.cost)} onClick={() => onBuildVehicle(id)}>Construct</Button></article>)}</div></>;
}

function CombatView({ state, onUpgrade, onRetreat, onRepair, onDoctrine, onEngage, onStop, onEquip, onSaveLoadout, onApplyLoadout, onClearEffect }: { state: GameState; onUpgrade: (id: EquipmentId) => void; onRetreat: (value: number) => void; onRepair: () => void; onDoctrine: (weapon?: CombatWeapon, stance?: CombatStance) => void; onEngage: (activity: SkillActivity) => void; onStop: () => void; onEquip: (id: string) => void; onSaveLoadout: (slot: "alpha" | "beta") => void; onApplyLoadout: (slot: "alpha" | "beta") => void; onClearEffect: (effect: StatusEffect) => void }) {
  const targets = activities.filter((entry) => entry.skillId === "combat" && entry.enemy);
  const activeCandidate = state.combat.activeTaskId ? activityById[state.combat.activeTaskId] : null;
  const activeTarget = activeCandidate?.skillId === "combat" ? activeCandidate : null;
  const combatPauseReasons = activeTarget ? operationPauseReasons(state, activeTarget) : [];
  const combatPaused = combatPauseReasons.length > 0;
  const totalVictories = Object.values(state.combat.victories).reduce((a, b) => a + b, 0);
  const milestones = [
    [5, "Targeting Suite", "+5% hit chance"], [10, "Overcharge", "Aggressive stance attacks faster"],
    [15, "Emergency Bulkheads", "10% less incoming damage"], [20, "Bounty Protocol", "+20% combat credits"],
  ] as const;
  return <>
    <div className="combat-summary panel">
      <div><Shield /><span>Hull integrity</span><strong>{state.hull} / {state.maxHull}</strong></div>
      <div><Zap /><span>Deflector charge</span><strong>{state.shields}</strong></div>
      <div><Crosshair /><span>Victory streak</span><strong>{state.combat.streak} · best {state.combat.bestStreak}</strong></div>
      <div><Target /><span>Total victories</span><strong>{totalVictories}</strong></div>
      <div><Rocket /><span>Missile magazine</span><strong>{state.inventory.missiles ?? 0}</strong></div>
      <div><Sparkles /><span>Last rare salvage</span><strong>{state.combat.lastLoot ?? "None recovered"}</strong></div>
    </div>
    <section className={`combat-operation panel ${activeTarget ? "active" : ""}`}>
      <div><p className="eyebrow">VESSEL COMBAT · LEVEL {state.skills.combat.level} · {fmt(state.skills.combat.xp)} XP · RUNS IN PARALLEL</p><h2>{activeTarget ? `Engaging ${activeTarget.name}` : "No hostile target selected"}</h2><p>{activeTarget ? `Combat continues while ${skillMeta[state.activeTask.skillId].name} trains independently.` : "Choose a target below. Your Skill Matrix activity will continue uninterrupted."}</p></div>
      <Progress value={activeTarget ? state.combat.progress : 0} />
      <strong>{activeTarget ? combatPaused ? `Paused · ${combatPauseReasons.join(" · ")}` : `${Math.floor(state.combat.progress)}% · ${actionSeconds(state, activeTarget).toFixed(1)}s encounter` : "Fire control standing by"}</strong>
      {activeTarget ? <Button variant="outline" onClick={onStop}>Disengage</Button> : null}
    </section>
    <section className="combat-control panel">
      <div><p className="eyebrow">FIRE CONTROL</p><h2>Combat doctrine</h2><p>Match your weapon to enemy defences. Guided missiles consume one missile per victory.</p></div>
      <label><span>Weapon system</span><Select value={state.combat.weapon} onValueChange={(value) => onDoctrine(value as CombatWeapon)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weaponNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></label>
      <label><span>Engagement stance</span><Select value={state.combat.stance} onValueChange={(value) => onDoctrine(undefined, value as CombatStance)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(stanceNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></label>
      <label className="retreat-control"><span>Auto-retreat at {state.retreatAt}% hull</span><Slider value={[state.retreatAt]} min={10} max={75} step={5} onValueChange={(value) => onRetreat(value[0])} /></label>
      <Button onClick={onRepair}><Wrench /> Repair & reset streak</Button>
    </section>
    <section className="depth-panel panel"><div><p className="eyebrow">TACTICAL LOADOUTS</p><h2>Doctrine presets</h2><p>Store weapon, stance and retreat settings for quick changes between targets.</p></div><div className="loadout-grid">{(["alpha", "beta"] as const).map((slot) => { const loadout = state.combatLoadouts[slot]; return <article key={slot}><strong>{slot.toUpperCase()}</strong><span>{weaponNames[loadout.weapon]} · {stanceNames[loadout.stance]} · retreat {loadout.retreatAt}%</span><div><Button variant="outline" onClick={() => onSaveLoadout(slot)}>Save current</Button><Button onClick={() => onApplyLoadout(slot)}>Apply</Button></div></article>; })}</div></section>
    {state.statusEffects.length ? <section className="depth-panel panel"><div><p className="eyebrow">SHIP CONDITIONS</p><h2>Persistent battle damage</h2><p>Conditions remain after combat until treated here or cleared by their related skill.</p></div><div className="effect-grid">{state.statusEffects.map((effect) => <article key={effect}><strong>{effect.replace(/([A-Z])/g, " $1")}</strong><span>{effect === "radiation" ? "Operations 5% slower · clear with 2 Medkits or Medicine" : effect === "hullBreach" ? "Incoming damage +18% · clear with 5 Salvage or Engineering" : effect === "sensorDisruption" ? "Combat accuracy −8% · clear with 5 Data or Science" : "Operations 10% slower · clear with 2 Power Cells or Metallurgy"}</span><Button variant="outline" onClick={() => onClearEffect(effect)}>Treat</Button></article>)}</div></section> : null}
    <div className="section-label"><p className="eyebrow">HOSTILE CONTACTS</p><h2>Target roster</h2></div>
    <div className="combat-targets">{targets.map((target) => {
      const enemy = target.enemy!;
      const available = state.skills.combat.level >= target.level && activityAvailable(state, target);
      const hasAmmo = state.combat.weapon !== "missile" || (state.inventory.missiles ?? 0) > 0;
      const matchup = combatMatchup(state, target);
      const active = state.combat.activeTaskId === target.id;
      const victories = state.combat.victories[target.id] ?? 0;
      const rareIn = enemy.rareEvery - victories % enemy.rareEvery;
      return <article key={target.id} className={`combat-target panel ${active ? "active" : ""}`}>
        <div className="target-head"><span><Crosshair /></span><div><p className="eyebrow">{enemy.class.toUpperCase()} · LEVEL {target.level}</p><h3>{target.name}</h3></div><b>{victories} KILLS</b></div>
        <p>{target.description}</p>
        <div className="target-stats"><span>Hull <b>{enemy.hull}</b></span><span>Shield <b>{enemy.shields}</b></span><span>Armor <b>{enemy.armor}</b></span><span>Evasion <b>{enemy.evasion}</b></span></div>
        <div className="matchup-readout"><span className={matchup.weakness ? "advantage" : ""}>{matchup.weakness ? "WEAKNESS EXPLOITED" : `Weak to ${weaponNames[enemy.weakness]}`}</span><span>{matchup.hitChance}% hit · {actionSeconds(state, target).toFixed(1)}s · {combatDamage(state, target)} incoming</span></div>
        <small>Standard: {itemsText(target.produces)} · Rare in {rareIn}: {itemsText(enemy.rareDrop)}</small>
        <Button disabled={!available || !hasAmmo || active} onClick={() => onEngage(target)}>{active ? "Engaging" : !available ? "Target unavailable" : !hasAmmo ? "No missiles" : "Engage target"}</Button>
      </article>;
    })}</div>
    <div className="combat-milestones panel"><div><p className="eyebrow">COMBAT SPECIALISATION</p><h2>Rank perks</h2></div>{milestones.map(([level, name, effect]) => <div key={level} className={state.skills.combat.level >= level ? "unlocked" : ""}><span>LV {level}</span><strong>{name}</strong><small>{effect}</small></div>)}</div>
    <div className="section-label"><p className="eyebrow">ARMOURY</p><h2>Equipment upgrades</h2></div>
    <div className="module-grid">{(Object.entries(equipmentSpecs) as [EquipmentId, typeof equipmentSpecs[EquipmentId]][]).map(([id, gear]) => { const cost = equipmentCosts[id](state.equipment[id]); return <article key={id} className="module-card panel"><span><Shield /></span><div><p className="eyebrow">MK {state.equipment[id]}</p><h3>{gear.name}</h3><p>{gear.description}</p><small>{itemsText(cost)}</small></div><Button disabled={!canAfford(state, cost)} onClick={() => onUpgrade(id)}>Upgrade</Button></article>; })}</div>
    <div className="section-label"><p className="eyebrow">BOSS SALVAGE</p><h2>Unique equipment</h2></div><div className="module-grid">{Object.entries(uniqueGear).map(([id, gear]) => { const owned = (state.inventory[id] ?? 0) > 0; return <article key={id} className={`module-card panel ${state.equippedGear === id ? "active" : ""}`}><span><Star /></span><div><p className="eyebrow">{owned ? "RECOVERED" : "UNKNOWN SIGNAL"}</p><h3>{gear.name}</h3><p>{gear.effect}</p></div><Button disabled={!owned || state.equippedGear === id} onClick={() => onEquip(id)}>{state.equippedGear === id ? "Equipped" : owned ? "Equip" : "Boss drop"}</Button></article>; })}</div>
  </>;
}

function ExpeditionView({ state, now, onLaunch }: { state: GameState; now: number; onLaunch: (id: string) => void }) {
  const active = expeditions.find((entry) => entry.id === state.activeExpedition?.id);
  return <><div className="expedition-status panel">{active ? <><Compass /><div><p className="eyebrow">TEAM DEPLOYED</p><h2>{active.name}</h2><span>Returns in {duration(((state.activeExpedition?.endsAt ?? now) - now) / 1000)}</span></div></> : <><Compass /><div><p className="eyebrow">EXPEDITION BAY</p><h2>Team ready</h2><span>Select one operation below.</span></div></>}</div><div className="module-grid">{expeditions.map((entry) => { const vehicleReady = !entry.vehicle || state.vehicles[entry.vehicle] > 0; return <article key={entry.id} className="module-card panel"><span><Landmark /></span><div><p className="eyebrow">{entry.minutes} MIN · TL {entry.level}</p><h3>{entry.name}</h3><p>{entry.description}</p><small>Cost: {itemsText(entry.cost)} · Reward: {itemsText(entry.reward)}{entry.vehicle ? ` · Requires ${vehicleSpecs[entry.vehicle].name}` : ""}</small></div><Button disabled={Boolean(state.activeExpedition) || totalLevel(state) < entry.level || !canAfford(state, entry.cost) || !vehicleReady} onClick={() => onLaunch(entry.id)}>Launch</Button></article>; })}</div></>;
}

function ContractView({ state, onComplete, onAlly }: { state: GameState; onComplete: (id: string) => void; onAlly: (id: string) => void }) {
  return <><div className="faction-strip">{Object.entries(state.factions).map(([id, rep]) => <div key={id} className={`panel ${state.factionAlly === id ? "allied" : ""}`}><small>{factionNames[id]}</small><strong>{rep}</strong><Progress value={rep} /><Button variant="outline" disabled={Boolean(state.factionAlly) || rep < 30} onClick={() => onAlly(id)}>{state.factionAlly === id ? "Allied" : rep < 30 ? "30 rep required" : "Form alliance"}</Button></div>)}</div>{state.factionAlly ? <div className="notice panel">Alliance active with {factionNames[state.factionAlly]}. Their contracts award 20% more credits.</div> : null}<div className="module-grid">{contracts.map((contract) => <article key={contract.id} className="module-card panel"><span><ScrollText /></span><div><p className="eyebrow">{factionNames[contract.faction]}</p><h3>{contract.name}</h3><p>{contract.description}</p><small>{itemsText(contract.cost)} · {Math.floor(contract.reward.credits * (state.factionAlly === contract.faction ? 1.2 : 1))} credits · +{contract.reward.reputation} reputation</small></div><Button disabled={!canAfford(state, contract.cost)} onClick={() => onComplete(contract.id)}>Fulfil</Button></article>)}</div></>;
}

function ObjectiveView({ state, onClaim }: { state: GameState; onClaim: (id: string) => void }) {
  return <div className="research-tree">{objectives.map((objective, index) => { const claimed = state.claimedObjectives.includes(objective.id); const met = objective.met(state); return <article key={objective.id} className={`research-node panel ${claimed ? "unlocked" : ""}`}><span>{claimed ? <Check /> : index + 1}</span><div><p className="eyebrow">{claimed ? `COMPLETED · ${objective.sector.toUpperCase()}` : objective.sector.toUpperCase()}</p><h3>{objective.name}</h3><p>{objective.description}</p><small>Reward: {objective.reward}</small></div><Button disabled={!met || claimed} onClick={() => onClaim(objective.id)}>{claimed ? "Claimed" : met ? "Claim" : "In progress"}</Button></article>; })}</div>;
}

function ResearchView({ state, onUnlock, onChoosePath }: { state: GameState; onUnlock: (id: string) => void; onChoosePath: (path: ResearchPath) => void }) {
  const paths: Record<ResearchPath, string> = { industrial: "Faster Engineering and Metallurgy", exploration: "Faster Science, Astrogation and Archaeology", military: "Higher combat accuracy", xenotechnology: "Faster biological and medical skills" };
  return <><section className="depth-panel panel"><div><p className="eyebrow">SPECIALISATION · TOTAL LEVEL 200</p><h2>{state.researchPath ? `${state.researchPath} doctrine` : "Choose a permanent research path"}</h2><p>This choice defines your fleet&apos;s strongest field and cannot be changed during this patrol.</p></div><div className="path-grid">{(Object.entries(paths) as [ResearchPath, string][]).map(([id, effect]) => <Button key={id} variant={state.researchPath === id ? "default" : "outline"} disabled={Boolean(state.researchPath) || totalLevel(state) < 200} onClick={() => onChoosePath(id)}><span>{id}</span><small>{effect}</small></Button>)}</div></section><div className="research-tree">{researchNodes.map((node, index) => { const unlocked = state.researchUnlocked.includes(node.id); const prerequisites = node.requires.every((id) => state.researchUnlocked.includes(id)); return <article key={node.id} className={`research-node panel ${unlocked ? "unlocked" : ""}`}><span>{index + 1}</span><div><p className="eyebrow">{unlocked ? "RESEARCHED" : "TECHNOLOGY"}</p><h3>{node.name}</h3><p>{node.description}</p><small>{itemsText(node.cost)}</small></div><Button disabled={unlocked || !prerequisites || !canAfford(state, node.cost)} onClick={() => onUnlock(node.id)}>{unlocked ? "Complete" : prerequisites ? "Research" : "Locked"}</Button></article>; })}</div></>;
}

function OutpostView({ state, onDevelop }: { state: GameState; onDevelop: (sectorId: string, type: OutpostType) => void }) {
  const types: Record<OutpostType, string> = { mining: "+1 gathered Mining and Salvage output per level", research: "+1 Science and Archaeology output per level", trade: "+4% operation credits per level" };
  const resourceIds = ["salvage", "plating", "circuits", "data", "navData"];
  return <><section className="outpost-overview panel"><div><p className="eyebrow">FIVE-SECTOR INFRASTRUCTURE</p><h2>Develop the sector you are currently orbiting</h2><p>Establish one doctrine per sector, upgrade it to level 10, or convert it without losing levels.</p></div><div className="outpost-resources"><span><Coins />{fmt(state.credits)} credits</span>{resourceIds.map((id) => <span key={id}>{fmt(state.inventory[id] ?? 0)} {itemNames[id]}</span>)}</div></section><div className="outpost-list">{sectors.map((sector) => {
    const outpost = state.outposts[sector.id];
    const local = state.sectorId === sector.id;
    return <article key={sector.id} className={`outpost-card panel ${local ? "current" : ""}`}><span><Landmark /></span><div className="outpost-card-body"><div className="outpost-heading"><div><p className="eyebrow">{sector.name.toUpperCase()} · {local ? "IN ORBIT" : "REMOTE"}</p><h3>{outpost ? `${outpost.type[0].toUpperCase()}${outpost.type.slice(1)} outpost` : "Unclaimed outpost site"}</h3></div><b>{outpost ? `LEVEL ${outpost.level}` : "NOT BUILT"}</b></div>{outpost ? <><p className="outpost-bonus">Active bonus: {types[outpost.type]}</p><Progress value={outpost.level * 10} /></> : <p>Build the first level with Salvage and Circuits, then specialise its supply chain.</p>}{local ? <div className="outpost-options">{(Object.keys(types) as OutpostType[]).map((type) => {
      const plan = outpostDevelopment(state, sector.id, type);
      const maxed = !plan.converting && plan.level > 10;
      const missingItems = Object.entries(plan.items).filter(([id, amount]) => (state.inventory[id] ?? 0) < amount).map(([id, amount]) => `${amount - (state.inventory[id] ?? 0)} more ${itemNames[id] ?? id}`);
      if (state.credits < plan.credits) missingItems.unshift(`${plan.credits - state.credits} more credits`);
      const available = !maxed && missingItems.length === 0;
      const verb = plan.converting ? "Convert" : outpost ? "Upgrade" : "Establish";
      return <section key={type} className={outpost?.type === type ? "selected" : ""}><div><strong>{type[0].toUpperCase()}{type.slice(1)}</strong>{outpost?.type === type ? <em>ACTIVE</em> : null}</div><p>{types[type]}</p><small>{maxed ? "Maximum level reached" : `${fmt(plan.credits)} credits · ${itemsText(plan.items)}`}</small><Button disabled={!available} onClick={() => onDevelop(sector.id, type)}>{maxed ? "Level 10" : available ? `${verb} level ${plan.level}` : `Missing: ${missingItems.join(" · ")}`}</Button></section>;
    })}</div> : <div className="outpost-remote"><Compass /> Travel to {sector.name} using the Star Chart to develop this site.</div>}</div></article>;
  })}</div></>;
}

function MissionView({ state, onClaim }: { state: GameState; onClaim: (id: string) => void }) {
  return <div className="research-tree">{missionDefinitions.map((mission, index) => { const complete = state.missionsCompleted.includes(mission.id); const ready = missionReady(state, mission.id); const reward = mission.reward as Record<string, number>; const { credits = 0, ...items } = reward; return <article key={mission.id} className={`research-node panel ${complete ? "unlocked" : ""}`}><span>{complete ? <Check /> : index + 1}</span><div><p className="eyebrow">{complete ? "MISSION COMPLETE" : "NARRATIVE MISSION"}</p><h3>{mission.name}</h3><p>{mission.description}</p><small>Reward: {itemsText(items)}{credits ? `${Object.keys(items).length ? " · " : ""}${fmt(credits)} credits` : ""}</small></div><Button disabled={!ready || complete} onClick={() => onClaim(mission.id)}>{complete ? "Complete" : ready ? "Claim reward" : "In progress"}</Button></article>; })}</div>;
}

function CollectionView({ state }: { state: GameState }) {
  const groups = Array.from(new Set(collectionEntries.map((entry) => entry[2])));
  const rareDiscoveries = state.collection.filter((id) => id.startsWith("rare-")).map((id) => activityById[id.slice(5)]?.name ?? id.slice(5));
  return <div className="collection-groups">{groups.map((group) => <section key={group}><div className="collection-title"><h2>{group}</h2><span>{collectionEntries.filter((entry) => entry[2] === group && state.collection.includes(entry[0])).length} / {collectionEntries.filter((entry) => entry[2] === group).length}</span></div><div className="collection-grid">{collectionEntries.filter((entry) => entry[2] === group).map(([id, name]) => { const found = state.collection.includes(id); return <div key={id} className={`collection-item panel ${found ? "found" : ""}`}>{found ? <Sparkles /> : <LockKeyhole />}<span>{found ? name : "Unknown discovery"}</span></div>; })}</div></section>)}<section><div className="collection-title"><h2>Rare operation discoveries</h2><span>{rareDiscoveries.length} found</span></div><div className="collection-grid">{rareDiscoveries.length ? rareDiscoveries.map((name) => <div key={name} className="collection-item panel found"><Sparkles /><span>{name} anomaly</span></div>) : <div className="collection-item panel"><LockKeyhole /><span>Complete 250 of an operation</span></div>}</div></section></div>;
}

function MarketView({ state, now, getPrice, onTrade }: { state: GameState; now: number; getPrice: (id: string, mode?: "buy" | "sell") => number; onTrade: (id: string, mode: "buy" | "sell", amount: number) => void }) {
  const [orderSize, setOrderSize] = useState(1);
  const sector = sectorById[state.sectorId];
  const nextRefresh = 300 - Math.floor((now % 300_000) / 1_000);
  const cargoBonus = Math.round((state.shipModules.cargo * 2 + state.skills.logistics.level * 0.3) * 10) / 10;
  return <div className="market-view">
    <section className="market-overview panel">
      <div><p className="eyebrow">DOCKED AT {sector.name.toUpperCase()}</p><h2>Station exchange</h2><p>Trade common supplies at the local station. Quotes refresh every five minutes; selling benefits from your cargo deck and Logistics training.</p></div>
      <div className="market-metrics"><span><Coins />{fmt(state.credits)}<small>credits</small></span><span><PackageOpen />{fmt(Object.values(state.inventory).reduce((total, amount) => total + amount, 0))}<small>cargo units</small></span><span><Activity />{Math.floor(nextRefresh / 60)}:{String(nextRefresh % 60).padStart(2, "0")}<small>next refresh</small></span></div>
    </section>
    <section className="market-toolbar panel"><div><strong>Order size</strong><div className="market-size-buttons">{[1, 5, 10, 25].map((amount) => <Button key={amount} variant={orderSize === amount ? "default" : "outline"} onClick={() => setOrderSize(amount)}>{amount}</Button>)}</div></div><p><TrendingUp />Cargo and Logistics add <b>+{cargoBonus}%</b> to sell quotes.</p></section>
    <section className="market-table panel"><div className="market-table-head"><span>Commodity</span><span>Market quote</span><span>Trade</span></div>{marketGoods.map((id) => {
      const Icon = itemIcons[id];
      const buyPrice = getPrice(id, "buy");
      const sellPrice = getPrice(id, "sell");
      const holding = state.inventory[id] ?? 0;
      const base = marketBase[id] * (1 + sectors.findIndex((entry) => entry.id === state.sectorId) * 0.08);
      const rising = buyPrice >= base * 1.1;
      const buyAmount = Math.min(orderSize, Math.floor(state.credits / buyPrice));
      const sellAmount = Math.min(orderSize, holding);
      return <div key={id} className="market-row"><span className="market-item-icon"><Icon /></span><div className="market-item"><strong>{itemNames[id]}</strong><small>In cargo: {fmt(holding)}</small></div><div className="market-quote"><span className={rising ? "rising" : "falling"}>{rising ? <ArrowUpRight /> : <ArrowDownRight />}{rising ? "Active demand" : "Soft demand"}</span><b>Buy {buyPrice} cr</b><small>Sell {sellPrice} cr</small></div><div className="market-actions"><Button variant="outline" disabled={!sellAmount} onClick={() => onTrade(id, "sell", orderSize)}>Sell {sellAmount || orderSize}</Button><Button disabled={!buyAmount} onClick={() => onTrade(id, "buy", orderSize)}>Buy {buyAmount || orderSize}</Button></div></div>;
    })}</section>
  </div>;
}

function PatrolView({ state, onNewPatrol }: { state: GameState; onNewPatrol: () => void }) {
  const ready = totalLevel(state) >= 700 && state.completedExpeditions >= 6 && (state.combat.victories["boss-sentinel-foundry"] ?? 0) >= 1;
  return <><div className="patrol-hero panel"><Medal /><div><p className="eyebrow">COMMISSION {String(state.patrol).padStart(2, "0")}</p><h2>{state.commandPoints} Command Points</h2><p>New commissions award 2 Command Points plus mission bonuses. Mastered operations, veteran crew, research, discoveries and unique boss gear carry forward.</p></div><AlertDialog><AlertDialogTrigger asChild><Button disabled={!ready}>Begin new patrol</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End the current patrol?</AlertDialogTitle><AlertDialogDescription>This resets skill XP, ordinary cargo, ship modules, outposts and standard equipment. Research, discoveries, operation mastery, crew progression, unique gear and Command Points are retained.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep patrolling</AlertDialogCancel><AlertDialogAction onClick={onNewPatrol}>Begin new commission</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div><div className="record-grid"><section className="panel"><h2>Achievements</h2>{achievements.map((entry) => <div key={entry.id} className={state.achievements.includes(entry.id) ? "earned" : ""}>{state.achievements.includes(entry.id) ? <Trophy /> : <LockKeyhole />}<span>{entry.name}</span></div>)}</section><section className="panel"><h2>Patrol requirements</h2><div className={totalLevel(state) >= 700 ? "earned" : ""}><Check /><span>Total level 700 ({totalLevel(state)} / 700)</span></div><div className={state.completedExpeditions >= 6 ? "earned" : ""}><Check /><span>Complete 6 expeditions ({state.completedExpeditions} / 6)</span></div><div className={(state.combat.victories["boss-sentinel-foundry"] ?? 0) >= 1 ? "earned" : ""}><Check /><span>Defeat the Sentinel Foundry</span></div><div><History /><span>{state.totalActions.toLocaleString()} lifetime actions this patrol</span></div></section><section className="panel log-record"><h2>Captain&apos;s log</h2>{state.storyLog.slice(0, 30).map((entry, index) => <p key={index}>{entry}</p>)}</section></div></>;
}

type HiscoreScope = "all" | "patrol" | "weekly";
type HiscoreCategory = "overall" | SkillId;
type HiscoreRow = { rank: number; displayName: string; level: number; xp: number };
type HiscoreRecord = {
  display_name: string;
  total_level: number;
  all_time_xp: number;
  boss_victories: number;
  missions_completed: number;
  expeditions_completed: number;
  patrol_commissions: number;
  operations_mastered: number;
  best_combat_streak: number;
};
type HiscoreResponse = {
  rows: HiscoreRow[];
  total: number;
  page: number;
  pages: number;
  player: HiscoreRow | null;
  record: HiscoreRecord | null;
};

const hiscoreScopes: { id: HiscoreScope; label: string; detail: string }[] = [
  { id: "all", label: "All Time", detail: "Lifetime XP retained across patrol commissions" },
  { id: "patrol", label: "Current Patrol", detail: "Progress earned during the active commission" },
  { id: "weekly", label: "Weekly", detail: "XP gained since Monday at 00:00 UTC" },
];

function HiscoresView({ signedIn, signInPath }: { signedIn: boolean; signInPath: string }) {
  const [category, setCategory] = useState<HiscoreCategory>("overall");
  const [scope, setScope] = useState<HiscoreScope>("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<HiscoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ category, scope, page: String(page) });
    if (search) params.set("search", search);
    fetch(`/api/hiscores?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to load rankings");
        }
        return response.json() as Promise<HiscoreResponse>;
      })
      .then((result) => { setData(result); setLoading(false); })
      .catch((reason: Error) => {
        if (reason.name === "AbortError") return;
        setError(reason.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [category, page, reload, scope, search]);

  const beginLoad = () => { setLoading(true); setError(""); };
  const chooseCategory = (next: HiscoreCategory) => { beginLoad(); setCategory(next); setPage(1); };
  const chooseScope = (next: HiscoreScope) => { beginLoad(); setScope(next); setPage(1); };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    beginLoad();
    setSearch(searchInput.trim().slice(0, 32));
    setPage(1);
  };
  const changePage = (next: number) => { beginLoad(); setPage(next); };
  const categoryName = category === "overall" ? "Overall" : skillMeta[category].name;
  const recordRows = data?.record ? [
    ["Boss victories", data.record.boss_victories, Crosshair],
    ["Missions completed", data.record.missions_completed, ScrollText],
    ["Expeditions completed", data.record.expeditions_completed, Compass],
    ["Patrol commissions", data.record.patrol_commissions, Medal],
    ["Operations mastered", data.record.operations_mastered, Check],
    ["Best combat streak", data.record.best_combat_streak, Zap],
  ] as const : [];

  return <div className="hiscores-layout">
    <aside className="hiscore-categories panel">
      <form className="hiscore-search" onSubmit={submitSearch}>
        <label htmlFor="commander-search">Find a commander</label>
        <div><Search /><Input id="commander-search" value={searchInput} maxLength={32} onChange={(event) => setSearchInput(event.target.value)} placeholder="Commander name" /><Button type="submit">Search</Button></div>
        {search ? <button type="button" className="clear-ranking-search" onClick={() => { beginLoad(); setSearchInput(""); setSearch(""); setPage(1); }}>Clear search for “{search}”</button> : null}
      </form>
      <div className="hiscore-category-list" aria-label="Ranking category">
        <button className={category === "overall" ? "selected" : ""} onClick={() => chooseCategory("overall")}><Trophy /><span><strong>Overall</strong><small>All fourteen skills</small></span><ChevronRight /></button>
        {SKILL_IDS.map((id) => { const Icon = skillIcons[id]; return <button key={id} className={category === id ? "selected" : ""} onClick={() => chooseCategory(id)}><Icon /><span><strong>{skillMeta[id].name}</strong><small>Level and experience</small></span><ChevronRight /></button>; })}
      </div>
    </aside>

    <section className="hiscore-board panel" aria-busy={loading}>
      <header className="hiscore-board-head">
        <div><p className="eyebrow">VERIFIED COMMANDER RANKINGS</p><h2>{categoryName} Hiscores</h2><p>{hiscoreScopes.find((entry) => entry.id === scope)?.detail}</p></div>
        <span>{data?.total ?? 0} ranked</span>
      </header>
      <div className="hiscore-tabs" role="group" aria-label="Ranking period">
        {hiscoreScopes.map((entry) => <button key={entry.id} aria-pressed={scope === entry.id} className={scope === entry.id ? "selected" : ""} onClick={() => chooseScope(entry.id)}>{entry.label}</button>)}
      </div>

      <div className="hiscore-table-wrap">
        <table className="hiscore-table">
          <thead><tr><th>Rank</th><th>Commander</th><th>{category === "overall" ? "Total level" : "Level"}</th><th>{scope === "weekly" ? "XP gained" : "Total XP"}</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 6 }, (_, index) => <tr key={index} className="hiscore-loading"><td colSpan={4}><span /></td></tr>) : null}
            {!loading && error ? <tr><td colSpan={4} className="hiscore-empty"><Radio />{error}<Button variant="outline" onClick={() => { beginLoad(); setReload((value) => value + 1); }}>Retry</Button></td></tr> : null}
            {!loading && !error && !data?.rows.length ? <tr><td colSpan={4} className="hiscore-empty"><Trophy /><strong>No commanders found</strong><span>{search ? "Try another commander name." : "The first signed-in cloud save will establish this ranking."}</span></td></tr> : null}
            {!loading && !error ? data?.rows.map((row) => <tr key={`${row.rank}-${row.displayName}`} className={`${row.rank <= 3 ? `podium rank-${row.rank}` : ""} ${data.player?.rank === row.rank && data.player.displayName === row.displayName ? "player-row" : ""}`}><td><span className="rank-value">{row.rank <= 3 ? <Medal /> : null}{row.rank.toLocaleString()}</span></td><td><strong>{row.displayName}</strong>{data.player?.rank === row.rank && data.player.displayName === row.displayName ? <small>YOU</small> : null}</td><td>{fmt(row.level)}</td><td>{fmt(row.xp)}</td></tr>) : null}
          </tbody>
        </table>
      </div>

      <footer className="hiscore-pagination">
        <Button variant="outline" disabled={page <= 1 || loading} onClick={() => changePage(Math.max(1, page - 1))}><ChevronLeft /> Previous</Button>
        <span>Page <strong>{data?.page ?? page}</strong> of <strong>{data?.pages ?? 1}</strong></span>
        <Button variant="outline" disabled={page >= (data?.pages ?? 1) || loading} onClick={() => changePage(page + 1)}>Next <ChevronRight /></Button>
      </footer>
    </section>

    <aside className="hiscore-personal">
      <section className="personal-rank panel">
        <p className="eyebrow">YOUR RECORD</p>
        {signedIn && data?.player ? <><div className="personal-rank-number"><Medal /><span>Rank</span><strong>#{fmt(data.player.rank)}</strong></div><h3>{data.player.displayName}</h3><div className="personal-rank-stats"><span>{category === "overall" ? "Total level" : `${categoryName} level`}<b>{fmt(data.player.level)}</b></span><span>{scope === "weekly" ? "XP gained" : "Experience"}<b>{fmt(data.player.xp)}</b></span></div></> : null}
        {signedIn && !loading && !data?.player ? <div className="personal-rank-empty"><Cloud /><strong>Awaiting cloud save</strong><span>Your commander will enter the rankings after the next successful save.</span></div> : null}
        {!signedIn ? <div className="personal-rank-empty"><ShieldCheck /><strong>Verify your commander</strong><span>Sign in to join the Hiscores and see your personal rank.</span><a className="sign-in-link" href={signInPath} target="_top">Sign in with ChatGPT</a></div> : null}
      </section>

      <section className="fleet-records panel">
        <div><p className="eyebrow">OTHER HISCORES</p><h3>Patrol record</h3></div>
        {recordRows.length ? recordRows.map(([label, value, Icon]) => <div key={label}><Icon /><span>{label}</span><strong>{fmt(value)}</strong></div>) : <p className="fleet-records-placeholder">Sign in and save progress to reveal your verified records.</p>}
      </section>

      <p className="hiscore-integrity"><ShieldCheck /> Only signed-in cloud saves enter the rankings. Updates are verified and written by the server.</p>
    </aside>
  </div>;
}

function CharacterView({ state, fallbackName, email, signedIn, signInPath, signOutPath, onSaveName }: { state: GameState; fallbackName: string; email: string | null; signedIn: boolean; signInPath: string; signOutPath: string; onSaveName: (name: string) => void }) {
  const [name, setName] = useState(state.displayName || fallbackName);
  const savedName = state.displayName || fallbackName;
  const initials = savedName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SC";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveName(name.trim().slice(0, 32));
  };

  return <div className="character-settings">
    <section className="character-card panel">
      <div className="character-emblem">{initials}</div>
      <div><p className="eyebrow">COMMANDER PROFILE</p><h2>{savedName}</h2><span>{signedIn ? "ChatGPT account · cloud save active" : "Guest profile · saved on this device"}</span></div>
      <div className="character-record"><span>Patrol <b>{state.patrol}</b></span><span>Total level <b>{totalLevel(state)}</b></span><span>Operations <b>{fmt(state.totalActions)}</b></span></div>
    </section>

    <section className="settings-panel panel">
      <div><p className="eyebrow">IDENTITY</p><h2>Display name</h2><p>Choose the commander name shown throughout Starfall Idle. This does not change your ChatGPT account name.</p></div>
      <form onSubmit={submit}>
        <label htmlFor="display-name">Commander display name</label>
        <div><Input id="display-name" value={name} maxLength={32} autoComplete="nickname" onChange={(event) => setName(event.target.value)} placeholder={fallbackName} /><Button type="submit" disabled={name.trim() === state.displayName}>Save name</Button></div>
        <small>{name.length} / 32 characters · Clear the field to use {fallbackName}.</small>
      </form>
    </section>

    <section className="settings-panel account-settings panel">
      <div><p className="eyebrow">ACCOUNT</p><h2>{signedIn ? "ChatGPT account" : "Guest commander"}</h2><p>{signedIn ? <>Signed in as {email}. Your character and patrol progress are stored in your private cloud save.</> : "Sign in with ChatGPT to carry this character and patrol progress between devices."}</p></div>
      {signedIn ? <a className="sign-out-link" href={signOutPath} target="_top">Sign out</a> : <a className="sign-in-link" href={signInPath} target="_top">Sign in with ChatGPT</a>}
    </section>
  </div>;
}

function StoryEvent({ eventId, onChoose }: { eventId: string; onChoose: (id: string) => void }) {
  const event = storyEvents[eventId as keyof typeof storyEvents];
  if (!event) return null;
  return <section className="story-event panel"><Sparkles /><div><p className="eyebrow">SHIP EVENT</p><h2>{event.title}</h2><p>{event.text}</p><div>{event.choices.map((choice) => <Button key={choice.id} variant="outline" onClick={() => onChoose(choice.id)}>{choice.label}</Button>)}</div></div></section>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: number }) {
  return <div className="resource"><Icon /><small>{label}</small><strong>{fmt(value)}</strong></div>;
}
