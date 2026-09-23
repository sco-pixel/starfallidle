/** Fixed atlas slots: art must never move when activity order or unlock levels change. */
export const combatSpriteSlots = {
  aethelgard: [1, 0],
  "scavenger-drone": [1, 1],
  "helix-automata": [1, 2],
  "corsair-skiff": [1, 3],
  "pirate-frigate": [1, 4],
  "void-sentinel": [1, 5],
  "silent-dreadnought": [1, 6],
  "combat-contact-01": [1, 7],
  "combat-contact-02": [1, 8],
  "combat-contact-03": [1, 9],
  "combat-contact-04": [1, 10],
  "combat-contact-05": [1, 11],
  "combat-contact-06": [1, 12],
  "combat-contact-07": [1, 13],
  "combat-contact-08": [1, 14],
  "combat-contact-09": [1, 15],
  "combat-contact-10": [2, 0],
  "combat-contact-11": [2, 1],
  "combat-contact-12": [2, 2],
  "combat-contact-13": [2, 3],
  "combat-contact-14": [2, 4],
  "combat-contact-15": [2, 5],
  "combat-contact-16": [2, 6],
  "combat-contact-17": [2, 7],
  "combat-contact-18": [2, 8],
  "combat-contact-19": [2, 9],
  "combat-contact-20": [2, 10],
  "combat-contact-21": [2, 11],
  "combat-contact-22": [2, 12],
  "combat-contact-23": [2, 13],
  "combat-contact-24": [2, 14],
  "combat-contact-25": [2, 15],
  "combat-contact-26": [3, 0],
  "combat-contact-27": [3, 1],
  "combat-contact-28": [3, 2],
  "combat-contact-29": [3, 3],
  "combat-contact-30": [3, 4],
  "combat-contact-31": [3, 5],
  "combat-contact-32": [3, 6],
  "combat-contact-33": [3, 7],
  "combat-contact-34": [3, 8],
  "combat-contact-35": [3, 9],
  "boss-corsair-carrier": [3, 10],
  "boss-helix-bioship": [3, 11],
  "boss-rift-leviathan": [3, 12],
  "boss-sentinel-foundry": [3, 13],
  "boss-machine-intelligence": [3, 14],
  asteroid: [3, 15],
} as const satisfies Record<string, readonly [number, number]>;

export type CombatSpriteId = keyof typeof combatSpriteSlots;

export type CombatSpriteReference = {
  src: string;
  column: number;
  row: number;
};

/** Relative paths support both local previews and GitHub Pages subpaths. */
export function getCombatSprite(id: string): CombatSpriteReference | undefined {
  if (!Object.prototype.hasOwnProperty.call(combatSpriteSlots, id)) return undefined;
  const [fleet, slot] = combatSpriteSlots[id as CombatSpriteId];
  return {
    src: `./assets/sprites/combat/fleet-${fleet}.png`,
    column: slot % 4,
    row: Math.floor(slot / 4),
  };
}
