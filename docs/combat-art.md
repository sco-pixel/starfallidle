# Combat sprite art

These three atlases were generated with the built-in image generation tool for the combat console. They cover the Aethelgard, all 46 combat targets, and an optional asteroid tile. Each atlas has a 4 by 4 grid; slots are read left to right, top to bottom. The stable game-ID mapping lives in `src/lib/combat-sprites.ts`.

Sprites are static pixel art. Weapon effects and hitsplats are driven by real attack events. Each attack applies accuracy, weapon strength, enemy armour, shields, and hull damage; only reducing enemy hull to zero earns a victory. Reduced-motion preferences disable decorative movement while keeping damage labels readable.

The combat engine persists damaged enemy HP, attack cooldowns, paid engagement supplies, and its random seed within the existing version-5 save. Old saves start a fresh enemy; transient hitsplats are never replayed after load. Live and capped offline progression share the same chronological attack/training simulation. Guided missiles cost one missile per shot; ordinary engagement supplies are charged once per enemy. Repair selects the highest eligible, affordable repair operation and leaves the combat page open.

Run `pnpm test`, `pnpm lint`, and `pnpm build` to validate combat and repair behavior.

The source reference was `public/assets/sprites/operations/combat.png`. The original header, sidebars, shared sprites, and global theme are retained.

## Generation prompts

Each sheet received a final built-in image edit to preserve the sixteen identities and their order while reducing sprites to roughly 60% of their cells, centering them, and leaving transparent gutters on all sides. The two white/green vessels in fleet-2 were turned to face left. Final files are the padded versions, not the initial tightly packed generations.

### fleet-1.png

Game production asset, crisp detailed 2D sci-fi pixel-art sprite atlas. EXACTLY a 4-column by 4-row regular grid of 16 separate sprites, square canvas 1024x1024 or larger square, equal 25%-width and 25%-height cells. Every sprite centered exactly in its cell, maximum bounding box 70% of cell width and height, large empty transparent gutters. Absolutely transparent background alpha, NOT a checkerboard graphic, no background scene, no shadows outside sprite, no labels, text, borders, cell outlines or interface. Each cell contains ONE complete isolated sprite, never clipped or crossing into neighbouring cell. Clean readable silhouettes and controlled pixel clusters. Style match supplied existing combat art: steel panels, low-res pixel edges, small high contrast highlights, muted sci-fi colours, limited emissive engine pixels. Three-quarter TOP-DOWN side-facing ships consistent viewpoint; ALL enemy ships point LEFT (nose left, engine right); only named allied Aethelgard points RIGHT. No laser beams, impacts, starfields or extra sprites. Make each named vessel distinct. Required exact row-major content, left-to-right then top-to-bottom:
Row 1, column 1: Aethelgard allied cruiser, faces RIGHT, long steel-grey angular hull, amber cockpit, orange rear engines.
Row 1, column 2: Scavenger Drone, red-eyed black orb with four claw arms.
Row 1, column 3: Helix Security Automata, white-grey angular quarantine security platform green sensors.
Row 1, column 4: Corsair Skiff, compact rust-orange raider ship.
Row 2, column 1: Corsair Frigate, broad heavily armoured red-grey capital raider.
Row 2, column 2: Void Sentinel, ancient angular bronze guardian with violet core.
Row 2, column 3: Silent Dreadnought, massive long black machine warship red slots.
Row 2, column 4: Ore Jacker, yellow industrial pirate tug with grabbing arms.
Row 3, column 1: Drift Marauder, narrow patched rust raider arrowhead.
Row 3, column 2: Gravimetric Mine, spherical dark grey mine with amber centre and spikes.
Row 3, column 3: Prospector Ambush, battered mining combat barge yellow stripes.
Row 3, column 4: Relay Sentry, small radar combat satellite with blue sensors.
Row 4, column 1: Helix Quarantine Drone, white ceramic red quarantine security drone.
Row 4, column 2: Spore Skiff, green organic ship with small spore sacs.
Row 4, column 3: Corsair Cutter, knife-shaped red pirate cutter.
Row 4, column 4: Relic Guardian, bronze circular relic construct cyan central eye.

### fleet-2.png

Game production asset, crisp detailed 2D sci-fi pixel-art sprite atlas. EXACTLY a 4-column by 4-row regular grid of 16 separate sprites, square canvas 1024x1024 or larger square, equal 25%-width and 25%-height cells. Every sprite centered exactly in its cell, maximum bounding box 70% of cell width and height, large empty transparent gutters. Absolutely transparent background alpha, NOT a checkerboard graphic, no background scene, no shadows outside sprite, no labels, text, borders, cell outlines or interface. Each cell contains ONE complete isolated sprite, never clipped or crossing into neighbouring cell. Clean readable silhouettes and controlled pixel clusters. Style match supplied existing combat art: steel panels, low-res pixel edges, small high contrast highlights, muted sci-fi colours, limited emissive engine pixels. Three-quarter TOP-DOWN side-facing ships consistent viewpoint; ALL enemy ships point LEFT (nose left, engine right); only named allied Aethelgard points RIGHT. No laser beams, impacts, starfields or extra sprites. Make each named vessel distinct. Required exact row-major content, left-to-right then top-to-bottom:
Row 1, column 1: Helix Interceptor, sleek white quarantine fighter green fins.
Row 1, column 2: Cinder Gunboat, charcoal gunship with orange twin cannons.
Row 1, column 3: Rift Scavenger, asymmetric blue-violet salvager with claws.
Row 1, column 4: Corsair Boarding Craft, thick armoured red boarding shuttle.
Row 2, column 1: Quarantine Destroyer, white-and-green elongated destroyer.
Row 2, column 2: Phase Raider, translucent violet dark raider silhouette with solid edges.
Row 2, column 3: Corsair Corvette, sharp red and grey pirate corvette.
Row 2, column 4: Rift Lancer, long pointed violet spear-shaped vessel.
Row 3, column 1: Helix Bio-Drone, green organic insectoid machine hybrid.
Row 3, column 2: Cinder Escort, stout rust-grey escort vessel with orange thrusters.
Row 3, column 3: Orpheus Warden, violet ring-shaped guardian with cyan eye.
Row 3, column 4: Rift Harvester, dark violet industrial vessel with paired harvesting prongs.
Row 4, column 1: Corsair Strike Frigate, large twin-hull red-grey pirate warship.
Row 4, column 2: Phase Stalker, black sharp three-pronged stealth fighter violet accent.
Row 4, column 3: Temporal Corsair, silver pirate craft with violet time-coil rear.
Row 4, column 4: Rift Survey Dread, broad survey warship with bright purple antenna array.

### fleet-3.png

Game production asset, crisp detailed 2D sci-fi pixel-art sprite atlas. EXACTLY a 4-column by 4-row regular grid of 16 separate sprites, square canvas 1024x1024 or larger square, equal 25%-width and 25%-height cells. Every sprite centered exactly in its cell, maximum bounding box 70% of cell width and height, large empty transparent gutters. Absolutely transparent background alpha, NOT a checkerboard graphic, no background scene, no shadows outside sprite, no labels, text, borders, cell outlines or interface. Each cell contains ONE complete isolated sprite, never clipped or crossing into neighbouring cell. Clean readable silhouettes and controlled pixel clusters. Style match supplied existing combat art: steel panels, low-res pixel edges, small high contrast highlights, muted sci-fi colours, limited emissive engine pixels. Three-quarter TOP-DOWN side-facing ships consistent viewpoint; ALL enemy ships point LEFT (nose left, engine right); only named allied Aethelgard points RIGHT. No laser beams, impacts, starfields or extra sprites. Make each named vessel distinct. Required exact row-major content, left-to-right then top-to-bottom:
Row 1, column 1: Sentinel Scout, small black triangular machine with blue eye.
Row 1, column 2: Machine Boarding Pod, dark mechanical armoured capsule with red clamps.
Row 1, column 3: Silent Skirmisher, jagged black fast machine with red fins.
Row 1, column 4: Sentinel Hunter, angular graphite predator vessel with red targeting lens.
Row 2, column 1: Machine Rail Platform, gunmetal floating rail cannon platform orange rails.
Row 2, column 2: Silent Systems Frigate, angular long black heavy frigate with red engine slots.
Row 2, column 3: Sentinel Custodian, symmetrical bronze-grey shield-shaped guardian with cyan core.
Row 2, column 4: Machine Breacher, heavily armoured black ram ship orange drill head.
Row 3, column 1: Void Cartographer, unusual black orbital instrument ship purple gyroscope.
Row 3, column 2: Silent Dreadnought advanced, huge skeletal machine dreadnought with crimson power spine.
Row 3, column 3: Corsair Carrier BOSS, enormous red-grey flight-deck carrier with side hangars.
Row 3, column 4: Helix Bio-Ship BOSS, green glowing living warship fused with metal hull.
Row 4, column 1: Rift Leviathan BOSS, great violet cosmic armoured serpent with cyan crystalline spines.
Row 4, column 2: Sentinel Foundry BOSS, mobile black-bronze factory ship orange furnace vents.
Row 4, column 3: Machine Intelligence Core FINAL BOSS, ominous black segmented orbital sphere with red central singular eye and symmetrical mechanical arms.
Row 4, column 4: Asteroid, irregular dark blue-grey rocky chunk without glow.
