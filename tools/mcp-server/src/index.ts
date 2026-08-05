#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadConfig } from './config.js';
import { buildPlugin } from './tools/build-plugin.js';
import { createPlugin } from './tools/create-plugin.js';
import { openPluginPr } from './tools/open-pr.js';
import { listPluginFiles, readPluginFile, writePluginFile } from './tools/plugin-files.js';
import { searchCatalog } from './tools/search-catalog.js';

const config = loadConfig();

// A tool list alone doesn't tell the model *when* or *why* to use each one —
// `instructions` is sent to the client at connect time specifically for that.
// Claude Desktop has no other way to see AGENTS.md or the skills; without
// this, a designer's request would just mechanically call tools with none of
// the governance rules (consult the catalog first, one purpose per plugin,
// never a preset's own classes, reuse @plugin-factory/core) applied.
const SERVER_INSTRUCTIONS = `
This server scaffolds and ships Figma plugins in a monorepo where designers create their own
plugins with Claude, governed by a design-system foundation team. Full rules are in two
resources this server exposes — read \`plugin-factory://agents-md\` before doing anything, and
the relevant skill resource before each step below.

Mandatory flow for "create me a plugin that does X":
1. Read \`plugin-factory://skills/discovery-and-anti-duplication\`, then call \`search_catalog\`.
   If a close match comes back, propose extending it instead of creating a new plugin — do not
   scaffold a new one without raising this first.
2. Read \`plugin-factory://skills/plugin-creation\`, then call \`create_plugin\`. Never invent an
   \`owner\` or GitHub credential — both come from the designer's local config automatically.
3. Use \`list_plugin_files\`/\`read_plugin_file\`/\`write_plugin_file\` to replace the scaffolded
   demo logic with the real thing, following \`plugin-factory://agents-md\`'s naming/utility-reuse
   rules. These are scoped to that one plugin's own folder — you cannot read or write anything
   under \`packages/\`, another plugin, or anywhere outside \`plugins/<id>\` through them.
4. Call \`build_plugin\` and only proceed once it reports success.
5. Call \`open_pr\` once the build passes.

The plugin's \`purpose\` must be one sentence, one purpose — no "and also". If a request splits
into two unrelated things, say so instead of cramming both into one plugin.
`.trim();

const server = new McpServer({ name: 'plugin-factory', version: '0.1.0' }, { instructions: SERVER_INSTRUCTIONS });

function registerFileResource(name: string, uri: string, title: string, relativePath: string): void {
  server.registerResource(
    name,
    uri,
    { title, mimeType: 'text/markdown' },
    async () => ({
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: readFileSync(join(config.repoPath, relativePath), 'utf8'),
        },
      ],
    }),
  );
}

registerFileResource('agents-md', 'plugin-factory://agents-md', 'Plugin Factory rules (AGENTS.md)', 'AGENTS.md');
registerFileResource(
  'skill-discovery',
  'plugin-factory://skills/discovery-and-anti-duplication',
  'Skill: discovery and anti-duplication',
  '.claude/skills/discovery-and-anti-duplication/SKILL.md',
);
registerFileResource(
  'skill-plugin-creation',
  'plugin-factory://skills/plugin-creation',
  'Skill: plugin creation',
  '.claude/skills/plugin-creation/SKILL.md',
);

server.registerTool(
  'search_catalog',
  {
    title: 'Search the plugin catalog',
    description:
      'Check whether a plugin with a similar purpose/capabilities/keywords already exists before creating a new one. Always call this first — see the discovery-and-anti-duplication skill.',
    inputSchema: {
      purpose: z.string().describe('One-sentence draft purpose for the plugin being considered'),
      capabilities: z.array(z.string()).describe('Draft capability verbs (controlled vocabulary)'),
      keywords: z.array(z.string()).default([]).describe('Draft search keywords'),
    },
  },
  async ({ purpose, capabilities, keywords }) => {
    const matches = await searchCatalog(config.repoPath, { purpose, capabilities, keywords });
    return { content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] };
  },
);

server.registerTool(
  'create_plugin',
  {
    title: 'Scaffold a new plugin',
    description:
      'Scaffolds a new plugin from templates/plugin-base via the Nx generator. Only call this after search_catalog confirms nothing similar exists. The owner is filled in automatically from the local designer config, not asked for.',
    inputSchema: {
      name: z.string().describe('Human-readable plugin name'),
      purpose: z.string().describe('One sentence, one purpose'),
      capabilities: z.array(z.string()).min(1).describe('Capability verbs from the controlled vocabulary'),
      keywords: z.array(z.string()).default([]),
      visibility: z.enum(['internal', 'org']).default('internal'),
    },
  },
  async ({ name, purpose, capabilities, keywords, visibility }) => {
    const result = await createPlugin(config.repoPath, config.designer.name, {
      name,
      purpose,
      capabilities,
      keywords,
      visibility,
    });
    return { content: [{ type: 'text', text: result.output }] };
  },
);

server.registerTool(
  'list_plugin_files',
  {
    title: 'List a plugin\'s files',
    description:
      'Lists every file under plugins/<id> (build artifacts excluded), so you know what the scaffold produced before editing it.',
    inputSchema: {
      id: z.string().describe('Plugin id, e.g. "svg-batch-exporter"'),
    },
  },
  async ({ id }) => {
    const files = await listPluginFiles(config.repoPath, id);
    return { content: [{ type: 'text', text: files.join('\n') }] };
  },
);

server.registerTool(
  'read_plugin_file',
  {
    title: 'Read a file from a plugin',
    description: 'Reads one file under plugins/<id>. Scoped to that plugin\'s own folder only.',
    inputSchema: {
      id: z.string().describe('Plugin id, e.g. "svg-batch-exporter"'),
      path: z.string().describe('Path relative to plugins/<id>, e.g. "src/main/index.ts"'),
    },
  },
  async ({ id, path }) => {
    const content = await readPluginFile(config.repoPath, id, path);
    return { content: [{ type: 'text', text: content }] };
  },
);

server.registerTool(
  'write_plugin_file',
  {
    title: 'Write a file in a plugin',
    description:
      'Overwrites (or creates) one file under plugins/<id> with the given content. Scoped to that plugin\'s own folder only — cannot touch packages/, another plugin, or anything else in the repo.',
    inputSchema: {
      id: z.string().describe('Plugin id, e.g. "svg-batch-exporter"'),
      path: z.string().describe('Path relative to plugins/<id>, e.g. "src/main/index.ts"'),
      content: z.string().describe('The full new content of the file'),
    },
  },
  async ({ id, path, content }) => {
    await writePluginFile(config.repoPath, id, path, content);
    return { content: [{ type: 'text', text: `Wrote plugins/${id}/${path}` }] };
  },
);

server.registerTool(
  'build_plugin',
  {
    title: 'Typecheck, lint, and build a plugin',
    description: 'Runs typecheck, lint, and the esbuild bundle for a plugin by id (the plugins/<id> folder name).',
    inputSchema: {
      id: z.string().describe('Plugin id, e.g. "svg-batch-exporter"'),
    },
  },
  async ({ id }) => {
    const result = await buildPlugin(config.repoPath, id);
    return {
      content: [{ type: 'text', text: result.output }],
      isError: !result.success,
    };
  },
);

server.registerTool(
  'open_pr',
  {
    title: 'Commit and open a pull request',
    description:
      'Creates a branch, commits everything currently changed in the working tree, pushes it with the designer\'s own GitHub credentials, and opens a PR. Call build_plugin first and only call this once it succeeds.',
    inputSchema: {
      id: z.string().describe('Plugin id — used to name the branch (plugin/<id>)'),
      title: z.string().describe('PR title — Conventional Commits format, e.g. "feat(svg-batch-exporter): add plugin"'),
      body: z.string().optional().describe('PR description'),
    },
  },
  async ({ id, title, body }) => {
    const pr = await openPluginPr(
      {
        repoPath: config.repoPath,
        githubToken: config.designer.github.token,
        repositoryOwner: config.repository.owner,
        repositoryName: config.repository.name,
        baseBranch: config.repository.baseBranch,
      },
      { id, title, body },
    );
    return { content: [{ type: 'text', text: pr.html_url }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
