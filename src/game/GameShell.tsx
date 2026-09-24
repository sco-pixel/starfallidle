import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Biohazard, Bot, Boxes, BrainCircuit, Check, ChevronLeft, ChevronRight,
  Cloud, Coins, Compass, Crosshair, Dna, FlaskConical,
  Hammer, HeartPulse, History, Landmark, LockKeyhole, Map, Medal, Orbit,
  Menu, PackageOpen, Pickaxe, Radio, Recycle, Rocket, ScrollText, Shield,
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
  activities, collectionEntries, contracts, crew, droneSpecs, equipmentSpecs,
  expeditions, itemNames, researchNodes, sectors, shipModules, skillMeta, vehicleSpecs,
  storyEvents, totalLevel, type Activity as SkillActivity,
} from "@/lib/game-content";
import { missionDefinitions, uniqueGear } from "@/lib/depth-content";
import {
  MAX_SKILL_LEVEL, SKILL_IDS, defaultGameState, levelFromXp, sanitizeGameState, xpForLevel,
  type CombatStance, type CombatWeapon, type DroneId, type EquipmentId, type GameState, type OutpostType, type PowerMode, type ShipModuleId, type SkillId, type StatusEffect, type VehicleId,
} from "@/lib/game-state";
import { Sprite } from "@/components/game/Sprite";
import { CombatSprite } from "@/components/game/CombatSprite";
import { advanceCombat, combatAttackProfile, combatPauseReason, prepareCombatEncounter, type CombatHooks } from "@/lib/combat-engine";

type ViewId = "skills" | "bank" | "sectors" | "ship" | "crew" | "combat" | "expeditions" | "directives" | "research" | "collection" | "market" | "character" | "outposts";
type OfflineReport = { seconds: number; actions: number; activity: string; gains: Record<string, number>; xp: number };

const activityById = Object.fromEntries(activities.map((entry) => [entry.id, entry])) as Record<string, SkillActivity>;
const sectorById = Object.fromEntries(sectors.map((entry) => [entry.id, entry]));

function encodeSave(state: GameState) {
  const bytes = new TextEncoder().encode(JSON.stringify({ ...state, lastActiveAt: Date.now() }));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeSave(code: string) {
  const normalized = code.replace(/\s/g, "");
  if (!normalized) throw new Error("Missing save code");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return sanitizeGameState(JSON.parse(new TextDecoder().decode(bytes)));
}

const skillIcons: Record<SkillId, typeof Pickaxe> = {
  mining: Pickaxe, salvage: Recycle, botany: Biohazard, engineering: Wrench,
  science: FlaskConical, combat: Crosshair, astrogation: Compass, drones: Bot,
  metallurgy: Hammer, biochemistry: Dna, logistics: Boxes, medicine: HeartPulse,
  diplomacy: Users, archaeology: Landmark,
};

const navigation: { group: string; items: { id: ViewId; label: string; icon: typeof Map }[] }[] = [
  { group: "Vessel", items: [
    { id: "ship", label: "Cruiser", icon: Rocket }, { id: "crew", label: "Crew", icon: Users },
  ] },
  { group: "Galaxy", items: [
    { id: "sectors", label: "Star Chart", icon: Map }, { id: "expeditions", label: "Expeditions", icon: Compass },
    { id: "directives", label: "Directive Board", icon: ScrollText },
    { id: "market", label: "Market", icon: TrendingUp }, { id: "outposts", label: "Outposts", icon: Landmark },
  ] },
  { group: "Archives", items: [
    { id: "research", label: "Research", icon: BrainCircuit }, { id: "collection", label: "Collection", icon: Telescope },
    { id: "character", label: "Character", icon: UserRound },
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
  { id: "freight-discipline", sector: "Erebus Belt", name: "Freight Discipline", description: "Reach Logistics level 6", reward: "5 Alloy Plating", met: (s) => s.skills.logistics.level >= 6, item: "plating", amount: 5 },
  { id: "helix-remedy", sector: "Helix Reach", name: "Helix Remedy", description: "Store 12 Medkits", reward: "4 Bio-catalysts", met: (s) => s.inventory.medicine >= 12, item: "catalyst", amount: 4 },
  { id: "cinder-watch", sector: "Cinder Expanse", name: "Cinder Watch", description: "Reach Combat level 14", reward: "350 credits", met: (s) => s.skills.combat.level >= 14, credits: 350 },
  { id: "rift-surveyor", sector: "Orpheus Rift", name: "Rift Surveyor", description: "Reach Astrogation level 16", reward: "5 Phase Crystals", met: (s) => s.skills.astrogation.level >= 16, item: "phaseCrystal", amount: 5 },
  { id: "silent-network", sector: "Silent Systems", name: "Silent Network", description: "Build any Silent Systems outpost", reward: "8 Quantum Circuits", met: (s) => Boolean(s.outposts.silent), item: "quantumCircuit", amount: 8 },
  { id: "veteran-specialists", sector: "Patrol", name: "Veteran Specialists", description: "Train three crew members to level 10", reward: "500 credits", met: (s) => Object.values(s.crewXp).filter((xp) => crewLevel(xp) >= 10).length >= 3, credits: 500 },
  { id: "ore-reserve", sector: "Erebus Belt", name: "Ore Reserve", description: "Store 80 Cobalt Crystals", reward: "250 credits", met: (s) => s.inventory.cobalt >= 80, credits: 250 },
  { id: "first-convoy", sector: "Erebus Belt", name: "Convoy Hand", description: "Complete 2 faction contracts", reward: "3 Fuel Rods", met: (s) => s.contractsCompleted.length >= 2, item: "fuelRod", amount: 3 },
  { id: "helix-containment", sector: "Helix Reach", name: "Containment Ready", description: "Reach Medicine level 10", reward: "8 Medkits", met: (s) => s.skills.medicine.level >= 10, item: "medicine", amount: 8 },
  { id: "helix-swarm", sector: "Helix Reach", name: "Swarm Discipline", description: "Build 3 Survey Drones", reward: "8 Drone Parts", met: (s) => s.drones.survey >= 3, item: "droneParts", amount: 8 },
  { id: "cinder-shipwright", sector: "Cinder Expanse", name: "Cinder Shipwright", description: "Upgrade any deck module to MK 4", reward: "450 credits", met: (s) => Object.values(s.shipModules).some((level) => level >= 4), credits: 450 },
  { id: "cinder-relief", sector: "Cinder Expanse", name: "Relief Runner", description: "Complete the Cinder Distress Run", reward: "6 Alloy Plating", met: (s) => s.collection.includes("expedition-distress"), item: "plating", amount: 6 },
  { id: "rift-protocol", sector: "Orpheus Rift", name: "Rift Protocol", description: "Reach Science level 20", reward: "6 Phase Crystals", met: (s) => s.skills.science.level >= 20, item: "phaseCrystal", amount: 6 },
  { id: "silent-decoder", sector: "Silent Systems", name: "Silent Decoder", description: "Complete the Silent Archive expedition", reward: "2 Ancient Cores", met: (s) => s.collection.includes("expedition-archive"), item: "ancientCore", amount: 2 },
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
  const tacticalOfficer = state.crewAssignments.sol === "combat" ? 5 : 0;
  return Math.max(45, Math.min(99, 78 + weaponTracking + training + systems + gear + disruption + tacticalOfficer - activity.enemy.evasion));
}
function combatMatchup(state: GameState, activity: SkillActivity) {
  if (!activity.enemy) return { hitChance: 100, weakness: false, time: 1 };
  const weakness = activity.enemy.weakness === state.combat.weapon;
  const defense = state.combat.weapon === "laser" ? activity.enemy.shields : state.combat.weapon === "railgun" ? activity.enemy.armor : activity.enemy.evasion;
  const weaponSpeed = state.combat.weapon === "laser" ? 0.9 : state.combat.weapon === "missile" ? 1.06 : 1;
  const stanceSpeed = state.combat.stance === "aggressive" ? (state.skills.combat.level >= 10 ? 0.78 : 0.83) : state.combat.stance === "defensive" ? 1.2 : 1;
  const matchup = weakness ? 0.68 : 1 + defense / 150;
  const hitChance = combatHitChance(state, activity);
  return { hitChance, weakness, time: weaponSpeed * stanceSpeed * matchup * (100 / hitChance) };
}
function actionSeconds(state: GameState, activity: SkillActivity) {
  const research = state.researchUnlocked.includes("efficient-cycles") ? 0.95 : 1;
  const mastery = Math.max(0.72, 1 - Math.floor(state.mastery[activity.skillId] / 100) * 0.01) * ((state.operationMastery[activity.id] ?? 0) >= 100 ? 0.9 : 1);
  const weapon = activity.skillId === "combat" ? Math.max(0.72, 1 - (state.equipment.railgun - 1) * 0.025) * combatMatchup(state, activity).time : 1;
  const powerSkills: Record<PowerMode, SkillId[]> = { balanced: [], industrial: ["engineering", "metallurgy", "drones"], research: ["science", "archaeology", "botany", "biochemistry", "medicine"], combat: ["combat"], navigation: ["astrogation", "logistics", "diplomacy"] };
  const power = state.powerMode !== "balanced" && powerSkills[state.powerMode].includes(activity.skillId) ? 0.88 : 1;
  const recovery = state.researchUnlocked.includes("recovery-protocols") && ["medicine", "biochemistry"].includes(activity.skillId) ? 0.92 : 1;
  const gear = state.equippedGear === "gearChronoDrive" ? 0.92 : state.equippedGear === "gearStarfallCrown" ? 0.96 : 1;
  const effects = state.statusEffects.includes("overheating") ? 1.1 : state.statusEffects.includes("radiation") ? 1.05 : 1;
  return Math.max(1, activity.seconds * research * mastery * weapon * power * recovery * gear * effects);
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
  if (skillId === "mining") bonus += Math.max(0, state.equipment.cutter - 1) + state.drones.mining + state.vehicles.rover;
  if (skillId === "salvage") bonus += Math.max(0, state.equipment.cutter - 1) + state.drones.salvage + state.vehicles.rover;
  if (["science", "botany", "archaeology"].includes(skillId)) bonus += Math.max(0, state.equipment.scanner - 1);
  if (["science", "archaeology"].includes(skillId)) bonus += state.drones.survey + state.shipModules.lab;
  if (["botany", "biochemistry"].includes(skillId)) bonus += state.shipModules.hydroponics;
  if (["engineering", "metallurgy", "drones"].includes(skillId)) bonus += state.shipModules.fabricator;
  if (skillId === "drones") bonus += state.shipModules.hangar;
  if (skillId === "medicine") bonus += state.shipModules.medbay;
  if (["astrogation", "logistics", "diplomacy"].includes(skillId)) bonus += state.shipModules.bridge;
  if (["archaeology", "diplomacy"].includes(skillId)) bonus += state.vehicles.boardingShuttle;
  if (["science", "archaeology"].includes(skillId) && state.researchUnlocked.includes("data-vaults")) bonus += 1;
  if ((skillId === "botany" || skillId === "biochemistry") && state.researchUnlocked.includes("xeno-adaptation")) bonus += 1;
  if (skillId === "logistics") bonus += state.drones.cargo;
  if (state.outposts[state.sectorId]?.type === "mining" && ["mining", "salvage"].includes(skillId)) bonus += state.outposts[state.sectorId].level;
  if (state.outposts[state.sectorId]?.type === "research" && ["science", "archaeology"].includes(skillId)) bonus += state.outposts[state.sectorId].level;
  if (state.equippedGear === "gearFoundryHeart" && ["engineering", "metallurgy", "drones"].includes(skillId)) bonus += 2;
  if (state.equippedGear === "gearStarfallCrown") bonus += 1;
  if (state.researchUnlocked.includes("starfall-doctrine")) bonus += Math.floor(Object.values(state.operationMastery).filter((mastery) => mastery >= 100).length / 25);
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
  const droneController = state.crewAssignments.rook === "drones" ? Math.min(4, state.drones.combat) : 0;
  const chiefEngineer = state.crewAssignments.jonas === "engineering" ? 1 : 0;
  return Math.max(1, Math.floor((activity.damage - mitigation - droneController - chiefEngineer) * protocol * stance * veteran * bossAnalysis * unique * breach));
}
function activityCosts(state: GameState, activity: SkillActivity) {
  const costs = { ...(activity.consumes ?? {}) };
  if ((state.operationMastery[activity.id] ?? 0) >= 50) Object.keys(costs).forEach((id) => { costs[id] = Math.max(0, costs[id] - 1); });
  return costs;
}
function activityAvailable(state: GameState, activity: SkillActivity) {
  return !activity.sectors || activity.sectors.includes(state.sectorId);
}
function operationPauseReasons(state: GameState, activity: SkillActivity) {
  if (activity.skillId === "combat" && activity.enemy) {
    const reason = combatPauseReason(state, activity, combatHooks);
    return reason ? [reason] : [];
  }
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
function bestRepairActivity(state: GameState) {
  return ["reactor-grid-repair", "armour-plating-repair", "hull-repair"]
    .map((id) => activityById[id])
    .find((activity) => operationPauseReasons(state, activity).length === 0);
}

function missionReady(state: GameState, id: string) {
  switch (id) {
    case "signal-in-static": return state.collection.length >= 12 && state.skills.science.level >= 15;
    case "broken-convoy": return state.contractsCompleted.length >= 8 && (state.combat.victories["corsair-skiff"] ?? 0) >= 10;
    case "rift-echo": return state.completedExpeditions >= 4 && state.skills.astrogation.level >= 35;
    case "machine-language": return ["science", "diplomacy", "archaeology"].every((skill) => state.skills[skill as SkillId].level >= 50);
    case "foundry-war": return (state.combat.victories["boss-sentinel-foundry"] ?? 0) >= 1 && Boolean(state.outposts.silent);
    case "starfall-protocol": return (state.combat.victories["boss-machine-intelligence"] ?? 0) >= 1 && totalLevel(state) >= 1000;
    case "helix-remnant": return state.skills.medicine.level >= 20 && state.skills.science.level >= 20 && (state.combat.victories["helix-automata"] ?? 0) >= 15;
    case "corsair-accord": return state.contractsCompleted.length >= 10 && state.skills.diplomacy.level >= 25;
    case "rift-cartographer": return state.skills.astrogation.level >= 45 && state.completedExpeditions >= 6;
    case "silent-witness": return state.collection.length >= 55 && (state.combat.victories["boss-rift-leviathan"] ?? 0) >= 1;
    case "erebus-oath": return state.contractsCompleted.length >= 3 && state.skills.logistics.level >= 12;
    case "helix-quarantine": return state.collection.includes("expedition-quarantine") && state.skills.medicine.level >= 18;
    case "cinder-mercy": return state.collection.includes("expedition-distress") && Object.entries(state.combat.victories).filter(([id]) => id.includes("corsair")).reduce((total, [, count]) => total + count, 0) >= 25;
    case "rift-probe-recovered": return state.collection.includes("expedition-probe") && state.skills.science.level >= 32;
    case "silent-archive-protocol": return state.collection.includes("expedition-archive") && state.skills.archaeology.level >= 40;
    default: return false;
  }
}
function applyAchievements(state: GameState) {
  const earned = achievements.filter((entry) => entry.met(state)).map((entry) => entry.id);
  return { ...state, achievements: Array.from(new Set([...state.achievements, ...earned])) };
}
function completeActions(state: GameState, activity: SkillActivity, requested: number, combatVictory = false) {
  if (state.skills[activity.skillId].level < activity.level) return { state, count: 0 };
  let count = Math.max(0, Math.floor(requested));
  const costs = combatVictory ? {} : activityCosts(state, activity);
  for (const [id, amount] of Object.entries(costs)) if (amount > 0) count = Math.min(count, Math.floor((state.inventory[id] ?? 0) / amount));
  const damage = combatVictory ? 0 : combatDamage(state, activity);
  if (damage) {
    const safeHull = state.maxHull * (state.retreatAt / 100);
    // An encounter may cross the retreat threshold; the next one must then pause.
    // Match operationPauseReasons: shields can still protect a hull already at the threshold.
    const endurance = Math.max(0, state.hull - safeHull) + state.shields;
    count = Math.min(count, Math.ceil(endurance / damage));
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
  const repairStrength = activity.id === "hull-repair" ? 18 : activity.id === "armour-plating-repair" ? 44 : activity.id === "reactor-grid-repair" ? 85 : 0;
  if (repairStrength) hull = Math.min(state.maxHull, hull + (repairStrength + (state.researchUnlocked.includes("autonomous-repair") ? 8 : 0)) * count);
  if (repairStrength) shields = Math.min(40 + state.equipment.shield * 10, shields + Math.ceil(repairStrength / 3) * count);
  if (activity.skillId === "medicine") morale = Math.min(100, morale + (2 + state.shipModules.medbay) * count);
  if (activity.skillId === "diplomacy") factions.frontier = Math.min(100, factions.frontier + count);
  const totalActionsAfter = state.totalActions + count;
  const crossedEvent = Math.floor(totalActionsAfter / 40) > Math.floor(state.totalActions / 40);
  const eventIds = Object.keys(storyEvents);
  const nextEvent = crossedEvent && !state.pendingEvent ? eventIds[Math.floor(totalActionsAfter / 40) % eventIds.length] : state.pendingEvent;

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
  } else if (repairStrength) combat = { ...combat, streak: 0 };
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
    crewMorale: morale,
    factions,
    pendingEvent: nextEvent,
    storyLog,
    lastActiveAt: Date.now(),
  });
  return { state: next, count };
}
const combatHooks: CombatHooks = {
  hitChance: combatHitChance,
  incomingDamage: combatDamage,
  encounterCosts: activityCosts,
  awardVictory: (state, target) => completeActions(state, target, 1, true).state,
  availabilityReasons: (state, target) => {
    const reasons: string[] = [];
    if (state.skills.combat.level < target.level) reasons.push(`Requires Combat level ${target.level}; current level is ${state.skills.combat.level}`);
    if (!activityAvailable(state, target)) reasons.push(`Wrong sector: travel to ${listText((target.sectors ?? []).map((id) => sectorById[id]?.name ?? id))}`);
    return reasons;
  },
};

/** Training completions and individual attacks share the same live/offline timeline. */
function advanceGameTime(state: GameState, seconds: number, emitHits = true) {
  let next = state;
  let remaining = Math.max(0, Math.min(24 * 3600, seconds));
  let skillActions = 0;
  let combatActions = 0;
  while (remaining > 0.000001) {
    const target = next.combat.activeTaskId ? activityById[next.combat.activeTaskId] : null;
    if (target?.enemy && target.skillId === "combat") next = prepareCombatEncounter(next, target, combatHooks);
    const training = activityById[next.activeTask.activityId] ?? activities[0];
    const ready = operationPauseReasons(next, training).length === 0;
    const trainingSeconds = actionSeconds(next, training);
    const untilTraining = ready ? Math.max(0.000001, (100 - next.progress) / 100 * trainingSeconds) : Infinity;
    let untilCombat = Infinity;
    if (target?.enemy && target.skillId === "combat") {
      const encounter = next.combat.encounter?.targetId === target.id ? next.combat.encounter : null;
      if (encounter && encounter.enemyHull <= 0) untilCombat = encounter.spawnDelay;
      else if (!combatPauseReason(next, target, combatHooks)) {
        const profile = combatAttackProfile(next, target);
        untilCombat = encounter ? Math.min(encounter.playerCooldown, encounter.enemyCooldown) : Math.min(profile.playerInterval, profile.enemyInterval);
      }
    }
    // Recheck training supplies and speed after every attack, reward, or repair event.
    const step = Math.min(remaining, untilTraining, Math.max(0.000001, untilCombat));
    const progress = ready ? Math.min(100, next.progress + step / trainingSeconds * 100) : next.progress;
    if (target?.enemy && target.skillId === "combat") {
      const result = advanceCombat(next, target, step, combatHooks, { emitHits });
      next = result.state;
      combatActions += result.victories;
    } else if (next.combat.hits.length) {
      next = { ...next, combat: { ...next.combat, hits: [] } };
    }
    next = { ...next, progress };
    if (ready && progress >= 100 - 0.000001) {
      const result = completeActions({ ...next, progress: 0 }, training, 1);
      next = result.state;
      skillActions += result.count;
    }
    remaining -= step;
  }
  return { state: next, skillActions, combatActions };
}

function applyOffline(state: GameState) {
  const cap = 24 * 3600;
  const elapsed = Math.min(cap, Math.max(0, (Date.now() - state.lastActiveAt) / 1000));
  const beforeInventory = state.inventory;
  const beforeXp = Object.values(state.skills).reduce((sum, skill) => sum + skill.xp, 0);
  const firstActivity = activityById[state.activeTask.activityId] ?? activities[0];
  const simulation = advanceGameTime(state, elapsed, false);
  const next = simulation.state;
  const { skillActions, combatActions } = simulation;
  const combatActivity = next.combat.activeTaskId ? activityById[next.combat.activeTaskId] : null;
  const gains: Record<string, number> = {};
  Object.entries(next.inventory).forEach(([id, amount]) => {
    const gain = amount - (beforeInventory[id] ?? 0);
    if (gain > 0) gains[id] = gain;
  });
  const totalActions = skillActions + combatActions;
  const activityLabel = combatActions && combatActivity ? `${firstActivity.name} + ${combatActivity.name}` : firstActivity.name;
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
    skills: { ...state.skills, [expedition.skill]: { xp: state.skills[expedition.skill].xp + expedition.xp, level: levelFromXp(state.skills[expedition.skill].xp + expedition.xp) } },
    collection: Array.from(new Set([...state.collection, expedition.collection])),
    activeExpedition: null,
    completedExpeditions: state.completedExpeditions + 1,
    crewMorale: Math.min(100, state.crewMorale + 3),
    storyLog: [`${expedition.name} completed successfully. +${expedition.xp} ${skillMeta[expedition.skill].name} XP.`, ...state.storyLog].slice(0, 30),
    lastActiveAt: Date.now(),
  });
}

export function GameShell({ initialState }: { initialState: GameState }) {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<ViewId>("skills");
  const [selectedSkill, setSelectedSkill] = useState<SkillId>(initialState.activeTask.skillId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(null);
  const [now, setNow] = useState(initialState.lastActiveAt);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAccountName = "Guest commander";
  useEffect(() => { stateRef.current = state; }, [state]);

  const persist = useCallback((next: GameState) => {
    try { localStorage.setItem("starfall-idle-save-v5", JSON.stringify({ ...next, lastActiveAt: Date.now() })); } catch {}
  }, []);

  const queueSave = useCallback((next: GameState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 700);
  }, [persist]);

  const updateState = useCallback((updater: (current: GameState) => GameState) => {
    setState((current) => {
      const next = updater(current);
      stateRef.current = next;
      queueSave(next);
      return next;
    });
  }, [queueSave]);

  const loadSave = useCallback((next: GameState) => {
    const loaded = { ...next, lastActiveAt: Date.now() };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setState(loaded);
    stateRef.current = loaded;
    setSelectedSkill(loaded.activeTask.skillId);
    setOfflineReport(null);
    persist(loaded);
  }, [persist]);

  /* eslint-disable react-hooks/set-state-in-effect -- hydration imports browser-only guest state into the live game. */
  useEffect(() => {
    let base = initialState;
    try {
      const parsed = JSON.parse(localStorage.getItem("starfall-idle-save-v5") ?? localStorage.getItem("starfall-idle-save-v4") ?? localStorage.getItem("starfall-idle-save-v3") ?? localStorage.getItem("starfall-idle-save-v2") ?? "null");
      if (parsed) base = sanitizeGameState(parsed);
    } catch {}
    base = completeExpedition(base);
    const result = applyOffline(base);
    // Hydration is where a guest save and its offline simulation become the live client state.
    setState(result.state);
    stateRef.current = result.state;
    setSelectedSkill(result.state.activeTask.skillId);
    setOfflineReport(result.report);
    setHydrated(true);
    if (result.report) queueSave(result.state);
  }, [initialState, queueSave]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    const saveGuest = () => {
      try { localStorage.setItem("starfall-idle-save-v5", JSON.stringify({ ...stateRef.current, lastActiveAt: Date.now() })); } catch {}
    };
    const timer = setInterval(saveGuest, 3000);
    document.addEventListener("visibilitychange", saveGuest);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", saveGuest); saveGuest(); };
  }, [hydrated]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setState((current) => {
        const simulation = advanceGameTime(completeExpedition(current), 0.25);
        const next = simulation.state;
        const completed = simulation.skillActions > 0 || simulation.combatActions > 0;
        stateRef.current = next;
        if (completed) queueSave(next);
        return next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [queueSave]);

  const startActivity = useCallback((activity: SkillActivity) => {
    const current = stateRef.current;
    if (activity.skillId === "combat" || current.skills[activity.skillId].level < activity.level || !activityAvailable(current, activity)) return;
    updateState((entry) => ({ ...entry, activeTask: { skillId: activity.skillId, activityId: activity.id }, progress: 0, lastActiveAt: Date.now() }));
    setSelectedSkill(activity.skillId);
    setView("skills");
  }, [updateState]);

  const startBestRepair = useCallback(() => {
    const repair = bestRepairActivity(stateRef.current);
    if (!repair || stateRef.current.activeTask.activityId === repair.id) return;
    updateState((entry) => ({ ...entry, activeTask: { skillId: "engineering", activityId: repair.id }, progress: 0, lastActiveAt: Date.now() }));
    setSelectedSkill("engineering");
  }, [updateState]);

  const startCombat = useCallback((activity: SkillActivity) => {
    const current = stateRef.current;
    if (activity.skillId !== "combat" || current.combat.activeTaskId === activity.id || operationPauseReasons(current, activity).length) return;
    updateState((entry) => ({ ...entry, combat: { ...entry.combat, activeTaskId: activity.id, progress: 0, encounter: null, hits: [] }, lastActiveAt: Date.now() }));
  }, [updateState]);

  const stopCombat = useCallback(() => updateState((entry) => ({ ...entry, combat: { ...entry.combat, activeTaskId: null, progress: 0, encounter: null, hits: [] }, lastActiveAt: Date.now() })), [updateState]);

  const active = activityById[state.activeTask.activityId] ?? activities[0];
  const activeSkill = state.skills[active.skillId];
  const activeSector = sectorById[state.sectorId] ?? sectors[0];
  const activePauseReasons = operationPauseReasons(state, active);
  const activeBlocked = activePauseReasons.length > 0;
  const selectedProgress = state.skills[selectedSkill];
  const xpStart = xpForLevel(selectedProgress.level);
  const xpEnd = selectedProgress.level === MAX_SKILL_LEVEL ? selectedProgress.xp : xpForLevel(selectedProgress.level + 1);
  const xpProgress = selectedProgress.level === MAX_SKILL_LEVEL ? 100 : (selectedProgress.xp - xpStart) / Math.max(1, xpEnd - xpStart) * 100;
  const displayName = state.displayName || activeAccountName;
  const openView = (nextView: ViewId) => { setView(nextView); setMobileMenuOpen(false); };

  const travel = (sectorId: string) => updateState((current) => {
    const destination = sectorById[sectorId];
    if (!destination || totalLevel(current) < destination.level) return current;
    const discount = current.researchUnlocked.includes("phase-mapping") ? 1 : 0;
    const fuel = Math.max(0, destination.fuel - discount);
    if ((current.inventory.fuelRod ?? 0) < fuel) return current;
    return applyAchievements({
      ...current,
      sectorId,
      inventory: { ...current.inventory, fuelRod: current.inventory.fuelRod - fuel },
      collection: Array.from(new Set([...current.collection, `chart-${sectorId}`])),
      storyLog: [`Arrived in ${destination.name}.`, ...current.storyLog].slice(0, 30),
      lastActiveAt: Date.now(),
    });
  });

  const upgradeModule = (id: ShipModuleId) => updateState((current) => {
    const level = current.shipModules[id];
    const cost = { plating: level * 3, circuits: level * 2, credits: level * 40 };
    if (!canAfford(current, { plating: cost.plating, circuits: cost.circuits }) || current.credits < cost.credits) return current;
    const maxHull = id === "reactor" ? current.maxHull + 10 : current.maxHull;
    return { ...current, credits: current.credits - cost.credits, inventory: spend(current.inventory, { plating: cost.plating, circuits: cost.circuits }), shipModules: { ...current.shipModules, [id]: level + 1 }, maxHull, hull: id === "reactor" ? maxHull : current.hull, lastActiveAt: Date.now() };
  });

  const upgradeEquipment = (id: EquipmentId) => updateState((current) => {
    const cost = equipmentCosts[id](current.equipment[id]);
    if (!canAfford(current, cost)) return current;
    return { ...current, inventory: spend(current.inventory, cost), equipment: { ...current.equipment, [id]: current.equipment[id] + 1 }, lastActiveAt: Date.now() };
  });

  const buildDrone = (id: DroneId) => updateState((current) => {
    const cost = droneSpecs[id].cost;
    if (!canAfford(current, cost)) return current;
    return { ...current, inventory: spend(current.inventory, cost), drones: { ...current.drones, [id]: current.drones[id] + 1 }, lastActiveAt: Date.now() };
  });

  const buildVehicle = (id: VehicleId) => updateState((current) => {
    const cost = vehicleSpecs[id].cost;
    if (!canAfford(current, cost)) return current;
    return { ...current, inventory: spend(current.inventory, cost), vehicles: { ...current.vehicles, [id]: current.vehicles[id] + 1 }, lastActiveAt: Date.now() };
  });

  const assignCrew = (id: string, skillId: SkillId) => updateState((current) => ({
    ...current, crewAssignments: { ...current.crewAssignments, [id]: skillId }, lastActiveAt: Date.now(),
  }));

  const unlockResearch = (id: string) => updateState((current) => {
    const node = researchNodes.find((entry) => entry.id === id);
    if (!node || current.researchUnlocked.includes(id) || !node.requires.every((entry) => current.researchUnlocked.includes(entry)) || !canAfford(current, node.cost)) return current;
    return { ...current, inventory: spend(current.inventory, node.cost), researchUnlocked: [...current.researchUnlocked, id], lastActiveAt: Date.now() };
  });

  const setPowerMode = (mode: PowerMode) => updateState((current) => ({ ...current, powerMode: mode, lastActiveAt: Date.now() }));

  const developOutpost = (sectorId: string, type: OutpostType) => updateState((current) => {
    if (current.sectorId !== sectorId) return current;
    const plan = outpostDevelopment(current, sectorId, type);
    if (plan.level > 10 || !canAfford(current, plan.items) || current.credits < plan.credits) return current;
    const action = plan.converting ? "converted to" : plan.existing ? "advanced to" : "established at";
    return { ...current, inventory: spend(current.inventory, plan.items), credits: current.credits - plan.credits, outposts: { ...current.outposts, [sectorId]: { type, level: plan.level } }, storyLog: [`${sectorById[sectorId].name} outpost ${action} ${type} level ${plan.level}.`, ...current.storyLog].slice(0, 100), lastActiveAt: Date.now() };
  });

  const equipUniqueGear = (id: string) => updateState((current) => (current.inventory[id] ?? 0) > 0 ? { ...current, equippedGear: id, lastActiveAt: Date.now() } : current);

  const clearStatusEffect = (effect: StatusEffect) => updateState((current) => {
    const costs: Record<StatusEffect, Record<string, number>> = { radiation: { medicine: 2 }, hullBreach: { salvage: 5 }, sensorDisruption: { data: 5 }, overheating: { powerCell: 2 } };
    if (!current.statusEffects.includes(effect) || !canAfford(current, costs[effect])) return current;
    return { ...current, inventory: spend(current.inventory, costs[effect]), statusEffects: current.statusEffects.filter((entry) => entry !== effect), storyLog: [`Cleared ship condition: ${effect}.`, ...current.storyLog].slice(0, 100), lastActiveAt: Date.now() };
  });

  const formAlliance = (faction: string) => updateState((current) => current.factionAlly || (current.factions[faction] ?? 0) < 30 ? current : { ...current, factionAlly: faction, storyLog: [`Formal alliance established with ${factionNames[faction]}.`, ...current.storyLog].slice(0, 100), lastActiveAt: Date.now() });

  const claimMission = (id: string) => updateState((current) => {
    if (current.missionsCompleted.includes(id) || !missionReady(current, id)) return current;
    const mission = missionDefinitions.find((entry) => entry.id === id);
    if (!mission) return current;
    const reward = mission.reward as Record<string, number>;
    const { credits = 0, ...items } = reward;
    const missionCredits = Math.floor(credits * (current.researchUnlocked.includes("mission-beacon") ? 1.2 : 1));
    return { ...current, credits: current.credits + missionCredits, inventory: addItems(current.inventory, items), missionsCompleted: [...current.missionsCompleted, id], storyLog: [`Mission completed: ${mission.name}.`, ...current.storyLog].slice(0, 100), lastActiveAt: Date.now() };
  });

  const completeContract = (id: string) => updateState((current) => {
    const contract = contracts.find((entry) => entry.id === id);
    if (!contract || current.contractsCompleted.includes(id) || !canAfford(current, contract.cost)) return current;
    const reputation = Math.floor(contract.reward.reputation * (current.researchUnlocked.includes("broker-network") ? 1.25 : 1));
    return {
      ...current,
      inventory: spend(current.inventory, contract.cost),
      credits: current.credits + Math.floor(contract.reward.credits * (current.factionAlly === contract.faction ? 1.2 : 1)),
      factions: { ...current.factions, [contract.faction]: Math.min(100, current.factions[contract.faction] + reputation) },
      contractsCompleted: [...current.contractsCompleted, id],
      storyLog: [`${contract.name} fulfilled.`, ...current.storyLog].slice(0, 30),
      lastActiveAt: Date.now(),
    };
  });

  const claimObjective = (id: string) => updateState((current) => {
    const objective = objectives.find((entry) => entry.id === id);
    if (!objective || current.claimedObjectives.includes(id) || !objective.met(current)) return current;
    const inventory = objective.item && objective.amount ? addItems(current.inventory, { [objective.item]: objective.amount }) : current.inventory;
    return { ...current, credits: current.credits + (objective.credits ?? 0), inventory, claimedObjectives: [...current.claimedObjectives, id], lastActiveAt: Date.now() };
  });

  const launchExpedition = (id: string) => updateState((current) => {
    const expedition = expeditions.find((entry) => entry.id === id);
    if (!expedition || current.activeExpedition || totalLevel(current) < expedition.level || !canAfford(current, expedition.cost) || (expedition.vehicle && !current.vehicles[expedition.vehicle])) return current;
    return { ...current, inventory: spend(current.inventory, expedition.cost), activeExpedition: { id, endsAt: Date.now() + expedition.minutes * 60_000 }, crewMorale: Math.max(0, current.crewMorale - 2), lastActiveAt: Date.now() };
  });

  const marketPrice = (item: string, mode: "buy" | "sell" = "buy") => {
    const sectorFactor = 1 + sectors.findIndex((entry) => entry.id === state.sectorId) * 0.08;
    const marketWave = 0.9 + ((Math.floor(now / 300_000) + item.length) % 5) * 0.05;
    const stationPrice = marketBase[item] * sectorFactor * marketWave;
    if (mode === "sell") {
      const cargoBonus = 1 + state.shipModules.cargo * 0.02 + state.skills.logistics.level * 0.003;
      return Math.max(1, Math.floor(stationPrice * 0.7 * cargoBonus));
    }
    return Math.max(1, Math.ceil(stationPrice * 1.1));
  };
  const trade = (item: string, mode: "buy" | "sell", requestedAmount: number) => updateState((current) => {
    const price = marketPrice(item, mode);
    const amount = mode === "buy"
      ? Math.min(Math.max(0, Math.floor(requestedAmount)), Math.floor(current.credits / price))
      : Math.min(Math.max(0, Math.floor(requestedAmount)), current.inventory[item] ?? 0);
    if (!amount) return current;
    if (mode === "buy") return { ...current, credits: current.credits - price * amount, inventory: addItems(current.inventory, { [item]: amount }), lastActiveAt: Date.now() };
    if (mode === "sell") {
      return { ...current, credits: current.credits + price * amount, inventory: spend(current.inventory, { [item]: amount }), lastActiveAt: Date.now() };
    }
    return current;
  });

  const resolveEvent = (choiceId: string) => updateState((current) => {
    const event = current.pendingEvent ? storyEvents[current.pendingEvent as keyof typeof storyEvents] : null;
    const choice = event?.choices.find((entry) => entry.id === choiceId);
    if (!event || !choice) return current;
    const { credits = 0, ...reward } = choice.reward;
    const factions = choice.faction ? { ...current.factions, [choice.faction.id]: Math.min(100, (current.factions[choice.faction.id] ?? 0) + choice.faction.reputation) } : current.factions;
    const skills = choice.xp ? { ...current.skills, [choice.xp.skill]: { xp: current.skills[choice.xp.skill].xp + choice.xp.amount, level: levelFromXp(current.skills[choice.xp.skill].xp + choice.xp.amount) } } : current.skills;
    return {
      ...current,
      credits: current.credits + credits,
      inventory: addItems(current.inventory, reward),
      crewMorale: Math.max(0, Math.min(100, current.crewMorale + choice.morale)),
      factions,
      skills,
      pendingEvent: null,
      storyLog: [choice.result, ...current.storyLog].slice(0, 30),
      lastActiveAt: Date.now(),
    };
  });

  const viewTitle: Record<ViewId, [string, string]> = {
    skills: [skillMeta[selectedSkill].name, skillMeta[selectedSkill].description],
    bank: ["Cargo Bank", "Every material carried aboard the Aethelgard"],
    sectors: ["Star Chart", "Travel changes available resources, enemies and discoveries"],
    ship: ["Aethelgard Cruiser", "Four decks, nine upgradeable ship systems"],
    crew: ["Crew Roster", "Assign ten specialists to support the skills you value"],
    combat: ["Combat", ""],
    expeditions: ["Expeditions", "Prepare supplies and send teams on longer operations"],
    directives: ["Directive Board", "Active contracts, sector objectives and long-form missions in one place"],
    research: ["Research Network", "Turn discoveries into permanent technical advantages"],
    collection: ["Discovery Archive", "Record resources, enemies, ruins and expeditions"],
    market: ["Station Market", "Prices shift every five minutes and vary by sector"],
    character: ["Character & Settings", "Manage your commander identity and local save"],
    outposts: ["Sector Outposts", "Develop support infrastructure across the five established sectors"],
  };

  return (
    <>
      <header className="site-header">
        <a className="brand-lockup" href="#/" aria-label="Return to the Starfall Idle home screen">
          <span className="brand-mark" aria-hidden="true"><Orbit /></span>
          <div><p className="eyebrow">SECTOR // {activeSector.name.toUpperCase()}</p><h1>Starfall Idle</h1></div>
        </a>
        <div className="account-area">
          <p className="greeting">Welcome aboard, <strong>{displayName}</strong></p>
          <a className="support-link" href="https://ko-fi.com/w644769" target="_blank" rel="noreferrer"><Coins /> Support</a>
          <span className="header-save-indicator" role="status" aria-label="Saved on this device" title="Saved on this device"><ShieldCheck /></span>
          <button className="account-link" onClick={() => openView("character")}><UserRound /> Character</button>
        </div>
      </header>
    <div className="game-layout v3 with-skill-nav">
      <aside className="command-nav panel">
        <button className={`home-button ${view === "skills" ? "selected" : ""}`} onClick={() => setView("skills")}><Activity /><span><strong>Skill Matrix</strong><small>TL {totalLevel(state)}</small></span></button>
        <div className="skill-list expanded-skills">
          {SKILL_IDS.map((id) => {
            const Icon = skillIcons[id];
            const isCombat = id === "combat";
            return <button key={id} className={`skill-button ${isCombat ? (view === "combat" ? "selected" : "") : (view === "skills" && selectedSkill === id ? "selected" : "")}`} onClick={() => isCombat ? openView("combat") : (setSelectedSkill(id), setView("skills"))}><span className="skill-icon"><Icon /></span><span><strong>{skillMeta[id].name}</strong><small>{isCombat ? "Combat console" : skillMeta[id].group}</small></span><b>{state.skills[id].level}</b>{isCombat ? state.combat.activeTaskId ? <i className="active-pip" aria-label="Combat engaged" /> : null : active.skillId === id ? <i className="active-pip" aria-label="Skill training active" /> : null}</button>;
          })}
        </div>
        <button className="home-button bank-link" onClick={() => openView("bank")}><Boxes /><span><strong>Cargo Bank</strong><small>{Object.values(state.inventory).reduce((a, b) => a + b, 0)} items</small></span></button>
      </aside>

      <main className="play-column">
        {offlineReport ? <div className="offline-report panel"><Cloud /><div><strong>Offline progress report · {duration(offlineReport.seconds)}</strong><span>{offlineReport.activity} · {offlineReport.actions} actions · +{offlineReport.xp} XP · {itemsText(offlineReport.gains)}</span></div><button onClick={() => setOfflineReport(null)}>×</button></div> : null}
        {view === "skills" ? <section className="active-operation panel">
          <div className="operation-mark"><Sprite kind="operation" id={active.id} label={`${active.name} operation sprite`} className="active-operation-sprite" decorative /></div>
          <div className="operation-body">
            <div className="operation-heading"><div><p className="eyebrow">ACTIVE · {skillMeta[active.skillId].name.toUpperCase()} · {activeSector.name.toUpperCase()}</p><h2>{active.name}</h2></div><span className="level-chip">LV {activeSkill.level}</span></div>
            <Progress value={activeBlocked ? 0 : state.progress} className="operation-progress" />
            <div className="operation-meta"><span>{activeBlocked ? `Paused — ${activePauseReasons.join(" · ")}` : `${Math.floor(state.progress)}% · ${actionSeconds(state, active).toFixed(1)}s action`}</span><span>{active.xp} XP · {itemsText(active.produces)}</span></div>
          </div>
        </section> : null}

        <header className={`content-heading v3-heading${view === "combat" ? " combat-heading" : ""}`}><div><p className="eyebrow">{view === "skills" ? skillMeta[selectedSkill].group.toUpperCase() + " SKILL" : view === "combat" ? "COMBAT CONSOLE" : "COMMAND CONSOLE"}</p><h1>{viewTitle[view][0]}</h1>{viewTitle[view][1] ? <p>{viewTitle[view][1]}</p> : null}</div>{view === "skills" ? <div className="xp-block"><strong>Level {state.skills[selectedSkill].level}</strong><span>{fmt(state.skills[selectedSkill].xp)} XP · {fmt(state.mastery[selectedSkill])} mastery</span><Progress value={xpProgress} /></div> : null}</header>

        {view === "skills" ? <SkillView state={state} skillId={selectedSkill} activeId={active.id} onStart={startActivity} /> : null}
        {view === "bank" ? <Bank state={state} /> : null}
        {view === "sectors" ? <SectorView state={state} onTravel={travel} /> : null}
        {view === "ship" ? <ShipView state={state} onUpgrade={upgradeModule} onUpgradeEquipment={upgradeEquipment} onEquip={equipUniqueGear} onPowerMode={setPowerMode} onBuildDrone={buildDrone} onBuildVehicle={buildVehicle} /> : null}
        {view === "crew" ? <CrewView state={state} onAssign={assignCrew} /> : null}
        {view === "combat" ? <CombatView state={state} onRetreat={(value) => updateState((current) => ({ ...current, retreatAt: value }))} onRepair={startBestRepair} onDoctrine={(weapon, stance) => updateState((current) => ({ ...current, combat: { ...current.combat, ...(weapon ? { weapon } : {}), ...(stance ? { stance } : {}) } }))} onEngage={startCombat} onStop={stopCombat} onClearEffect={clearStatusEffect} /> : null}
        {view === "expeditions" ? <ExpeditionView state={state} now={now} onLaunch={launchExpedition} /> : null}
        {view === "directives" ? <DirectiveView state={state} onCompleteContract={completeContract} onAlly={formAlliance} onClaimObjective={claimObjective} onClaimMission={claimMission} /> : null}
        {view === "research" ? <ResearchView state={state} onUnlock={unlockResearch} /> : null}
        {view === "collection" ? <CollectionView state={state} /> : null}
        {view === "market" ? <MarketView state={state} now={now} getPrice={marketPrice} onTrade={trade} /> : null}
        {view === "outposts" ? <OutpostView state={state} onDevelop={developOutpost} /> : null}
        {view === "character" ? <CharacterView state={state} fallbackName={activeAccountName} onSaveName={(name) => updateState((current) => ({ ...current, displayName: name, lastActiveAt: Date.now() }))} onLoadSave={loadSave} /> : null}
      </main>

      <aside className="status-column v3-status">
        <div className="wallet panel"><Stat icon={Coins} label="Credits" value={state.credits} /><Stat icon={Medal} label="Achievements" value={state.achievements.length} /><Stat icon={Trophy} label="Mastered" value={Object.values(state.operationMastery).filter((mastery) => mastery >= 100).length} /></div>
        <div className="vitals panel"><div><span>Hull</span><strong>{state.hull} / {state.maxHull}</strong></div><Progress value={state.hull / state.maxHull * 100} /><div><span>Shields</span><strong>{state.shields}</strong></div><Progress value={Math.min(100, state.shields)} /><div><span>Crew morale</span><strong>{state.crewMorale}%</strong></div><Progress value={state.crewMorale} /></div>
        {state.pendingEvent ? <StoryEvent eventId={state.pendingEvent} onChoose={resolveEvent} /> : null}
        <div className="side-nav panel">
          {navigation.map((group) => <div key={group.group}><p className="eyebrow">{group.group}</p>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "selected" : ""} onClick={() => openView(item.id)}><Icon /><span>{item.label}</span><ChevronRight /></button>; })}</div>)}
        </div>
      </aside>

      <nav className="mobile-nav wide-mobile" aria-label="Game sections">
        <button className={view === "skills" ? "selected" : ""} onClick={() => openView("skills")}><Activity /><span>Skills</span></button>
        <button className={view === "ship" ? "selected" : ""} onClick={() => openView("ship")}><Rocket /><span>Ship</span></button>
        <button className={view === "sectors" ? "selected" : ""} onClick={() => openView("sectors")}><Map /><span>Galaxy</span></button>
        <button className={view === "directives" ? "selected" : ""} onClick={() => openView("directives")}><ScrollText /><span>Directives</span></button>
        <button className={view === "bank" ? "selected" : ""} onClick={() => openView("bank")}><Boxes /><span>Bank</span></button>
        <button className={mobileMenuOpen ? "selected" : ""} onClick={() => setMobileMenuOpen(true)} aria-expanded={mobileMenuOpen}><Menu /><span>More</span></button>
      </nav>

      {mobileMenuOpen ? <div className="mobile-more-overlay" role="dialog" aria-modal="true" aria-label="More game sections">
        <button className="mobile-more-backdrop" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
        <section className="mobile-more-panel panel">
          <header><div><p className="eyebrow">COMMAND MENU</p><h2>More sections</h2></div><button aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X /></button></header>
          {navigation.map((group) => <div key={group.group} className="mobile-more-group"><p className="eyebrow">{group.group}</p><div>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "selected" : ""} onClick={() => openView(item.id)}><Icon /><span>{item.label}</span></button>; })}</div></div>)}
        </section>
      </div> : null}
    </div>
    </>
  );
}

function SkillView({ state, skillId, activeId, onStart }: { state: GameState; skillId: SkillId; activeId: string; onStart: (activity: SkillActivity) => void }) {
  return <div className="activity-list">{activities.filter((entry) => entry.skillId === skillId).sort((a, b) => a.level - b.level).map((activity) => {
    const locked = state.skills[skillId].level < activity.level;
    const wrongSector = !activityAvailable(state, activity);
    const destinations = (activity.sectors ?? []).map((id) => sectorById[id]?.name ?? id);
    const mastery = state.operationMastery[activity.id] ?? 0;
    const completions = state.operationCounts[activity.id] ?? 0;
    const nextMilestone = [10, 100, 250, 1000, 10000].find((value) => completions < value);
    return <article key={activity.id} className={`activity-row panel ${activeId === activity.id ? "running" : ""}`}><span className="activity-level"><Sprite kind="operation" id={activity.id} label={`${activity.name} operation sprite`} className="activity-operation-sprite" decorative /><b>LV {activity.level}</b></span><span className="activity-copy"><strong>{activity.name}</strong><small>{activity.description}</small><em>{activity.consumes ? `Uses: ${itemsText(activity.consumes)} · ` : ""}Yields: {itemsText(activity.produces)}{activity.credits ? ` · ${activity.credits} credits` : ""}</em><span className="mastery-line">Mastery {mastery}/100 · {fmt(completions)} completions{mastery >= 100 ? " · Master perk active" : ""}{nextMilestone ? ` · Next record ${fmt(nextMilestone)}` : " · Legendary record"}</span>{locked ? <i>Requires {skillMeta[skillId].name} level {activity.level}</i> : wrongSector ? <i>Travel to {listText(destinations)}</i> : null}</span><span className="activity-action"><b>{activity.seconds}s</b><small>{activity.xp} XP</small><Button size="sm" disabled={locked || wrongSector || activeId === activity.id} onClick={() => onStart(activity)}>{activeId === activity.id ? "Running" : "Start"}</Button></span></article>;
  })}</div>;
}

function Bank({ state }: { state: GameState }) {
  const sections = [
    ["Raw materials", ["ferrite", "cobalt", "iridium", "titanium", "phaseCrystal", "darkMatter", "quantumDust", "neutronium"]],
    ["Components & fabrication", ["salvage", "circuits", "plating", "powerCell", "droneParts", "titaniumPlate", "quantumAlloy", "quantumCircuit", "neutroniumPlate", "quantumParts", "singularityCore"]],
    ["Supplies & biological", ["algae", "rations", "medicine", "catalyst", "xenoFiber", "neuralGel", "genesisSeed", "genesisCompound"]],
    ["Data & discoveries", ["data", "navData", "relic", "artefact", "voidData", "ancientCore", "commandToken"]],
    ["Combat stores & unique gear", ["missiles", "fuelRod", "gearPhaseLance", "gearLivingBulwark", "gearChronoDrive", "gearFoundryHeart", "gearStarfallCrown"]],
  ] as const;
  return <div className="bank expanded panel"><div className="panel-heading"><div><p className="eyebrow">CARGO MANIFEST</p><h2>{Object.values(state.inventory).reduce((a, b) => a + b, 0)} stored items</h2></div><PackageOpen /></div><div className="cargo-sections">{sections.map(([title, ids]) => <section key={title}><div className="collection-title"><h2>{title}</h2><span>{ids.reduce((total, id) => total + (state.inventory[id] ?? 0), 0)} units</span></div><div className="bank-grid">{ids.filter((id) => id in state.inventory).map((id) => <div key={id} className="bank-item"><Sprite kind="item" id={id} label={itemNames[id] ?? id} className="cargo-item-sprite" decorative /><div><small>{itemNames[id] ?? id}</small><strong>{fmt(state.inventory[id] ?? 0)}</strong></div></div>)}</div></section>)}</div></div>;
}

function SectorView({ state, onTravel }: { state: GameState; onTravel: (id: string) => void }) {
  return <div className="sector-grid">{sectors.map((sector, index) => {
    const unlocked = totalLevel(state) >= sector.level;
    const fuel = Math.max(0, sector.fuel - (state.researchUnlocked.includes("phase-mapping") ? 1 : 0));
    return <article key={sector.id} className={`sector-card panel ${state.sectorId === sector.id ? "current" : ""}`}><span className="sector-index">{String(index + 1).padStart(2, "0")}</span><div><p className="eyebrow">{sector.tone}</p><h2>{sector.name}</h2><p>{sector.description}</p><small>Requires total level {sector.level} · {fuel} Fuel Rods</small></div><Button disabled={!unlocked || state.sectorId === sector.id || state.inventory.fuelRod < fuel} onClick={() => onTravel(sector.id)}>{state.sectorId === sector.id ? "Current sector" : unlocked ? "Travel" : "Locked"}</Button></article>;
  })}</div>;
}

function ShipView({ state, onUpgrade, onUpgradeEquipment, onEquip, onPowerMode, onBuildDrone, onBuildVehicle }: { state: GameState; onUpgrade: (id: ShipModuleId) => void; onUpgradeEquipment: (id: EquipmentId) => void; onEquip: (id: string) => void; onPowerMode: (mode: PowerMode) => void; onBuildDrone: (id: DroneId) => void; onBuildVehicle: (id: VehicleId) => void }) {
  const modes: { id: PowerMode; name: string; effect: string }[] = [
    { id: "balanced", name: "Balanced", effect: "No system penalties or priority bonuses" }, { id: "industrial", name: "Industrial", effect: "12% faster Engineering, Metallurgy and Drones" },
    { id: "research", name: "Research", effect: "12% faster scientific and medical skills" }, { id: "combat", name: "Combat", effect: "12% faster vessel encounters" },
    { id: "navigation", name: "Navigation", effect: "12% faster Astrogation, Logistics and Diplomacy" },
  ];
  const activeMode = modes.find((mode) => mode.id === state.powerMode) ?? modes[0];
  return <><section className="power-panel panel"><header className="power-intro"><div><p className="eyebrow">REACTOR DISTRIBUTION</p><h2>Ship power priority</h2><p>Select one preset to change operation speeds immediately.</p></div><div className="power-readout"><Zap /><span>Current routing</span><strong>{activeMode.name}</strong><small>{activeMode.effect}</small></div></header><div className="power-options">{modes.map((mode) => { const selected = state.powerMode === mode.id; return <button type="button" key={mode.id} className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => onPowerMode(mode.id)}><span className="power-option-icon"><Zap /></span><span><strong>{mode.name}</strong><small>{mode.effect}</small></span><b>{selected ? "ACTIVE" : "SELECT"}</b></button>; })}</div></section><div className="section-label"><p className="eyebrow">VESSEL SYSTEMS</p><h2>Deck modules</h2></div><div className="module-grid">{(Object.entries(shipModules) as [ShipModuleId, typeof shipModules[ShipModuleId]][]).map(([id, module]) => { const level = state.shipModules[id]; const cost = { plating: level * 3, circuits: level * 2, credits: level * 40 }; const missing = moduleMissing(state, cost); const affordable = missing.length === 0; return <article key={id} className="module-card panel"><span><Orbit /></span><div><p className="eyebrow">DECK SYSTEM · MK {level}</p><h3>{module.name}</h3><p>{module.description}</p><small>Current bonus: {module.effect(level)}</small><small>Next upgrade: {cost.credits} credits · {cost.plating} Plating · {cost.circuits} Circuits</small>{missing.length ? <em className="missing-cost">Missing: {missing.join(" · ")}</em> : <em className="ready-cost">Materials verified</em>}</div><Button disabled={!affordable} onClick={() => onUpgrade(id)}>{affordable ? "Upgrade" : "Requirements unmet"}</Button></article>; })}</div><ArmouryView state={state} onUpgrade={onUpgradeEquipment} onEquip={onEquip} /><DroneView state={state} onBuild={onBuildDrone} onBuildVehicle={onBuildVehicle} /></>;
}

function moduleMissing(state: GameState, cost: Record<string, number>) {
  return Object.entries(cost).flatMap(([id, amount]) => {
    const held = id === "credits" ? state.credits : state.inventory[id] ?? 0;
    return held < amount ? [`${amount - held} ${id === "credits" ? "credits" : itemNames[id] ?? id}`] : [];
  });
}

function ArmouryView({ state, onUpgrade, onEquip }: { state: GameState; onUpgrade: (id: EquipmentId) => void; onEquip: (id: string) => void }) {
  return <><div className="section-label"><p className="eyebrow">CRUISER ARMOURY</p><h2>Equipment upgrades</h2></div><div className="module-grid">{(Object.entries(equipmentSpecs) as [EquipmentId, typeof equipmentSpecs[EquipmentId]][]).map(([id, gear]) => { const cost = equipmentCosts[id](state.equipment[id]); const missing = moduleMissing(state, cost); return <article key={id} className="module-card panel"><span><Shield /></span><div><p className="eyebrow">MK {state.equipment[id]}</p><h3>{gear.name}</h3><p>{gear.description}</p><small>Current bonus: {gear.effect(state.equipment[id])}</small><small>Next upgrade: {itemsText(cost)}</small>{missing.length ? <em className="missing-cost">Missing: {missing.join(" · ")}</em> : <em className="ready-cost">Materials verified</em>}</div><Button disabled={missing.length > 0} onClick={() => onUpgrade(id)}>{missing.length ? "Requirements unmet" : "Upgrade"}</Button></article>; })}</div><div className="section-label"><p className="eyebrow">BOSS SALVAGE</p><h2>Unique equipment</h2></div><div className="module-grid">{Object.entries(uniqueGear).map(([id, gear]) => { const owned = (state.inventory[id] ?? 0) > 0; return <article key={id} className={`module-card panel ${state.equippedGear === id ? "active" : ""}`}><span><Star /></span><div><p className="eyebrow">{state.equippedGear === id ? "EQUIPPED" : owned ? "RECOVERED" : "BOSS DROP REQUIRED"}</p><h3>{gear.name}</h3><p>Bonus: {gear.effect}</p>{!owned ? <em className="missing-cost">Missing: defeat its sector boss to recover this gear.</em> : <em className="ready-cost">Requirement met — ready to equip</em>}</div><Button disabled={!owned || state.equippedGear === id} onClick={() => onEquip(id)}>{state.equippedGear === id ? "Equipped" : owned ? "Equip" : "Requirements unmet"}</Button></article>; })}</div></>;
}

function crewLevel(xp: number) {
  return Math.min(50, 1 + Math.floor(Math.sqrt(xp / 25)));
}

function CrewView({ state, onAssign }: { state: GameState; onAssign: (id: string, skill: SkillId) => void }) {
  const posted = crew.filter((member) => state.crewAssignments[member.id]).length;
  const specialistPosts = crew.filter((member) => member.specialties.includes(state.crewAssignments[member.id])).length;
  const pairBonus = SKILL_IDS.reduce((total, skillId) => total + Math.floor(crewCount(state, skillId) / 2), 0);
  return <>
    <section className="crew-overview panel"><div><p className="eyebrow">CREW OPERATIONS</p><h2>Specialists make the cruiser stronger.</h2><p>Post crew to a skill to earn XP while that work completes. Every two people on the same posting add +1 output; a specialist also adds their personal bonus when placed in a native discipline.</p></div><div className="crew-overview-metrics"><span><strong>{posted}</strong> posted</span><span><strong>{specialistPosts}</strong> specialist posts</span><span><strong>+{pairBonus}</strong> pairing output</span></div></section>
    <div className="crew-grid">{crew.map((member) => {
      const xp = state.crewXp[member.id] ?? 0;
      const level = crewLevel(xp);
      const loyalty = state.crewLoyalty[member.id] ?? 50;
      const assignment = state.crewAssignments[member.id];
      const specialist = member.specialties.includes(assignment);
      const personalBonus = specialist ? 1 + Math.floor((level - 1) / 20) : 0;
      const levelStart = (level - 1) ** 2 * 25;
      const nextLevelAt = level ** 2 * 25;
      const levelProgress = level >= 50 ? 100 : ((xp - levelStart) / Math.max(1, nextLevelAt - levelStart)) * 100;
      return <article key={member.id} className={`crew-card panel ${specialist ? "specialist-post" : ""}`}>
        <div className="crew-card-head"><div className="crew-avatar">{member.name.split(" ").map((part) => part[0]).join("")}</div><div><p className="eyebrow">{member.role} · LEVEL {level}</p><h3>{member.name}</h3><p className="crew-bio">{member.bio}</p></div></div>
        <div className="crew-specialties"><span>{member.trait}</span>{member.specialties.map((skillId) => { const Icon = skillIcons[skillId]; return <span key={skillId}><Icon /> {skillMeta[skillId].name}</span>; })}</div>
        <div className="crew-effect"><strong>{specialist ? `Active: +${personalBonus} ${skillMeta[assignment].name} output` : `General post: ${skillMeta[assignment].name}`}</strong><span>{specialist ? member.perk : "Move this specialist to a marked native discipline to activate their personal output bonus."}</span></div>
        <div className="crew-progress"><div><span>Service XP · {fmt(xp)}</span><span>{level >= 50 ? "Veteran rank" : `${fmt(Math.max(0, nextLevelAt - xp))} XP to level ${level + 1}`}</span></div><Progress value={Math.max(0, Math.min(100, levelProgress))} /><div><span>Loyalty</span><span>{loyalty}%</span></div><Progress value={loyalty} /></div>
        <label className="crew-posting"><span>Posting</span><Select value={assignment} onValueChange={(value) => onAssign(member.id, value as SkillId)}><SelectTrigger aria-label={`Assignment for ${member.name}`}><SelectValue /></SelectTrigger><SelectContent>{SKILL_IDS.map((id) => <SelectItem key={id} value={id}>{skillMeta[id].name}{member.specialties.includes(id) ? " · specialist" : ""}</SelectItem>)}</SelectContent></Select></label>
      </article>;
    })}</div>
  </>;
}

function DroneView({ state, onBuild, onBuildVehicle }: { state: GameState; onBuild: (id: DroneId) => void; onBuildVehicle: (id: VehicleId) => void }) {
  return <><div className="section-label"><p className="eyebrow">AUTONOMOUS CRAFT</p><h2>Drone Swarms</h2></div><div className="module-grid">{(Object.entries(droneSpecs) as [DroneId, typeof droneSpecs[DroneId]][]).map(([id, drone]) => { const missing = moduleMissing(state, drone.cost); return <article key={id} className="module-card panel"><span><Bot /></span><div><p className="eyebrow">ACTIVE UNITS · {state.drones[id]}</p><h3>{drone.name}</h3><p>{drone.description}</p><small>Current bonus: {drone.effect(state.drones[id])}</small><small>Fabrication cost: {itemsText(drone.cost)}</small>{missing.length ? <em className="missing-cost">Missing: {missing.join(" · ")}</em> : <em className="ready-cost">Materials verified</em>}</div><Button disabled={missing.length > 0} onClick={() => onBuild(id)}>{missing.length ? "Requirements unmet" : "Fabricate"}</Button></article>; })}</div><div className="section-label"><p className="eyebrow">HANGAR VEHICLES</p><h2>Surface & Boarding Craft</h2></div><div className="module-grid">{(Object.entries(vehicleSpecs) as [VehicleId, typeof vehicleSpecs[VehicleId]][]).map(([id, vehicle]) => { const missing = moduleMissing(state, vehicle.cost); return <article key={id} className="module-card panel"><span><Rocket /></span><div><p className="eyebrow">READY · {state.vehicles[id]}</p><h3>{vehicle.name}</h3><p>{vehicle.description}</p><small>Current bonus: {vehicle.effect(state.vehicles[id])}</small><small>Construction cost: {itemsText(vehicle.cost)}</small>{missing.length ? <em className="missing-cost">Missing: {missing.join(" · ")}</em> : <em className="ready-cost">Materials verified</em>}</div><Button disabled={missing.length > 0} onClick={() => onBuildVehicle(id)}>{missing.length ? "Requirements unmet" : "Construct"}</Button></article>; })}</div></>;
}

function victoriesUntilRareSalvage(victories: number, mastery: number, rareEvery: number) {
  // Each victory increases mastery before the engine checks that victory's rare interval.
  // The interval change can skip the old milestone, so allow one full interval on either side.
  for (let next = 1; next <= Math.max(2, rareEvery) * 2; next += 1) {
    const interval = Math.max(2, rareEvery - (mastery + next >= 100 ? Math.ceil(rareEvery * 0.1) : 0));
    if (Math.floor((victories + next) / interval) > Math.floor((victories + next - 1) / interval)) return next;
  }
  return Math.max(2, rareEvery);
}

function CombatView({ state, onRetreat, onRepair, onDoctrine, onEngage, onStop, onClearEffect }: { state: GameState; onRetreat: (value: number) => void; onRepair: () => void; onDoctrine: (weapon?: CombatWeapon, stance?: CombatStance) => void; onEngage: (activity: SkillActivity) => void; onStop: () => void; onClearEffect: (effect: StatusEffect) => void }) {
  const [sectorOnly, setSectorOnly] = useState(true);
  const targets = activities.filter((entry) => entry.skillId === "combat" && entry.enemy);
  const visibleTargets = sectorOnly ? targets.filter((target) => !target.sectors?.length || target.sectors.includes(state.sectorId)) : targets;
  const activeCandidate = state.combat.activeTaskId ? activityById[state.combat.activeTaskId] : null;
  const activeTarget = activeCandidate?.skillId === "combat" ? activeCandidate : null;
  const combatPauseReasons = activeTarget ? operationPauseReasons(state, activeTarget) : [];
  const combatPaused = combatPauseReasons.length > 0;
  const previewTarget = activeTarget ?? activityById["scavenger-drone"];
  const previewEnemy = previewTarget.enemy!;
  const previewMatchup = combatMatchup(state, previewTarget);
  const attackProfile = combatAttackProfile(state, previewTarget);
  const encounter = state.combat.encounter?.targetId === previewTarget.id ? state.combat.encounter : null;
  const enemyHull = encounter?.enemyHull ?? previewEnemy.hull;
  const enemyShields = encounter?.enemyShields ?? previewEnemy.shields;
  const combatState = activeTarget ? encounter?.spawnDelay ? "respawning" : combatPaused ? "paused" : "running" : "standby";
  const repairActivity = bestRepairActivity(state);
  const repairing = Boolean(repairActivity && state.activeTask.activityId === repairActivity.id);
  const bossPhase = activeTarget?.enemy?.class.includes("Boss") ? enemyHull > previewEnemy.hull * .66 ? "Phase 1 · screening defences" : enemyHull > previewEnemy.hull * .33 ? "Phase 2 · weapons response" : "Phase 3 · final countermeasure" : null;
  const renderHits = (target: "player" | "enemy") => <div className="combat-hits" aria-hidden="true">{state.combat.hits.filter((hit) => hit.target === target).flatMap((hit) => {
    const style = { "--hit-lane": hit.id % 3 } as CSSProperties;
    return hit.miss ? [<span key={`${hit.id}-miss`} className="combat-hit is-miss" style={style}>MISS</span>] : [
      hit.shieldDamage > 0 ? <span key={`${hit.id}-shield`} className="combat-hit is-shield" style={style}>−{hit.shieldDamage}</span> : null,
      hit.hullDamage > 0 ? <span key={`${hit.id}-hull`} className="combat-hit is-hull" style={{ "--hit-lane": (hit.id + 1) % 3 } as CSSProperties}>−{hit.hullDamage}</span> : null,
    ];
  })}</div>;
  const totalVictories = Object.values(state.combat.victories).reduce((a, b) => a + b, 0);
  const milestones = [
    [5, "Targeting Suite", "+5% hit chance"], [10, "Overcharge", "Aggressive stance attacks faster"],
    [15, "Emergency Bulkheads", "10% less incoming damage"], [20, "Bounty Protocol", "+20% combat credits"],
  ] as const;
  return <>
    <div className="combat-console"><div className="combat-summary panel">
      <div><Shield /><span>Hull integrity</span><strong>{state.hull} / {state.maxHull}</strong></div>
      <div><Zap /><span>Shields</span><strong>{state.shields}</strong></div>
      <div><Rocket /><span>Missile magazine</span><strong>{state.inventory.missiles ?? 0}</strong></div>
    </div>
    <div className="combat-workspace">
      <section className="combat-battle panel" aria-label="Vessel combat">
        <div className="combat-stage-heading"><div><p className="eyebrow">VESSEL COMBAT · LEVEL {state.skills.combat.level} · {fmt(state.skills.combat.xp)} XP</p><h2>{activeTarget ? activeTarget.name : "Fire control standing by"}</h2></div><span className={`combat-stage-status is-${combatState}`}>{combatState === "running" ? "Engaging" : combatState === "paused" ? "Paused" : combatState === "respawning" ? "Target destroyed" : "Standby"}</span></div>
        <div className={`combat-stage is-${combatState} weapon-${state.combat.weapon}`}>
          <CombatSprite id="asteroid" label="" className="combat-asteroid combat-asteroid-one" decorative />
          <CombatSprite id="asteroid" label="" className="combat-asteroid combat-asteroid-two" decorative />
          <CombatSprite id="asteroid" label="" className="combat-asteroid combat-asteroid-three" decorative />
          <div className="combat-vessel combat-vessel-player">
            <div className="combat-vessel-art"><span className="combat-thruster" aria-hidden="true" /><CombatSprite id="aethelgard" label="Aethelgard" className="combat-ship-sprite" decorative loading="eager" />{state.shields > 0 ? <span className="combat-shield" aria-hidden="true" /> : null}</div>
            {renderHits("player")}
            <div className="combat-vessel-label"><strong>Aethelgard</strong><div className="combat-vitals">
              <div className="combat-vital is-shield"><span>Shields {state.shields} / {40 + state.equipment.shield * 10}</span><Progress aria-label="Your shields" value={state.shields / (40 + state.equipment.shield * 10) * 100} /></div>
              <div className="combat-vital is-hull"><span>Hull {state.hull} / {state.maxHull}</span><Progress aria-label="Your hull" value={state.hull / state.maxHull * 100} /></div>
            </div></div>
          </div>
          {state.combat.hits.map((hit) => <span key={`shot-${hit.id}`} className={`combat-shot is-fired weapon-${hit.weapon === "enemy" ? "laser" : hit.weapon}${hit.target === "player" ? " combat-shot-enemy" : ""}`} aria-hidden="true" />)}
          <div className="combat-vessel combat-vessel-enemy">
            <div className="combat-vessel-art"><CombatSprite id={previewTarget.id} label={previewTarget.name} className="combat-ship-sprite" decorative loading="eager" /></div>
            {renderHits("enemy")}
            <div className="combat-vessel-label"><strong>{previewTarget.name}</strong><div className="combat-vitals">
              <div className="combat-vital is-shield"><span>Shields {Math.ceil(enemyShields)} / {previewEnemy.shields}</span><Progress aria-label="Enemy shields" value={previewEnemy.shields > 0 ? enemyShields / previewEnemy.shields * 100 : 0} /></div>
              <div className="combat-vital is-hull"><span>Hull {Math.ceil(enemyHull)} / {previewEnemy.hull}</span><Progress aria-label="Enemy hull" value={enemyHull / previewEnemy.hull * 100} /></div>
            </div></div>
          </div>
        </div>
        <div className="combat-encounter">
          <div className="combat-encounter-copy"><strong>{!activeTarget ? "Choose a target to engage" : combatPaused ? "Combat paused" : combatState === "respawning" ? "Victory · acquiring next target" : `${weaponNames[state.combat.weapon]} · ${stanceNames[state.combat.stance]}`}</strong><span>{!activeTarget ? "Target preview · weapons standing by" : combatState === "respawning" ? "The same target repeats automatically." : "Shields absorb hits first. Destroy the enemy hull to win."}</span></div>
          {activeTarget && combatState !== "respawning" ? <div className="combat-attack-clock">
            <div><span>Your next shot <strong>{(encounter?.playerCooldown ?? attackProfile.playerInterval).toFixed(1)}s</strong></span><Progress aria-label="Your weapon cooldown" value={encounter ? Math.max(0, 1 - encounter.playerCooldown / attackProfile.playerInterval) * 100 : 0} /></div>
            <div className="is-enemy"><span>Enemy next shot <strong>{(encounter?.enemyCooldown ?? attackProfile.enemyInterval).toFixed(1)}s</strong></span><Progress aria-label="Enemy weapon cooldown" value={encounter ? Math.max(0, 1 - encounter.enemyCooldown / attackProfile.enemyInterval) * 100 : 0} /></div>
          </div> : null}
          {combatPaused ? <p className="combat-unavailable" role="status">{combatPauseReasons.join(" · ")}</p> : bossPhase && activeTarget ? <p>{bossPhase}</p> : null}
          {activeTarget ? <Button variant="outline" onClick={onStop}>Disengage</Button> : null}
        </div>
        <div className="combat-matchup"><span className={previewMatchup.weakness ? "advantage" : ""}>{previewMatchup.weakness ? "Weakness exploited" : `Weak to ${weaponNames[previewEnemy.weakness]}`}</span><span>{previewMatchup.hitChance}% hit chance</span><span>{attackProfile.playerDamage} shot power · {attackProfile.playerInterval.toFixed(1)}s attack</span></div>
      </section>
    <section className="combat-control panel">
      <div className="combat-control-heading"><p className="eyebrow">FIRE CONTROL</p><h2>Combat doctrine</h2><p>Match weapons to enemy defences. Guided missiles use one missile per shot.</p></div>
      <label><span>Weapon system</span><Select value={state.combat.weapon} onValueChange={(value) => onDoctrine(value as CombatWeapon)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weaponNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></label>
      <label><span>Engagement stance</span><Select value={state.combat.stance} onValueChange={(value) => onDoctrine(undefined, value as CombatStance)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(stanceNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></label>
      <label className="retreat-control"><span>Auto-retreat at {state.retreatAt}% hull</span><Slider value={[state.retreatAt]} min={10} max={75} step={5} onValueChange={(value) => onRetreat(value[0])} /></label>
      <div className="combat-repair"><Button onClick={onRepair} disabled={!repairActivity || repairing}><Wrench /> {repairing ? "Repairing hull" : "Repair hull"}</Button><small>{repairActivity ? `${repairing ? "Training" : "Switch training to"} ${repairActivity.name}` : "No repair supplies available. Gather Salvage to repair hull."}</small></div>
    </section>
    </div>
    {state.statusEffects.length ? <section className="depth-panel panel"><div><p className="eyebrow">SHIP CONDITIONS</p><h2>Persistent battle damage</h2><p>Conditions remain after combat until treated here or cleared by their related skill.</p></div><div className="effect-grid">{state.statusEffects.map((effect) => <article key={effect}><strong>{effect.replace(/([A-Z])/g, " $1")}</strong><span>{effect === "radiation" ? "Operations 5% slower · clear with 2 Medkits or Medicine" : effect === "hullBreach" ? "Incoming damage +18% · clear with 5 Salvage or Engineering" : effect === "sensorDisruption" ? "Combat accuracy −8% · clear with 5 Data or Science" : "Operations 10% slower · clear with 2 Power Cells or Metallurgy"}</span><Button variant="outline" onClick={() => onClearEffect(effect)}>Treat</Button></article>)}</div></section> : null}
    <section className="combat-roster panel">
    <div className="section-label combat-roster-heading"><div><p className="eyebrow">HOSTILE CONTACTS</p><h2>Target roster</h2></div><label className="target-sector-toggle"><input type="checkbox" checked={sectorOnly} onChange={(event) => setSectorOnly(event.target.checked)} /> This sector only</label></div>
    <div className="combat-target-list">{[...visibleTargets].sort((a, b) => a.level - b.level).map((target) => {
      const enemy = target.enemy!;
      const unavailableReasons = operationPauseReasons(state, target);
      const available = unavailableReasons.length === 0;
      const matchup = combatMatchup(state, target);
      const targetProfile = combatAttackProfile(state, target);
      const active = state.combat.activeTaskId === target.id;
      const victories = state.combat.victories[target.id] ?? 0;
      const mastery = state.operationMastery[target.id] ?? 0;
      const rareInterval = Math.max(2, enemy.rareEvery - (mastery >= 100 ? Math.ceil(enemy.rareEvery * 0.1) : 0));
      const rareIn = victoriesUntilRareSalvage(victories, mastery, enemy.rareEvery);
      const rewards = Object.fromEntries(Object.entries(target.produces).filter(([, amount]) => amount > 0));
      const costs = Object.fromEntries(Object.entries(activityCosts(state, target)).filter(([, amount]) => amount > 0));
      return <article key={target.id} className={`combat-target-row ${active ? "is-active" : ""} ${available ? "is-ready" : "is-locked"}`}>
        <div className="combat-target-main">
          <CombatSprite id={target.id} label={target.name} className="combat-target-sprite" decorative />
          <div className="combat-target-identity"><p className="eyebrow">{enemy.class.toUpperCase()} · LV {target.level}</p><h3>{target.name}</h3><span>{victories} kills · {mastery} / 100 mastery</span>{!available ? <em className="combat-unavailable">{unavailableReasons[0]}</em> : <em className="combat-ready">{active ? "Current target" : "Ready to engage"}</em>}</div>
          <div className="combat-target-loot"><strong>{itemsText(rewards)}</strong><span>Rare in {rareIn} {rareIn === 1 ? "victory" : "victories"}</span></div>
          <Button disabled={!available || active} onClick={() => onEngage(target)}>{active ? combatPaused ? "Paused" : "Engaging" : available ? "Engage" : "Locked"}</Button>
        </div>
        <details className="combat-target-details"><summary>Target intelligence <ChevronRight /></summary><div className="combat-target-detail-content">
        <p>{target.description}</p>
        <div className="target-stats"><span>Hull <b>{enemy.hull}</b></span><span>Shield <b>{enemy.shields}</b></span><span>Armor <b>{enemy.armor}</b></span><span>Evasion <b>{enemy.evasion}</b></span></div>
        <div className="matchup-readout"><span className={matchup.weakness ? "advantage" : ""}>{matchup.weakness ? "WEAKNESS EXPLOITED" : `Weak to ${weaponNames[enemy.weakness]}`}</span><span>{matchup.hitChance}% hit · {targetProfile.playerDamage} shot power · {targetProfile.playerInterval.toFixed(1)}s attack</span></div>
        <em className="combat-profile">{enemy.weakness === "laser" ? "Pulse lasers deal extra shield damage." : enemy.weakness === "railgun" ? "Kinetic railguns penetrate more armour." : "Guided missiles track evasive targets."} Enemy volleys deal {combatDamage(state, target)} damage every {targetProfile.enemyInterval.toFixed(1)}s.</em>
        <small>Base rewards: {itemsText(rewards)} · {target.credits ?? 0} credits · {target.xp} Combat XP</small>
        <small>Rare salvage: {itemsText(enemy.rareDrop)} · every {rareInterval} victories · next in {rareIn}</small>
        <small>Supplies per engagement: {Object.keys(costs).length ? itemsText(costs) : "None"}{state.combat.weapon === "missile" ? " · 1 missile per shot" : ""} · Sectors: {target.sectors?.map((id) => sectorById[id]?.name ?? id).join(", ") ?? "All sectors"}</small>
        {!available ? <div className="combat-unavailable">{unavailableReasons.map((reason) => <p key={reason}>{reason}</p>)}</div> : null}
        </div></details>
      </article>;
    })}</div>
    </section>
    <div className="combat-records panel"><span><Target />Total victories <strong>{fmt(totalVictories)}</strong></span><span><Sparkles />Last rare salvage <strong>{state.combat.lastLoot ?? "None recovered"}</strong></span></div>
    <div className="combat-milestones panel"><div><p className="eyebrow">COMBAT SPECIALISATION</p><h2>Rank perks</h2></div>{milestones.map(([level, name, effect]) => <div key={level} className={state.skills.combat.level >= level ? "unlocked" : ""}><span>LV {level}</span><strong>{name}</strong><small>{effect}</small></div>)}</div>
    </div>
  </>;
}

type ExpeditionSort = "level" | "skill";

function ExpeditionView({ state, now, onLaunch }: { state: GameState; now: number; onLaunch: (id: string) => void }) {
  const [sort, setSort] = useState<ExpeditionSort>("level");
  const active = expeditions.find((entry) => entry.id === state.activeExpedition?.id);
  const orderedExpeditions = [...expeditions].sort((a, b) => {
    if (sort === "skill") {
      const skillOrder = skillMeta[a.skill].name.localeCompare(skillMeta[b.skill].name);
      if (skillOrder) return skillOrder;
    }
    return a.level - b.level || a.name.localeCompare(b.name);
  });
  return <><div className="expedition-status panel">{active ? <><Compass /><div><p className="eyebrow">TEAM DEPLOYED</p><h2>{active.name}</h2><span>Returns in {duration(((state.activeExpedition?.endsAt ?? now) - now) / 1000)}</span></div></> : <><Compass /><div><p className="eyebrow">EXPEDITION BAY</p><h2>Team ready</h2><span>Every launch requirement is listed below.</span></div></>}</div><section className="expedition-sort panel"><div><p className="eyebrow">MISSION ORDER</p><h2>Browse expeditions</h2><p>Order missions by progression requirements or the skill that receives their XP.</p></div><label><span>Sort by</span><Select value={sort} onValueChange={(value) => setSort(value as ExpeditionSort)}><SelectTrigger aria-label="Sort expeditions"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="level">Total level</SelectItem><SelectItem value="skill">XP skill</SelectItem></SelectContent></Select></label></section><div className="module-grid">{orderedExpeditions.map((entry) => { const missing: string[] = []; if (totalLevel(state) < entry.level) missing.push(`Total level ${entry.level} (${totalLevel(state)} / ${entry.level})`); Object.entries(entry.cost).forEach(([id, amount]) => { const held = state.inventory[id] ?? 0; if (held < amount) missing.push(`${amount - held} more ${itemNames[id] ?? id}`); }); if (entry.vehicle && !state.vehicles[entry.vehicle]) missing.push(`Build a ${vehicleSpecs[entry.vehicle].name}`); if (state.activeExpedition) missing.unshift("Away team already deployed"); const ready = missing.length === 0; return <article key={entry.id} className="module-card panel"><span><Landmark /></span><div><p className="eyebrow">{entry.minutes} MIN · TL {entry.level}</p><h3>{entry.name}</h3><p>{entry.description}</p><small>Cost: {itemsText(entry.cost)} · Reward: {itemsText(entry.reward)} · +{fmt(entry.xp)} {skillMeta[entry.skill].name} XP{entry.vehicle ? ` · Requires ${vehicleSpecs[entry.vehicle].name}` : ""}</small><em className={ready ? "ready-cost" : "missing-cost"}>{ready ? "Launch requirements met" : `Missing: ${missing.join(" · ")}`}</em></div><Button disabled={!ready} onClick={() => onLaunch(entry.id)}>{ready ? "Launch" : "Requirements unmet"}</Button></article>; })}</div></>;
}

function CompletedArchive({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <details className="completed-archive"><summary><span>{title}</span><b>{count}</b><ChevronRight /></summary><div>{count ? children : <span>No completed entries yet.</span>}</div></details>;
}

function DirectiveView({ state, onCompleteContract, onAlly, onClaimObjective, onClaimMission }: { state: GameState; onCompleteContract: (id: string) => void; onAlly: (id: string) => void; onClaimObjective: (id: string) => void; onClaimMission: (id: string) => void }) {
  const openContracts = contracts.filter((entry) => !state.contractsCompleted.includes(entry.id)).sort((a, b) => Number(canAfford(state, b.cost)) - Number(canAfford(state, a.cost)));
  const openObjectives = objectives.filter((entry) => !state.claimedObjectives.includes(entry.id)).sort((a, b) => Number(b.met(state)) - Number(a.met(state)));
  const openMissions = missionDefinitions.filter((entry) => !state.missionsCompleted.includes(entry.id)).sort((a, b) => Number(missionReady(state, b.id)) - Number(missionReady(state, a.id)));
  return <div className="directive-board">
    <section className="directive-overview panel"><div><p className="eyebrow">FRONTIER MISSION CONTROL</p><h2>One board for every active goal.</h2><p>Contracts fund the cruiser and earn faction standing. Objectives mark career milestones. Missions are the long-form story across the five sectors.</p></div><div className="directive-counts"><span><strong>{openContracts.length}</strong> contracts</span><span><strong>{openObjectives.length}</strong> objectives</span><span><strong>{openMissions.length}</strong> missions</span></div></section>
    <section className="directive-section"><div className="section-label"><p className="eyebrow">FACTION WORK</p><h2>Contracts</h2></div><div className="faction-strip">{Object.entries(state.factions).map(([id, rep]) => <div key={id} className={`panel ${state.factionAlly === id ? "allied" : ""}`}><small>{factionNames[id]}</small><strong>{rep}</strong><Progress value={rep} /><Button variant="outline" disabled={Boolean(state.factionAlly) || rep < 30} onClick={() => onAlly(id)}>{state.factionAlly === id ? "Allied" : rep < 30 ? "30 rep required" : "Form alliance"}</Button></div>)}</div>{state.factionAlly ? <div className="notice panel">Alliance active with {factionNames[state.factionAlly]}. Their contracts award 20% more credits.</div> : null}<div className="module-grid">{openContracts.map((contract) => { const affordable = canAfford(state, contract.cost); const missing = Object.entries(contract.cost).filter(([id, amount]) => (state.inventory[id] ?? 0) < amount).map(([id, amount]) => `${amount - (state.inventory[id] ?? 0)} ${itemNames[id] ?? id}`); const reputation = Math.floor(contract.reward.reputation * (state.researchUnlocked.includes("broker-network") ? 1.25 : 1)); return <article key={contract.id} className="module-card panel"><span><ScrollText /></span><div><p className="eyebrow">{factionNames[contract.faction]}</p><h3>{contract.name}</h3><p>{contract.description}</p><small>Deliver: {itemsText(contract.cost)} · Reward: {Math.floor(contract.reward.credits * (state.factionAlly === contract.faction ? 1.2 : 1))} credits · +{reputation} reputation</small><em className={affordable ? "ready-cost" : "missing-cost"}>{affordable ? "Cargo verified — ready to fulfil" : `Need ${missing.join(" · ")}`}</em></div><Button disabled={!affordable} onClick={() => onCompleteContract(contract.id)}>{affordable ? "Fulfil contract" : "Cargo required"}</Button></article>; })}</div><CompletedArchive title="Fulfilled contracts" count={state.contractsCompleted.length}>{contracts.filter((entry) => state.contractsCompleted.includes(entry.id)).map((entry) => <span key={entry.id}>{entry.name} · {factionNames[entry.faction]}</span>)}</CompletedArchive></section>
    <section className="directive-section"><div className="section-label"><p className="eyebrow">CAREER MILESTONES</p><h2>Objectives</h2></div><div className="research-tree">{openObjectives.map((objective, index) => { const met = objective.met(state); return <article key={objective.id} className="research-node panel"><span>{index + 1}</span><div><p className="eyebrow">{objective.sector.toUpperCase()}</p><h3>{objective.name}</h3><p>{objective.description}</p><small>Reward: {objective.reward}</small></div><Button disabled={!met} onClick={() => onClaimObjective(objective.id)}>{met ? "Claim reward" : "In progress"}</Button></article>; })}</div><CompletedArchive title="Completed objectives" count={state.claimedObjectives.length}>{objectives.filter((entry) => state.claimedObjectives.includes(entry.id)).map((entry) => <span key={entry.id}>{entry.name} · {entry.sector}</span>)}</CompletedArchive></section>
    <section className="directive-section"><div className="section-label"><p className="eyebrow">NARRATIVE CAMPAIGN</p><h2>Missions</h2></div><div className="research-tree">{openMissions.map((mission, index) => { const ready = missionReady(state, mission.id); const reward = mission.reward as Record<string, number>; const { credits = 0, ...items } = reward; const adjustedCredits = Math.floor(credits * (state.researchUnlocked.includes("mission-beacon") ? 1.2 : 1)); return <article key={mission.id} className="research-node panel"><span>{index + 1}</span><div><p className="eyebrow">NARRATIVE MISSION</p><h3>{mission.name}</h3><p>{mission.description}</p><small>Reward: {itemsText(items)}{adjustedCredits ? `${Object.keys(items).length ? " · " : ""}${fmt(adjustedCredits)} credits` : ""}</small></div><Button disabled={!ready} onClick={() => onClaimMission(mission.id)}>{ready ? "Claim reward" : "In progress"}</Button></article>; })}</div><CompletedArchive title="Completed missions" count={state.missionsCompleted.length}>{missionDefinitions.filter((entry) => state.missionsCompleted.includes(entry.id)).map((entry) => <span key={entry.id}>{entry.name}</span>)}</CompletedArchive></section>
  </div>;
}

function ResearchView({ state, onUnlock }: { state: GameState; onUnlock: (id: string) => void }) {
  const available = researchNodes.filter((node) => !state.researchUnlocked.includes(node.id));
  const complete = researchNodes.filter((node) => state.researchUnlocked.includes(node.id));
  return <><section className="depth-panel panel"><div><p className="eyebrow">PERMANENT TECHNOLOGY</p><h2>Research network</h2><p>Research spends recovered materials to permanently improve the cruiser and its systems. Every technology remains available once its prerequisites are complete.</p></div></section><div className="research-tree">{available.map((node, index) => { const prerequisites = node.requires.every((id) => state.researchUnlocked.includes(id)); const affordable = canAfford(state, node.cost); return <article key={node.id} className="research-node panel"><span>{index + 1}</span><div><p className="eyebrow">TECHNOLOGY</p><h3>{node.name}</h3><p>{node.description}</p><small>{itemsText(node.cost)}</small></div><Button disabled={!prerequisites || !affordable} onClick={() => onUnlock(node.id)}>{prerequisites ? affordable ? "Research" : "Materials required" : "Locked"}</Button></article>; })}</div><CompletedArchive title="Completed research" count={complete.length}>{complete.map((node) => <span key={node.id}>{node.name}</span>)}</CompletedArchive></>;
}

function OutpostView({ state, onDevelop }: { state: GameState; onDevelop: (sectorId: string, type: OutpostType) => void }) {
  const types: Record<OutpostType, string> = { mining: "+1 gathered Mining and Salvage output per level", research: "+1 Science and Archaeology output per level", trade: "+4% operation credits per level" };
  const resourceIds = ["salvage", "plating", "circuits", "data", "navData"];
  return <><section className="outpost-overview panel"><div><p className="eyebrow">FIVE-SECTOR INFRASTRUCTURE</p><h2>Develop the sector you are currently orbiting</h2><p>Establish one doctrine per sector, upgrade it to level 10, or change its doctrine at any time while keeping its current level.</p></div><div className="outpost-resources"><span><Coins />{fmt(state.credits)} credits</span>{resourceIds.map((id) => <span key={id}>{fmt(state.inventory[id] ?? 0)} {itemNames[id]}</span>)}</div></section><div className="outpost-list">{sectors.map((sector) => {
    const outpost = state.outposts[sector.id];
    const local = state.sectorId === sector.id;
    return <article key={sector.id} className={`outpost-card panel ${local ? "current" : ""}`}><span><Landmark /></span><div className="outpost-card-body"><div className="outpost-heading"><div><p className="eyebrow">{sector.name.toUpperCase()} · {local ? "IN ORBIT" : "REMOTE"}</p><h3>{outpost ? `${outpost.type[0].toUpperCase()}${outpost.type.slice(1)} outpost` : "Unclaimed outpost site"}</h3></div><b>{outpost ? `LEVEL ${outpost.level}` : "NOT BUILT"}</b></div>{outpost ? <><p className="outpost-bonus">Active bonus: {types[outpost.type]}</p><Progress value={outpost.level * 10} /></> : <p>Build the first level with Salvage and Circuits, then specialise its supply chain.</p>}{local ? <div className="outpost-options">{(Object.keys(types) as OutpostType[]).map((type) => {
      const plan = outpostDevelopment(state, sector.id, type);
      const maxed = !plan.converting && plan.level > 10;
      const missingItems = Object.entries(plan.items).filter(([id, amount]) => (state.inventory[id] ?? 0) < amount).map(([id, amount]) => `${amount - (state.inventory[id] ?? 0)} more ${itemNames[id] ?? id}`);
      if (state.credits < plan.credits) missingItems.unshift(`${plan.credits - state.credits} more credits`);
      const available = !maxed && missingItems.length === 0;
      const verb = plan.converting ? "Change doctrine" : outpost ? "Upgrade" : "Establish";
      return <section key={type} className={outpost?.type === type ? "selected" : ""}><div><strong>{type[0].toUpperCase()}{type.slice(1)}</strong>{outpost?.type === type ? <em>ACTIVE</em> : null}</div><p>{types[type]}</p><small>{maxed ? "Maximum level reached" : `${fmt(plan.credits)} credits · ${itemsText(plan.items)}${plan.converting ? ` · retains level ${plan.level}` : ""}`}</small><Button disabled={!available} onClick={() => onDevelop(sector.id, type)}>{maxed ? "Level 10" : available ? plan.converting ? `${verb} · keep level ${plan.level}` : `${verb} level ${plan.level}` : `Missing: ${missingItems.join(" · ")}`}</Button></section>;
    })}</div> : <div className="outpost-remote"><Compass /> Travel to {sector.name} using the Star Chart to develop this site.</div>}</div></article>;
  })}</div></>;
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
    <section className="market-toolbar panel"><div><strong>Order size</strong><div className="market-size-buttons">{[50, 100, 150, 200, 250, 500, 1000].map((amount) => <Button key={amount} variant={orderSize === amount ? "default" : "outline"} onClick={() => setOrderSize(amount)}>{amount}</Button>)}</div></div><p><TrendingUp />Cargo and Logistics add <b>+{cargoBonus}%</b> to sell quotes.</p></section>
    <section className="market-table panel"><div className="market-table-head"><span>Commodity</span><span>Market quote</span><span>Trade</span></div>{marketGoods.map((id) => {
      const buyPrice = getPrice(id, "buy");
      const sellPrice = getPrice(id, "sell");
      const holding = state.inventory[id] ?? 0;
      const base = marketBase[id] * (1 + sectors.findIndex((entry) => entry.id === state.sectorId) * 0.08);
      const rising = buyPrice >= base * 1.1;
      const buyAmount = Math.min(orderSize, Math.floor(state.credits / buyPrice));
      const sellAmount = Math.min(orderSize, holding);
      return <div key={id} className="market-row"><Sprite kind="item" id={id} label={itemNames[id]} className="market-item-icon" decorative /><div className="market-item"><strong>{itemNames[id]}</strong><small>In cargo: {fmt(holding)}</small></div><div className="market-quote"><span className={rising ? "rising" : "falling"}>{rising ? <ArrowUpRight /> : <ArrowDownRight />}{rising ? "Active demand" : "Soft demand"}</span><b>Buy {buyPrice} cr</b><small>Sell {sellPrice} cr</small></div><div className="market-actions"><Button variant="outline" disabled={!sellAmount} onClick={() => onTrade(id, "sell", orderSize)}>Sell {sellAmount || orderSize}</Button><Button disabled={!buyAmount} onClick={() => onTrade(id, "buy", orderSize)}>Buy {buyAmount || orderSize}</Button></div></div>;
    })}</section>
  </div>;
}

function CharacterView({ state, fallbackName, onSaveName, onLoadSave }: { state: GameState; fallbackName: string; onSaveName: (name: string) => void; onLoadSave: (save: GameState) => void }) {
  const [name, setName] = useState(state.displayName || fallbackName);
  const [saveCode, setSaveCode] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const savedName = state.displayName || fallbackName;
  const initials = savedName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SC";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveName(name.trim().slice(0, 32));
  };
  const exportSave = () => {
    setSaveCode(encodeSave(state));
    setSaveMessage({ type: "success", text: "Save code created. Keep it somewhere safe before changing browsers or devices." });
  };
  const copySave = async () => {
    if (!saveCode) return;
    try {
      await navigator.clipboard.writeText(saveCode);
      setSaveMessage({ type: "success", text: "Save code copied to your clipboard." });
    } catch {
      setSaveMessage({ type: "error", text: "Copy was unavailable. Select the code above and copy it manually." });
    }
  };
  const importSave = () => {
    try {
      const save = decodeSave(saveCode);
      if (!window.confirm("Replace this browser's current Starfall Idle save? This cannot be undone unless you exported it first.")) return;
      onLoadSave(save);
      setSaveMessage({ type: "success", text: "Save loaded into this browser." });
    } catch {
      setSaveMessage({ type: "error", text: "That is not a valid Starfall Idle Base64 save code." });
    }
  };

  return <div className="character-settings">
    <section className="character-card panel">
      <div className="character-emblem">{initials}</div>
      <div><p className="eyebrow">COMMANDER PROFILE</p><h2>{savedName}</h2><span>Profile saved on this device</span></div>
      <div className="character-record"><span>Total level <b>{totalLevel(state)}</b></span><span>Operations <b>{fmt(state.totalActions)}</b></span><span>Mastered <b>{Object.values(state.operationMastery).filter((mastery) => mastery >= 100).length}</b></span></div>
    </section>

    <section className="settings-panel skill-profile panel">
      <div><p className="eyebrow">COMMANDER QUALIFICATIONS</p><h2>Skill record</h2><p>Training level and total experience across the Aethelgard&apos;s fourteen disciplines.</p></div>
      <div className="profile-skill-grid">{SKILL_IDS.map((id) => { const skill = state.skills[id]; const start = xpForLevel(skill.level); const end = skill.level >= MAX_SKILL_LEVEL ? skill.xp : xpForLevel(skill.level + 1); const progress = skill.level >= MAX_SKILL_LEVEL ? 100 : (skill.xp - start) / Math.max(1, end - start) * 100; const Icon = skillIcons[id]; return <article key={id}><span><Icon /></span><div><strong>{skillMeta[id].name}</strong><small>Level {skill.level} · {fmt(skill.xp)} XP</small><Progress value={progress} /></div></article>; })}</div>
    </section>

    <section className="settings-panel panel">
      <div><p className="eyebrow">IDENTITY</p><h2>Display name</h2><p>Choose the commander name shown throughout Starfall Idle.</p></div>
      <form onSubmit={submit}>
        <label htmlFor="display-name">Commander display name</label>
        <div><Input id="display-name" value={name} maxLength={32} autoComplete="nickname" onChange={(event) => setName(event.target.value)} placeholder={fallbackName} /><Button type="submit" disabled={name.trim() === state.displayName}>Save name</Button></div>
        <small>{name.length} / 32 characters · Clear the field to use {fallbackName}.</small>
      </form>
    </section>

    <section className="settings-panel account-settings panel">
      <div><p className="eyebrow">LOCAL SAVE</p><h2>This browser only</h2><p>Your character progress is stored in this browser. Clearing site data or changing devices starts a separate save.</p></div>
    </section>

    <section className="settings-panel save-transfer-panel panel">
      <div><p className="eyebrow">SAVE TRANSFER</p><h2>Base64 save code</h2><p>Create a portable copy of this character, then paste it here to load it on another browser or device.</p></div>
      <div className="save-transfer-controls">
        <label htmlFor="save-code">Save code</label>
        <textarea id="save-code" value={saveCode} onChange={(event) => setSaveCode(event.target.value)} placeholder="Create a save code or paste one here" spellCheck={false} />
        <div className="save-transfer-actions"><Button type="button" onClick={exportSave}>Create save code</Button><Button type="button" variant="outline" onClick={copySave} disabled={!saveCode}>Copy code</Button><Button type="button" variant="outline" onClick={importSave} disabled={!saveCode}>Load save</Button></div>
        {saveMessage ? <small className={`save-transfer-message ${saveMessage.type}`}>{saveMessage.text}</small> : <small>Loading replaces the current save in this browser.</small>}
      </div>
    </section>
  </div>;
}

function StoryEvent({ eventId, onChoose }: { eventId: string; onChoose: (id: string) => void }) {
  const event = storyEvents[eventId as keyof typeof storyEvents];
  if (!event) return null;
  return <section className="story-event panel"><Sparkles /><div><p className="eyebrow">SHIP EVENT · {event.purpose}</p><h2>{event.title}</h2><p>{event.text}</p><div>{event.choices.map((choice) => <Button key={choice.id} variant="outline" onClick={() => onChoose(choice.id)}>{choice.label}</Button>)}</div></div></section>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: number }) {
  return <div className="resource"><Icon /><small>{label}</small><strong>{fmt(value)}</strong></div>;
}
