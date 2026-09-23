/**
 * Stable, static sprite paths for the game UI.
 *
 * Generated images belong in `public/assets/sprites/<group>/<id>.png`.
 * Keep game IDs as filenames: this keeps art references independent of saves
 * and lets a missing image fall back gracefully in the UI.
 */
import { activities } from "./game-content";

export type SpriteKind = "skill" | "operation" | "item" | "cargo";

type AtlasPosition = { column: number; row: number };

export type SpriteReference = {
  src: string;
  fallback: string;
  accent: "ore" | "tech" | "bio" | "signal" | "command" | "wealth";
  atlas?: AtlasPosition;
};

// The app uses Vite's relative base path, so this resolves on localhost and
// from the repository subpath used by GitHub Pages.
const assetRoot = "./assets/sprites/";
const cargoAtlas = `${assetRoot}cargo-atlas.png`;
const activitySkillIds = Object.fromEntries(activities.map((activity) => [activity.id, activity.skillId]));

const skills: Record<string, Omit<SpriteReference, "src">> = {
  mining: { fallback: "MN", accent: "ore" },
  salvage: { fallback: "SV", accent: "tech" },
  botany: { fallback: "XB", accent: "bio" },
  combat: { fallback: "CB", accent: "command" },
  archaeology: { fallback: "AR", accent: "ore" },
  engineering: { fallback: "EN", accent: "tech" },
  metallurgy: { fallback: "MT", accent: "ore" },
  biochemistry: { fallback: "BC", accent: "bio" },
  science: { fallback: "SC", accent: "signal" },
  medicine: { fallback: "MD", accent: "bio" },
  astrogation: { fallback: "AS", accent: "signal" },
  drones: { fallback: "DR", accent: "tech" },
  logistics: { fallback: "LG", accent: "command" },
  diplomacy: { fallback: "DP", accent: "command" },
};

const items: Record<string, Omit<SpriteReference, "src">> = {
  ferrite: { fallback: "FE", accent: "ore", atlas: { column: 0, row: 0 } }, cobalt: { fallback: "CO", accent: "ore", atlas: { column: 1, row: 0 } },
  iridium: { fallback: "IR", accent: "ore", atlas: { column: 2, row: 0 } }, titanium: { fallback: "TI", accent: "ore", atlas: { column: 3, row: 0 } },
  phaseCrystal: { fallback: "PC", accent: "signal", atlas: { column: 4, row: 0 } }, darkMatter: { fallback: "DM", accent: "signal", atlas: { column: 5, row: 0 } },
  quantumDust: { fallback: "QD", accent: "signal", atlas: { column: 6, row: 0 } }, neutronium: { fallback: "NE", accent: "ore", atlas: { column: 7, row: 0 } },
  salvage: { fallback: "SV", accent: "tech", atlas: { column: 0, row: 1 } }, circuits: { fallback: "CI", accent: "tech", atlas: { column: 1, row: 1 } },
  plating: { fallback: "PL", accent: "tech", atlas: { column: 2, row: 1 } }, powerCell: { fallback: "PW", accent: "tech", atlas: { column: 3, row: 1 } },
  droneParts: { fallback: "DP", accent: "tech", atlas: { column: 4, row: 1 } }, titaniumPlate: { fallback: "TP", accent: "tech", atlas: { column: 5, row: 1 } },
  quantumAlloy: { fallback: "QA", accent: "tech", atlas: { column: 6, row: 1 } }, quantumCircuit: { fallback: "QC", accent: "tech", atlas: { column: 7, row: 1 } },
  neutroniumPlate: { fallback: "NP", accent: "tech", atlas: { column: 0, row: 2 } }, quantumParts: { fallback: "QP", accent: "tech", atlas: { column: 1, row: 2 } },
  singularityCore: { fallback: "SG", accent: "signal", atlas: { column: 2, row: 2 } }, algae: { fallback: "AL", accent: "bio", atlas: { column: 3, row: 2 } },
  rations: { fallback: "RA", accent: "bio", atlas: { column: 4, row: 2 } }, medicine: { fallback: "MK", accent: "bio", atlas: { column: 5, row: 2 } },
  catalyst: { fallback: "CA", accent: "bio", atlas: { column: 6, row: 2 } }, xenoFiber: { fallback: "XF", accent: "bio", atlas: { column: 7, row: 2 } },
  neuralGel: { fallback: "NG", accent: "bio", atlas: { column: 0, row: 3 } }, genesisCompound: { fallback: "GC", accent: "bio", atlas: { column: 1, row: 3 } },
  data: { fallback: "DT", accent: "signal", atlas: { column: 2, row: 3 } }, navData: { fallback: "NV", accent: "signal", atlas: { column: 3, row: 3 } },
  relic: { fallback: "RL", accent: "ore", atlas: { column: 4, row: 3 } }, artefact: { fallback: "AF", accent: "ore", atlas: { column: 5, row: 3 } },
  voidData: { fallback: "VD", accent: "signal", atlas: { column: 6, row: 3 } }, ancientCore: { fallback: "AC", accent: "signal", atlas: { column: 7, row: 3 } },
  commandToken: { fallback: "CT", accent: "command", atlas: { column: 0, row: 4 } }, missiles: { fallback: "MS", accent: "command", atlas: { column: 1, row: 4 } },
  fuelRod: { fallback: "FR", accent: "tech", atlas: { column: 2, row: 4 } }, phaseFilament: { fallback: "PF", accent: "signal", atlas: { column: 3, row: 4 } },
  bioLumen: { fallback: "BL", accent: "bio", atlas: { column: 4, row: 4 } }, voidLens: { fallback: "VL", accent: "signal", atlas: { column: 5, row: 4 } },
  sentinelCipher: { fallback: "SC", accent: "signal", atlas: { column: 6, row: 4 } }, riftAlloy: { fallback: "RA", accent: "tech", atlas: { column: 7, row: 4 } },
  phaseLattice: { fallback: "PL", accent: "signal", atlas: { column: 0, row: 5 } }, repairNanites: { fallback: "RN", accent: "tech", atlas: { column: 1, row: 5 } },
  gearPhaseLance: { fallback: "LP", accent: "command", atlas: { column: 2, row: 5 } }, gearLivingBulwark: { fallback: "LB", accent: "bio", atlas: { column: 3, row: 5 } },
  gearChronoDrive: { fallback: "CD", accent: "signal", atlas: { column: 4, row: 5 } }, gearFoundryHeart: { fallback: "FH", accent: "tech", atlas: { column: 5, row: 5 } },
  gearStarfallCrown: { fallback: "SC", accent: "wealth", atlas: { column: 6, row: 5 } },
};

const generic: Record<Exclude<SpriteKind, "skill" | "item">, Omit<SpriteReference, "src">> = {
  operation: { fallback: "OP", accent: "command" },
  cargo: { fallback: "CG", accent: "tech" },
};

function spritePath(folder: string, id: string) {
  return `${assetRoot}${folder}/${id}.png`;
}

/** Returns the expected path and a presentation fallback for any known game ID. */
export function getSprite(kind: SpriteKind, id: string = kind): SpriteReference {
  if (kind === "skill") {
    const definition = skills[id] ?? { fallback: id.slice(0, 2).toUpperCase(), accent: "command" as const };
    return { ...definition, src: spritePath("skills", id) };
  }

  if (kind === "item") {
    if (id === "genesisSeed") return { fallback: "GS", accent: "bio", src: spritePath("items", id) };
    const definition = items[id] ?? { fallback: id.slice(0, 2).toUpperCase(), accent: "tech" as const };
    return { ...definition, src: cargoAtlas };
  }

  if (kind === "operation") {
    // An operation sprite is shared by every activity in its skill, so the
    // asset set stays compact while still covering all present and future IDs.
    const skillId = activitySkillIds[id] ?? id;
    return { ...generic.operation, fallback: skills[skillId]?.fallback ?? generic.operation.fallback, accent: skills[skillId]?.accent ?? generic.operation.accent, src: spritePath("operations", skillId) };
  }

  const definition = generic[kind];
  return { ...definition, src: definition.atlas ? cargoAtlas : spritePath("ui", kind) };
}

/** Directories and IDs for an asset-generation/export pipeline. */
export const spriteAssetDirectories = {
  skills: "public/assets/sprites/skills",
  operations: "public/assets/sprites/operations",
  items: "public/assets/sprites/items",
  cargoAtlas: "public/assets/sprites/cargo-atlas.png",
} as const;
