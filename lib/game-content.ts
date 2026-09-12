import type { DroneId, EquipmentId, GameState, ShipModuleId, SkillId, VehicleId } from "./game-state";
import { advancedActivities, bossActivities } from "./depth-content";

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
  voidData: "Void Data", commandToken: "Command Token", gearPhaseLance: "Phase Lance", gearLivingBulwark: "Living Bulwark",
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

export const activities: Activity[] = [...coreActivities, ...advancedActivities, ...bossActivities];

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
];

export const expeditions: { id: string; name: string; minutes: number; level: number; description: string; cost: Record<string, number>; reward: Record<string, number>; collection: string; vehicle?: VehicleId }[] = [
  { id: "colony-ship", name: "Board the Colony Ship", minutes: 2, level: 8, description: "Search an unpowered habitat ring.", cost: { rations: 2, medicine: 1 }, reward: { salvage: 12, data: 5 }, collection: "expedition-colony" },
  { id: "uncharted-moon", name: "Survey the Uncharted Moon", minutes: 4, level: 18, description: "Deploy a rover beyond beacon range.", cost: { fuelRod: 1, rations: 4 }, reward: { cobalt: 8, catalyst: 3 }, collection: "expedition-moon", vehicle: "rover" },
  { id: "alien-structure", name: "Enter the Alien Structure", minutes: 7, level: 38, description: "Take a multidisciplinary team below the surface.", cost: { powerCell: 2, medicine: 3, data: 8 }, reward: { relic: 8, artefact: 1 }, collection: "expedition-structure", vehicle: "boardingShuttle" },
  { id: "jump-gate", name: "Repair the Broken Gate", minutes: 10, level: 60, description: "Restore a pre-collapse transit gate.", cost: { plating: 8, circuits: 8, fuelRod: 3 }, reward: { artefact: 3, navData: 15 }, collection: "expedition-gate", vehicle: "boardingShuttle" },
  { id: "phase-storm", name: "Cross the Phase Storm", minutes: 14, level: 180, description: "Escort a science team through a repeating spatial front.", cost: { fuelRod: 4, medicine: 5, phaseCrystal: 3 }, reward: { voidData: 12, quantumDust: 8 }, collection: "expedition-storm", vehicle: "boardingShuttle" },
  { id: "bioship-remains", name: "Enter the Bio-Ship", minutes: 18, level: 320, description: "Recover living technology after a successful containment battle.", cost: { medicine: 8, neuralGel: 4, powerCell: 5 }, reward: { xenoFiber: 18, genesisCompound: 4 }, collection: "expedition-bioship", vehicle: "boardingShuttle" },
  { id: "sentinel-foundry", name: "Raid the Foundry Interior", minutes: 24, level: 600, description: "Send a boarding team into an active machine production line.", cost: { neutroniumPlate: 3, medicine: 10, missiles: 15 }, reward: { ancientCore: 6, quantumParts: 15 }, collection: "expedition-foundry", vehicle: "boardingShuttle" },
  { id: "machine-core", name: "Descend into the Machine Core", minutes: 35, level: 1000, description: "Reach the intelligence chamber beneath the Silent Systems.", cost: { singularityCore: 1, genesisCompound: 5, fuelRod: 10 }, reward: { commandToken: 1, voidData: 50 }, collection: "expedition-core", vehicle: "boardingShuttle" },
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
  ["enemy-scavenger", "Scavenger Drone", "Hostiles"], ["enemy-automata", "Helix Automata", "Hostiles"], ["enemy-corsair", "Corsair Skiff", "Hostiles"], ["enemy-frigate", "Corsair Frigate", "Hostiles"], ["enemy-sentinel", "Void Sentinel", "Hostiles"], ["enemy-dreadnought", "Silent Dreadnought", "Hostiles"],
  ["ruin-colony", "Colony Tablet", "Relics"], ["ruin-vault", "Vault Mechanism", "Relics"], ["expedition-structure", "Structure Survey", "Expeditions"],
  ["expedition-gate", "Restored Jump Gate", "Expeditions"], ["chart-rift", "Rift Chart", "Navigation"], ["accord-corsair", "Corsair Accord", "Diplomacy"],
  ["boss-carrier", "Corsair Carrier Wreck", "Bosses"], ["boss-bioship", "Contained Bio-Ship", "Bosses"], ["boss-leviathan", "Leviathan Echo", "Bosses"],
  ["boss-foundry", "Disabled Sentinel Foundry", "Bosses"], ["boss-core", "Machine Intelligence Core", "Bosses"],
  ["expedition-storm", "Phase Storm Crossing", "Expeditions"], ["expedition-bioship", "Bio-Ship Interior", "Expeditions"],
  ["expedition-foundry", "Foundry Interior", "Expeditions"], ["expedition-core", "Core Descent", "Expeditions"],
] as const;

export function totalLevel(state: GameState) {
  return Object.values(state.skills).reduce((sum, skill) => sum + skill.level, 0);
}
