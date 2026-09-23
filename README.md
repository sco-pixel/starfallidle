# Starfall Idle

A mobile-friendly science-fiction idle RPG inspired by skill-based progression games. Command the **Aethelgard**, train a permanent crew, build production chains, explore dangerous systems, and continue progressing while offline.

## Current gameplay

- 14 trainable skills with 160+ operations, an original accelerating XP curve to level 100, per-operation mastery, records, unlocks, and deep resource chains
- Exactly five explorable sectors with travel requirements, location-specific activities, and upgradeable outposts
- Nine upgradeable cruiser systems across the Aethelgard
- Ten assignable crew specialists with personal XP, levels, and loyalty
- Mining, salvage, survey, cargo, and combat drones
- Constructible planetary rover and boarding shuttle
- Parallel vessel combat, five late-game bosses, unique equipment, tactical loadouts, persistent battle conditions, shields, hull damage, and automatic retreat
- Eight timed expeditions, faction contracts and alliances, 22 sector objectives, narrative missions, and station markets
- One permanent research tree, discovery collection, operation rares, achievements, and story events
- Capped offline progression with multi-operation production queues and detailed return reports
- Device-local saves and capped offline progression

## Development

Requires Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

## Persistence

Starfall Idle is a static, browser-only app. Progress is saved in `localStorage` under `starfall-idle-save-v5`, and offline progression is calculated when the game opens. Saves are specific to a browser profile and are not shared between devices.


## Stack

- React 19
- Vite
- TypeScript
- GitHub Pages
- Tailwind CSS
- Radix UI and Lucide icons

## Deploy to GitHub Pages

The included GitHub Actions workflow publishes `dist/` whenever `main` is pushed. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once. The deployed game is available at the repository's GitHub Pages URL.
