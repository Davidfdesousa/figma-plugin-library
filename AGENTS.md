# AGENTS.md — Plugin Factory

Read this before generating or modifying anything in this repo. It's the concise rulebook;
the `.claude/skills/` directory has the detailed step-by-step procedures for the workflows
below.

## What this is

Designers build their own Figma plugins here, with Claude, on a foundation the design-system
team maintains. A designer uses their plugin the same week they ask for it; periodically, the
foundation team reviews it and it becomes shared property of the whole team. The point is
**autonomy for the designer, governance for the foundation, reuse across the team** — not
turning designers into engineers. (`docs/architecture.md`, with the reasoning behind each layer,
is planned but not written yet — see "Known gaps" below.)

**Two ways this gets used:** designers with a terminal use Claude Code directly against a local
clone of this repo. Designers without one use Claude Desktop connected to the Plugin Factory MCP
server (`tools/mcp-server`), which exposes the same underlying operations — catalog search,
scaffolding, building, opening a PR — as tools, running locally on that designer's own machine
against their own clone. Both `.claude/skills/*/SKILL.md` files call out where the two paths
diverge (a shell command on one side, an MCP tool call on the other) — the rules in this file
apply identically either way.

## The one rule that matters most: consult before you create

**Before scaffolding any new plugin, check whether something close already exists.** Read
`.claude/skills/discovery-and-anti-duplication/SKILL.md` and follow it. If a close match
exists, propose extending that plugin instead of creating a new one. Skip this and the
catalog degrades into duplicate plugins within months — this is not optional.

## Scope rule: one plugin, one purpose

A plugin's `plugin.meta.json` `purpose` field must be one sentence, describing one thing, with
no "and" joining two distinct purposes. If a request naturally splits into "export X and also
sync Y to GitHub," that's two plugins (or one plugin's PR extending a related plugin, if one of
the two already exists) — not one plugin with a compound purpose. The schema in
`packages/catalog/src/schema.ts` enforces the mechanical checks (length, sentence count, a few
compound-purpose phrase markers); use your judgment for the rest.

## Never reference a style preset's own classes

Every visual thing in this repo is a Web Component (`packages/ui`) styled **exclusively** from
design tokens (`packages/tokens`). A component's template must never contain a class name that
belongs to a specific style preset (e.g. `btn`, `btn-primary`, `card`, `form-control` — those
are Bootstrap's, once the Bootstrap preset exists). A plugin's own light-DOM markup may only use
a preset's `utilityClasses` (`row`/`stack`/`container` today — see
`packages/styles/src/contract.ts`), never a hardcoded class from the preset's stylesheet. This
is what makes swapping the preset a one-line change instead of a rewrite — see
`registerStylePreset()` in `packages/styles/src/style-provider.ts`. (A walkthrough doc,
`docs/swapping-style-preset.md`, is planned but not written yet.)

**Current state:** only the `minimal` preset exists (`packages/styles/src/presets/minimal`). The
Bootstrap preset is planned but not built yet — don't assume it exists.

## Token and file naming conventions

- Semantic color tokens: `bg.*` for background (never `background`), `content.*` for text/icon
  color (never `fg`/`foreground`). Variations in use: `subtle`, `muted`, `strong`, `intense`,
  `hover`, `pressed`. See `packages/tokens/src/semantics/color.ts`.
- Spacing is categorized by usage, not a raw scale: `stack.*` (vertical space between elements),
  `inset.*` (padding inside a container). See `packages/tokens/src/semantics/spacing.ts`.
- Never reference a primitive token (`packages/tokens/src/primitives/*`) directly from a
  component or a plugin — always go through a semantic token via `cssVar()`
  (`packages/tokens/src/css-var.ts`).
- Everything is named in English — no mixed-language identifiers, file names, or plugin ids.
- Plugin ids are lowercase kebab-case, matching the plugin's folder name under `plugins/`.

## Utilities that must never be reimplemented

All in `@plugin-factory/core` (`packages/core/src`) — import, don't rewrite:

| Need | Import from |
|---|---|
| Main-thread ↔ UI messaging | `@plugin-factory/core` (`createMainBridge`, `createUiBridge`) |
| Export a node to SVG/PNG/JSON | `@plugin-factory/core` (`exportNodeAsSvg`, `exportNodeAsPng`, `serializeNodeToJson`) |
| Read the user's selection safely | `@plugin-factory/core` (`getSelection`, `walkSelection`, `filterSelectionByType`) |
| Call GitHub (read/open a PR) | `@plugin-factory/core` (`GitHubClient`) — restricted to `api.github.com` |
| Authorization guard | `@plugin-factory/core` (`runIfAuthorized`, `checkAuthorization`) |
| Logging without leaking secrets | `@plugin-factory/core` (`createLogger`) |

And the three Web Components in `@plugin-factory/ui` (`pf-button`, `pf-field`, `pf-card`) —
extend them with props/slots, don't build a parallel button/field/card.

## Authorization guard is mandatory for `visibility: "internal"`

Figma's Plugin API has no group-membership lookup — only a user id and name. If
`plugin.meta.json`'s `visibility` is `"internal"`, the plugin's `src/main/auth-config.ts` must
list authorized Figma user ids (or wire `resolveAuthorization` to a real directory service), and
`src/main/index.ts` must gate all plugin behavior behind `runIfAuthorized` — not just hide UI,
actually refuse to act on messages from an unauthorized session. `templates/plugin-base` already
wires this correctly; keep that structure when you replace the demo logic.

## Adding a new plugin — step by step

1. Read `.claude/skills/discovery-and-anti-duplication/SKILL.md` and confirm nothing similar exists.
2. Read `.claude/skills/plugin-creation/SKILL.md` and follow it: run the generator
   (`nx g @plugin-factory/generators:new-plugin`), fill in `manifest.json`'s `networkAccess`,
   fill in the auth guard if internal, replace the demo logic, verify with
   `nx run @plugin-factory/<id>:typecheck,lint,build`.
3. One plugin per pull request — never mix two plugins' changes in one PR. Conventional Commits;
   the designer describes what changed in plain language, the commit type is derived from that.
   (A designer-facing translation of semver, `docs/versioning.md`, is planned but not written yet
   — for now, use standard Conventional Commits judgment: `fix:` for a correction, `feat:` for a
   non-breaking addition, `feat!:`/`BREAKING CHANGE:` for a change to what the plugin delivers or
   how it's used.)

## Changing an existing plugin

The dedicated skill for this (`.claude/skills/plugin-modification/`) doesn't exist yet — until
it does: read the target plugin's `plugin.meta.json` to understand its declared purpose and
capabilities first, keep the change inside that purpose (if it's drifting outside, that's a
scope-cohesion problem — see above), and still follow the naming/token/utility rules in this
file. Ask the designer what changed in plain language before writing the commit.

## Known gaps (don't assume these exist)

- No Bootstrap style preset yet (`minimal` only).
- No CI validators or GitHub Actions workflow yet — nothing currently blocks a PR automatically.
- Only 2 of the planned 6 Claude Skills exist: discovery-and-anti-duplication, plugin-creation.
- `docs/architecture.md`, `docs/creating-a-plugin.md`, `docs/swapping-style-preset.md`,
  `docs/versioning.md`, and `CODEOWNERS` don't exist yet.

These are tracked as a deliberate "polish pass" that comes after the core create-a-plugin flow
works end to end — not oversights. Don't route around them by inventing a CI config or a second
style preset unless asked to.
