import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { discoverPlugins, findDuplicateIdentifiers, PLUGIN_META_FILENAME } from './discover';
import type { PluginMetadata } from './schema';

function metadata(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'svg-batch-exporter',
    name: 'SVG Batch Exporter',
    purpose: 'Export every selected frame as an SVG file',
    capabilities: ['export'],
    keywords: ['svg', 'export'],
    owner: 'ana',
    maintainer: 'design-system-foundation',
    visibility: 'org',
    version: '1.0.0',
    ...overrides,
  };
}

async function writePlugin(root: string, dirName: string, content: unknown): Promise<void> {
  const dir = join(root, dirName);
  await mkdir(dir, { recursive: true });
  const body = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  await writeFile(join(dir, PLUGIN_META_FILENAME), body, 'utf8');
}

describe('discoverPlugins', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'plugin-factory-catalog-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('returns an empty result for a directory that does not exist', async () => {
    const result = await discoverPlugins(join(root, 'nope'));
    expect(result).toEqual({ valid: [], errors: [] });
  });

  it('skips subdirectories with no plugin.meta.json', async () => {
    await mkdir(join(root, 'not-a-plugin'), { recursive: true });
    const result = await discoverPlugins(root);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('collects valid metadata from every plugin subdirectory', async () => {
    await writePlugin(root, 'svg-exporter', metadata({ id: 'svg-exporter' }));
    await writePlugin(root, 'png-exporter', metadata({ id: 'png-exporter', name: 'PNG Exporter' }));

    const result = await discoverPlugins(root);
    expect(result.valid.map((p) => p.id).sort()).toEqual(['png-exporter', 'svg-exporter']);
    expect(result.errors).toHaveLength(0);
  });

  it('reports invalid JSON as an error, keyed by directory', async () => {
    await writePlugin(root, 'broken', '{ not valid json');
    const result = await discoverPlugins(root);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].dir).toContain('broken');
  });

  it('reports schema violations as an error', async () => {
    await writePlugin(root, 'missing-owner', metadata({ owner: '' }));
    const result = await discoverPlugins(root);
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0].issues.join(' ')).toContain('owner');
  });
});

describe('findDuplicateIdentifiers', () => {
  function plugin(overrides: Partial<PluginMetadata>): PluginMetadata {
    return {
      id: 'a',
      name: 'A',
      purpose: 'Do a thing',
      capabilities: ['export'],
      keywords: ['x'],
      owner: 'ana',
      maintainer: 'design-system-foundation',
      status: 'active',
      visibility: 'org',
      allowedGroups: [],
      version: '1.0.0',
      ...overrides,
    };
  }

  it('finds no duplicates when ids and names are unique', () => {
    const result = findDuplicateIdentifiers([plugin({ id: 'a', name: 'A' }), plugin({ id: 'b', name: 'B' })]);
    expect(result).toHaveLength(0);
  });

  it('flags a duplicate id', () => {
    const result = findDuplicateIdentifiers([
      plugin({ id: 'a', name: 'A' }),
      plugin({ id: 'a', name: 'A2' }),
    ]);
    expect(result.some((d) => d.kind === 'id' && d.value === 'a')).toBe(true);
  });

  it('flags a duplicate name even with different ids (case-insensitive)', () => {
    const result = findDuplicateIdentifiers([
      plugin({ id: 'a', name: 'Same Name' }),
      plugin({ id: 'b', name: 'same name' }),
    ]);
    expect(result.some((d) => d.kind === 'name')).toBe(true);
  });
});
