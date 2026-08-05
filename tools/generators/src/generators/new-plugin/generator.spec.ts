import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { readJson, workspaceRoot, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import newPluginGenerator from './generator';

const TEMPLATE_SRC = join(workspaceRoot, 'templates', 'plugin-base');
const SKIP_DIRS = new Set(['dist', 'out-tsc', 'node_modules']);

// The generator copies templates/plugin-base out of the Nx virtual Tree, but
// createTreeWithEmptyWorkspace() starts empty — seed it from the real
// template on disk so this test exercises the actual template, not a stub.
function seedTemplateIntoTree(tree: Tree): void {
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = relative(TEMPLATE_SRC, fullPath).split(sep).join('/');
        tree.write(`templates/plugin-base/${relativePath}`, readFileSync(fullPath));
      }
    }
  }
  walk(TEMPLATE_SRC);
}

describe('new-plugin generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    seedTemplateIntoTree(tree);
  });

  it('scaffolds a new plugin directory copied from the template', async () => {
    await newPluginGenerator(tree, {
      name: 'SVG Batch Exporter',
      purpose: 'Export every selected frame as an SVG file',
      capabilities: ['export'],
      owner: 'ana',
      keywords: 'svg, export',
      visibility: 'org',
    });

    expect(tree.exists('plugins/svg-batch-exporter/manifest.json')).toBe(true);
    expect(tree.exists('plugins/svg-batch-exporter/src/main/index.ts')).toBe(true);
    expect(tree.exists('plugins/svg-batch-exporter/src/ui/index.ts')).toBe(true);
    expect(tree.exists('plugins/svg-batch-exporter/README.md')).toBe(true);
  });

  it('writes a package.json scoped to the new plugin id', async () => {
    await newPluginGenerator(tree, {
      name: 'SVG Batch Exporter',
      purpose: 'Export every selected frame as an SVG file',
      capabilities: ['export'],
      owner: 'ana',
    });

    const pkg = readJson(tree, 'plugins/svg-batch-exporter/package.json');
    expect(pkg.name).toBe('@plugin-factory/svg-batch-exporter');
  });

  it('writes plugin.meta.json with the real answers', async () => {
    await newPluginGenerator(tree, {
      name: 'SVG Batch Exporter',
      purpose: 'Export every selected frame as an SVG file',
      capabilities: ['export'],
      owner: 'ana',
      keywords: 'svg, export',
      visibility: 'org',
    });

    const meta = readJson(tree, 'plugins/svg-batch-exporter/plugin.meta.json');
    expect(meta).toMatchObject({
      id: 'svg-batch-exporter',
      name: 'SVG Batch Exporter',
      purpose: 'Export every selected frame as an SVG file',
      capabilities: ['export'],
      keywords: ['svg', 'export'],
      owner: 'ana',
      maintainer: 'design-system-foundation',
      status: 'active',
      visibility: 'org',
      allowedGroups: [],
      version: '0.1.0',
    });
  });

  it('defaults visibility to internal and fills a placeholder allowedGroups', async () => {
    await newPluginGenerator(tree, {
      name: 'Internal Tool',
      purpose: 'Does an internal thing',
      capabilities: ['audit'],
      owner: 'ana',
    });

    const meta = readJson(tree, 'plugins/internal-tool/plugin.meta.json');
    expect(meta.visibility).toBe('internal');
    expect(meta.allowedGroups).toHaveLength(1);
  });

  it('falls back keywords to the plugin id when none are given', async () => {
    await newPluginGenerator(tree, {
      name: 'No Keywords Plugin',
      purpose: 'Does a thing without keywords',
      capabilities: ['audit'],
      owner: 'ana',
    });

    const meta = readJson(tree, 'plugins/no-keywords-plugin/plugin.meta.json');
    expect(meta.keywords).toEqual(['no-keywords-plugin']);
  });

  it('rejects a capability outside the controlled vocabulary', async () => {
    await expect(
      newPluginGenerator(tree, {
        name: 'Weird Plugin',
        purpose: 'Does something odd',
        capabilities: ['teleport'],
        owner: 'ana',
      }),
    ).rejects.toThrow(/controlled vocabulary/);
  });

  it('refuses to overwrite an existing plugin directory', async () => {
    tree.write('plugins/svg-batch-exporter/.gitkeep', '');

    await expect(
      newPluginGenerator(tree, {
        name: 'SVG Batch Exporter',
        purpose: 'Export every selected frame as an SVG file',
        capabilities: ['export'],
        owner: 'ana',
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('returns a callback that logs next steps without throwing', async () => {
    const callback = await newPluginGenerator(tree, {
      name: 'SVG Batch Exporter',
      purpose: 'Export every selected frame as an SVG file',
      capabilities: ['export'],
      owner: 'ana',
    });

    expect(() => callback()).not.toThrow();
  });
});
