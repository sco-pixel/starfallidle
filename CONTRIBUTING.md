# Contributing to Starfall Idle

Thanks for helping improve Starfall Idle. Contributions are welcome for gameplay, balance, UI, accessibility, documentation, bug fixes, and art direction.

## Before you start

- Use an issue or discussion to propose major gameplay, progression, save-format, or visual-direction changes before investing significant time.
- Keep pull requests focused. Separate refactors, gameplay changes, and generated-art changes when practical.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local setup

Starfall Idle requires Node.js 22.13 or newer and pnpm 11.19.0.

```bash
pnpm install
pnpm dev
```

Run the checks before opening a pull request:

```bash
pnpm lint
pnpm build
```

The app is static and deploys to GitHub Pages. The production build is written to `dist/`; do not commit that directory.

## Project guide

- `src/game/` contains the game shell and gameplay UI.
- `src/lib/` contains game state, content, progression logic, and data-driven sprite mappings.
- `src/components/` contains reusable interface components.
- `public/assets/` contains shipped static assets, including generated sprites.
- `src/styles/` contains global styling.

Gameplay must remain playable without a server. Saves live in browser `localStorage`, so preserve backward compatibility in `sanitizeGameState` when changing saved data. Avoid changing the save key or wiping existing values unless a migration is explicitly included and documented.

## Making a change

1. Create a branch from `main`.
2. Make the smallest change that solves the issue.
3. Keep gameplay data and UI changes data-driven where possible.
4. Test the affected flow in the browser, including a fresh save and an existing local save when state handling changes.
5. Run `pnpm lint` and `pnpm build`.
6. Open a pull request with a clear title and description.

For visual changes, include screenshots or a short recording when it helps reviewers. For new generated assets, keep the source prompt or art-direction notes in the pull request description and place only the final, optimized assets in `public/assets/`.

## Pull request expectations

Please include:

- What changed and why.
- Any gameplay, balance, or save-data impact.
- The validation you ran.
- Linked issues, where applicable.

Avoid unrelated formatting churn, generated build output, credentials, and browser save data. Do not add a hosting, authentication, database, or server dependency without first discussing the architecture.

## Reporting bugs

Include clear reproduction steps, the expected and actual behaviour, browser/device details, and screenshots where useful. If a bug affects a local save, do not attach personal save data unless you have removed anything you do not want shared.
