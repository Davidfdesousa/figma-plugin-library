# Plugin Factory MCP server

Bridges Claude Desktop (no terminal, no code editor) to this repo. Runs **locally on your own
machine**, against your own clone of `plugin-factory` — it is not a shared/hosted service. Under
the hood it just runs the same `nx` commands and `git` commands a designer using Claude Code
would run themselves; Claude Desktop calls it as tools instead of you typing commands.

## One-time setup

You need Node.js and this repo cloned locally — the server still needs to run real builds and
git commands on disk, it just does it on your behalf instead of you typing them.

1. Clone this repo somewhere on your machine (if you haven't already) and run `npm install` at
   its root once.
2. From the repo root, run the setup wizard:
   ```
   npx tsx tools/mcp-server/setup.ts
   ```
   It asks a handful of questions — your name, GitHub username, GitHub token (you can skip this
   and fill it in later if you only want to try creating/building a plugin today, not opening a
   real PR yet), and the repo this codebase lives in on GitHub — then **writes
   `~/.plugin-factory/config.json` and updates `claude_desktop_config.json` for you**, merging in
   without touching anything else already configured there. No manual JSON editing needed.
3. Restart Claude Desktop. It should show "plugin-factory" under its connected tools/MCP
   servers. Try asking it something that would use `search_catalog` (e.g. "is there already a
   plugin that exports SVGs?").

Re-running the wizard later (e.g. to add a real GitHub token) is safe — it overwrites your
answers, it doesn't duplicate anything.

<details>
<summary>Setting it up by hand instead (if the wizard doesn't work for you)</summary>

1. Copy `tools/mcp-server/config.example.json` to `~/.plugin-factory/config.json` (on Windows,
   `%USERPROFILE%\.plugin-factory\config.json`) and fill it in:
   - `repoPath` — the absolute path to your local clone.
   - `designer.name` — used as `plugin.meta.json`'s `owner` field automatically; you're never
     asked for it again.
   - `designer.github.username`/`token` — your own GitHub account. Create a
     [personal access token](https://github.com/settings/tokens) with `repo` scope (needed to
     push a branch and open a PR). **Treat this file like a password** — it lives in your home
     directory, outside the repo entirely, specifically so it can never accidentally get
     committed.
   - `repository.owner`/`name` — the GitHub org/user and repo name this codebase lives in.
2. Add the server to Claude Desktop's MCP config. Find (or create) `claude_desktop_config.json`:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   Add an entry (merge with whatever's already there, don't replace the whole file):
   ```json
   {
     "mcpServers": {
       "plugin-factory": {
         "command": "npx",
         "args": ["tsx", "/absolute/path/to/plugin-factory/tools/mcp-server/src/index.ts"]
       }
     }
   }
   ```
   Use the real absolute path to your clone. Restart Claude Desktop.
</details>

## What the seven tools do

| Tool | What it runs | Needs |
|---|---|---|
| `search_catalog` | `discoverPlugins`/`findSimilarPlugins` from `@plugin-factory/catalog` | nothing — read-only |
| `create_plugin` | `nx g @plugin-factory/generators:new-plugin ...` | nothing — writes files locally |
| `list_plugin_files` | lists everything under `plugins/<id>` (build output excluded) | nothing — read-only |
| `read_plugin_file` | reads one file under `plugins/<id>` | nothing — read-only |
| `write_plugin_file` | overwrites/creates one file under `plugins/<id>` | nothing — local write |
| `build_plugin` | `nx run-many -t typecheck,lint,build --projects=@plugin-factory/<id>` | nothing — local build |
| `open_pr` | `git checkout -b`, `git commit`, `git push`, then `GitHubClient.openPullRequest` | your GitHub token, push access to the repo |

`create_plugin` and `open_pr` never ask for an "owner" parameter — it's always taken from your
local config, so a plugin's declared owner can't drift from who actually created it.

`list_plugin_files`/`read_plugin_file`/`write_plugin_file` are how Claude actually edits the
plugin's logic after scaffolding — they're deliberately scoped to one plugin's own folder
(`plugins/<id>/**`) and reject any path that would escape it (`../` traversal, an absolute path
elsewhere), so Claude can't read or modify `packages/`, another plugin, or anything else in the
repo through them. The server also exposes 3 MCP **resources** (`plugin-factory://agents-md` and
the 2 skill files) so Claude can read the actual governance rules, not just guess from tool
names/descriptions.

## Troubleshooting

- **"No Plugin Factory config found"** — you haven't created `~/.plugin-factory/config.json`
  yet, or it's not valid against the schema in `src/config.ts`. The error message includes the
  exact path it looked for.
- **`open_pr` fails with a GitHub API error** — check your token has `repo` scope and hasn't
  expired, and that `repository.owner`/`name` in your config match the real repo.
- **`build_plugin` reports failure** — read the returned output, it's the real `nx` command
  output (typecheck/lint/build errors), not a wrapped/summarized version.
