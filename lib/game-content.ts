import type { DroneId, EquipmentId, GameState, ShipModuleId, SkillId, VehicleId } from "./game-state";

export type Activity = {
  id: string;
  skillId: SkillId;
  name: string;
  level: number;
  seconds: number;
  xp: number;
  description: string;
  produces: Record<string, number>;
  consumes?: Record<string, number>;
  credits?: number;
  sectors?: string[];
  damage?: number;
  enemy?: { hull: number; shields: number; armor: number; evasion: number; class: string; weakness: "laser" | "railgun" | "missile"; rareEvery: number; rareDrop: Record<string, number> };
  collectionId?: string;
};

export const skillMeta: Record<SkillId, { name: string; description: string; group: "Field" | "Technical" | "Command" }> = {
  mining: { name: "Mining", description: "Extract asteroid ore", group: "Field" },
  salvage: { name: "Salvage", description: "Strip abandoned vessels", group: "Field" },
  botany: { name: "Xenobotany", description: "Grow closed-loop supplies", group: "Field" },
  combat: { name: "Combat", description: "Clear hostile sectors", group: "Field" },
  archaeology: { name: "Archaeology", description: "Recover lost technology", group: "Field" },
  engineering: { name: "Engineering", description: "Fabricate ship hardware", group: "Technical" },
  metallurgy: { name: "Metallurgy", description: "Refine specialised alloys", group: "Technical" },
  biochemistry: { name: "Biochemistry", description: "Create medicine and catalysts", group: "Technical" },
  science: { name: "Science", description: "Analyse deep-space signals", group: "Technical" },
  medicine: { name: "Medicine", description: "Protect and restore the crew", group: "Technical" },
  astrogation: { name: "Astrogation", description: "Chart routes between systems", group: "Command" },
  drones: { name: "Drone Command", description: "Coordinate autonomous craft", group: "Command" },
  logistics: { name: "Logistics", description: "Move cargo and fulfil contracts", group: "Command" },
  diplomacy: { name: "Diplomacy", description: "Build faction relationships", group: "Command" },
};

export const itemNames: Record<string, string> = {
  ferrite: "Ferrite Ore", cobalt: "Cobalt", iridium: "Iridium", salvage: "Salvage",
  circuits: "Circuits", algae: "Algae Culture", rations: "Rations", plating: "Alloy Plating",
  powerCell: "Power Cells", data: "Signal Data", relic: "Relic Fragments", medicine: "Medkits",
  catalyst: "Bio-catalyst", navData: "Nav Data", droneParts: "Drone Parts", fuelRod: "Fuel Rods",
  artefact: "Ancient Artefacts",
  missiles: "Tactical Missiles",
};

export const activities: Activity[] = [
  { id: "ferrite-outcrop", skillId: "mining", name: "Ferrite Outcrop", level: 1, seconds: 3, xp: 9, description: "Cut common hull-grade ore from a near-field rock.", produces: { ferrite: 3 }, collectionId: "ore-ferrite" },
  { id: "cobalt-seam", skillId: "mining", name: "Cobalt Seam", level: 5, seconds: 5, xp: 17, description: "Track blue seams used in compact power cells.", produces: { cobalt: 2 }, sectors: ["helix", "cinder", "orpheus", "silent"], collectionId: "ore-cobalt" },
  { id: "iridium-core", skillId: "mining", name: "Iridium Core", level: 12, seconds: 8, xp: 32, description: "Bore into a dense and unstable asteroid core.", produces: { ferrite: 5, iridium: 2 }, sectors: ["orpheus", "silent"], collectionId: "ore-iridium" },
  { id: "drift-debris", skillId: "salvage", name: "Drift Debris", level: 1, seconds: 4, xp: 10, description: "Recover usable scrap from the shipping lane.", produces: { salvage: 3 }, credits: 2, collectionId: "wreck-courier" },
  { id: "relay-hulk", skillId: "salvage", name: "Relay Hulk", level: 6, seconds: 7, xp: 23, description: "Extract intact circuits from a silent relay.", produces: { salvage: 4, circuits: 1 }, credits: 5, sectors: ["helix", "cinder", "orpheus", "silent"], collectionId: "wreck-relay" },
  { id: "warship-grave", skillId: "salvage", name: "Warship Grave", level: 14, seconds: 10, xp: 40, description: "Work a dangerous pre-collapse wreck field.", produces: { salvage: 8, circuits: 3, plating: 1 }, credits: 12, sectors: ["cinder", "silent"], collectionId: "wreck-dreadnought" },
  { id: "algae-vat", skillId: "botany", name: "Algae Vats", level: 1, seconds: 4, xp: 9, description: "Cultivate a hardy oxygenating food base.", produces: { algae: 3 }, collectionId: "flora-algae" },
  { id: "hydroponic-bay", skillId: "botany", name: "Hydroponic Bay", level: 5, seconds: 7, xp: 20, description: "Convert algae cultures into patrol rations.", consumes: { algae: 4 }, produces: { rations: 2 }, collectionId: "flora-kelp" },
  { id: "xeno-spores", skillId: "botany", name: "Xeno Spore Culture", level: 13, seconds: 9, xp: 36, description: "Grow a rare catalyst under sealed glass.", consumes: { algae: 5 }, produces: { rations: 3, catalyst: 1 }, sectors: ["helix", "orpheus", "silent"], collectionId: "flora-spore" },
  { id: "hull-repair", skillId: "engineering", name: "Hull Repair", level: 1, seconds: 5, xp: 13, description: "Use salvage to restore the patrol vessel.", consumes: { salvage: 2 }, produces: {}, collectionId: "blueprint-repair" },
  { id: "drone-chassis", skillId: "engineering", name: "Drone Chassis", level: 7, seconds: 8, xp: 28, description: "Fabricate autonomous cargo and mining hardware.", consumes: { plating: 1, circuits: 2 }, produces: { droneParts: 2 }, collectionId: "blueprint-drone" },
  { id: "jump-coil", skillId: "engineering", name: "Jump Coil", level: 15, seconds: 12, xp: 48, description: "Build precision components for long-range travel.", consumes: { iridium: 2, powerCell: 1, circuits: 3 }, produces: { navData: 3 }, credits: 20, collectionId: "blueprint-coil" },
  { id: "alloy-plating", skillId: "metallurgy", name: "Alloy Plating", level: 1, seconds: 5, xp: 14, description: "Smelt ferrite and salvage into pressure plating.", consumes: { ferrite: 5, salvage: 2 }, produces: { plating: 1 }, collectionId: "alloy-standard" },
  { id: "power-cell", skillId: "metallurgy", name: "Power Cell", level: 6, seconds: 8, xp: 27, description: "Assemble a compact high-density power cell.", consumes: { cobalt: 3, circuits: 1 }, produces: { powerCell: 1 }, collectionId: "alloy-cobalt" },
  { id: "tactical-missiles", skillId: "metallurgy", name: "Tactical Missiles", level: 9, seconds: 9, xp: 34, description: "Machine guided anti-ship munitions for evasive targets.", consumes: { plating: 1, circuits: 2, powerCell: 1 }, produces: { missiles: 4 }, collectionId: "alloy-missile" },
  { id: "fuel-rod", skillId: "metallurgy", name: "Reactor Fuel Rod", level: 13, seconds: 10, xp: 42, description: "Refine iridium into stable reactor fuel.", consumes: { iridium: 2, cobalt: 2 }, produces: { fuelRod: 1 }, collectionId: "alloy-iridium" },
  { id: "medkit", skillId: "biochemistry", name: "Synthesize Medkit", level: 1, seconds: 5, xp: 13, description: "Blend algae cultures into field medicine.", consumes: { algae: 4 }, produces: { medicine: 2 }, collectionId: "bio-medkit" },
  { id: "combat-stim", skillId: "biochemistry", name: "Combat Stimulant", level: 7, seconds: 8, xp: 28, description: "Stabilise a catalyst for dangerous boarding actions.", consumes: { catalyst: 2, medicine: 1 }, produces: { rations: 3 }, credits: 8, collectionId: "bio-stim" },
  { id: "xeno-serum", skillId: "biochemistry", name: "Xeno Serum", level: 14, seconds: 11, xp: 45, description: "Produce an experimental regenerative compound.", consumes: { catalyst: 3, relic: 1 }, produces: { medicine: 6 }, collectionId: "bio-serum" },
  { id: "passive-scan", skillId: "science", name: "Passive Telemetry", level: 1, seconds: 5, xp: 12, description: "Map emissions beyond the Erebus dust veil.", produces: { data: 2 }, collectionId: "signal-pulse" },
  { id: "relic-decode", skillId: "science", name: "Relic Decoding", level: 6, seconds: 8, xp: 26, description: "Interpret fragmented non-human machine code.", consumes: { data: 6 }, produces: { relic: 1 }, credits: 15, collectionId: "signal-cipher" },
  { id: "anomaly-probe", skillId: "science", name: "Anomaly Probe", level: 14, seconds: 12, xp: 45, description: "Sample a gravitational fracture with a disposable probe.", consumes: { powerCell: 1, data: 4 }, produces: { relic: 3 }, sectors: ["orpheus", "silent"], collectionId: "signal-anomaly" },
  { id: "triage-drill", skillId: "medicine", name: "Triage Drill", level: 1, seconds: 5, xp: 12, description: "Train emergency response throughout the ship.", consumes: { medicine: 1 }, produces: {}, collectionId: "medical-field" },
  { id: "radiation-therapy", skillId: "medicine", name: "Radiation Therapy", level: 7, seconds: 8, xp: 29, description: "Treat exposure sustained beyond shielded space.", consumes: { medicine: 2, catalyst: 1 }, produces: {}, sectors: ["orpheus", "silent"], collectionId: "medical-radiation" },
  { id: "scavenger-drone", skillId: "combat", name: "Scavenger Drone", level: 1, seconds: 6, xp: 16, description: "Disable a lightly armoured autonomous scavenger.", produces: { salvage: 3 }, credits: 6, damage: 7, enemy: { hull: 30, shields: 5, armor: 2, evasion: 8, class: "Drone", weakness: "laser", rareEvery: 12, rareDrop: { droneParts: 1 } }, collectionId: "enemy-scavenger" },
  { id: "helix-automata", skillId: "combat", name: "Helix Security Automata", level: 4, seconds: 8, xp: 24, description: "Breach a quarantine-era security platform.", produces: { circuits: 1, salvage: 2 }, credits: 11, damage: 10, sectors: ["helix", "orpheus", "silent"], enemy: { hull: 48, shields: 24, armor: 5, evasion: 5, class: "Automata", weakness: "laser", rareEvery: 15, rareDrop: { data: 4 } }, collectionId: "enemy-automata" },
  { id: "corsair-skiff", skillId: "combat", name: "Corsair Skiff", level: 7, seconds: 10, xp: 34, description: "Intercept a raider before it reaches the convoy.", consumes: { rations: 1 }, produces: { circuits: 2 }, credits: 18, damage: 14, sectors: ["cinder", "orpheus", "silent"], enemy: { hull: 65, shields: 16, armor: 6, evasion: 24, class: "Raider", weakness: "missile", rareEvery: 18, rareDrop: { powerCell: 2 } }, collectionId: "enemy-corsair" },
  { id: "pirate-frigate", skillId: "combat", name: "Corsair Frigate", level: 12, seconds: 13, xp: 48, description: "Cripple an armoured capital raider and board its hold.", consumes: { rations: 2 }, produces: { plating: 2, salvage: 4 }, credits: 32, damage: 21, sectors: ["cinder", "silent"], enemy: { hull: 105, shields: 20, armor: 22, evasion: 10, class: "Frigate", weakness: "railgun", rareEvery: 20, rareDrop: { missiles: 5, artefact: 1 } }, collectionId: "enemy-frigate" },
  { id: "void-sentinel", skillId: "combat", name: "Void Sentinel", level: 16, seconds: 16, xp: 64, description: "Engage an ancient guardian at close range.", consumes: { rations: 2, powerCell: 1 }, produces: { relic: 2, plating: 1 }, credits: 48, damage: 29, sectors: ["silent"], enemy: { hull: 160, shields: 55, armor: 28, evasion: 16, class: "Guardian", weakness: "railgun", rareEvery: 25, rareDrop: { relic: 6, artefact: 1 } }, collectionId: "enemy-sentinel" },
  { id: "local-charts", skillId: "astrogation", name: "Update Local Charts", level: 1, seconds: 5, xp: 12, description: "Reconcile beacon drift and shipping telemetry.", produces: { navData: 2 }, collectionId: "chart-erebus" },
  { id: "rift-calculation", skillId: "astrogation", name: "Rift Calculation", level: 8, seconds: 9, xp: 31, description: "Calculate a safe path through warped space.", consumes: { data: 2 }, produces: { navData: 5 }, sectors: ["orpheus", "silent"], collectionId: "chart-rift" },
  { id: "mining-swarm", skillId: "drones", name: "Mining Swarm", level: 1, seconds: 5, xp: 12, description: "Coordinate automated extraction patterns.", consumes: { droneParts: 1 }, produces: { ferrite: 5 }, collectionId: "drone-miner" },
  { id: "survey-swarm", skillId: "drones", name: "Survey Swarm", level: 7, seconds: 8, xp: 29, description: "Sweep the sector for signals and wreckage.", consumes: { powerCell: 1 }, produces: { data: 3, salvage: 2 }, collectionId: "drone-survey" },
  { id: "cargo-drill", skillId: "logistics", name: "Cargo Drill", level: 1, seconds: 5, xp: 11, description: "Optimise rover deployment and magnetic tie-downs.", produces: { salvage: 1 }, credits: 4, collectionId: "logistics-loader" },
  { id: "frontier-haul", skillId: "logistics", name: "Frontier Haul", level: 7, seconds: 9, xp: 30, description: "Move priority supplies between isolated stations.", consumes: { rations: 2, fuelRod: 1 }, produces: { circuits: 2 }, credits: 28, collectionId: "logistics-convoy" },
  { id: "station-aid", skillId: "diplomacy", name: "Station Mediation", level: 1, seconds: 6, xp: 13, description: "Resolve disputes among Erebus prospectors.", consumes: { rations: 1 }, produces: {}, credits: 8, collectionId: "accord-erebus" },
  { id: "corsair-parley", skillId: "diplomacy", name: "Corsair Parley", level: 8, seconds: 10, xp: 34, description: "Negotiate passage through a contested system.", consumes: { relic: 1 }, produces: { data: 2 }, credits: 22, sectors: ["cinder"], collectionId: "accord-corsair" },
  { id: "colony-ruins", skillId: "archaeology", name: "Colony Ruins", level: 1, seconds: 6, xp: 14, description: "Catalogue abandoned frontier technology.", consumes: { data: 1 }, produces: { relic: 1 }, collectionId: "ruin-colony" },
  { id: "alien-vault", skillId: "archaeology", name: "Alien Vault", level: 9, seconds: 11, xp: 38, description: "Reconstruct machinery from a sealed structure.", consumes: { relic: 3, powerCell: 1 }, produces: { artefact: 1 }, sectors: ["orpheus", "silent"], collectionId: "ruin-vault" },
];

export const sectors = [
  { id: "erebus", name: "Erebus Belt", level: 1, fuel: 0, tone: "Industrial frontier", description: "Safe shipping lanes, training rocks and crowded salvage fields." },
  { id: "helix", name: "Helix Reach", level: 10, fuel: 1, tone: "Research quarantine", description: "Abandoned laboratories and rapidly adapting xenoflora." },
  { id: "cinder", name: "Cinder Expanse", level: 24, fuel: 2, tone: "Corsair territory", description: "Profitable wrecks guarded by organised raider fleets." },
  { id: "orpheus", name: "Orpheus Rift", level: 42, fuel: 3, tone: "Gravitational fracture", description: "Rare minerals, time distortion and unstable routes." },
  { id: "silent", name: "The Silent Systems", level: 70, fuel: 5, tone: "Machine domain", description: "Endgame ruins protected by ancient autonomous sentinels." },
];

export const shipModules: Record<ShipModuleId, { name: string; description: string }> = {
  bridge: { name: "Bridge", description: "Astrogation speed and route access" },
  cic: { name: "Combat Information Centre", description: "Combat and drone coordination" },
  cargo: { name: "Cargo Bay", description: "Bank capacity and contract rewards" },
  hydroponics: { name: "Hydroponics", description: "Xenobotany and ration output" },
  fabricator: { name: "Fabrication Deck", description: "Engineering and metallurgy output" },
  lab: { name: "Science Laboratory", description: "Science and archaeology research" },
  medbay: { name: "Medical Bay", description: "Hull retreat recovery and morale" },
  reactor: { name: "Reactor", description: "Shield strength and expedition range" },
  hangar: { name: "Hangar", description: "Drone capacity and vehicle operations" },
};

export const crew = [
  { id: "mara", name: "Mara Venn", role: "Captain", trait: "Steady Hand" },
  { id: "jonas", name: "Jonas Rhee", role: "Chief Engineer", trait: "Improviser" },
  { id: "priya", name: "Priya Nadir", role: "Science Officer", trait: "Pattern Seeker" },
  { id: "okafor", name: "Dr Okafor", role: "Medical Officer", trait: "Calm Under Fire" },
  { id: "sol", name: "Sol Mercer", role: "Tactical Officer", trait: "Deadeye" },
  { id: "mei", name: "Mei Navarro", role: "Xenobotanist", trait: "Green Thumb" },
  { id: "rook", name: "Rook-7", role: "Drone Controller", trait: "Parallel Mind" },
  { id: "elias", name: "Elias Ward", role: "Quartermaster", trait: "Nothing Wasted" },
  { id: "vega", name: "Vega Holt", role: "Salvage Lead", trait: "Voidwalker" },
  { id: "anya", name: "Anya Sato", role: "Archaeologist", trait: "Old Languages" },
];

export const droneSpecs: Record<DroneId, { name: string; description: string; cost: Record<string, number> }> = {
  mining: { name: "Mining Drone", description: "Adds passive yield to ore extraction.", cost: { droneParts: 3, powerCell: 1 } },
  salvage: { name: "Salvage Drone", description: "Recovers extra intact components.", cost: { droneParts: 3, circuits: 2 } },
  survey: { name: "Survey Probe", description: "Improves science and sector discovery.", cost: { droneParts: 2, data: 4 } },
  combat: { name: "Combat Drone", description: "Reduces damage during hostile actions.", cost: { droneParts: 4, plating: 2, powerCell: 1 } },
  cargo: { name: "Cargo Loader", description: "Improves logistics and market returns.", cost: { droneParts: 3, plating: 2 } },
};

export const vehicleSpecs: Record<VehicleId, { name: string; description: string; cost: Record<string, number> }> = {
  rover: { name: "Planetary Rover", description: "Carries a survey team across hostile planetary surfaces.", cost: { plating: 6, circuits: 5, powerCell: 2 } },
  boardingShuttle: { name: "Boarding Shuttle", description: "Transfers crew safely to derelicts, stations and alien structures.", cost: { plating: 10, circuits: 8, powerCell: 4 } },
};

export const equipmentSpecs: Record<EquipmentId, { name: string; description: string }> = {
  cutter: { name: "Plasma Cutter", description: "Mining and salvage yield" },
  exosuit: { name: "Boarding Rig", description: "Combat protection and damage" },
  scanner: { name: "Survey Array", description: "Science and xenobotany yield" },
  railgun: { name: "Coil Railgun", description: "Armour damage and combat speed" },
  shield: { name: "Deflector Grid", description: "Reduces incoming combat damage" },
};

export const researchNodes: { id: string; name: string; description: string; cost: Record<string, number>; requires: string[] }[] = [
  { id: "efficient-cycles", name: "Efficient Cycles", description: "All actions complete 5% faster.", cost: { data: 12 }, requires: [] },
  { id: "autonomous-repair", name: "Autonomous Repair", description: "Engineering actions restore additional hull.", cost: { data: 18, circuits: 3 }, requires: ["efficient-cycles"] },
  { id: "xeno-adaptation", name: "Xeno Adaptation", description: "Xenobotany and biochemistry gain bonus output.", cost: { data: 22, catalyst: 2 }, requires: ["efficient-cycles"] },
  { id: "phase-mapping", name: "Phase Mapping", description: "Travel costs one fewer Fuel Rod.", cost: { data: 30, relic: 3 }, requires: ["autonomous-repair"] },
  { id: "sentinel-protocol", name: "Sentinel Protocol", description: "Ancient enemies deal 20% less damage.", cost: { data: 45, artefact: 1 }, requires: ["phase-mapping", "xeno-adaptation"] },
];

export const contracts: { id: string; faction: string; name: string; description: string; cost: Record<string, number>; reward: { credits: number; reputation: number } }[] = [
  { id: "ore-quota", faction: "prospectors", name: "Prospector Ore Quota", description: "Deliver 30 Ferrite Ore.", cost: { ferrite: 30 }, reward: { credits: 110, reputation: 6 } },
  { id: "station-relief", faction: "frontier", name: "Station Relief", description: "Deliver food and medicine to Kestrel Station.", cost: { rations: 8, medicine: 3 }, reward: { credits: 160, reputation: 8 } },
  { id: "research-cache", faction: "institute", name: "Research Cache", description: "Supply decoded signal material.", cost: { data: 15, relic: 2 }, reward: { credits: 220, reputation: 9 } },
  { id: "patrol-refit", faction: "patrol", name: "Patrol Refit", description: "Supply structural materials to a damaged cutter.", cost: { plating: 6, circuits: 4 }, reward: { credits: 260, reputation: 10 } },
  { id: "quiet-passage", faction: "corsairs", name: "Quiet Passage", description: "Trade valuable salvage for intelligence.", cost: { salvage: 25, relic: 2 }, reward: { credits: 300, reputation: 7 } },
  { id: "rift-convoy", faction: "frontier", name: "Rift Convoy", description: "Prepare a long-range convoy package.", cost: { fuelRod: 3, rations: 10, medicine: 4 }, reward: { credits: 420, reputation: 12 } },
];

export const expeditions: { id: string; name: string; minutes: number; level: number; description: string; cost: Record<string, number>; reward: Record<string, number>; collection: string; vehicle?: VehicleId }[] = [
  { id: "colony-ship", name: "Board the Colony Ship", minutes: 2, level: 8, description: "Search an unpowered habitat ring.", cost: { rations: 2, medicine: 1 }, reward: { salvage: 12, data: 5 }, collection: "expedition-colony" },
  { id: "uncharted-moon", name: "Survey the Uncharted Moon", minutes: 4, level: 18, description: "Deploy a rover beyond beacon range.", cost: { fuelRod: 1, rations: 4 }, reward: { cobalt: 8, catalyst: 3 }, collection: "expedition-moon", vehicle: "rover" },
  { id: "alien-structure", name: "Enter the Alien Structure", minutes: 7, level: 38, description: "Take a multidisciplinary team below the surface.", cost: { powerCell: 2, medicine: 3, data: 8 }, reward: { relic: 8, artefact: 1 }, collection: "expedition-structure", vehicle: "boardingShuttle" },
  { id: "jump-gate", name: "Repair the Broken Gate", minutes: 10, level: 60, description: "Restore a pre-collapse transit gate.", cost: { plating: 8, circuits: 8, fuelRod: 3 }, reward: { artefact: 3, navData: 15 }, collection: "expedition-gate", vehicle: "boardingShuttle" },
];

export const storyEvents = {
  escapePod: {
    title: "The Unclaimed Escape Pod",
    text: "A sealed pod broadcasts a century-old distress code. Its life signs are impossible.",
    choices: [
      { id: "open", label: "Bring it aboard", result: "The pod contained an intact navigation core.", reward: { navData: 8 }, morale: -4 },
      { id: "report", label: "Report it to Patrol", result: "Patrol Command records your restraint.", reward: { credits: 90 }, morale: 3 },
    ],
  },
  cargoNoise: {
    title: "Movement in the Cargo Hold",
    text: "Something is moving behind a sealed salvage container.",
    choices: [
      { id: "investigate", label: "Send the salvage team", result: "A maintenance drone reactivates and joins the ship.", reward: { droneParts: 5 }, morale: 2 },
      { id: "vent", label: "Vent the container", result: "The threat is gone, along with some salvage.", reward: { salvage: -5 }, morale: -2 },
    ],
  },
} as const;

export const collectionEntries = [
  ["ore-ferrite", "Ferrite Sample", "Resources"], ["ore-cobalt", "Cobalt Crystal", "Resources"], ["ore-iridium", "Iridium Core", "Resources"],
  ["alloy-missile", "Guidance Warhead", "Resources"],
  ["wreck-courier", "Courier Wreck", "Derelicts"], ["wreck-relay", "Silent Relay", "Derelicts"], ["wreck-dreadnought", "Lost Dreadnought", "Derelicts"],
  ["flora-algae", "Vacuum Algae", "Xenoflora"], ["flora-kelp", "Helix Kelp", "Xenoflora"], ["flora-spore", "Singing Spore", "Xenoflora"],
  ["enemy-scavenger", "Scavenger Drone", "Hostiles"], ["enemy-automata", "Helix Automata", "Hostiles"], ["enemy-corsair", "Corsair Skiff", "Hostiles"], ["enemy-frigate", "Corsair Frigate", "Hostiles"], ["enemy-sentinel", "Void Sentinel", "Hostiles"],
  ["ruin-colony", "Colony Tablet", "Relics"], ["ruin-vault", "Vault Mechanism", "Relics"], ["expedition-structure", "Structure Survey", "Expeditions"],
  ["expedition-gate", "Restored Jump Gate", "Expeditions"], ["chart-rift", "Rift Chart", "Navigation"], ["accord-corsair", "Corsair Accord", "Diplomacy"],
] as const;

export function totalLevel(state: GameState) {
  return Object.values(state.skills).reduce((sum, skill) => sum + skill.level, 0);
}
