---
name: plugin-creation
description: Use to scaffold and build out a new Figma plugin, after the discovery-and-anti-duplication skill has confirmed nothing similar already exists.
---

# Plugin creation

Prerequisite: you've already run `.claude/skills/discovery-and-anti-duplication/SKILL.md` and
confirmed there's no existing plugin close enough to extend instead. If you haven't, do that
first — this skill doesn't repeat that check on its own (though the generator below re-runs it
as a second safety net).

## Two execution paths

- **Claude Code, terminal available:** follow the steps below directly.
- **Claude Desktop via the Plugin Factory MCP server, no terminal:** use the `create_plugin`,
  `build_plugin`, and `open_pr` tools instead of steps 2, 6, and 7's shell commands — they run
  the same underlying `nx`/`git` commands on the designer's local clone. Steps 1, 3, 4, and 5
  (gathering answers, editing `manifest.json`/the auth guard/the actual plugin logic) are
  unchanged — the MCP server writes files and runs commands, it doesn't write the plugin's logic
  for you. Note: `create_plugin` and `open_pr` take the owner and GitHub credentials from the
  designer's local config automatically — never ask for them or pass them as tool arguments. See
  `tools/mcp-server/README.md`.

## Steps

### 1. Gather the four required answers

You need: the plugin's **name**, its **purpose** (one sentence, one purpose — see the scope rule
in `AGENTS.md`), its **capabilities** (one or more verbs from the controlled vocabulary in
`packages/catalog/src/capabilities.ts`), and its **owner** (the designer). Also decide
**visibility** (`internal` — a specific team/group only, needs an authorization guard filled in;
or `org` — everyone) and optionally a few **keywords**.

If any of these is unclear from the conversation, ask — don't guess a `purpose` or invent
`capabilities` that weren't actually requested.

### 2. Run the generator

```
nx g @plugin-factory/generators:new-plugin \
  --name="<name>" \
  --purpose="<purpose>" \
  --capabilities=<comma-separated capability verbs> \
  --owner="<owner>" \
  --keywords=<comma-separated keywords> \
  --visibility=<internal|org>
```

This copies `templates/plugin-base` into `plugins/<kebab-case-id>`, writes a real
`plugin.meta.json`, and prints any catalog-similarity warnings and any metadata-schema issues.
Read that output before continuing — if it flags a close match you missed, stop and reconsider
extending instead (go back to the discovery skill).

If you're running non-interactively (no TTY for prompts), pass all the flags as shown above. If
you're running interactively, you can omit flags and answer the prompts instead.

### 3. Fill in `manifest.json`

Open `plugins/<id>/manifest.json`. The template ships with `networkAccess.allowedDomains`
pointing at `api.github.com` (for `@plugin-factory/core`'s `GitHubClient`, if the plugin uses
it). Update this to the **exact hosts the plugin actually calls** — remove the GitHub entry if
unused, add others only as needed. **Never** use a wildcard domain. Leave `id` unset — Figma
assigns it automatically the first time the plugin is imported via manifest.

### 4. Fill in the authorization guard, if `visibility` is `internal`

Open `plugins/<id>/src/main/auth-config.ts` and add the Figma user ids allowed to run this
plugin, or wire `resolveAuthorization` to a real directory service if the org has one. Figma's
Plugin API has no group-membership lookup — `plugin.meta.json`'s `allowedGroups` is
documentation for humans, this file is what actually enforces it. Don't skip this for an
`internal` plugin; `runIfAuthorized` in `src/main/index.ts` denies everyone by default until you
do.

### 5. Replace the demo logic with the real plugin

`src/main/index.ts` and `src/ui/` ship with a working "say hello, show selection count" demo so
the scaffold is provably functional out of the box. Replace it with the plugin's actual behavior:

- Add message types to `src/shared/messages.ts` (`ToUiMessages`/`ToMainMessages`) for whatever
  the plugin needs to send in each direction.
- In `src/main/index.ts`, keep the `isAuthorized` gate around any new message handling — a
  handler must never act on a message that arrived before (or despite) denial.
- Use `@plugin-factory/core` for export/selection/GitHub/logging — see the table in `AGENTS.md`.
  Don't reimplement any of it.
- Build the UI out of `@plugin-factory/ui` components (`<pf-button>`, `<pf-field>`, `<pf-card>`)
  in `src/ui/index.html`, wired up in `src/ui/index.ts`. Never reference a style preset's own
  class name (no `btn`, `card`, etc.) — only the DS components' own classes (already handled
  inside each component) and the active preset's `utilityClasses` (`pf-row`, `pf-stack`,
  `pf-container`) for the plugin's own layout markup.

### 6. Verify

```
nx run @plugin-factory/<id>:typecheck
nx run @plugin-factory/<id>:lint
nx run @plugin-factory/<id>:build
```

The build produces `plugins/<id>/dist/code.js` and `dist/ui.html`. There's no automated test
target in the template by default — add one (a `vitest.config.mts` alongside a `.spec.ts`) if the
plugin's logic is non-trivial enough to warrant it, following the pattern in any `packages/*`
project.

### 7. Commit and open a PR

One plugin per pull request — never mix changes to two different plugins in one PR. Use
Conventional Commits. See `AGENTS.md`'s versioning note for how commit type maps to what actually
changed (a fuller designer-facing translation is planned in `docs/versioning.md`, not written
yet).

## What NOT to do

- Don't hand-copy `templates/plugin-base` with `cp`/file-copy tools instead of the generator —
  the generator fills in `package.json`, `project.json`, and `plugin.meta.json` correctly (real
  plugin id, no leftover template name) and runs the duplicate check. A manual copy skips both.
- Don't invent a fifth "capability" verb outside the controlled vocabulary — if nothing fits,
  that's worth flagging to the foundation team to extend the vocabulary
  (`packages/catalog/src/capabilities.ts`), not a reason to write a free-text one.
- Don't leave `visibility: "internal"` with an empty `AUTHORIZED_USER_IDS` and call the plugin
  done — that configuration denies every user.
