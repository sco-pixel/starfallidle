import type { DroneId, EquipmentId, GameState, ShipModuleId, SkillId, VehicleId } from "./game-state";
import { advancedActivities, bossActivities, combatActivities } from "./depth-content";

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
  titanium: "Titanium Ore", phaseCrystal: "Phase Crystals", darkMatter: "Dark Matter", quantumDust: "Quantum Dust",
  neutronium: "Neutronium", quantumCircuit: "Quantum Circuits", ancientCore: "Ancient Cores", xenoFiber: "Xeno-fibre",
  neuralGel: "Neural Gel", quantumParts: "Quantum Components", titaniumPlate: "Titanium Plating", quantumAlloy: "Quantum Alloy",
  neutroniumPlate: "Neutronium Plating", singularityCore: "Singularity Cores", genesisCompound: "Genesis Compound",
  voidData: "Void Data", commandToken: "Command Token", phaseFilament: "Phase Filament", bioLumen: "Bio-lumen",
  voidLens: "Void Lens", sentinelCipher: "Sentinel Cipher", riftAlloy: "Rift Alloy", phaseLattice: "Phase Lattice", repairNanites: "Repair Nanites",
  gearPhaseLance: "Phase Lance", gearLivingBulwark: "Living Bulwark",
  gearChronoDrive: "Chrono Drive", gearFoundryHeart: "Foundry Heart", gearStarfallCrown: "Starfall Crown",
};

const coreActivities: Activity[] = [
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
  { id: "armour-plating-repair", skillId: "engineering", name: "Armour Plating Repair", level: 18, seconds: 11, xp: 58, description: "Replace damaged hull plating and restore deflector integrity.", consumes: { salvage: 5, plating: 2, circuits: 2 }, produces: {}, collectionId: "blueprint-armour-repair" },
  { id: "reactor-grid-repair", skillId: "engineering", name: "Reactor Grid Repair", level: 42, seconds: 18, xp: 142, description: "Rebalance damaged power relays for a major cruiser recovery.", consumes: { plating: 5, circuits: 6, powerCell: 3 }, produces: {}, sectors: ["orpheus", "silent"], collectionId: "blueprint-reactor-repair" },
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

  { id: "nickel-asteroid", skillId: "mining", name: "Nickel-Iron Asteroid", level: 3, seconds: 4, xp: 13, description: "Break down a dense metallic asteroid for mixed industrial ore.", produces: { ferrite: 4, cobalt: 1 } },
  { id: "helix-crystal", skillId: "mining", name: "Helix Crystal Shelf", level: 8, seconds: 6, xp: 24, description: "Extract conductive crystals beneath the quarantine debris.", produces: { cobalt: 3, data: 1 }, sectors: ["helix", "orpheus", "silent"] },
  { id: "rift-iridium", skillId: "mining", name: "Rift Iridium Deposit", level: 20, seconds: 12, xp: 58, description: "Stabilise and mine ore warped by the Orpheus fracture.", produces: { iridium: 4, cobalt: 3 }, sectors: ["orpheus", "silent"] },

  { id: "lifeboat-recovery", skillId: "salvage", name: "Abandoned Lifeboat", level: 3, seconds: 5, xp: 15, description: "Recover emergency stores from an old evacuation craft.", produces: { salvage: 3, rations: 1 }, credits: 3 },
  { id: "helix-lab-wreck", skillId: "salvage", name: "Helix Laboratory Wreck", level: 9, seconds: 8, xp: 30, description: "Strip protected research hardware from a ruined laboratory.", produces: { circuits: 2, data: 2, salvage: 3 }, credits: 8, sectors: ["helix", "orpheus", "silent"] },
  { id: "sentinel-carcass", skillId: "salvage", name: "Sentinel Carcass", level: 20, seconds: 13, xp: 60, description: "Dismantle an ancient machine without reactivating its core.", produces: { plating: 3, relic: 2, circuits: 4 }, credits: 20, sectors: ["silent"] },

  { id: "protein-moss", skillId: "botany", name: "Protein Moss Beds", level: 3, seconds: 5, xp: 14, description: "Cultivate a resilient staple crop for long patrols.", consumes: { algae: 2 }, produces: { rations: 2 } },
  { id: "medicinal-lichen", skillId: "botany", name: "Medicinal Lichen", level: 8, seconds: 8, xp: 29, description: "Grow quarantine lichen rich in useful organic compounds.", consumes: { algae: 4 }, produces: { catalyst: 2, medicine: 1 }, sectors: ["helix", "orpheus", "silent"] },
  { id: "void-orchard", skillId: "botany", name: "Void Orchard", level: 20, seconds: 13, xp: 59, description: "Maintain fruiting xenoflora adapted to machine-world radiation.", consumes: { algae: 8, catalyst: 1 }, produces: { rations: 7, catalyst: 3, relic: 1 }, sectors: ["silent"] },

  { id: "circuit-refit", skillId: "engineering", name: "Circuit Refit", level: 4, seconds: 6, xp: 18, description: "Rebuild damaged control boards from stripped components.", consumes: { salvage: 4 }, produces: { circuits: 2 } },
  { id: "shield-capacitor", skillId: "engineering", name: "Shield Capacitor", level: 10, seconds: 10, xp: 36, description: "Fabricate a reserve capacitor for the cruiser deflectors.", consumes: { cobalt: 4, plating: 2, circuits: 2 }, produces: { powerCell: 2 } },
  { id: "phase-lattice", skillId: "engineering", name: "Phase Lattice", level: 20, seconds: 14, xp: 64, description: "Assemble a precision frame for Silent Systems technology.", consumes: { iridium: 3, relic: 2, circuits: 5 }, produces: { navData: 5, artefact: 1 }, sectors: ["silent"] },

  { id: "cobalt-laminate", skillId: "metallurgy", name: "Cobalt Laminate", level: 3, seconds: 6, xp: 19, description: "Press cobalt into heat-resistant structural layers.", consumes: { ferrite: 3, cobalt: 2 }, produces: { plating: 2 } },
  { id: "relic-alloy", skillId: "metallurgy", name: "Relic-Bonded Alloy", level: 20, seconds: 14, xp: 65, description: "Bond iridium around fragments of non-human material.", consumes: { iridium: 3, relic: 2 }, produces: { plating: 5, artefact: 1 }, sectors: ["silent"] },

  { id: "nutrient-gel", skillId: "biochemistry", name: "Nutrient Gel", level: 3, seconds: 6, xp: 18, description: "Concentrate algae into stable emergency nutrition.", consumes: { algae: 3 }, produces: { rations: 3 } },
  { id: "quarantine-antiviral", skillId: "biochemistry", name: "Quarantine Antiviral", level: 10, seconds: 9, xp: 35, description: "Adapt old Helix treatments to living xenopathogens.", consumes: { catalyst: 2, data: 2 }, produces: { medicine: 4 }, sectors: ["helix", "orpheus", "silent"] },
  { id: "cryogenic-enzyme", skillId: "biochemistry", name: "Cryogenic Enzyme", level: 20, seconds: 14, xp: 63, description: "Synthesize a regenerative compound stable near absolute zero.", consumes: { catalyst: 4, relic: 2 }, produces: { medicine: 8, rations: 2 }, sectors: ["silent"] },

  { id: "beacon-analysis", skillId: "science", name: "Beacon Analysis", level: 3, seconds: 6, xp: 17, description: "Decode traffic patterns from neglected navigation beacons.", produces: { data: 3, navData: 1 } },
  { id: "xenoflora-genome", skillId: "science", name: "Xenoflora Genome", level: 9, seconds: 9, xp: 34, description: "Sequence the adaptive mechanisms of Helix plant life.", consumes: { algae: 3, data: 2 }, produces: { catalyst: 2, data: 3 }, sectors: ["helix", "orpheus", "silent"] },
  { id: "sentinel-core-study", skillId: "science", name: "Sentinel Core Study", level: 20, seconds: 15, xp: 68, description: "Interrogate a dormant machine intelligence under containment.", consumes: { relic: 3, powerCell: 2 }, produces: { data: 10, artefact: 1 }, sectors: ["silent"] },

  { id: "crew-wellness", skillId: "medicine", name: "Crew Wellness Round", level: 3, seconds: 6, xp: 17, description: "Run preventative checks across the ten-person crew.", consumes: { rations: 1 }, produces: {} },
  { id: "trauma-surgery", skillId: "medicine", name: "Trauma Surgery Drill", level: 5, seconds: 7, xp: 24, description: "Practise stabilising severe boarding-action injuries.", consumes: { medicine: 2 }, produces: {} },
  { id: "quarantine-inoculation", skillId: "medicine", name: "Quarantine Inoculation", level: 11, seconds: 10, xp: 39, description: "Protect the crew against Helix biological hazards.", consumes: { medicine: 3, catalyst: 1 }, produces: {}, sectors: ["helix", "orpheus", "silent"] },
  { id: "stasis-revival", skillId: "medicine", name: "Stasis Revival Protocol", level: 20, seconds: 14, xp: 64, description: "Rehearse revival procedures using recovered machine medicine.", consumes: { medicine: 5, relic: 1 }, produces: {}, sectors: ["silent"] },

  { id: "silent-dreadnought", skillId: "combat", name: "Silent Dreadnought", level: 22, seconds: 21, xp: 92, description: "Break the layered defences of a machine command vessel.", consumes: { rations: 3, powerCell: 2 }, produces: { relic: 4, plating: 3 }, credits: 85, damage: 38, sectors: ["silent"], enemy: { hull: 260, shields: 90, armor: 42, evasion: 12, class: "Dreadnought", weakness: "railgun", rareEvery: 30, rareDrop: { artefact: 2, missiles: 8 } }, collectionId: "enemy-dreadnought" },

  { id: "shipping-lanes", skillId: "astrogation", name: "Shipping Lane Survey", level: 3, seconds: 6, xp: 18, description: "Optimise safe commercial routes around Erebus traffic.", produces: { navData: 3 }, credits: 5 },
  { id: "quarantine-route", skillId: "astrogation", name: "Quarantine Route", level: 6, seconds: 8, xp: 27, description: "Chart a path through the Helix exclusion perimeter.", consumes: { data: 2 }, produces: { navData: 4 }, sectors: ["helix", "orpheus", "silent"] },
  { id: "corsair-lanes", skillId: "astrogation", name: "Corsair Smuggling Lanes", level: 12, seconds: 11, xp: 43, description: "Map hidden routes through raider-controlled space.", consumes: { data: 3 }, produces: { navData: 6 }, credits: 14, sectors: ["cinder", "orpheus", "silent"] },
  { id: "silent-gate-vector", skillId: "astrogation", name: "Silent Gate Vector", level: 20, seconds: 15, xp: 67, description: "Calculate a repeatable approach to a dormant machine gate.", consumes: { data: 5, relic: 2 }, produces: { navData: 10 }, sectors: ["silent"] },

  { id: "salvage-swarm", skillId: "drones", name: "Salvage Swarm", level: 4, seconds: 6, xp: 19, description: "Coordinate cutters across a fragmented debris field.", consumes: { droneParts: 1 }, produces: { salvage: 6 } },
  { id: "cargo-swarm", skillId: "drones", name: "Cargo Relay Swarm", level: 8, seconds: 9, xp: 32, description: "Move supplies between the cruiser and a remote station.", consumes: { powerCell: 1 }, produces: { salvage: 3, circuits: 2 }, credits: 10 },
  { id: "interceptor-swarm", skillId: "drones", name: "Interceptor Screen", level: 12, seconds: 11, xp: 44, description: "Run autonomous defensive formations around the cruiser.", consumes: { droneParts: 2, powerCell: 1 }, produces: { missiles: 2 }, sectors: ["cinder", "orpheus", "silent"] },
  { id: "autonomous-fleet", skillId: "drones", name: "Autonomous Fleet", level: 20, seconds: 15, xp: 68, description: "Coordinate independent drone wings through machine space.", consumes: { droneParts: 3, powerCell: 2 }, produces: { data: 6, relic: 2, salvage: 5 }, sectors: ["silent"] },

  { id: "medical-supply-run", skillId: "logistics", name: "Medical Supply Run", level: 3, seconds: 6, xp: 17, description: "Deliver urgent medical stores across Erebus Station.", consumes: { medicine: 1 }, produces: {}, credits: 12 },
  { id: "ore-freight", skillId: "logistics", name: "Ore Freight Contract", level: 5, seconds: 7, xp: 23, description: "Consolidate refinery ore into a profitable shipment.", consumes: { ferrite: 8 }, produces: { plating: 1 }, credits: 15 },
  { id: "blockade-run", skillId: "logistics", name: "Cinder Blockade Run", level: 12, seconds: 11, xp: 43, description: "Move supplies through a shifting corsair interdiction line.", consumes: { rations: 2, fuelRod: 1 }, produces: { circuits: 4 }, credits: 42, sectors: ["cinder", "orpheus", "silent"] },
  { id: "machine-relay-supply", skillId: "logistics", name: "Machine Relay Supply", level: 20, seconds: 15, xp: 66, description: "Maintain an isolated forward relay inside the Silent Systems.", consumes: { rations: 3, fuelRod: 1, medicine: 1 }, produces: { data: 5, relic: 1 }, credits: 65, sectors: ["silent"] },

  { id: "prospector-charter", skillId: "diplomacy", name: "Prospector Charter", level: 3, seconds: 7, xp: 18, description: "Negotiate shared extraction rights in the Erebus Belt.", consumes: { ferrite: 3 }, produces: {}, credits: 14 },
  { id: "helix-arbitration", skillId: "diplomacy", name: "Helix Arbitration", level: 6, seconds: 9, xp: 28, description: "Mediate access between researchers and quarantine crews.", consumes: { data: 2 }, produces: { medicine: 1 }, credits: 20, sectors: ["helix"] },
  { id: "frontier-treaty", skillId: "diplomacy", name: "Frontier Defence Treaty", level: 12, seconds: 12, xp: 45, description: "Coordinate a mutual-defence compact against corsair raids.", consumes: { rations: 2, data: 3 }, produces: { navData: 3 }, credits: 38, sectors: ["cinder", "orpheus"] },
  { id: "machine-translation", skillId: "diplomacy", name: "Machine Translation", level: 20, seconds: 16, xp: 70, description: "Attempt structured communication with a Sentinel chorus.", consumes: { data: 6, relic: 2 }, produces: { artefact: 1 }, credits: 60, sectors: ["silent"] },

  { id: "derelict-archive", skillId: "archaeology", name: "Derelict Archive", level: 4, seconds: 7, xp: 21, description: "Reconstruct civilian records from a damaged memory core.", consumes: { data: 2 }, produces: { relic: 2 } },
  { id: "helix-strata", skillId: "archaeology", name: "Helix Laboratory Strata", level: 7, seconds: 9, xp: 31, description: "Separate layers of experiments performed across decades.", consumes: { data: 3 }, produces: { relic: 2, catalyst: 1 }, sectors: ["helix", "orpheus", "silent"] },
  { id: "corsair-reliquary", skillId: "archaeology", name: "Corsair Reliquary", level: 13, seconds: 12, xp: 47, description: "Catalogue stolen relics accumulated by a raider dynasty.", consumes: { relic: 2, data: 2 }, produces: { artefact: 1 }, sectors: ["cinder", "silent"] },
  { id: "sentinel-city", skillId: "archaeology", name: "Sentinel City Survey", level: 20, seconds: 16, xp: 72, description: "Map the cultural layers beneath an active machine metropolis.", consumes: { relic: 4, powerCell: 2 }, produces: { artefact: 2, data: 6 }, sectors: ["silent"] },
];

export const activities: Activity[] = [...coreActivities, ...combatActivities, ...advancedActivities, ...bossActivities];

export const sectors = [
  { id: "erebus", name: "Erebus Belt", level: 1, fuel: 0, tone: "Industrial frontier", description: "Safe shipping lanes, training rocks and crowded salvage fields." },
  { id: "helix", name: "Helix Reach", level: 10, fuel: 1, tone: "Research quarantine", description: "Abandoned laboratories and rapidly adapting xenoflora." },
  { id: "cinder", name: "Cinder Expanse", level: 24, fuel: 2, tone: "Corsair territory", description: "Profitable wrecks guarded by organised raider fleets." },
  { id: "orpheus", name: "Orpheus Rift", level: 42, fuel: 3, tone: "Gravitational fracture", description: "Rare minerals, time distortion and unstable routes." },
  { id: "silent", name: "The Silent Systems", level: 70, fuel: 5, tone: "Machine domain", description: "Endgame ruins protected by ancient autonomous sentinels." },
];

export const shipModules: Record<ShipModuleId, { name: string; description: string; effect: (level: number) => string }> = {
  bridge: { name: "Bridge", description: "Deck 1 command bridge with helm, tactical and patrol-control stations.", effect: (level) => `+${level} Astrogation, Logistics and Diplomacy output.` },
  cic: { name: "Combat Information Centre", description: "Deck 1 tactical centre coordinating sensors, weapons and drone swarms.", effect: (level) => `+${level} combat accuracy and -${level} incoming combat damage.` },
  cargo: { name: "Cargo Bay", description: "Deck 3 modular 200-ton hold with magnetic restraints, lift and vehicle access.", effect: (level) => `+${level * 2}% station sale value.` },
  hydroponics: { name: "Hydroponics", description: "Deck 2 life-support gardens supplying fresh food, herbs and atmosphere support.", effect: (level) => `+${level} Xenobotany and Biochemistry output.` },
  fabricator: { name: "Fabrication Deck", description: "Deck 4 machine shop for component manufacture, field repairs and refits.", effect: (level) => `+${level} Engineering, Metallurgy and Drones output.` },
  lab: { name: "Science Laboratory", description: "Deck 3 analysis lab for samples, anomalies, archaeology and research work.", effect: (level) => `+${level} Science and Archaeology output.` },
  medbay: { name: "Medical Bay", description: "Deck 3 auto-doc, trauma bay and isolation space for the ten-person crew.", effect: (level) => `+${level} Medicine output and +${level} morale restored per Medicine action.` },
  reactor: { name: "Antimatter Reactor", description: "Deck 4 power plant feeding propulsion, shields and every ship system.", effect: (level) => `Upgrade adds 10 maximum hull; current hull capacity is ${100 + Math.max(0, level - 1) * 10}.` },
  hangar: { name: "Vehicle & Drone Bay", description: "Deck 3 storage and launch support for two rovers and the ship's drone swarms.", effect: (level) => `+${level} Drones output.` },
};

export const crew = [
  { id: "mara", name: "Mara Venn", role: "Captain", trait: "Steady Hand", specialties: ["astrogation", "diplomacy"] as SkillId[], bio: "A former convoy commander who keeps a cold bridge and a warmer crew.", perk: "Command instinct: +1 output in Astrogation or Diplomacy." },
  { id: "jonas", name: "Jonas Rhee", role: "Chief Engineer", trait: "Improviser", specialties: ["engineering", "metallurgy"] as SkillId[], bio: "He can rebuild a failed coil from a cargo latch and a bad idea.", perk: "Fabricator’s eye: +1 output in Engineering or Metallurgy." },
  { id: "priya", name: "Priya Nadir", role: "Science Officer", trait: "Pattern Seeker", specialties: ["science", "archaeology"] as SkillId[], bio: "Priya reads dead signals as if they were unfinished conversations.", perk: "Signal literacy: +1 output in Science or Archaeology." },
  { id: "okafor", name: "Dr Okafor", role: "Medical Officer", trait: "Calm Under Fire", specialties: ["medicine", "biochemistry"] as SkillId[], bio: "A field surgeon who treats every emergency as a solvable equation.", perk: "Clinical discipline: +1 output in Medicine or Biochemistry." },
  { id: "sol", name: "Sol Mercer", role: "Tactical Officer", trait: "Deadeye", specialties: ["combat"] as SkillId[], bio: "Sol studies engagement footage until every escape vector becomes familiar.", perk: "Target lock: +1 Combat output." },
  { id: "mei", name: "Mei Navarro", role: "Xenobotanist", trait: "Green Thumb", specialties: ["botany", "biochemistry"] as SkillId[], bio: "Mei keeps a forbidden seed archive behind the hydroponics bulkhead.", perk: "Closed-loop cultivation: +1 output in Xenobotany or Biochemistry." },
  { id: "rook", name: "Rook-7", role: "Drone Controller", trait: "Parallel Mind", specialties: ["drones", "mining"] as SkillId[], bio: "An ex-industrial control unit learning to enjoy the sound of a living crew.", perk: "Swarm intuition: +1 output in Drone Command or Mining." },
  { id: "elias", name: "Elias Ward", role: "Quartermaster", trait: "Nothing Wasted", specialties: ["logistics", "diplomacy"] as SkillId[], bio: "Elias knows every crate, favour and spare ration on the cruiser by memory.", perk: "Supply sense: +1 output in Logistics or Diplomacy." },
  { id: "vega", name: "Vega Holt", role: "Salvage Lead", trait: "Voidwalker", specialties: ["salvage", "mining"] as SkillId[], bio: "Vega is happiest outside the hull with a cutter and a very short tether.", perk: "Wreck sense: +1 output in Salvage or Mining." },
  { id: "anya", name: "Anya Sato", role: "Archaeologist", trait: "Old Languages", specialties: ["archaeology", "science"] as SkillId[], bio: "Anya can identify a civilisation from a hinge, a glyph or a burial pattern.", perk: "Contextual recall: +1 output in Archaeology or Science." },
];

export const droneSpecs: Record<DroneId, { name: string; description: string; effect: (count: number) => string; cost: Record<string, number> }> = {
  mining: { name: "Mining Drone", description: "Autonomous ore-cutting support for mining crews.", effect: (count) => `+${count} Mining output.`, cost: { droneParts: 3, powerCell: 1 } },
  salvage: { name: "Salvage Drone", description: "Retrieves intact components from unstable wreckage.", effect: (count) => `+${count} Salvage output.`, cost: { droneParts: 3, circuits: 2 } },
  survey: { name: "Survey Probe", description: "Maps anomalies and samples distant sites ahead of the crew.", effect: (count) => `+${count} Science and Archaeology output.`, cost: { droneParts: 2, data: 4 } },
  combat: { name: "Combat Drone", description: "Interposes defensive fire during hostile vessel actions.", effect: (count) => `-${count * 2} incoming combat damage and +${count} combat accuracy.`, cost: { droneParts: 4, plating: 2, powerCell: 1 } },
  cargo: { name: "Cargo Loader", description: "Automates secure loading, sorting and cargo transfer.", effect: (count) => `+${count} Logistics output.`, cost: { droneParts: 3, plating: 2 } },
};

export const vehicleSpecs: Record<VehicleId, { name: string; description: string; effect: (count: number) => string; cost: Record<string, number> }> = {
  rover: { name: "Planetary Rover", description: "Carries a survey team across hostile planetary surfaces and unlocks rover expeditions.", effect: (count) => `+${count} Mining and Salvage output.`, cost: { plating: 6, circuits: 5, powerCell: 2 } },
  boardingShuttle: { name: "Boarding Shuttle", description: "Transfers crew safely to derelicts, stations and alien structures and unlocks boarding expeditions.", effect: (count) => `+${count} Archaeology and Diplomacy output.`, cost: { plating: 10, circuits: 8, powerCell: 4 } },
};

export const equipmentSpecs: Record<EquipmentId, { name: string; description: string; effect: (level: number) => string }> = {
  cutter: { name: "Plasma Cutter", description: "Heavy plasma tooling for extraction and cutting work.", effect: (level) => `+${Math.max(0, level - 1)} Mining and Salvage output from upgrades.` },
  exosuit: { name: "Boarding Rig", description: "Armoured work suit used during dangerous shipboard actions.", effect: (level) => `-${level} incoming combat damage.` },
  scanner: { name: "Survey Array", description: "Long-range sensors tuned for samples, anomalies and ruins.", effect: (level) => `+${Math.max(0, level - 1)} Science, Xenobotany and Archaeology output from upgrades.` },
  railgun: { name: "Coil Railgun", description: "Primary kinetic weapon with a progressively faster cycling system.", effect: (level) => `+${level * 2} combat accuracy, +${level} combat credits, and ${Math.max(0, level - 1) * 2.5}% faster encounters.` },
  shield: { name: "Deflector Grid", description: "Directional energy shielding for sustained hostile actions.", effect: (level) => `-${level * 2} incoming combat damage and ${40 + level * 10} maximum shields after repair.` },
};

export const researchNodes: { id: string; name: string; description: string; cost: Record<string, number>; requires: string[] }[] = [
  { id: "efficient-cycles", name: "Efficient Cycles", description: "All actions complete 5% faster.", cost: { data: 12 }, requires: [] },
  { id: "autonomous-repair", name: "Autonomous Repair", description: "Engineering actions restore additional hull.", cost: { data: 18, circuits: 3 }, requires: ["efficient-cycles"] },
  { id: "xeno-adaptation", name: "Xeno Adaptation", description: "Xenobotany and biochemistry gain bonus output.", cost: { data: 22, catalyst: 2 }, requires: ["efficient-cycles"] },
  { id: "phase-mapping", name: "Phase Mapping", description: "Travel costs one fewer Fuel Rod.", cost: { data: 30, relic: 3 }, requires: ["autonomous-repair"] },
  { id: "sentinel-protocol", name: "Sentinel Protocol", description: "Ancient enemies deal 20% less damage.", cost: { data: 45, artefact: 1 }, requires: ["phase-mapping", "xeno-adaptation"] },
  { id: "titanium-printing", name: "Titanium Printing", description: "Industrial power produces one extra manufactured item.", cost: { data: 70, titanium: 15 }, requires: ["autonomous-repair"] },
  { id: "neural-cultures", name: "Neural Cultures", description: "Crew gain experience 25% faster.", cost: { data: 90, neuralGel: 8 }, requires: ["xeno-adaptation"] },
  { id: "quantum-logistics", name: "Quantum Logistics", description: "Production queues hold eight operations.", cost: { voidData: 30, quantumCircuit: 10 }, requires: ["phase-mapping"] },
  { id: "boss-analysis", name: "Boss Analysis", description: "Sector bosses deal 15% less damage.", cost: { voidData: 45, ancientCore: 2 }, requires: ["sentinel-protocol"] },
  { id: "outpost-network", name: "Outpost Network", description: "Outpost bonuses apply throughout their sector.", cost: { quantumCircuit: 18, titaniumPlate: 10 }, requires: ["titanium-printing"] },
  { id: "singularity-theory", name: "Singularity Theory", description: "Unlock the highest tier of specialist operations.", cost: { voidData: 80, quantumDust: 30, ancientCore: 5 }, requires: ["boss-analysis", "outpost-network"] },
  { id: "starfall-doctrine", name: "Starfall Doctrine", description: "Command Points improve all output by one per five points.", cost: { singularityCore: 2, commandToken: 1 }, requires: ["singularity-theory"] },
  { id: "recovery-protocols", name: "Recovery Protocols", description: "Medicine and Biochemistry actions complete 8% faster.", cost: { data: 36, medicine: 6 }, requires: ["xeno-adaptation"] },
  { id: "broker-network", name: "Broker Network", description: "Faction contracts award 25% more reputation.", cost: { data: 38, navData: 6 }, requires: ["phase-mapping"] },
  { id: "data-vaults", name: "Data Vaults", description: "Science and Archaeology operations gain +1 output.", cost: { relic: 6, circuits: 8 }, requires: ["sentinel-protocol"] },
  { id: "mission-beacon", name: "Mission Beacon", description: "Mission credit rewards increase by 20%.", cost: { voidData: 20, commandToken: 1 }, requires: ["quantum-logistics"] },
];

export const contracts: { id: string; faction: string; name: string; description: string; cost: Record<string, number>; reward: { credits: number; reputation: number } }[] = [
  { id: "ore-quota", faction: "prospectors", name: "Prospector Ore Quota", description: "Deliver 30 Ferrite Ore.", cost: { ferrite: 30 }, reward: { credits: 110, reputation: 6 } },
  { id: "station-relief", faction: "frontier", name: "Station Relief", description: "Deliver food and medicine to Kestrel Station.", cost: { rations: 8, medicine: 3 }, reward: { credits: 160, reputation: 8 } },
  { id: "research-cache", faction: "institute", name: "Research Cache", description: "Supply decoded signal material.", cost: { data: 15, relic: 2 }, reward: { credits: 220, reputation: 9 } },
  { id: "patrol-refit", faction: "patrol", name: "Patrol Refit", description: "Supply structural materials to a damaged cutter.", cost: { plating: 6, circuits: 4 }, reward: { credits: 260, reputation: 10 } },
  { id: "quiet-passage", faction: "corsairs", name: "Quiet Passage", description: "Trade valuable salvage for intelligence.", cost: { salvage: 25, relic: 2 }, reward: { credits: 300, reputation: 7 } },
  { id: "rift-convoy", faction: "frontier", name: "Rift Convoy", description: "Prepare a long-range convoy package.", cost: { fuelRod: 3, rations: 10, medicine: 4 }, reward: { credits: 420, reputation: 12 } },
  { id: "helix-sanitation", faction: "institute", name: "Helix Sanitation Run", description: "Supply a sealed research ward.", cost: { medicine: 6, catalyst: 3, rations: 6 }, reward: { credits: 360, reputation: 11 } },
  { id: "ore-survey", faction: "prospectors", name: "Deep Ore Survey", description: "Deliver a mixed ore analysis package.", cost: { cobalt: 18, iridium: 6, data: 8 }, reward: { credits: 430, reputation: 13 } },
  { id: "patrol-ammunition", faction: "patrol", name: "Patrol Ammunition Reserve", description: "Resupply a listening post under pressure.", cost: { missiles: 12, powerCell: 4, plating: 5 }, reward: { credits: 520, reputation: 14 } },
  { id: "corsair-manifest", faction: "corsairs", name: "Corsair Manifest", description: "Trade recovered artefacts for a verified route manifest.", cost: { relic: 8, artefact: 1, salvage: 30 }, reward: { credits: 610, reputation: 12 } },
  { id: "silent-relay", faction: "frontier", name: "Silent Relay Lifeline", description: "Keep a remote relay supplied in machine territory.", cost: { fuelRod: 5, circuits: 10, medicine: 6 }, reward: { credits: 760, reputation: 16 } },
  { id: "institute-specimens", faction: "institute", name: "Institute Specimen Vault", description: "Deliver stabilised xenological samples.", cost: { catalyst: 8, neuralGel: 3, data: 20 }, reward: { credits: 820, reputation: 17 } },
  { id: "erebus-rescue", faction: "patrol", name: "Erebus Rescue Stores", description: "Stock a patrol tender preparing for emergency departures.", cost: { rations: 14, medicine: 5, fuelRod: 2 }, reward: { credits: 340, reputation: 11 } },
  { id: "helix-cold-chain", faction: "institute", name: "Helix Cold Chain", description: "Deliver sterile storage materials to the quarantine research teams.", cost: { medicine: 8, data: 12, powerCell: 3 }, reward: { credits: 490, reputation: 13 } },
  { id: "cinder-hullwork", faction: "frontier", name: "Cinder Hullwork", description: "Provide plating and coils for a civilian convoy's emergency repair.", cost: { plating: 12, circuits: 9, salvage: 20 }, reward: { credits: 570, reputation: 14 } },
  { id: "rift-instruments", faction: "prospectors", name: "Rift Instrument Package", description: "Supply precision instruments for a risky mineral assay.", cost: { iridium: 10, data: 14, powerCell: 4 }, reward: { credits: 680, reputation: 15 } },
  { id: "silent-shielding", faction: "patrol", name: "Silent Shielding Reserve", description: "Equip a patrol relay against machine interference.", cost: { cobalt: 24, plating: 14, powerCell: 6 }, reward: { credits: 880, reputation: 18 } },
  { id: "corsair-salvage-ledger", faction: "corsairs", name: "Corsair Salvage Ledger", description: "Trade a carefully documented cache of recovered ship components.", cost: { salvage: 40, circuits: 14, relic: 5 }, reward: { credits: 940, reputation: 16 } },
];

export const expeditions: { id: string; name: string; minutes: number; level: number; description: string; cost: Record<string, number>; reward: Record<string, number>; collection: string; skill: SkillId; xp: number; vehicle?: VehicleId }[] = [
  { id: "colony-ship", name: "Board the Colony Ship", minutes: 2, level: 8, description: "Search an unpowered habitat ring.", cost: { rations: 2, medicine: 1 }, reward: { salvage: 12, data: 5 }, collection: "expedition-colony", skill: "salvage", xp: 160 },
  { id: "erebus-debris", name: "Map the Debris Wake", minutes: 3, level: 12, description: "Trace a dangerous drift corridor through the Erebus patrol route.", cost: { rations: 3, data: 3 }, reward: { navData: 6, salvage: 8 }, collection: "expedition-debris", skill: "astrogation", xp: 220 },
  { id: "uncharted-moon", name: "Survey the Uncharted Moon", minutes: 4, level: 18, description: "Deploy a rover beyond beacon range.", cost: { fuelRod: 1, rations: 4 }, reward: { cobalt: 8, catalyst: 3 }, collection: "expedition-moon", skill: "mining", xp: 300, vehicle: "rover" },
  { id: "helix-quarantine", name: "Quarantine Field Study", minutes: 5, level: 26, description: "Observe a Helix bloom without disturbing its containment field.", cost: { medicine: 3, data: 6 }, reward: { catalyst: 6, neuralGel: 2 }, collection: "expedition-quarantine", skill: "medicine", xp: 420, vehicle: "rover" },
  { id: "alien-structure", name: "Enter the Alien Structure", minutes: 7, level: 38, description: "Take a multidisciplinary team below the surface.", cost: { powerCell: 2, medicine: 3, data: 8 }, reward: { relic: 8, artefact: 1 }, collection: "expedition-structure", skill: "archaeology", xp: 650, vehicle: "boardingShuttle" },
  { id: "cinder-distress", name: "Cinder Distress Run", minutes: 8, level: 48, description: "Reach a stranded civilian crew before the Expanse takes their ship.", cost: { rations: 6, medicine: 4, fuelRod: 2 }, reward: { credits: 260, plating: 5 }, collection: "expedition-distress", skill: "diplomacy", xp: 780, vehicle: "boardingShuttle" },
  { id: "jump-gate", name: "Repair the Broken Gate", minutes: 10, level: 60, description: "Restore a pre-collapse transit gate.", cost: { plating: 8, circuits: 8, fuelRod: 3 }, reward: { artefact: 3, navData: 15 }, collection: "expedition-gate", skill: "engineering", xp: 1000, vehicle: "boardingShuttle" },
  { id: "rift-probe", name: "Recover the Rift Probe", minutes: 12, level: 95, description: "Recover a lost science probe from unstable Orpheus spacetime.", cost: { powerCell: 4, data: 16, phaseCrystal: 2 }, reward: { voidData: 10, quantumDust: 4 }, collection: "expedition-probe", skill: "science", xp: 1400, vehicle: "boardingShuttle" },
  { id: "phase-storm", name: "Cross the Phase Storm", minutes: 14, level: 180, description: "Escort a science team through a repeating spatial front.", cost: { fuelRod: 4, medicine: 5, phaseCrystal: 3 }, reward: { voidData: 12, quantumDust: 8 }, collection: "expedition-storm", skill: "astrogation", xp: 2000, vehicle: "boardingShuttle" },
  { id: "bioship-remains", name: "Enter the Bio-Ship", minutes: 18, level: 320, description: "Recover living technology after a successful containment battle.", cost: { medicine: 8, neuralGel: 4, powerCell: 5 }, reward: { xenoFiber: 18, genesisCompound: 4 }, collection: "expedition-bioship", skill: "biochemistry", xp: 3000, vehicle: "boardingShuttle" },
  { id: "silent-archive", name: "Decode the Silent Archive", minutes: 21, level: 460, description: "Interpret an isolated machine archive before its defence routine wakes.", cost: { data: 30, relic: 12, medicine: 8 }, reward: { ancientCore: 3, quantumCircuit: 10 }, collection: "expedition-archive", skill: "archaeology", xp: 4200, vehicle: "boardingShuttle" },
  { id: "sentinel-foundry", name: "Raid the Foundry Interior", minutes: 24, level: 600, description: "Send a boarding team into an active machine production line.", cost: { neutroniumPlate: 3, medicine: 10, missiles: 15 }, reward: { ancientCore: 6, quantumParts: 15 }, collection: "expedition-foundry", skill: "combat", xp: 6000, vehicle: "boardingShuttle" },
  { id: "machine-core", name: "Descend into the Machine Core", minutes: 35, level: 1000, description: "Reach the intelligence chamber beneath the Silent Systems.", cost: { singularityCore: 1, genesisCompound: 5, fuelRod: 10 }, reward: { commandToken: 1, voidData: 50 }, collection: "expedition-core", skill: "science", xp: 10000, vehicle: "boardingShuttle" },
];

export type StoryEvent = { title: string; purpose: string; text: string; choices: { id: string; label: string; result: string; reward: Record<string, number>; morale: number; faction?: { id: string; reputation: number }; commandPoints?: number; xp?: { skill: SkillId; amount: number } }[] };

export const storyEvents: Record<string, StoryEvent> = {
  escapePod: {
    title: "The Unclaimed Escape Pod",
    purpose: "Choose between navigation progress and Patrol reputation.",
    text: "A sealed pod broadcasts a century-old distress code. Its life signs are impossible.",
    choices: [
      { id: "open", label: "Bring it aboard", result: "The pod contained an intact navigation core.", reward: { navData: 8, data: 3 }, morale: -4 },
      { id: "report", label: "Report it to Patrol", result: "Patrol Command records your restraint.", reward: { credits: 90 }, morale: 3, faction: { id: "patrol", reputation: 4 } },
    ],
  },
  cargoNoise: {
    title: "Movement in the Cargo Hold",
    purpose: "Choose a practical salvage gain or preserve crew morale.",
    text: "Something is moving behind a sealed salvage container.",
    choices: [
      { id: "investigate", label: "Send the salvage team", result: "A maintenance drone reactivates and joins the ship.", reward: { droneParts: 5, circuits: 2 }, morale: 2 },
      { id: "vent", label: "Vent the container", result: "The threat is gone, along with some salvage.", reward: { salvage: -5, medicine: 2 }, morale: -2 },
    ],
  },
  frontierSignal: {
    title: "Frontier Relay Signal",
    purpose: "Choose a faction relationship or a direct economic reward.",
    text: "An Erebus relay asks for a quiet escort. The contract is poorly funded but the signal is genuine.",
    choices: [
      { id: "escort", label: "Escort the relay tender", result: "The Frontier Compact marks the cruiser as dependable.", reward: { credits: 45, rations: 2 }, morale: 2, faction: { id: "frontier", reputation: 5 } },
      { id: "sell", label: "Sell the route data", result: "Prospectors pay for the location before anyone else arrives.", reward: { credits: 150 }, morale: -1, faction: { id: "prospectors", reputation: 2 } },
    ],
  },
  researchBreach: {
    title: "Quarantine Sample Breach",
    purpose: "Choose between a research material and a safer medical response.",
    text: "A Helix specimen has breached its thermal cradle. It may be valuable, but it is not inert.",
    choices: [
      { id: "study", label: "Contain and study it", result: "The laboratory records a rare adaptive sequence.", reward: { catalyst: 4, data: 6 }, morale: -3, faction: { id: "institute", reputation: 4 } },
      { id: "stabilise", label: "Stabilise the crew", result: "The crew completes the response drill without exposure.", reward: { medicine: 5 }, morale: 5 },
    ],
  },
  corsairCipher: {
    title: "Corsair Cipher",
    purpose: "Choose a combat supply cache or an intelligence connection.",
    text: "A weak corsair transmission repeats from an abandoned buoy. Its encryption is deliberately incomplete.",
    choices: [
      { id: "crack", label: "Crack the cipher", result: "The partial manifest opens a quiet line to the Cinder Corsairs.", reward: { data: 8 }, morale: -1, faction: { id: "corsairs", reputation: 5 } },
      { id: "ambush", label: "Prepare an ambush", result: "The buoy was bait, but the cruiser recovers its ammunition cache.", reward: { missiles: 6, powerCell: 2 }, morale: 1 },
    ],
  },
  veteranCeremony: {
    title: "Veteran Crew Ceremony",
    purpose: "Convert crew morale into a lasting commission benefit or immediate operational supplies.",
    text: "The crew asks for a brief ceremony after another long patrol milestone. The bridge has time for one meaningful gesture.",
    choices: [
      { id: "commend", label: "Issue commendations", result: "The crew records the commission as one worth remembering.", reward: { credits: 60 }, morale: 8, commandPoints: 1 },
      { id: "train", label: "Run a tactical drill", result: "The crew turns the occasion into a focused readiness exercise.", reward: { missiles: 4, medicine: 3 }, morale: 3 },
    ],
  },
  gravityWake: {
    title: "Unstable Gravity Wake",
    purpose: "Turn a navigation hazard into Astrogation or Engineering experience.",
    text: "A short-lived gravity wake is pulling loose hardware across the cruiser’s intended route.",
    choices: [
      { id: "thread", label: "Thread the wake", result: "The bridge records a clean traversal solution.", reward: { navData: 5 }, morale: 1, xp: { skill: "astrogation", amount: 180 } },
      { id: "brace", label: "Brace the cruiser", result: "Engineering turns the wake into a live stress-test of the ship’s systems.", reward: { plating: 2, circuits: 2 }, morale: 0, xp: { skill: "engineering", amount: 180 } },
    ],
  },
  roverTransmission: {
    title: "Rover Transmission",
    purpose: "Choose useful field data or practical mining experience.",
    text: "One of the stored rovers receives a narrow-band transmission from an old survey cache.",
    choices: [
      { id: "survey", label: "Run a remote survey", result: "The rover reconstructs a useful geological profile.", reward: { data: 6, cobalt: 3 }, morale: 1, xp: { skill: "science", amount: 170 } },
      { id: "drill", label: "Follow the mineral trace", result: "The cache leads the rover to a dense ore seam.", reward: { ferrite: 10 }, morale: 0, xp: { skill: "mining", amount: 170 } },
    ],
  },
  crewDebate: {
    title: "Mess Hall Debate",
    purpose: "Settle a crew dispute with Diplomacy or deepen a research lead.",
    text: "A debate over an Institute transmission has divided the mess hall into two stubborn camps.",
    choices: [
      { id: "mediate", label: "Mediate the discussion", result: "The crew leaves with a clear decision and renewed trust in command.", reward: { credits: 45 }, morale: 5, xp: { skill: "diplomacy", amount: 160 } },
      { id: "investigate", label: "Check the transmission", result: "The argument was caused by an unusual pattern hidden in the signal.", reward: { data: 7 }, morale: -1, xp: { skill: "science", amount: 160 } },
    ],
  },
  derelictBeacon: {
    title: "Derelict Beacon",
    purpose: "Recover salvage or train the crew in cautious archaeology.",
    text: "A derelict beacon pings a protocol that predates every known sector authority.",
    choices: [
      { id: "strip", label: "Strip the beacon", result: "The beacon’s casing yields intact components.", reward: { salvage: 9, circuits: 3 }, morale: 0, xp: { skill: "salvage", amount: 190 } },
      { id: "document", label: "Document the markings", result: "The markings reveal an otherwise lost patrol route designation.", reward: { relic: 2, navData: 3 }, morale: 1, xp: { skill: "archaeology", amount: 190 } },
    ],
  },
  hydroponicBloom: {
    title: "Hydroponic Bloom",
    purpose: "Use a surprise crop for Xenobotany or Biochemistry experience.",
    text: "A sealed grow tray has produced an unfamiliar, rapidly adapting vine overnight.",
    choices: [
      { id: "cultivate", label: "Cultivate the bloom", result: "The hydroponics deck adapts the growth medium without losing the crop.", reward: { rations: 6, catalyst: 2 }, morale: 2, xp: { skill: "botany", amount: 175 } },
      { id: "sample", label: "Take a sample", result: "Biochemistry isolates a useful catalyst from the vine’s defence response.", reward: { medicine: 3, catalyst: 3 }, morale: -1, xp: { skill: "biochemistry", amount: 175 } },
    ],
  },
  droneGhost: {
    title: "Drone Ghost Signal",
    purpose: "Improve drone control or prepare for a hostile encounter.",
    text: "The CIC detects an apparently empty drone swarm matching the Aethelgard’s own control language.",
    choices: [
      { id: "sync", label: "Synchronise with it", result: "The controller extracts a cleaner swarm-routing model.", reward: { droneParts: 4, data: 4 }, morale: 1, xp: { skill: "drones", amount: 200 } },
      { id: "drill", label: "Run a defence drill", result: "Fire control rehearses the response without giving the signal a way in.", reward: { missiles: 3 }, morale: 0, xp: { skill: "combat", amount: 200 } },
    ],
  },
} as const;

export const collectionEntries = [
  ["ore-ferrite", "Ferrite Sample", "Resources"], ["ore-cobalt", "Cobalt Crystal", "Resources"], ["ore-iridium", "Iridium Core", "Resources"],
  ["alloy-missile", "Guidance Warhead", "Resources"],
  ["wreck-courier", "Courier Wreck", "Derelicts"], ["wreck-relay", "Silent Relay", "Derelicts"], ["wreck-dreadnought", "Lost Dreadnought", "Derelicts"],
  ["flora-algae", "Vacuum Algae", "Xenoflora"], ["flora-kelp", "Helix Kelp", "Xenoflora"], ["flora-spore", "Singing Spore", "Xenoflora"],
  ["enemy-scavenger", "Scavenger Drone", "Hostiles"], ["enemy-automata", "Helix Automata", "Hostiles"], ["enemy-corsair", "Corsair Skiff", "Hostiles"], ["enemy-frigate", "Corsair Frigate", "Hostiles"], ["enemy-sentinel", "Void Sentinel", "Hostiles"], ["enemy-dreadnought", "Silent Dreadnought", "Hostiles"],
  ["ruin-colony", "Colony Tablet", "Relics"], ["ruin-vault", "Vault Mechanism", "Relics"], ["expedition-structure", "Structure Survey", "Expeditions"],
  ["expedition-gate", "Restored Jump Gate", "Expeditions"], ["chart-rift", "Rift Chart", "Navigation"], ["accord-corsair", "Corsair Accord", "Diplomacy"],
  ["boss-carrier", "Corsair Carrier Wreck", "Bosses"], ["boss-bioship", "Contained Bio-Ship", "Bosses"], ["boss-leviathan", "Leviathan Echo", "Bosses"],
  ["boss-foundry", "Disabled Sentinel Foundry", "Bosses"], ["boss-core", "Machine Intelligence Core", "Bosses"],
  ["expedition-storm", "Phase Storm Crossing", "Expeditions"], ["expedition-bioship", "Bio-Ship Interior", "Expeditions"],
  ["expedition-foundry", "Foundry Interior", "Expeditions"], ["expedition-core", "Core Descent", "Expeditions"],
  ["expedition-debris", "Debris Wake Map", "Expeditions"], ["expedition-moon", "Uncharted Moon Survey", "Expeditions"],
  ["expedition-quarantine", "Quarantine Field Study", "Expeditions"], ["expedition-distress", "Cinder Distress Run", "Expeditions"],
  ["expedition-probe", "Recovered Rift Probe", "Expeditions"], ["expedition-archive", "Silent Archive", "Expeditions"],
] as const;

export function totalLevel(state: GameState) {
  return Object.values(state.skills).reduce((sum, skill) => sum + skill.level, 0);
}
