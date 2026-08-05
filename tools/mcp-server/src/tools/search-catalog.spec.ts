import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { searchCatalog } from './search-catalog.js';

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

describe('searchCatalog', () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await mkdtemp(join(tmpdir(), 'plugin-factory-mcp-catalog-'));
    const pluginDir = join(repoRoot, 'plugins', 'svg-batch-exporter');
    await mkdir(pluginDir, { recursive: true });
    await writeFile(join(pluginDir, 'plugin.meta.json'), JSON.stringify(metadata()), 'utf8');
  });

  afterEach(async () => {
    await rm(repoRoot, { recursive: true, force: true });
  });

  it('finds an existing plugin with an overlapping purpose', async () => {
    const matches = await searchCatalog(repoRoot, {
      purpose: 'Export selected frames as SVG',
      capabilities: ['export'],
      keywords: ['svg'],
    });
    expect(matches.some((match) => match.candidate.id === 'svg-batch-exporter')).toBe(true);
  });

  it('returns no matches for an unrelated request', async () => {
    const matches = await searchCatalog(repoRoot, {
      purpose: 'Notify the team on Slack when a release ships',
      capabilities: ['notify'],
      keywords: ['slack'],
    });
    expect(matches).toHaveLength(0);
  });
});
