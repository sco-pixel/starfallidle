import type { Activity } from "./game-content";
import type { SkillId } from "./game-state";

const advancedLevels = [30, 45, 60, 75, 90, 100] as const;
const sectorsForTier = (index: number) => index === 0 ? ["cinder", "orpheus", "silent"] : index < 3 ? ["orpheus", "silent"] : ["silent"];

const operationNames: Record<Exclude<SkillId, "combat">, string[]> = {
  mining: ["Titanium Meteor", "Phase Crystal Vein", "Dark-Matter Nodule", "Quantum Dust Cloud", "Neutronium Fragment", "Singularity Core Extraction"],
  salvage: ["Carrier Debris Field", "Phase-Burned Cruiser", "Rift Research Ark", "Machine Cathedral Wreck", "Sentinel Fleet Grave", "Primordial Megastructure"],
  botany: ["Vacuum Vine Nursery", "Neural Mycelium", "Darklight Kelp", "Quantum Bloom Conservatory", "Sentinel Symbiote", "Genesis Seed Cultivation"],
  engineering: ["Titanium Bulkhead", "Phase Relay Assembly", "Quantum Control Matrix", "Autonomous Repair Lattice", "Neutronium Superstructure", "Singularity Drive Core"],
  metallurgy: ["Titanium Composite", "Phase-Conductive Alloy", "Dark-Matter Containment", "Quantum-Forged Plating", "Neutronium Laminate", "Event-Horizon Alloy"],
  biochemistry: ["Neural Gel Culture", "Phase-Adaptive Serum", "Rift Metabolic Catalyst", "Quantum Regeneration Bath", "Sentinel Interface Compound", "Genesis Biocode"],
  science: ["Phase Harmonic Analysis", "Dark-Matter Spectroscopy", "Rift Chronology Study", "Quantum Cognition Trial", "Sentinel Network Model", "Singularity Physics Programme"],
  medicine: ["Neural Trauma Therapy", "Phase Exposure Treatment", "Temporal Displacement Care", "Quantum Tissue Reconstruction", "Machine-Mind Separation", "Genesis Revival Protocol"],
  astrogation: ["Corsair Deep Route", "Phase Current Mapping", "Temporal Tide Calculation", "Quantum Beacon Network", "Sentinel Transit Cipher", "Event-Horizon Navigation"],
  drones: ["Titanium Work Fleet", "Phase Survey Wing", "Rift Recovery Formation", "Quantum Interceptor Net", "Sentinel Proxy Swarm", "Autonomous Armada"],
  logistics: ["Titanium Freight Corridor", "Phase-Material Convoy", "Rift Relief Operation", "Quantum Supply Web", "Sentinel Border Exchange", "Five-Sector Grand Convoy"],
  diplomacy: ["Corsair Trade Compact", "Orpheus Research Accord", "Rift Refugee Settlement", "Machine Contact Protocol", "Sentinel Non-Aggression Pact", "Five-Sector Concord"],
  archaeology: ["Pre-Collapse Flagship", "Phase Temple Archive", "Rift Civilisation Layer", "Quantum Memory Palace", "Sentinel Origin Vault", "First-Machine Excavation"],
};

function advancedRecipe(skillId: Exclude<SkillId, "combat">, tier: number) {
  const scale = tier + 1;
  switch (skillId) {
    case "mining": return { produces: tier < 2 ? { titanium: 2 + scale, phaseCrystal: tier } : tier < 4 ? { darkMatter: 1 + tier, quantumDust: tier } : { neutronium: tier, singularityCore: tier === 5 ? 1 : 0 }, consumes: undefined };
    case "salvage": return { produces: { salvage: 8 + tier * 3, quantumCircuit: 1 + tier, ancientCore: tier >= 4 ? 1 : 0 }, consumes: { powerCell: 1 + Math.floor(tier / 2) } };
    case "botany": return { produces: { xenoFiber: 2 + tier, neuralGel: 1 + tier, rations: 3 + tier }, consumes: { algae: 5 + tier, catalyst: Math.max(1, tier) } };
    case "engineering": return { produces: { quantumParts: 1 + tier, singularityCore: tier === 5 ? 1 : 0 }, consumes: { titaniumPlate: 1 + tier, quantumCircuit: 1 + tier, powerCell: 1 + Math.floor(tier / 2) } };
    case "metallurgy": return { produces: tier < 3 ? { titaniumPlate: 2 + tier, quantumAlloy: tier } : { quantumAlloy: 2 + tier, neutroniumPlate: tier - 2 }, consumes: { titanium: 3 + tier, phaseCrystal: Math.max(1, tier), darkMatter: Math.max(1, tier - 1) } };
    case "biochemistry": return { produces: { neuralGel: 2 + tier, genesisCompound: tier >= 4 ? 1 + tier - 4 : 0 }, consumes: { catalyst: 2 + tier, xenoFiber: 1 + tier, medicine: 1 + Math.floor(tier / 2) } };
    case "science": return { produces: { voidData: 3 + tier * 2, quantumDust: 1 + tier }, consumes: { data: 4 + tier * 2, phaseCrystal: Math.max(1, tier) } };
    case "medicine": return { produces: {}, consumes: { medicine: 2 + tier, neuralGel: 1 + tier, genesisCompound: tier >= 4 ? 1 : 0 } };
    case "astrogation": return { produces: { navData: 5 + tier * 3, voidData: 1 + tier }, consumes: { data: 2 + tier, phaseCrystal: Math.max(1, tier - 1) } };
    case "drones": return { produces: { salvage: 5 + tier * 2, quantumCircuit: 1 + tier, voidData: tier }, consumes: { droneParts: 2 + tier, powerCell: 1 + tier } };
    case "logistics": return { produces: { quantumCircuit: 1 + tier, titaniumPlate: 1 + tier }, consumes: { rations: 2 + tier, fuelRod: 1 + Math.floor(tier / 2), medicine: 1 + Math.floor(tier / 3) } };
    case "diplomacy": return { produces: { voidData: 2 + tier, navData: 2 + tier }, consumes: { rations: 2 + tier, data: 3 + tier, relic: 1 + Math.floor(tier / 2) } };
    case "archaeology": return { produces: { relic: 2 + tier, artefact: 1 + Math.floor(tier / 2), ancientCore: tier >= 3 ? 1 : 0 }, consumes: { data: 3 + tier, powerCell: 1 + Math.floor(tier / 2) } };
  }
}

function compactRecipe(recipe: ReturnType<typeof advancedRecipe>) {
  const compact = (values: object | undefined) => values
    ? Object.fromEntries(Object.entries(values).filter(([, amount]) => typeof amount === "number" && amount > 0)) as Record<string, number>
    : undefined;
  return { produces: compact(recipe.produces) ?? {}, consumes: compact(recipe.consumes) };
}

export const advancedActivities: Activity[] = (Object.keys(operationNames) as Exclude<SkillId, "combat">[]).flatMap((skillId) =>
  advancedLevels.map((level, tier) => {
    const recipe = compactRecipe(advancedRecipe(skillId, tier));
    return {
      id: `${skillId}-advanced-${level}`,
      skillId,
      name: operationNames[skillId][tier],
      level,
      seconds: 16 + tier * 4,
      xp: 110 + tier * 75,
      description: `A tier ${tier + 1} specialist operation using ${skillId === "botany" ? "sealed xenobiology" : skillId === "diplomacy" ? "five-sector influence" : "late-patrol technology"}.`,
      produces: recipe.produces,
      consumes: recipe.consumes,
      credits: ["logistics", "diplomacy", "salvage"].includes(skillId) ? 90 + tier * 85 : undefined,
      sectors: sectorsForTier(tier),
    };
  }),
);

export const bossActivities: Activity[] = [
  { id: "boss-corsair-carrier", skillId: "combat", name: "Corsair Carrier", level: 30, seconds: 26, xp: 210, description: "Break a carrier group controlling the Cinder trade lanes.", produces: { titanium: 5, quantumCircuit: 2 }, credits: 240, damage: 48, sectors: ["cinder", "orpheus", "silent"], enemy: { hull: 420, shields: 120, armor: 58, evasion: 22, class: "Sector Boss", weakness: "missile", rareEvery: 12, rareDrop: { gearPhaseLance: 1 } }, collectionId: "boss-carrier" },
  { id: "boss-helix-bioship", skillId: "combat", name: "Helix Bio-Ship", level: 45, seconds: 31, xp: 330, description: "Contain an escaped research organism grown around a warship hull.", produces: { neuralGel: 6, xenoFiber: 8 }, credits: 360, damage: 62, sectors: ["helix", "orpheus", "silent"], enemy: { hull: 610, shields: 180, armor: 42, evasion: 30, class: "Sector Boss", weakness: "laser", rareEvery: 14, rareDrop: { gearLivingBulwark: 1 } }, collectionId: "boss-bioship" },
  { id: "boss-rift-leviathan", skillId: "combat", name: "Rift Leviathan", level: 60, seconds: 38, xp: 480, description: "Hunt a temporal organism large enough to distort local navigation.", produces: { darkMatter: 8, quantumDust: 8 }, credits: 520, damage: 78, sectors: ["orpheus", "silent"], enemy: { hull: 900, shields: 260, armor: 75, evasion: 34, class: "Sector Boss", weakness: "railgun", rareEvery: 16, rareDrop: { gearChronoDrive: 1 } }, collectionId: "boss-leviathan" },
  { id: "boss-sentinel-foundry", skillId: "combat", name: "Sentinel Foundry", level: 80, seconds: 47, xp: 720, description: "Disable a mobile factory producing fresh machine fleets.", produces: { neutroniumPlate: 4, ancientCore: 2 }, credits: 780, damage: 102, sectors: ["silent"], enemy: { hull: 1450, shields: 430, armor: 115, evasion: 20, class: "Sector Boss", weakness: "railgun", rareEvery: 18, rareDrop: { gearFoundryHeart: 1 } }, collectionId: "boss-foundry" },
  { id: "boss-machine-intelligence", skillId: "combat", name: "Machine Intelligence Core", level: 100, seconds: 60, xp: 1100, description: "Confront the coordinating intelligence beneath the Silent Systems.", produces: { singularityCore: 2, ancientCore: 5 }, credits: 1400, damage: 140, sectors: ["silent"], enemy: { hull: 2400, shields: 800, armor: 160, evasion: 28, class: "Final Boss", weakness: "missile", rareEvery: 20, rareDrop: { gearStarfallCrown: 1 } }, collectionId: "boss-core" },
];

export const uniqueGear = {
  gearPhaseLance: { name: "Phase Lance", effect: "+12% combat accuracy" },
  gearLivingBulwark: { name: "Living Bulwark", effect: "15% less incoming damage" },
  gearChronoDrive: { name: "Chrono Drive", effect: "All operations 8% faster" },
  gearFoundryHeart: { name: "Foundry Heart", effect: "+2 manufactured output" },
  gearStarfallCrown: { name: "Starfall Crown", effect: "All gear effects at half strength" },
} as const;

export const missionDefinitions = [
  { id: "signal-in-static", name: "A Signal in the Static", description: "Record 12 discoveries and reach Science level 15.", reward: { data: 25, credits: 300 } },
  { id: "broken-convoy", name: "The Broken Convoy", description: "Complete 8 contracts and defeat 10 Corsair Skiffs.", reward: { titanium: 12, credits: 650 } },
  { id: "rift-echo", name: "Echoes of Orpheus", description: "Complete 4 expeditions and reach Astrogation level 35.", reward: { phaseCrystal: 8, voidData: 10 } },
  { id: "machine-language", name: "The Machine Language", description: "Reach Science, Diplomacy and Archaeology level 50.", reward: { ancientCore: 2, credits: 1200 } },
  { id: "foundry-war", name: "The Foundry War", description: "Defeat the Sentinel Foundry and construct a Silent outpost.", reward: { neutroniumPlate: 10, singularityCore: 1 } },
  { id: "starfall-protocol", name: "The Starfall Protocol", description: "Defeat the Machine Intelligence Core and reach total level 1,000.", reward: { commandToken: 1, credits: 5000 } },
] as const;
