# Plugin Factory

Designers build their own Figma plugins here, with Claude, on a foundation the design-system
team maintains. A designer uses their plugin the same week they ask for it; periodically, the
foundation team reviews it and it becomes shared property of the whole team. The goal is
**autonomy for the designer, governance for the foundation, reuse across the team** — not
turning designers into engineers.

Full rules for how Claude should behave in this repo live in [`AGENTS.md`](./AGENTS.md). This
README is the human-facing map of the codebase.

## How a designer actually uses this

There are two supported ways to talk to Claude about a plugin, depending on what's available:

- **Claude Code, terminal available.** Clone this repo, run `npm install` once, open Claude Code
  in it. Claude reads `AGENTS.md` and `.claude/skills/` automatically — just ask for a plugin in
  plain language.
- **Claude Desktop, no terminal.** Set up the [Plugin Factory MCP server](./tools/mcp-server)
  once (a few minutes, see its README) — it runs **locally on your own machine**, against your
  own clone of this repo. It is not a hosted/shared service: every designer runs their own copy,
  using their own GitHub credentials to open PRs. Claude Desktop then talks to it as MCP tools
  instead of you typing commands.

Either way, the actual rules Claude follows (consult the catalog first, one purpose per plugin,
never touch a style preset's own classes, reuse `@plugin-factory/core`, ...) are identical — see
`AGENTS.md`.

## Repo structure

```
plugin-factory/
├── packages/
│   ├── tokens/     design tokens (source of truth for color/spacing/typography), no visual-library awareness
│   ├── styles/     the Bootstrap-isolation layer: preset contract + style-provider (only the "minimal" preset exists so far)
│   ├── ui/         Web Components (pf-button, pf-field, pf-card), styled only from tokens
│   ├── core/       plugin-runtime utilities: message bridge, node export, selection helpers, GitHub client, auth guard, logger
│   └── catalog/    plugin.meta.json schema + the similarity search that powers anti-duplication
├── templates/
│   └── plugin-base/   the scaffold every new plugin starts from
├── plugins/            each designer's plugin lives here as plugins/<id> — empty until the first one is created
├── tools/
│   ├── generators/     the Nx generator that scaffolds a new plugin from templates/plugin-base
│   └── mcp-server/     the local MCP server for the Claude Desktop path (see above)
├── .claude/skills/      step-by-step procedures Claude follows (discovery/anti-dup, plugin creation, ...)
├── AGENTS.md            the rulebook Claude reads before generating anything
└── docs/                 planned, not written yet — see AGENTS.md's "Known gaps"
```

## Working on the foundation itself (not a plugin)

This is an [Nx](https://nx.dev) monorepo with npm workspaces. Common commands, run from the repo
root:

```
npm install                                    # install everything
nx run-many -t typecheck,lint,test             # verify the whole workspace
nx run @plugin-factory/<project>:test          # test one package
nx run @plugin-factory/catalog:generate        # regenerate the plugin catalog
nx g @plugin-factory/generators:new-plugin     # scaffold a new plugin (interactive prompts)
```

Every package's own `README.md` (where one exists) has package-specific detail; `AGENTS.md` has
the naming/architecture rules that apply everywhere.

## Current status

The core loop — designer asks, Claude checks the catalog, scaffolds from the template, builds,
opens a PR — works end to end, on both execution paths above. Deliberately not built yet: a
second style preset (Bootstrap), CI validators, 4 of the 6 planned Claude Skills, and most of
`docs/`. See `AGENTS.md`'s "Known gaps" section for the up-to-date list — don't assume something
exists just because it would make sense to.
