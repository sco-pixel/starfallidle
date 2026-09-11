"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, Atom, Biohazard, Bot, Boxes, BrainCircuit, Check, ChevronRight,
  CircleGauge, Cloud, Coins, Compass, Crosshair, Dna, FlaskConical, Gem,
  Hammer, HeartPulse, History, Landmark, LockKeyhole, Map, Medal, Orbit,
  PackageOpen, Pickaxe, Radio, Recycle, Rocket, ScrollText, Shield,
  ShieldCheck, Sparkles, Star, Target, Telescope, TrendingUp, Trophy,
  Users, Wrench, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  SKILL_IDS, defaultGameState, levelFromXp, sanitizeGameState, xpForLevel,
  type CombatStance, type CombatWeapon, type DroneId, type EquipmentId, type GameState, type ShipModuleId, type SkillId, type VehicleId,
} from "@/lib/game-state";

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
  }
}

type SaveStatus = "guest" | "saved" | "saving" | "error";
type ViewId = "skills" | "bank" | "sectors" | "ship" | "crew" | "drones" | "combat" | "expeditions" | "contracts" | "objectives" | "research" | "collection" | "market" | "patrol";
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
    { id: "drones", label: "Drones", icon: Bot }, { id: "combat", label: "Combat", icon: Crosshair },
  ] },
  { group: "Galaxy", items: [
    { id: "sectors", label: "Star Chart", icon: Map }, { id: "expeditions", label: "Expeditions", icon: Compass },
    { id: "contracts", label: "Contracts", icon: ScrollText }, { id: "objectives", label: "Objectives", icon: Target },
    { id: "market", label: "Market", icon: TrendingUp },
  ] },
  { group: "Archives", items: [
    { id: "research", label: "Research", icon: BrainCircuit }, { id: "collection", label: "Collection", icon: Telescope },
    { id: "patrol", label: "Patrol Record", icon: Medal },
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

const objectives = [
  { id: "first-haul", name: "First Haul", description: "Store 25 Ferrite Ore", reward: "75 credits", met: (s: GameState) => s.inventory.ferrite >= 25, credits: 75 },
  { id: "field-engineer", name: "Field Engineer", description: "Reach Metallurgy level 5", reward: "2 Power Cells", met: (s: GameState) => s.skills.metallurgy.level >= 5, item: "powerCell", amount: 2 },
  { id: "beyond-erebus", name: "Beyond Erebus", description: "Travel to Helix Reach", reward: "120 credits", met: (s: GameState) => s.sectorId !== "erebus", credits: 120 },
  { id: "away-team", name: "Away Team", description: "Complete an expedition", reward: "4 Drone Parts", met: (s: GameState) => s.completedExpeditions >= 1, item: "droneParts", amount: 4 },
  { id: "archivist", name: "Archivist", description: "Record 8 discoveries", reward: "300 credits", met: (s: GameState) => s.collection.length >= 8, credits: 300 },
  { id: "space-superiority", name: "Space Superiority", description: "Win 25 hostile encounters", reward: "8 Tactical Missiles", met: (s: GameState) => Object.values(s.combat.victories).reduce((a, b) => a + b, 0) >= 25, item: "missiles", amount: 8 },
];

const marketGoods = ["ferrite", "salvage", "algae", "circuits", "medicine", "fuelRod"];
const marketBase: Record<string, number> = { ferrite: 4, salvage: 6, algae: 5, circuits: 18, medicine: 22, fuelRod: 45 };

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
function canAfford(state: GameState, costs: Record<string, number> = {}) {
  return Object.entries(costs).every(([id, amount]) => (state.inventory[id] ?? 0) >= amount);
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
  return Math.max(45, Math.min(99, 78 + weaponTracking + training + systems - activity.enemy.evasion));
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
  const mastery = Math.max(0.8, 1 - Math.floor(state.mastery[activity.skillId] / 100) * 0.01);
  const weapon = activity.skillId === "combat" ? Math.max(0.72, 1 - (state.equipment.railgun - 1) * 0.025) * combatMatchup(state, activity).time : 1;
  return Math.max(1, activity.seconds * research * mastery * weapon);
}
function outputBonus(state: GameState, skillId: SkillId) {
  let bonus = Math.floor(crewCount(state, skillId) / 2);
  bonus += Math.floor(state.mastery[skillId] / 250);
  if (skillId === "mining") bonus += Math.floor((state.equipment.cutter - 1) / 2) + Math.floor(state.drones.mining / 2);
  if (skillId === "salvage") bonus += Math.floor((state.equipment.cutter - 1) / 2) + Math.floor(state.drones.salvage / 2);
  if (skillId === "science" || skillId === "botany") bonus += Math.floor((state.equipment.scanner - 1) / 2);
  if ((skillId === "botany" || skillId === "biochemistry") && state.researchUnlocked.includes("xeno-adaptation")) bonus += 1;
  if (skillId === "logistics") bonus += Math.floor(state.drones.cargo / 2);
  return bonus;
}
function combatDamage(state: GameState, activity: SkillActivity) {
  if (!activity.damage) return 0;
  const mitigation = state.equipment.shield * 2 + state.equipment.exosuit + state.drones.combat * 2 + state.shipModules.cic;
  const protocol = state.researchUnlocked.includes("sentinel-protocol") && activity.id === "void-sentinel" ? 0.8 : 1;
  const stance = state.combat.stance === "aggressive" ? 1.25 : state.combat.stance === "defensive" ? 0.68 : 1;
  const veteran = state.skills.combat.level >= 15 ? 0.9 : 1;
  return Math.max(1, Math.floor((activity.damage - mitigation) * protocol * stance * veteran));
}
function activityCosts(state: GameState, activity: SkillActivity) {
  const costs = { ...(activity.consumes ?? {}) };
  if (activity.skillId === "combat" && state.combat.weapon === "missile") costs.missiles = (costs.missiles ?? 0) + 1;
  return costs;
}
function activityAvailable(state: GameState, activity: SkillActivity) {
  return !activity.sectors || activity.sectors.includes(state.sectorId);
}
function applyAchievements(state: GameState) {
  const earned = achievements.filter((entry) => entry.met(state)).map((entry) => entry.id);
  return { ...state, achievements: Array.from(new Set([...state.achievements, ...earned])) };
}
function completeActions(state: GameState, activity: SkillActivity, requested: number) {
  let count = Math.max(0, Math.floor(requested));
  const costs = activityCosts(state, activity);
  for (const [id, amount] of Object.entries(costs)) count = Math.min(count, Math.floor((state.inventory[id] ?? 0) / amount));
  const damage = combatDamage(state, activity);
  if (damage) {
    const safeHull = state.maxHull * (state.retreatAt / 100);
    count = Math.min(count, Math.max(0, Math.floor((state.hull - safeHull + state.shields) / damage)));
  }
  if (!count || !activityAvailable(state, activity)) return { state, count: 0 };

  let inventory = spend(state.inventory, Object.fromEntries(Object.entries(costs).map(([id, amount]) => [id, amount * count])));
  const bonus = outputBonus(state, activity.skillId);
  inventory = addItems(inventory, Object.fromEntries(Object.entries(activity.produces).map(([id, amount]) => [id, (amount + bonus) * count])));
  const skillXp = state.skills[activity.skillId].xp + activity.xp * count;
  const mastery = state.mastery[activity.skillId] + count;
  const collection = activity.collectionId ? Array.from(new Set([...state.collection, activity.collectionId])) : state.collection;
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
  if (activity.skillId === "combat" && activity.enemy) {
    const previous = combat.victories[activity.id] ?? 0;
    const victories = previous + count;
    const rareCount = Math.floor(victories / activity.enemy.rareEvery) - Math.floor(previous / activity.enemy.rareEvery);
    if (rareCount > 0) inventory = addItems(inventory, activity.enemy.rareDrop, rareCount);
    const streak = combat.streak + count;
    combat = { ...combat, victories: { ...combat.victories, [activity.id]: victories }, streak, bestStreak: Math.max(combat.bestStreak, streak), lastLoot: rareCount > 0 ? itemsText(activity.enemy.rareDrop) : combat.lastLoot };
  } else if (activity.id === "hull-repair") combat = { ...combat, streak: 0 };
  const bountyMultiplier = activity.skillId === "combat" && state.skills.combat.level >= 20 ? 1.2 : 1;
  const next = applyAchievements({
    ...state,
    credits: state.credits + Math.floor(((activity.credits ?? 0) + (activity.skillId === "combat" ? state.equipment.railgun : 0)) * count * bountyMultiplier),
    inventory,
    skills: { ...state.skills, [activity.skillId]: { xp: skillXp, level: levelFromXp(skillXp) } },
    mastery: { ...state.mastery, [activity.skillId]: mastery },
    totalActions: totalActionsAfter,
    collection,
    hull,
    shields: Math.min(40 + state.equipment.shield * 10, shields + (activity.skillId === "engineering" ? 3 * count : 0)),
    combat,
    crewMorale: morale,
    factions,
    pendingEvent: nextEvent,
    lastActiveAt: Date.now(),
  });
  return { state: next, count };
}
function applyOffline(state: GameState) {
  const activity = activityById[state.activeTask.activityId] ?? activities[0];
  const cap = (12 + state.patrol * 2 + state.commandPoints) * 3600;
  const elapsed = Math.min(cap, Math.max(0, (Date.now() - state.lastActiveAt) / 1000));
  const beforeInventory = state.inventory;
  const beforeXp = Object.values(state.skills).reduce((sum, skill) => sum + skill.xp, 0);
  const seconds = actionSeconds(state, activity);
  const requested = Math.floor((elapsed + state.progress / 100 * seconds) / seconds);
  const skillResult = completeActions(state, activity, requested);
  const skillProgress = skillResult.count < requested ? 0 : Math.min(99.9, ((elapsed + state.progress / 100 * seconds - skillResult.count * seconds) / seconds) * 100);
  let next = { ...skillResult.state, progress: skillProgress };
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
  const totalActions = skillResult.count + combatActions;
  const activityLabel = combatActions && combatActivity ? `${activity.name} + ${combatActivity.name}` : activity.name;
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

export function GameShell({ initialState, signedIn, saveAvailable, signInPath }: { initialState: GameState; signedIn: boolean; saveAvailable: boolean; signInPath: string }) {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<ViewId>("skills");
  const [selectedSkill, setSelectedSkill] = useState<SkillId>(initialState.activeTask.skillId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(signedIn && saveAvailable ? "saved" : signedIn ? "error" : "guest");
  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(null);
  const [now, setNow] = useState(initialState.lastActiveAt);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef(false);
  useEffect(() => { stateRef.current = state; }, [state]);

  const persist = useCallback(async (next: GameState) => {
    if (!signedIn || !saveAvailable) return;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/save", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...next, lastActiveAt: Date.now() }), keepalive: true,
      });
      if (!response.ok) throw new Error("Save failed");
      pendingSave.current = false;
      setSaveStatus("saved");
    } catch { setSaveStatus("error"); }
  }, [saveAvailable, signedIn]);

  const queueSave = useCallback((next: GameState) => {
    if (!signedIn || !saveAvailable) return;
    pendingSave.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(next), 700);
  }, [persist, saveAvailable, signedIn]);

  const updateState = useCallback((updater: (current: GameState) => GameState) => {
    setState((current) => {
      const next = updater(current);
      stateRef.current = next;
      queueSave(next);
      return next;
    });
  }, [queueSave]);

  useEffect(() => {
    let base = initialState;
    if (!signedIn) {
      try {
        const parsed = JSON.parse(localStorage.getItem("starfall-idle-save-v3") ?? localStorage.getItem("starfall-idle-save-v2") ?? "null");
        if (parsed) base = sanitizeGameState(parsed);
      } catch {}
    }
    base = completeExpedition(base);
    const result = applyOffline(base);
    // Hydration is where a guest save and its offline simulation become the live client state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(result.state);
    stateRef.current = result.state;
    setSelectedSkill(result.state.activeTask.skillId);
    setOfflineReport(result.report);
    setHydrated(true);
    if (result.report) queueSave(result.state);
  }, [initialState, queueSave, signedIn]);

  useEffect(() => {
    if (!hydrated || signedIn) return;
    const saveGuest = () => {
      try { localStorage.setItem("starfall-idle-save-v3", JSON.stringify({ ...stateRef.current, lastActiveAt: Date.now() })); } catch {}
    };
    const timer = setInterval(saveGuest, 3000);
    document.addEventListener("visibilitychange", saveGuest);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", saveGuest); saveGuest(); };
  }, [hydrated, signedIn]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setState((current) => {
        let next = completeExpedition(current);
        let completed = false;
        const activity = activityById[next.activeTask.activityId] ?? activities[0];
        if (activityAvailable(next, activity) && canAfford(next, activityCosts(next, activity))) {
          const progress = next.progress + 100 / (actionSeconds(next, activity) * 4);
          if (progress >= 100) {
            const result = completeActions({ ...next, progress: progress - 100 }, activity, 1);
            next = result.state;
            completed = result.count > 0;
          } else next = { ...next, progress };
        }
        const combatActivity = next.combat.activeTaskId ? activityById[next.combat.activeTaskId] : null;
        const combatReady = combatActivity?.skillId === "combat" && activityAvailable(next, combatActivity) && canAfford(next, activityCosts(next, combatActivity)) && (Boolean(next.shields) || next.hull > next.maxHull * next.retreatAt / 100);
        if (combatActivity && combatReady) {
          const progress = next.combat.progress + 100 / (actionSeconds(next, combatActivity) * 4);
          if (progress >= 100) {
            const result = completeActions({ ...next, combat: { ...next.combat, progress: progress - 100 } }, combatActivity, 1);
            next = result.state;
            completed = completed || result.count > 0;
          } else next = { ...next, combat: { ...next.combat, progress } };
        }
        stateRef.current = next;
        if (completed) queueSave(next);
        return next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [queueSave]);

  useEffect(() => {
    if (!signedIn || !saveAvailable) return;
    const timer = setInterval(() => { if (pendingSave.current) void persist(stateRef.current); }, 8000);
    const flush = () => { if (pendingSave.current) void persist(stateRef.current); };
    document.addEventListener("visibilitychange", flush);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", flush); };
  }, [persist, saveAvailable, signedIn]);

  const startActivity = useCallback((activity: SkillActivity) => {
    const current = stateRef.current;
    if (activity.skillId === "combat" || current.skills[activity.skillId].level < activity.level || !activityAvailable(current, activity)) return;
    updateState((entry) => ({ ...entry, activeTask: { skillId: activity.skillId, activityId: activity.id }, progress: 0, lastActiveAt: Date.now() }));
    setSelectedSkill(activity.skillId);
    setView("skills");
  }, [updateState]);

  const startCombat = useCallback((activity: SkillActivity) => {
    const current = stateRef.current;
    if (activity.skillId !== "combat" || current.skills.combat.level < activity.level || !activityAvailable(current, activity)) return;
    updateState((entry) => ({ ...entry, combat: { ...entry.combat, activeTaskId: activity.id, progress: 0 }, lastActiveAt: Date.now() }));
  }, [updateState]);

  const stopCombat = useCallback(() => updateState((entry) => ({ ...entry, combat: { ...entry.combat, activeTaskId: null, progress: 0 }, lastActiveAt: Date.now() })), [updateState]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "start_training", title: "Start skill training", description: "Start an unlocked Starfall Idle activity.",
        inputSchema: { type: "object", properties: { activityId: { type: "string", enum: activities.filter((entry) => entry.skillId !== "combat").map((entry) => entry.id) } }, required: ["activityId"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const activity = activityById[(input as { activityId?: string }).activityId ?? ""];
          if (!activity || activity.skillId === "combat") throw new Error("Unknown skill activity.");
          startActivity(activity);
          return { selected: activity.name };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {}
    return () => lifecycle.abort();
  }, [startActivity]);

  const active = activityById[state.activeTask.activityId] ?? activities[0];
  const activeSkill = state.skills[active.skillId];
  const activeSector = sectorById[state.sectorId] ?? sectors[0];
  const activeBlocked = !canAfford(state, activityCosts(state, active)) || !activityAvailable(state, active) || (Boolean(active.damage) && !state.shields && state.hull <= state.maxHull * state.retreatAt / 100);
  const xpStart = xpForLevel(activeSkill.level);
  const xpEnd = activeSkill.level === 99 ? activeSkill.xp : xpForLevel(activeSkill.level + 1);
  const xpProgress = activeSkill.level === 99 ? 100 : (activeSkill.xp - xpStart) / Math.max(1, xpEnd - xpStart) * 100;

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

  const completeContract = (id: string) => updateState((current) => {
    const contract = contracts.find((entry) => entry.id === id);
    if (!contract || !canAfford(current, contract.cost)) return current;
    return {
      ...current,
      inventory: spend(current.inventory, contract.cost),
      credits: current.credits + contract.reward.credits,
      factions: { ...current.factions, [contract.faction]: Math.min(100, current.factions[contract.faction] + contract.reward.reputation) },
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

  const marketPrice = (item: string) => {
    const sectorFactor = 1 + sectors.findIndex((entry) => entry.id === state.sectorId) * 0.08;
    const marketWave = 0.9 + ((Math.floor(now / 300_000) + item.length) % 5) * 0.05;
    return Math.max(1, Math.round(marketBase[item] * sectorFactor * marketWave));
  };
  const trade = (item: string, mode: "buy" | "sell") => updateState((current) => {
    const price = marketPrice(item);
    if (mode === "buy" && current.credits >= price) return { ...current, credits: current.credits - price, inventory: addItems(current.inventory, { [item]: 1 }), lastActiveAt: Date.now() };
    if (mode === "sell" && (current.inventory[item] ?? 0) > 0) {
      const cargoBonus = 1 + current.shipModules.cargo * 0.02 + current.skills.logistics.level * 0.003;
      return { ...current, credits: current.credits + Math.max(1, Math.floor(price * 0.7 * cargoBonus)), inventory: spend(current.inventory, { [item]: 1 }), lastActiveAt: Date.now() };
    }
    return current;
  });

  const resolveEvent = (choiceId: string) => updateState((current) => {
    const event = current.pendingEvent ? storyEvents[current.pendingEvent as keyof typeof storyEvents] : null;
    const choice = event?.choices.find((entry) => entry.id === choiceId);
    if (!event || !choice) return current;
    const reward = "credits" in choice.reward ? {} : choice.reward;
    const credits = "credits" in choice.reward ? choice.reward.credits ?? 0 : 0;
    return {
      ...current,
      credits: current.credits + credits,
      inventory: addItems(current.inventory, reward),
      crewMorale: Math.max(0, Math.min(100, current.crewMorale + choice.morale)),
      pendingEvent: null,
      storyLog: [choice.result, ...current.storyLog].slice(0, 30),
      lastActiveAt: Date.now(),
    };
  });

  const beginNewPatrol = () => updateState((current) => {
    if (totalLevel(current) < 100 || current.completedExpeditions < 2) return current;
    const fresh = defaultGameState();
    return {
      ...fresh,
      patrol: current.patrol + 1,
      commandPoints: current.commandPoints + 1,
      collection: current.collection,
      researchUnlocked: current.researchUnlocked,
      achievements: Array.from(new Set([...current.achievements, "veteran"])),
      storyLog: [`Patrol ${String(current.patrol + 1).padStart(2, "0")} commissioned with ${current.commandPoints + 1} Command Points.`, ...current.storyLog].slice(0, 30),
    };
  });

  const viewTitle: Record<ViewId, [string, string]> = {
    skills: [skillMeta[selectedSkill].name, skillMeta[selectedSkill].description],
    bank: ["Cargo Bank", "Every material carried aboard the Aethelgard"],
    sectors: ["Star Chart", "Travel changes available resources, enemies and discoveries"],
    ship: ["Aethelgard Cruiser", "Four decks, nine upgradeable ship systems"],
    crew: ["Crew Roster", "Assign ten specialists to support the skills you value"],
    drones: ["Drone Hangar", "Build autonomous craft for persistent skill bonuses"],
    combat: ["Combat Doctrine", "Balance weapons, protection and automatic retreat"],
    expeditions: ["Expeditions", "Prepare supplies and send teams on longer operations"],
    contracts: ["Faction Contracts", "Exchange production output for credits and reputation"],
    objectives: ["Sector Objectives", "Claim milestone rewards that fund the next stage of the patrol"],
    research: ["Research Network", "Turn discoveries into permanent technical advantages"],
    collection: ["Discovery Archive", "Record resources, enemies, ruins and expeditions"],
    market: ["Station Market", "Prices shift every five minutes and vary by sector"],
    patrol: ["Patrol Record", "Achievements, mastery and five-year commission cycles"],
  };

  return (
    <div className="game-layout v3">
      <aside className="command-nav panel">
        <button className={`home-button ${view === "skills" ? "selected" : ""}`} onClick={() => setView("skills")}><Activity /><span><strong>Skill Matrix</strong><small>TL {totalLevel(state)}</small></span></button>
        <div className="skill-list expanded-skills">
          {SKILL_IDS.filter((id) => id !== "combat").map((id) => {
            const Icon = skillIcons[id];
            return <button key={id} className={`skill-button ${view === "skills" && selectedSkill === id ? "selected" : ""}`} onClick={() => { setSelectedSkill(id); setView("skills"); }}><span className="skill-icon"><Icon /></span><span><strong>{skillMeta[id].name}</strong><small>{skillMeta[id].group}</small></span><b>{state.skills[id].level}</b>{active.skillId === id ? <i className="active-pip" /> : null}</button>;
          })}
        </div>
        <button className={`home-button bank-link ${view === "bank" ? "selected" : ""}`} onClick={() => setView("bank")}><Boxes /><span><strong>Cargo Bank</strong><small>{Object.values(state.inventory).reduce((a, b) => a + b, 0)} items</small></span></button>
      </aside>

      <main className="play-column">
        {offlineReport ? <div className="offline-report panel"><Cloud /><div><strong>Offline patrol report · {duration(offlineReport.seconds)}</strong><span>{offlineReport.activity} · {offlineReport.actions} actions · +{offlineReport.xp} XP · {itemsText(offlineReport.gains)}</span></div><button onClick={() => setOfflineReport(null)}>×</button></div> : null}
        {state.pendingEvent ? <StoryEvent eventId={state.pendingEvent} onChoose={resolveEvent} /> : null}
        <section className="active-operation panel">
          <div className="operation-mark"><CircleGauge /></div>
          <div className="operation-body">
            <div className="operation-heading"><div><p className="eyebrow">ACTIVE · {skillMeta[active.skillId].name.toUpperCase()} · {activeSector.name.toUpperCase()}</p><h2>{active.name}</h2></div><span className="level-chip">LV {activeSkill.level}</span></div>
            <Progress value={activeBlocked ? 0 : state.progress} className="operation-progress" />
            <div className="operation-meta"><span>{activeBlocked ? "Operation paused — check location, materials or retreat threshold" : `${Math.floor(state.progress)}% · ${actionSeconds(state, active).toFixed(1)}s action`}</span><span>{active.xp} XP · {itemsText(active.produces)}</span></div>
          </div>
        </section>

        <header className="content-heading v3-heading"><div><p className="eyebrow">{view === "skills" ? skillMeta[selectedSkill].group.toUpperCase() + " SKILL" : "COMMAND CONSOLE"}</p><h1>{viewTitle[view][0]}</h1><p>{viewTitle[view][1]}</p></div>{view === "skills" ? <div className="xp-block"><strong>Level {state.skills[selectedSkill].level}</strong><span>{fmt(state.skills[selectedSkill].xp)} XP · {fmt(state.mastery[selectedSkill])} mastery</span><Progress value={selectedSkill === active.skillId ? xpProgress : 0} /></div> : null}</header>

        {view === "skills" ? <SkillView state={state} skillId={selectedSkill} activeId={active.id} onStart={startActivity} /> : null}
        {view === "bank" ? <Bank state={state} /> : null}
        {view === "sectors" ? <SectorView state={state} onTravel={travel} /> : null}
        {view === "ship" ? <ShipView state={state} onUpgrade={upgradeModule} /> : null}
        {view === "crew" ? <CrewView state={state} onAssign={assignCrew} /> : null}
        {view === "drones" ? <DroneView state={state} onBuild={buildDrone} onBuildVehicle={buildVehicle} /> : null}
        {view === "combat" ? <CombatView state={state} onUpgrade={upgradeEquipment} onRetreat={(value) => updateState((current) => ({ ...current, retreatAt: value }))} onRepair={() => startActivity(activityById["hull-repair"])} onDoctrine={(weapon, stance) => updateState((current) => ({ ...current, combat: { ...current.combat, ...(weapon ? { weapon } : {}), ...(stance ? { stance } : {}) } }))} onEngage={startCombat} onStop={stopCombat} /> : null}
        {view === "expeditions" ? <ExpeditionView state={state} now={now} onLaunch={launchExpedition} /> : null}
        {view === "contracts" ? <ContractView state={state} onComplete={completeContract} /> : null}
        {view === "objectives" ? <ObjectiveView state={state} onClaim={claimObjective} /> : null}
        {view === "research" ? <ResearchView state={state} onUnlock={unlockResearch} /> : null}
        {view === "collection" ? <CollectionView state={state} /> : null}
        {view === "market" ? <MarketView state={state} getPrice={marketPrice} onTrade={trade} /> : null}
        {view === "patrol" ? <PatrolView state={state} onNewPatrol={beginNewPatrol} /> : null}
      </main>

      <aside className="status-column v3-status">
        <div className="wallet panel"><Stat icon={Coins} label="Credits" value={state.credits} /><Stat icon={Medal} label="Patrol" value={state.patrol} /><Stat icon={Trophy} label="Command" value={state.commandPoints} /></div>
        <div className="vitals panel"><div><span>Hull</span><strong>{state.hull} / {state.maxHull}</strong></div><Progress value={state.hull / state.maxHull * 100} /><div><span>Shields</span><strong>{state.shields}</strong></div><Progress value={Math.min(100, state.shields)} /><div><span>Crew morale</span><strong>{state.crewMorale}%</strong></div><Progress value={state.crewMorale} /></div>
        <div className="side-nav panel">
          {navigation.map((group) => <div key={group.group}><p className="eyebrow">{group.group}</p>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "selected" : ""} onClick={() => setView(item.id)}><Icon /><span>{item.label}</span><ChevronRight /></button>; })}</div>)}
        </div>
        <div className={`save-state panel ${saveStatus}`}>
          {saveStatus === "guest" ? <><Radio /><div><strong>Guest commander</strong><span>Saved on this device. Sign in for a D1 cloud save.</span><a href={signInPath} target="_top">Sign in with ChatGPT</a></div></> : null}
          {saveStatus === "saved" ? <><ShieldCheck /><div><strong>Cloud save current</strong><span>Your patrol is synced.</span></div></> : null}
          {saveStatus === "saving" ? <><Radio className="pulse" /><div><strong>Saving patrol</strong><span>Uploading the latest action.</span></div></> : null}
          {saveStatus === "error" ? <><Radio /><div><strong>Cloud link interrupted</strong><span>Progress continues locally until retry.</span></div></> : null}
        </div>
      </aside>

      <nav className="mobile-nav wide-mobile" aria-label="Game sections">
        <button className={view === "skills" ? "selected" : ""} onClick={() => setView("skills")}><Activity /><span>Skills</span></button>
        <button className={view === "ship" ? "selected" : ""} onClick={() => setView("ship")}><Rocket /><span>Ship</span></button>
        <button className={view === "sectors" ? "selected" : ""} onClick={() => setView("sectors")}><Map /><span>Galaxy</span></button>
        <button className={view === "contracts" ? "selected" : ""} onClick={() => setView("contracts")}><ScrollText /><span>Jobs</span></button>
        <button className={view === "bank" ? "selected" : ""} onClick={() => setView("bank")}><Boxes /><span>Bank</span></button>
      </nav>
    </div>
  );
}

function SkillView({ state, skillId, activeId, onStart }: { state: GameState; skillId: SkillId; activeId: string; onStart: (activity: SkillActivity) => void }) {
  return <div className="activity-list">{activities.filter((entry) => entry.skillId === skillId).map((activity) => {
    const locked = state.skills[skillId].level < activity.level;
    const wrongSector = !activityAvailable(state, activity);
    return <button key={activity.id} className={`activity-row panel ${activeId === activity.id ? "running" : ""}`} disabled={locked || wrongSector} onClick={() => onStart(activity)}><span className="activity-level">{locked ? <LockKeyhole /> : <CircleGauge />}<b>LV {activity.level}</b></span><span className="activity-copy"><strong>{activity.name}</strong><small>{activity.description}</small><em>{activity.consumes ? `Uses: ${itemsText(activity.consumes)} · ` : ""}Yields: {itemsText(activity.produces)}{activity.credits ? ` · ${activity.credits} credits` : ""}</em>{wrongSector ? <i>Unavailable in this sector</i> : null}</span><span className="activity-action"><b>{activity.seconds}s</b><small>{activity.xp} XP</small><ChevronRight /></span></button>;
  })}</div>;
}

function Bank({ state }: { state: GameState }) {
  return <div className="bank expanded panel"><div className="panel-heading"><div><p className="eyebrow">CARGO MANIFEST</p><h2>{Object.values(state.inventory).reduce((a, b) => a + b, 0)} stored items</h2></div><PackageOpen /></div><div className="bank-grid">{Object.entries(state.inventory).map(([id, amount]) => { const Icon = itemIcons[id] ?? Boxes; return <div key={id} className="bank-item"><span><Icon /></span><div><small>{itemNames[id] ?? id}</small><strong>{fmt(amount)}</strong></div></div>; })}</div></div>;
}

function SectorView({ state, onTravel }: { state: GameState; onTravel: (id: string) => void }) {
  return <div className="sector-grid">{sectors.map((sector, index) => {
    const unlocked = totalLevel(state) >= sector.level;
    const fuel = Math.max(0, sector.fuel - (state.researchUnlocked.includes("phase-mapping") ? 1 : 0));
    return <article key={sector.id} className={`sector-card panel ${state.sectorId === sector.id ? "current" : ""}`}><span className="sector-index">{String(index + 1).padStart(2, "0")}</span><div><p className="eyebrow">{sector.tone}</p><h2>{sector.name}</h2><p>{sector.description}</p><small>Requires total level {sector.level} · {fuel} Fuel Rods</small></div><Button disabled={!unlocked || state.sectorId === sector.id || state.inventory.fuelRod < fuel} onClick={() => onTravel(sector.id)}>{state.sectorId === sector.id ? "Current sector" : unlocked ? "Travel" : "Locked"}</Button></article>;
  })}</div>;
}

function ShipView({ state, onUpgrade }: { state: GameState; onUpgrade: (id: ShipModuleId) => void }) {
  return <div className="module-grid">{(Object.entries(shipModules) as [ShipModuleId, typeof shipModules[ShipModuleId]][]).map(([id, module]) => { const level = state.shipModules[id]; const affordable = state.credits >= level * 40 && canAfford(state, { plating: level * 3, circuits: level * 2 }); return <article key={id} className="module-card panel"><span><Orbit /></span><div><p className="eyebrow">DECK SYSTEM · MK {level}</p><h3>{module.name}</h3><p>{module.description}</p><small>{level * 40} credits · {level * 3} Plating · {level * 2} Circuits</small></div><Button disabled={!affordable} onClick={() => onUpgrade(id)}>Upgrade</Button></article>; })}</div>;
}

function CrewView({ state, onAssign }: { state: GameState; onAssign: (id: string, skill: SkillId) => void }) {
  return <div className="crew-grid">{crew.map((member) => <article key={member.id} className="crew-card panel"><div className="crew-avatar">{member.name.split(" ").map((part) => part[0]).join("")}</div><div><p className="eyebrow">{member.role}</p><h3>{member.name}</h3><span>{member.trait}</span></div><Select value={state.crewAssignments[member.id]} onValueChange={(value) => onAssign(member.id, value as SkillId)}><SelectTrigger aria-label={`Assignment for ${member.name}`}><SelectValue /></SelectTrigger><SelectContent>{SKILL_IDS.map((id) => <SelectItem key={id} value={id}>{skillMeta[id].name}</SelectItem>)}</SelectContent></Select></article>)}</div>;
}

function DroneView({ state, onBuild, onBuildVehicle }: { state: GameState; onBuild: (id: DroneId) => void; onBuildVehicle: (id: VehicleId) => void }) {
  return <><div className="section-label"><p className="eyebrow">AUTONOMOUS CRAFT</p><h2>Drone Swarms</h2></div><div className="module-grid">{(Object.entries(droneSpecs) as [DroneId, typeof droneSpecs[DroneId]][]).map(([id, drone]) => <article key={id} className="module-card panel"><span><Bot /></span><div><p className="eyebrow">ACTIVE UNITS · {state.drones[id]}</p><h3>{drone.name}</h3><p>{drone.description}</p><small>{itemsText(drone.cost)}</small></div><Button disabled={!canAfford(state, drone.cost)} onClick={() => onBuild(id)}>Fabricate</Button></article>)}</div><div className="section-label"><p className="eyebrow">HANGAR VEHICLES</p><h2>Surface & Boarding Craft</h2></div><div className="module-grid">{(Object.entries(vehicleSpecs) as [VehicleId, typeof vehicleSpecs[VehicleId]][]).map(([id, vehicle]) => <article key={id} className="module-card panel"><span><Rocket /></span><div><p className="eyebrow">READY · {state.vehicles[id]}</p><h3>{vehicle.name}</h3><p>{vehicle.description}</p><small>{itemsText(vehicle.cost)}</small></div><Button disabled={!canAfford(state, vehicle.cost)} onClick={() => onBuildVehicle(id)}>Construct</Button></article>)}</div></>;
}

function CombatView({ state, onUpgrade, onRetreat, onRepair, onDoctrine, onEngage, onStop }: { state: GameState; onUpgrade: (id: EquipmentId) => void; onRetreat: (value: number) => void; onRepair: () => void; onDoctrine: (weapon?: CombatWeapon, stance?: CombatStance) => void; onEngage: (activity: SkillActivity) => void; onStop: () => void }) {
  const targets = activities.filter((entry) => entry.skillId === "combat" && entry.enemy);
  const activeCandidate = state.combat.activeTaskId ? activityById[state.combat.activeTaskId] : null;
  const activeTarget = activeCandidate?.skillId === "combat" ? activeCandidate : null;
  const combatPaused = activeTarget ? !activityAvailable(state, activeTarget) || !canAfford(state, activityCosts(state, activeTarget)) || (!state.shields && state.hull <= state.maxHull * state.retreatAt / 100) : false;
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
      <strong>{activeTarget ? combatPaused ? "Paused · check ammunition, sector or retreat threshold" : `${Math.floor(state.combat.progress)}% · ${actionSeconds(state, activeTarget).toFixed(1)}s encounter` : "Fire control standing by"}</strong>
      {activeTarget ? <Button variant="outline" onClick={onStop}>Disengage</Button> : null}
    </section>
    <section className="combat-control panel">
      <div><p className="eyebrow">FIRE CONTROL</p><h2>Combat doctrine</h2><p>Match your weapon to enemy defences. Guided missiles consume one missile per victory.</p></div>
      <label><span>Weapon system</span><Select value={state.combat.weapon} onValueChange={(value) => onDoctrine(value as CombatWeapon)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weaponNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></label>
      <label><span>Engagement stance</span><Select value={state.combat.stance} onValueChange={(value) => onDoctrine(undefined, value as CombatStance)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(stanceNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></label>
      <label className="retreat-control"><span>Auto-retreat at {state.retreatAt}% hull</span><Slider value={[state.retreatAt]} min={10} max={75} step={5} onValueChange={(value) => onRetreat(value[0])} /></label>
      <Button onClick={onRepair}><Wrench /> Repair & reset streak</Button>
    </section>
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
  </>;
}

function ExpeditionView({ state, now, onLaunch }: { state: GameState; now: number; onLaunch: (id: string) => void }) {
  const active = expeditions.find((entry) => entry.id === state.activeExpedition?.id);
  return <><div className="expedition-status panel">{active ? <><Compass /><div><p className="eyebrow">TEAM DEPLOYED</p><h2>{active.name}</h2><span>Returns in {duration(((state.activeExpedition?.endsAt ?? now) - now) / 1000)}</span></div></> : <><Compass /><div><p className="eyebrow">EXPEDITION BAY</p><h2>Team ready</h2><span>Select one operation below.</span></div></>}</div><div className="module-grid">{expeditions.map((entry) => { const vehicleReady = !entry.vehicle || state.vehicles[entry.vehicle] > 0; return <article key={entry.id} className="module-card panel"><span><Landmark /></span><div><p className="eyebrow">{entry.minutes} MIN · TL {entry.level}</p><h3>{entry.name}</h3><p>{entry.description}</p><small>Cost: {itemsText(entry.cost)} · Reward: {itemsText(entry.reward)}{entry.vehicle ? ` · Requires ${vehicleSpecs[entry.vehicle].name}` : ""}</small></div><Button disabled={Boolean(state.activeExpedition) || totalLevel(state) < entry.level || !canAfford(state, entry.cost) || !vehicleReady} onClick={() => onLaunch(entry.id)}>Launch</Button></article>; })}</div></>;
}

function ContractView({ state, onComplete }: { state: GameState; onComplete: (id: string) => void }) {
  return <><div className="faction-strip">{Object.entries(state.factions).map(([id, rep]) => <div key={id} className="panel"><small>{factionNames[id]}</small><strong>{rep}</strong><Progress value={rep} /></div>)}</div><div className="module-grid">{contracts.map((contract) => <article key={contract.id} className="module-card panel"><span><ScrollText /></span><div><p className="eyebrow">{factionNames[contract.faction]}</p><h3>{contract.name}</h3><p>{contract.description}</p><small>{itemsText(contract.cost)} · {contract.reward.credits} credits · +{contract.reward.reputation} reputation</small></div><Button disabled={!canAfford(state, contract.cost)} onClick={() => onComplete(contract.id)}>Fulfil</Button></article>)}</div></>;
}

function ObjectiveView({ state, onClaim }: { state: GameState; onClaim: (id: string) => void }) {
  return <div className="research-tree">{objectives.map((objective, index) => { const claimed = state.claimedObjectives.includes(objective.id); const met = objective.met(state); return <article key={objective.id} className={`research-node panel ${claimed ? "unlocked" : ""}`}><span>{claimed ? <Check /> : index + 1}</span><div><p className="eyebrow">{claimed ? "COMPLETED" : "PATROL OBJECTIVE"}</p><h3>{objective.name}</h3><p>{objective.description}</p><small>Reward: {objective.reward}</small></div><Button disabled={!met || claimed} onClick={() => onClaim(objective.id)}>{claimed ? "Claimed" : met ? "Claim" : "In progress"}</Button></article>; })}</div>;
}

function ResearchView({ state, onUnlock }: { state: GameState; onUnlock: (id: string) => void }) {
  return <div className="research-tree">{researchNodes.map((node, index) => { const unlocked = state.researchUnlocked.includes(node.id); const prerequisites = node.requires.every((id) => state.researchUnlocked.includes(id)); return <article key={node.id} className={`research-node panel ${unlocked ? "unlocked" : ""}`}><span>{index + 1}</span><div><p className="eyebrow">{unlocked ? "RESEARCHED" : "TECHNOLOGY"}</p><h3>{node.name}</h3><p>{node.description}</p><small>{itemsText(node.cost)}</small></div><Button disabled={unlocked || !prerequisites || !canAfford(state, node.cost)} onClick={() => onUnlock(node.id)}>{unlocked ? "Complete" : prerequisites ? "Research" : "Locked"}</Button></article>; })}</div>;
}

function CollectionView({ state }: { state: GameState }) {
  const groups = Array.from(new Set(collectionEntries.map((entry) => entry[2])));
  return <div className="collection-groups">{groups.map((group) => <section key={group}><div className="collection-title"><h2>{group}</h2><span>{collectionEntries.filter((entry) => entry[2] === group && state.collection.includes(entry[0])).length} / {collectionEntries.filter((entry) => entry[2] === group).length}</span></div><div className="collection-grid">{collectionEntries.filter((entry) => entry[2] === group).map(([id, name]) => { const found = state.collection.includes(id); return <div key={id} className={`collection-item panel ${found ? "found" : ""}`}>{found ? <Sparkles /> : <LockKeyhole />}<span>{found ? name : "Unknown discovery"}</span></div>; })}</div></section>)}</div>;
}

function MarketView({ state, getPrice, onTrade }: { state: GameState; getPrice: (id: string) => number; onTrade: (id: string, mode: "buy" | "sell") => void }) {
  return <div className="market-table panel">{marketGoods.map((id) => { const Icon = itemIcons[id]; const price = getPrice(id); return <div key={id} className="market-row"><span><Icon /></span><div><strong>{itemNames[id]}</strong><small>In cargo: {state.inventory[id]}</small></div><b>{price} cr</b><Button variant="outline" disabled={!state.inventory[id]} onClick={() => onTrade(id, "sell")}>Sell</Button><Button disabled={state.credits < price} onClick={() => onTrade(id, "buy")}>Buy</Button></div>; })}</div>;
}

function PatrolView({ state, onNewPatrol }: { state: GameState; onNewPatrol: () => void }) {
  const ready = totalLevel(state) >= 100 && state.completedExpeditions >= 2;
  return <><div className="patrol-hero panel"><Medal /><div><p className="eyebrow">COMMISSION {String(state.patrol).padStart(2, "0")}</p><h2>{state.commandPoints} Command Points</h2><p>Each completed patrol permanently extends offline progress. Research and discoveries carry into the next commission.</p></div><AlertDialog><AlertDialogTrigger asChild><Button disabled={!ready}>Begin new patrol</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End the current patrol?</AlertDialogTitle><AlertDialogDescription>This resets skills, cargo, ship modules and equipment. Research, discoveries, achievements and Command Points are retained.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep patrolling</AlertDialogCancel><AlertDialogAction onClick={onNewPatrol}>Begin new commission</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div><div className="record-grid"><section className="panel"><h2>Achievements</h2>{achievements.map((entry) => <div key={entry.id} className={state.achievements.includes(entry.id) ? "earned" : ""}>{state.achievements.includes(entry.id) ? <Trophy /> : <LockKeyhole />}<span>{entry.name}</span></div>)}</section><section className="panel"><h2>Patrol requirements</h2><div className={totalLevel(state) >= 100 ? "earned" : ""}><Check /><span>Total level 100 ({totalLevel(state)} / 100)</span></div><div className={state.completedExpeditions >= 2 ? "earned" : ""}><Check /><span>Complete 2 expeditions ({state.completedExpeditions} / 2)</span></div><div><History /><span>{state.totalActions.toLocaleString()} lifetime actions this patrol</span></div></section><section className="panel log-record"><h2>Captain&apos;s log</h2>{state.storyLog.slice(0, 8).map((entry, index) => <p key={index}>{entry}</p>)}</section></div></>;
}

function StoryEvent({ eventId, onChoose }: { eventId: string; onChoose: (id: string) => void }) {
  const event = storyEvents[eventId as keyof typeof storyEvents];
  if (!event) return null;
  return <section className="story-event panel"><Sparkles /><div><p className="eyebrow">SHIP EVENT</p><h2>{event.title}</h2><p>{event.text}</p><div>{event.choices.map((choice) => <Button key={choice.id} variant="outline" onClick={() => onChoose(choice.id)}>{choice.label}</Button>)}</div></div></section>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: number }) {
  return <div className="resource"><Icon /><small>{label}</small><strong>{fmt(value)}</strong></div>;
}
