---
name: discovery-and-anti-duplication
description: Use before creating any new Figma plugin in this repo — checks the catalog for an existing plugin that already does this, so the repo doesn't accumulate duplicates.
---

# Discovery and anti-duplication

This is the most important skill in the repo. Without it, `plugins/` fills up with five
different SVG exporters within six months. Run this **every time**, before scaffolding a new
plugin — never skip it because the request "sounds obviously new."

## When to use this

The moment a designer asks for a plugin that automates something in Figma — before you touch
`tools/generators` or write any code.

## Two execution paths

- **Claude Code, terminal available:** follow the steps below directly (`nx run ...`, throwaway
  `tsx` scripts).
- **Claude Desktop via the Plugin Factory MCP server, no terminal:** call the `search_catalog`
  tool instead of steps 2-3 below — it runs the exact same `discoverPlugins`/`findSimilarPlugins`
  check server-side and returns the matches directly. See `tools/mcp-server/README.md`. Steps 1,
  4, and 5 (draft the request, decide what to do with matches) are the same either way.

## Steps

1. **Draft the shape of the request**, in the same terms `plugin.meta.json` uses:
   - `purpose` — one sentence, what it does.
   - `capabilities` — verbs from the controlled vocabulary in
     `packages/catalog/src/capabilities.ts` (`export`, `import`, `generate`, `validate`, `sync`,
     `audit`, `convert`, `organize`, `annotate`, `measure`, `rename`, `document`, `publish`,
     `lint`, `extract`, `inject`, `analyze`, `transform`, `schedule`, `notify`).
   - `keywords` — a few free-text search terms.

2. **Get the current catalog.** Regenerate it so you're not looking at stale data:
   ```
   nx run @plugin-factory/catalog:generate
   ```
   This writes `packages/catalog/dist/catalog.json` — a list of every plugin under `plugins/`
   with its full metadata. Read that file.

3. **Compare.** For a quick manual read: scan `catalog.json` for entries whose `purpose` or
   `capabilities` overlap with your draft. For a precise check (worth doing if the catalog has
   more than a handful of entries, or the overlap is ambiguous), run the real similarity scorer
   instead of eyeballing it. Write a small throwaway script **at the repo root** (module
   resolution for `@plugin-factory/catalog` needs to be inside the npm workspace — a temp file
   outside the repo won't find it) and run it with `tsx`, then delete it:
   ```ts
   // tmp-check-similar.ts, at the repo root
   import { discoverPlugins, findSimilarPlugins } from '@plugin-factory/catalog';

   async function main() {
     const { valid } = await discoverPlugins('plugins');
     const matches = findSimilarPlugins(
       { purpose: '<draft purpose>', capabilities: ['<draft capabilities>'], keywords: ['<draft keywords>'] },
       valid,
     );
     console.log(JSON.stringify(matches, null, 2));
   }

   main();
   ```
   ```
   npx tsx tmp-check-similar.ts   # then delete the file
   ```
   (This is exactly what `tools/generators`'s `new-plugin` generator runs automatically as a
   second safety net when you scaffold — see `warnOnSimilarPlugins` in
   `tools/generators/src/generators/new-plugin/generator.ts` — but check *before* you get that
   far, so the conversation with the designer happens before code exists, not after.)

4. **If a close match comes back:** don't create a new plugin. Tell the designer what already
   exists (name, purpose, owner, `plugins/<id>`) and propose extending it instead — a new
   capability, a new option, a variant flag. Only proceed to a new plugin if the designer
   confirms the existing one genuinely doesn't fit (different purpose, different owner/team
   context that shouldn't be coupled, etc.) — extending isn't automatically mandatory, but it
   must be the first thing you propose, not an afterthought.

5. **If nothing close exists:** proceed to the `plugin-creation` skill
   (`.claude/skills/plugin-creation/SKILL.md`).

## What "close" means

There's no single hardcoded threshold you need to memorize — `findSimilarPlugins` defaults to a
0.35 combined score (capabilities weighted highest, then keywords, then purpose text), but use
judgment: a high capability-overlap with a totally unrelated purpose usually isn't a real match
("export" is used by a lot of unrelated plugins), while a lower score with near-identical purpose
wording usually is. When genuinely unsure, surface the candidate to the designer and let them
decide — false positives cost a short conversation, false negatives cost a duplicate plugin.
