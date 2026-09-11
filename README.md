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
- Research tree and permanent specializations, discovery collection, operation rares, achievements, story events, and redesigned patrol prestige
- Capped offline progression with multi-operation production queues and detailed return reports
- Device-local guest saves and per-user D1 cloud saves through optional Sign in with ChatGPT

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

## Persistence and authentication

The public game can be played without an account. Guest progress is stored locally in the browser.

Signed-in visitors are identified through Sites-managed ChatGPT authentication headers. Save authorization is checked server-side, and each user's state is stored as a JSON record in Cloudflare D1. The database schema and migration are under `db/` and `drizzle/`.

## Stack

- React 19
- Next.js / Vinext
- TypeScript
- Cloudflare Workers and D1
- Tailwind CSS
- Radix UI and Lucide icons

## Live game

[Play Starfall Idle](https://starfall-idle.lacoot.chatgpt.site)
