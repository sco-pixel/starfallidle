import type { Activity } from "./game-content";
import type { SkillId } from "./game-state";

const advancedLevels = [23, 30, 38, 48, 60, 70, 80, 90, 100] as const;
const engineeringLevels = [25, 35, 50, 65, 80, 90, 100] as const;
const sectorsForTier = (index: number) => index === 0 ? ["cinder", "orpheus", "silent"] : index < 2 ? ["cinder", "orpheus", "silent"] : index < 4 ? ["orpheus", "silent"] : ["silent"];
const levelsForSkill = (skillId: Exclude<SkillId, "combat">) => skillId === "engineering" ? engineeringLevels : advancedLevels;

const operationNames: Record<Exclude<SkillId, "combat">, string[]> = {
  mining: ["Titanium Meteor", "Phase Crystal Vein", "Dark-Matter Nodule", "Quantum Dust Cloud", "Neutronium Fragment", "Singularity Lode", "Event-Horizon Ore", "Void-Crystal Mantle", "Terminal Singularity Mine"],
  salvage: ["Carrier Debris Field", "Phase-Burned Cruiser", "Rift Research Ark", "Machine Cathedral Wreck", "Sentinel Fleet Grave", "Primordial Megastructure", "Core-World Hulks", "Voidship Ossuary", "Starfall Wreck Ring"],
  botany: ["Vacuum Vine Nursery", "Neural Mycelium", "Darklight Kelp", "Quantum Bloom Conservatory", "Sentinel Symbiote", "Genesis Seed Cultivation", "First-Garden Canopy", "Void Orchid Reserve", "Starfall Seedbank"],
  engineering: ["Titanium Bulkhead", "Phase Relay Assembly", "Quantum Control Matrix", "Autonomous Repair Lattice", "Neutronium Superstructure", "Singularity Drive Core", "Starfall Systems Retrofit"],
  metallurgy: ["Titanium Composite", "Phase-Conductive Alloy", "Dark-Matter Containment", "Quantum-Forged Plating", "Neutronium Laminate", "Event-Horizon Alloy", "Starforged Crucible", "Voidsteel Tempering", "Starfall Forge"],
  biochemistry: ["Neural Gel Culture", "Phase-Adaptive Serum", "Rift Metabolic Catalyst", "Quantum Regeneration Bath", "Sentinel Interface Compound", "Genesis Biocode", "First-Life Synthesis", "Void-Symbiote Culture", "Starfall Genome"],
  science: ["Phase Harmonic Analysis", "Dark-Matter Spectroscopy", "Rift Chronology Study", "Quantum Cognition Trial", "Sentinel Network Model", "Singularity Physics Programme", "Starfall Theory", "Void Resonance Experiment", "Starfall Equation"],
  medicine: ["Neural Trauma Therapy", "Phase Exposure Treatment", "Temporal Displacement Care", "Quantum Tissue Reconstruction", "Machine-Mind Separation", "Genesis Revival Protocol", "Crew Continuity Protocol", "Void Sickness Immunisation", "Starfall Revival Suite"],
  astrogation: ["Corsair Deep Route", "Phase Current Mapping", "Temporal Tide Calculation", "Quantum Beacon Network", "Sentinel Transit Cipher", "Event-Horizon Navigation", "Starfall Route", "Void Lattice Passage", "Starfall Vector"],
  drones: ["Titanium Work Fleet", "Phase Survey Wing", "Rift Recovery Formation", "Quantum Interceptor Net", "Sentinel Proxy Swarm", "Autonomous Armada", "Starfall Drone Chorus", "Voidwalker Formation", "Starfall Fleetmind"],
  logistics: ["Titanium Freight Corridor", "Phase-Material Convoy", "Rift Relief Operation", "Quantum Supply Web", "Sentinel Border Exchange", "Five-Sector Grand Convoy", "Starfall Supply Chain", "Void Freight Exchange", "Starfall Grand Convoy"],
  diplomacy: ["Corsair Trade Compact", "Orpheus Research Accord", "Rift Refugee Settlement", "Machine Contact Protocol", "Sentinel Non-Aggression Pact", "Five-Sector Concord", "Starfall Assembly", "Void Accord", "Starfall Charter"],
  archaeology: ["Pre-Collapse Flagship", "Phase Temple Archive", "Rift Civilisation Layer", "Quantum Memory Palace", "Sentinel Origin Vault", "First-Machine Excavation", "Starfall Archive", "Void Dynasty Mausoleum", "Starfall Origin Vault"],
};

function apexRecipe(skillId: Exclude<SkillId, "combat" | "engineering">, tier: number) {
  const final = tier === 8;
  switch (skillId) {
    case "mining": return { produces: final ? { singularityCore: 3, neutronium: 12, quantumDust: 14 } : { singularityCore: 2, voidLens: 4, neutronium: 9 } };
    case "salvage": return { produces: final ? { singularityCore: 3, ancientCore: 14, quantumParts: 16 } : { singularityCore: 2, voidLens: 5, ancientCore: 10 }, consumes: final ? { powerCell: 12, quantumCircuit: 10 } : { powerCell: 10, quantumCircuit: 8 } };
    case "botany": return { produces: final ? { genesisSeed: 14, genesisCompound: 6, neuralGel: 18 } : { genesisSeed: 10, bioLumen: 11, genesisCompound: 4 }, consumes: final ? { algae: 18, catalyst: 10, voidData: 8 } : { algae: 16, catalyst: 9, phaseCrystal: 5 } };
    case "metallurgy": return { produces: final ? { riftAlloy: 20, neutroniumPlate: 16, phaseLattice: 8 } : { riftAlloy: 16, neutroniumPlate: 14, phaseLattice: 6 }, consumes: final ? { neutronium: 16, quantumDust: 14, singularityCore: 2 } : { neutronium: 14, darkMatter: 11, singularityCore: 1 } };
    case "biochemistry": return { produces: final ? { genesisCompound: 22, bioLumen: 15, medicine: 30 } : { genesisCompound: 18, bioLumen: 12, medicine: 25 }, consumes: final ? { catalyst: 13, genesisSeed: 11, neuralGel: 12 } : { catalyst: 11, genesisSeed: 9, bioLumen: 9 } };
    case "science": return { produces: final ? { voidLens: 15, sentinelCipher: 14, voidData: 36 } : { voidLens: 12, sentinelCipher: 12, voidData: 32 }, consumes: final ? { data: 34, ancientCore: 6, singularityCore: 2 } : { data: 30, voidLens: 8, ancientCore: 5 } };
    case "medicine": return { produces: final ? { medicine: 42, genesisCompound: 6, repairNanites: 5 } : { medicine: 36, genesisCompound: 5, repairNanites: 4 }, consumes: final ? { medicine: 16, genesisSeed: 8, neuralGel: 12 } : { medicine: 14, bioLumen: 7, genesisSeed: 6 } };
    case "astrogation": return { produces: final ? { navData: 64, voidData: 22, sentinelCipher: 8 } : { navData: 55, voidLens: 7, voidData: 19 }, consumes: final ? { data: 30, voidLens: 8, ancientCore: 4 } : { data: 26, voidLens: 6, singularityCore: 1 } };
    case "drones": return { produces: final ? { repairNanites: 12, sentinelCipher: 10, quantumParts: 18 } : { repairNanites: 10, voidData: 14, quantumParts: 15 }, consumes: final ? { droneParts: 18, powerCell: 13, phaseLattice: 7 } : { droneParts: 16, powerCell: 11, quantumCircuit: 7 } };
    case "logistics": return { produces: final ? { quantumParts: 18, commandToken: 2, riftAlloy: 6 } : { quantumParts: 16, riftAlloy: 4, voidData: 10 }, consumes: final ? { rations: 18, fuelRod: 9, medicine: 7, sentinelCipher: 7 } : { rations: 16, fuelRod: 8, medicine: 6, riftAlloy: 4 } };
    case "diplomacy": return { produces: final ? { commandToken: 3, ancientCore: 6, navData: 30 } : { commandToken: 2, voidData: 18, sentinelCipher: 6 }, consumes: final ? { rations: 18, data: 30, artefact: 7, sentinelCipher: 8 } : { rations: 16, data: 27, artefact: 6, sentinelCipher: 6 } };
    case "archaeology": return { produces: final ? { singularityCore: 3, commandToken: 2, ancientCore: 16 } : { singularityCore: 2, voidLens: 7, ancientCore: 14 }, consumes: final ? { data: 34, powerCell: 12, artefact: 9, sentinelCipher: 6 } : { data: 30, powerCell: 11, artefact: 8, sentinelCipher: 5 } };
  }
}

function advancedRecipe(skillId: Exclude<SkillId, "combat">, tier: number) {
  if (skillId !== "engineering" && tier >= 7) return apexRecipe(skillId, tier);
  switch (skillId) {
    case "mining": return [
      { produces: { titanium: 4, phaseCrystal: 1 } }, { produces: { phaseCrystal: 5, phaseFilament: 1 } }, { produces: { darkMatter: 3, quantumDust: 2 } }, { produces: { quantumDust: 6, voidLens: 1 } }, { produces: { neutronium: 4, darkMatter: 4 } }, { produces: { singularityCore: 1, neutronium: 4 } }, { produces: { singularityCore: 1, neutronium: 7, quantumDust: 7 } },
    ][tier];
    case "salvage": return [
      { produces: { salvage: 12, quantumCircuit: 2 }, consumes: { powerCell: 1 } }, { produces: { salvage: 15, phaseFilament: 2, circuits: 4 }, consumes: { powerCell: 2 } }, { produces: { quantumCircuit: 5, ancientCore: 1, relic: 3 }, consumes: { powerCell: 3 } }, { produces: { quantumParts: 4, sentinelCipher: 1, ancientCore: 2 }, consumes: { powerCell: 4, phaseFilament: 1 } }, { produces: { neutronium: 3, sentinelCipher: 3, ancientCore: 4 }, consumes: { powerCell: 5, quantumCircuit: 2 } }, { produces: { singularityCore: 1, voidLens: 2, ancientCore: 6 }, consumes: { powerCell: 6, quantumCircuit: 4 } }, { produces: { singularityCore: 2, ancientCore: 8, quantumParts: 8 }, consumes: { powerCell: 8, quantumCircuit: 6 } },
    ][tier];
    case "botany": return [
      { produces: { xenoFiber: 4, neuralGel: 2, rations: 5 }, consumes: { algae: 6, catalyst: 1 } }, { produces: { neuralGel: 4, bioLumen: 1, rations: 6 }, consumes: { algae: 7, catalyst: 2 } }, { produces: { xenoFiber: 6, bioLumen: 3, catalyst: 3 }, consumes: { algae: 8, catalyst: 3 } }, { produces: { genesisSeed: 1, bioLumen: 5, neuralGel: 6 }, consumes: { algae: 9, catalyst: 4, phaseCrystal: 1 } }, { produces: { genesisSeed: 3, xenoFiber: 8, neuralGel: 8 }, consumes: { algae: 10, catalyst: 5, voidData: 2 } }, { produces: { genesisSeed: 5, bioLumen: 7, genesisCompound: 1 }, consumes: { algae: 12, catalyst: 6, phaseCrystal: 3 } }, { produces: { genesisSeed: 8, genesisCompound: 3, neuralGel: 12 }, consumes: { algae: 14, catalyst: 8, voidData: 5 } },
    ][tier];
    case "engineering": return [
      { produces: { quantumParts: 3, droneParts: 3 }, consumes: { titaniumPlate: 2, quantumCircuit: 2, powerCell: 1 } }, { produces: { phaseLattice: 2, quantumParts: 4 }, consumes: { titaniumPlate: 3, phaseFilament: 2, powerCell: 2 } }, { produces: { quantumParts: 6, phaseLattice: 4 }, consumes: { titaniumPlate: 4, quantumCircuit: 4, phaseCrystal: 3 } }, { produces: { repairNanites: 3, quantumParts: 7, phaseLattice: 5 }, consumes: { riftAlloy: 3, quantumCircuit: 5, powerCell: 4 } }, { produces: { repairNanites: 6, neutroniumPlate: 2, quantumParts: 9 }, consumes: { neutroniumPlate: 3, phaseLattice: 4, powerCell: 5 } }, { produces: { singularityCore: 1, repairNanites: 9, quantumParts: 12 }, consumes: { riftAlloy: 6, quantumCircuit: 8, voidLens: 2 } }, { produces: { singularityCore: 2, repairNanites: 14, quantumParts: 16 }, consumes: { neutroniumPlate: 6, phaseLattice: 8, quantumCircuit: 12 } },
    ][tier];
    case "metallurgy": return [
      { produces: { titaniumPlate: 4, quantumAlloy: 2 }, consumes: { titanium: 5, phaseCrystal: 1 } }, { produces: { riftAlloy: 3, titaniumPlate: 4 }, consumes: { titanium: 6, phaseCrystal: 3 } }, { produces: { quantumAlloy: 5, riftAlloy: 5 }, consumes: { titanium: 7, phaseCrystal: 4, darkMatter: 2 } }, { produces: { neutroniumPlate: 3, riftAlloy: 7 }, consumes: { neutronium: 4, quantumDust: 4, darkMatter: 4 } }, { produces: { neutroniumPlate: 6, phaseLattice: 2 }, consumes: { neutronium: 6, quantumDust: 6, phaseCrystal: 5 } }, { produces: { riftAlloy: 10, neutroniumPlate: 8 }, consumes: { neutronium: 8, darkMatter: 7, singularityCore: 1 } }, { produces: { riftAlloy: 14, neutroniumPlate: 12, phaseLattice: 5 }, consumes: { neutronium: 12, quantumDust: 10, singularityCore: 1 } },
    ][tier];
    case "biochemistry": return [
      { produces: { neuralGel: 5, medicine: 4 }, consumes: { catalyst: 3, xenoFiber: 3, medicine: 1 } }, { produces: { bioLumen: 3, medicine: 6 }, consumes: { catalyst: 4, xenoFiber: 4, neuralGel: 2 } }, { produces: { genesisCompound: 2, neuralGel: 7 }, consumes: { catalyst: 5, xenoFiber: 5, bioLumen: 2 } }, { produces: { genesisCompound: 4, medicine: 10 }, consumes: { catalyst: 6, genesisSeed: 2, bioLumen: 4 } }, { produces: { genesisCompound: 7, sentinelCipher: 1 }, consumes: { catalyst: 7, genesisSeed: 3, neuralGel: 5 } }, { produces: { genesisCompound: 10, medicine: 16 }, consumes: { catalyst: 8, genesisSeed: 5, bioLumen: 6 } }, { produces: { genesisCompound: 15, bioLumen: 10, medicine: 20 }, consumes: { catalyst: 10, genesisSeed: 8, neuralGel: 8 } },
    ][tier];
    case "science": return [
      { produces: { voidData: 5, quantumDust: 2 }, consumes: { data: 7, phaseCrystal: 2 } }, { produces: { voidLens: 2, voidData: 7 }, consumes: { data: 9, phaseCrystal: 4 } }, { produces: { voidData: 10, quantumDust: 5, sentinelCipher: 1 }, consumes: { data: 12, phaseCrystal: 5, bioLumen: 1 } }, { produces: { voidLens: 4, sentinelCipher: 3, quantumDust: 7 }, consumes: { data: 15, phaseCrystal: 7, ancientCore: 1 } }, { produces: { voidData: 16, sentinelCipher: 6, phaseLattice: 2 }, consumes: { data: 18, voidLens: 2, ancientCore: 2 } }, { produces: { voidLens: 7, quantumDust: 11, voidData: 20 }, consumes: { data: 22, phaseCrystal: 10, singularityCore: 1 } }, { produces: { voidLens: 11, sentinelCipher: 10, voidData: 28 }, consumes: { data: 28, ancientCore: 4, singularityCore: 1 } },
    ][tier];
    case "medicine": return [
      { produces: { medicine: 4 }, consumes: { medicine: 3, neuralGel: 2 } }, { produces: { medicine: 6, bioLumen: 1 }, consumes: { medicine: 4, neuralGel: 3, bioLumen: 1 } }, { produces: { medicine: 9, genesisCompound: 1 }, consumes: { medicine: 5, neuralGel: 4, genesisCompound: 1 } }, { produces: { medicine: 13, repairNanites: 1 }, consumes: { medicine: 6, bioLumen: 3, genesisCompound: 2 } }, { produces: { medicine: 18, neuralGel: 4 }, consumes: { medicine: 8, sentinelCipher: 2, genesisCompound: 3 } }, { produces: { medicine: 24, genesisCompound: 2 }, consumes: { medicine: 10, bioLumen: 5, genesisSeed: 2 } }, { produces: { medicine: 32, genesisCompound: 4, repairNanites: 3 }, consumes: { medicine: 12, genesisSeed: 5, neuralGel: 8 } },
    ][tier];
    case "astrogation": return [
      { produces: { navData: 8, voidData: 2 }, consumes: { data: 5, phaseCrystal: 1 } }, { produces: { navData: 12, voidLens: 1 }, consumes: { data: 7, phaseCrystal: 3 } }, { produces: { navData: 17, voidData: 6 }, consumes: { data: 10, voidLens: 1, phaseCrystal: 4 } }, { produces: { navData: 23, sentinelCipher: 2 }, consumes: { data: 13, voidLens: 3, quantumDust: 2 } }, { produces: { navData: 30, voidData: 10 }, consumes: { data: 16, sentinelCipher: 3, ancientCore: 1 } }, { produces: { navData: 38, voidLens: 4 }, consumes: { data: 20, voidLens: 4, singularityCore: 1 } }, { produces: { navData: 50, voidData: 16, sentinelCipher: 5 }, consumes: { data: 25, voidLens: 6, ancientCore: 3 } },
    ][tier];
    case "drones": return [
      { produces: { salvage: 10, droneParts: 3, quantumCircuit: 2 }, consumes: { droneParts: 3, powerCell: 2 } }, { produces: { phaseFilament: 2, data: 6, salvage: 12 }, consumes: { droneParts: 4, powerCell: 3 } }, { produces: { quantumCircuit: 5, voidLens: 1, salvage: 15 }, consumes: { droneParts: 5, powerCell: 4, phaseFilament: 1 } }, { produces: { quantumParts: 5, sentinelCipher: 2 }, consumes: { droneParts: 6, powerCell: 5, phaseLattice: 2 } }, { produces: { ancientCore: 3, quantumCircuit: 8, salvage: 20 }, consumes: { droneParts: 8, powerCell: 6, sentinelCipher: 2 } }, { produces: { repairNanites: 4, voidData: 10, quantumParts: 8 }, consumes: { droneParts: 10, powerCell: 8, quantumCircuit: 5 } }, { produces: { repairNanites: 8, sentinelCipher: 6, quantumParts: 12 }, consumes: { droneParts: 14, powerCell: 10, phaseLattice: 5 } },
    ][tier];
    case "logistics": return [
      { produces: { quantumCircuit: 2, titaniumPlate: 2 }, consumes: { rations: 4, fuelRod: 1, medicine: 1 } }, { produces: { riftAlloy: 2, credits: 1 }, consumes: { rations: 5, fuelRod: 2, medicine: 1 } }, { produces: { quantumCircuit: 5, voidData: 3 }, consumes: { rations: 6, fuelRod: 2, medicine: 2, phaseFilament: 1 } }, { produces: { phaseLattice: 3, sentinelCipher: 1 }, consumes: { rations: 7, fuelRod: 3, medicine: 2, quantumCircuit: 2 } }, { produces: { neutroniumPlate: 3, voidData: 7 }, consumes: { rations: 9, fuelRod: 4, medicine: 3, sentinelCipher: 2 } }, { produces: { quantumParts: 8, credits: 1 }, consumes: { rations: 11, fuelRod: 5, medicine: 4, riftAlloy: 3 } }, { produces: { quantumParts: 14, commandToken: 1 }, consumes: { rations: 14, fuelRod: 7, medicine: 5, sentinelCipher: 5 } },
    ][tier];
    case "diplomacy": return [
      { produces: { navData: 6, voidData: 3 }, consumes: { rations: 4, data: 6, relic: 1 } }, { produces: { sentinelCipher: 1, navData: 9 }, consumes: { rations: 5, data: 8, relic: 2 } }, { produces: { voidData: 8, sentinelCipher: 3 }, consumes: { rations: 6, data: 10, relic: 3, bioLumen: 1 } }, { produces: { sentinelCipher: 5, artefact: 2 }, consumes: { rations: 8, data: 13, relic: 4, voidLens: 1 } }, { produces: { ancientCore: 2, navData: 15 }, consumes: { rations: 10, data: 16, relic: 5, sentinelCipher: 2 } }, { produces: { commandToken: 1, voidData: 15 }, consumes: { rations: 12, data: 20, artefact: 3, sentinelCipher: 4 } }, { produces: { commandToken: 2, ancientCore: 4, navData: 24 }, consumes: { rations: 15, data: 25, artefact: 5, sentinelCipher: 7 } },
    ][tier];
    case "archaeology": return [
      { produces: { relic: 4, artefact: 2 }, consumes: { data: 6, powerCell: 2 } }, { produces: { relic: 6, voidLens: 1, artefact: 2 }, consumes: { data: 8, powerCell: 3 } }, { produces: { ancientCore: 2, sentinelCipher: 1, artefact: 4 }, consumes: { data: 11, powerCell: 4, relic: 2 } }, { produces: { voidLens: 3, ancientCore: 4, artefact: 5 }, consumes: { data: 14, powerCell: 5, relic: 4 } }, { produces: { sentinelCipher: 5, ancientCore: 6, phaseLattice: 2 }, consumes: { data: 18, powerCell: 6, relic: 6 } }, { produces: { singularityCore: 1, voidLens: 5, ancientCore: 8 }, consumes: { data: 22, powerCell: 8, artefact: 4 } }, { produces: { singularityCore: 2, commandToken: 1, ancientCore: 12 }, consumes: { data: 28, powerCell: 10, artefact: 7, sentinelCipher: 4 } },
    ][tier];
  }
}

function compactRecipe(recipe: ReturnType<typeof advancedRecipe>) {
  const compact = (values: object | undefined) => values
    ? Object.fromEntries(Object.entries(values).filter(([, amount]) => typeof amount === "number" && amount > 0)) as Record<string, number>
    : undefined;
  return { produces: compact(recipe.produces) ?? {}, consumes: compact(recipe.consumes) };
}

export const advancedActivities: Activity[] = (Object.keys(operationNames) as Exclude<SkillId, "combat">[]).flatMap((skillId) =>
  levelsForSkill(skillId).map((level, tier) => {
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

const combatTargetNames = [
  "Ore Jacker", "Drift Marauder", "Gravimetric Mine", "Prospector Ambush", "Relay Sentry", "Helix Quarantine Drone", "Spore Skiff", "Corsair Cutter", "Relic Guardian", "Helix Interceptor", "Cinder Gunboat", "Rift Scavenger", "Corsair Boarding Craft", "Quarantine Destroyer", "Phase Raider", "Corsair Corvette", "Rift Lancer", "Helix Bio-Drone", "Cinder Escort", "Orpheus Warden", "Rift Harvester", "Corsair Strike Frigate", "Phase Stalker", "Temporal Corsair", "Rift Survey Dread", "Sentinel Scout", "Machine Boarding Pod", "Silent Skirmisher", "Sentinel Hunter", "Machine Rail Platform", "Silent Systems Frigate", "Sentinel Custodian", "Machine Breacher", "Void Cartographer", "Silent Dreadnought",
] as const;
const combatTargetLevels = [2, 3, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 35, 38, 40, 43, 48, 50, 53, 55, 58, 62, 65, 68, 70, 73, 78, 82, 86, 92, 96] as const;
const combatWeaknesses = ["laser", "railgun", "missile"] as const;

export const combatActivities: Activity[] = combatTargetNames.map((name, index) => {
  const level = combatTargetLevels[index];
  const stage = Math.floor(index / 7);
  const sector = index < 7 ? ["erebus"] : index < 14 ? ["helix", "cinder"] : index < 22 ? ["cinder", "orpheus"] : index < 29 ? ["orpheus", "silent"] : ["silent"];
  const className = stage === 0 ? "Raider" : stage === 1 ? "Hostile Drone" : stage === 2 ? "Corsair Vessel" : stage === 3 ? "Rift Hostile" : "Sentinel Vessel";
  const base = 38 + index * 23;
  return {
    id: `combat-contact-${String(index + 1).padStart(2, "0")}`,
    skillId: "combat",
    name,
    level,
    seconds: 7 + Math.floor(index / 3),
    xp: 20 + index * 13,
    description: `${className} contact operating inside the established ${stage < 1 ? "frontier" : stage < 2 ? "quarantine frontier" : stage < 3 ? "Cinder and Orpheus lanes" : stage < 4 ? "rift approaches" : "Silent Systems"}.`,
    produces: index < 10 ? { salvage: 2 + stage, circuits: stage } : index < 22 ? { plating: 1 + stage, circuits: 2 + stage } : index < 30 ? { relic: 1 + stage, data: 3 + stage } : { quantumCircuit: 1 + stage, ancientCore: stage > 4 ? 1 : 0 },
    credits: 10 + index * 14,
    damage: 8 + index * 3,
    sectors: sector,
    enemy: { hull: base * 3, shields: base + stage * 18, armor: 4 + index * 3, evasion: 5 + (index * 7) % 34, class: className, weakness: combatWeaknesses[index % combatWeaknesses.length], rareEvery: 10 + stage * 2, rareDrop: index < 12 ? { droneParts: 1 + stage } : index < 24 ? { powerCell: 2 + stage, relic: 1 } : { voidData: 2 + stage, quantumDust: stage > 3 ? 1 : 0 } },
    collectionId: `enemy-contact-${String(index + 1).padStart(2, "0")}`,
  };
});

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
  { id: "helix-remnant", name: "The Helix Remnant", description: "Reach Medicine and Science level 20, then defeat 15 Helix Security Automata.", reward: { neuralGel: 10, credits: 900 } },
  { id: "corsair-accord", name: "Corsair Accord", description: "Complete 10 contracts and reach Diplomacy level 25.", reward: { phaseCrystal: 6, credits: 1100 } },
  { id: "rift-cartographer", name: "The Rift Cartographer", description: "Reach Astrogation level 45 and complete 6 expeditions.", reward: { voidData: 16, quantumCircuit: 6 } },
  { id: "silent-witness", name: "Silent Witness", description: "Record 55 discoveries and defeat the Rift Leviathan.", reward: { ancientCore: 3, credits: 2200 } },
  { id: "erebus-oath", name: "The Erebus Oath", description: "Complete 3 contracts and reach Logistics level 12.", reward: { fuelRod: 6, credits: 450 } },
  { id: "helix-quarantine", name: "The Quarantine Line", description: "Complete the Quarantine Field Study and reach Medicine level 18.", reward: { catalyst: 10, neuralGel: 5 } },
  { id: "cinder-mercy", name: "Cinder Mercy", description: "Complete the Cinder Distress Run and defeat 25 corsair targets.", reward: { plating: 12, credits: 850 } },
  { id: "rift-probe-recovered", name: "The Lost Probe", description: "Complete the Rift Probe expedition and reach Science level 32.", reward: { phaseCrystal: 10, voidData: 8 } },
  { id: "silent-archive-protocol", name: "Archive Protocol", description: "Complete the Silent Archive expedition and reach Archaeology level 40.", reward: { quantumCircuit: 12, ancientCore: 2 } },
] as const;
