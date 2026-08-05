# Plugin Base Template

Every plugin in `plugins/` starts as a copy of this folder (normally via the Nx generator in
`tools/generators`, not by hand). This README is copied along with it — trim it down once the
real plugin exists.

## What you should edit

- **`plugin.meta.json`** — fill in every placeholder (`id`, `name`, `purpose`, `capabilities`,
  `keywords`, `owner`, `allowedGroups`, ...). This is what makes the plugin discoverable and
  keeps the catalog's duplicate-detection working for the next person.
- **`manifest.json`** — rename `name`, update `networkAccess.allowedDomains` to the exact hosts
  this plugin actually calls (remove the GitHub entry if you don't need it). Never use a
  wildcard domain — that's a hard CI failure.
- **`src/main/auth-config.ts`** — if `plugin.meta.json`'s `visibility` is `"internal"`, add the
  Figma user ids allowed to run this plugin (or wire `resolveAuthorization` to a real directory
  service). Figma's Plugin API doesn't expose group membership, so `allowedGroups` in the
  metadata is documentation for humans, not enforcement — this file is the enforcement.
- **`src/main/index.ts`** — replace the "say hello" demo (`submit-name` → `echo`) with the
  plugin's real logic. Keep the `isAuthorized` gate around whatever you add.
- **`src/ui/index.html`** and **`src/ui/index.ts`** — build the real UI here, out of
  `@plugin-factory/ui` components (`<pf-button>`, `<pf-field>`, `<pf-card>`, ...).

## What you should not touch

- **Never** use a Bootstrap (or any preset's) class name inside a component or in this plugin's
  own markup — style with `@plugin-factory/ui` components and the preset's `utilityClasses`
  (`pf-row`, `pf-stack`, `pf-container`) only. Swapping the preset later should never require
  touching this file. See `docs/swapping-style-preset.md`.
- **Don't reimplement** anything already in `@plugin-factory/core` (message bridge, node export,
  selection helpers, GitHub client, auth guard, logger) — import it instead.
- **`scripts/build.ts`** — the esbuild setup that bundles `src/main` to `dist/code.js` and
  `src/ui` (with the compiled design tokens CSS inlined) to `dist/ui.html`. Shouldn't need
  changes for a typical plugin.

## Building and loading into Figma

```
nx run @plugin-factory/<your-plugin-name>:build
```

This produces `dist/code.js` and `dist/ui.html`. In the Figma desktop app: **Plugins → Development
→ Import plugin from manifest…**, then pick this folder's `manifest.json`. Figma will assign a
plugin `id` and write it back into `manifest.json` on first import — don't invent one yourself.

## Publishing

CI builds and validates the plugin but does not publish it — Figma has no plugin-publish API.
Publishing to the org is a manual step done by the foundation team in a periodic ritual. Don't
try to automate it.
