import { describe, expect, it } from 'vitest';

import { parsePluginMetadata } from './schema';

function validMetadata(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'svg-batch-exporter',
    name: 'SVG Batch Exporter',
    purpose: 'Export every selected frame as an SVG file in one click',
    capabilities: ['export'],
    keywords: ['svg', 'export', 'batch'],
    owner: 'ana@example.com',
    maintainer: 'design-system-foundation',
    visibility: 'org',
    version: '1.0.0',
    ...overrides,
  };
}

describe('parsePluginMetadata', () => {
  it('accepts well-formed metadata', () => {
    const result = parsePluginMetadata(validMetadata());
    expect(result.success).toBe(true);
  });

  it('defaults status to active', () => {
    const result = parsePluginMetadata(validMetadata());
    if (!result.success) throw new Error('expected success');
    expect(result.data.status).toBe('active');
  });

  it('rejects an id that is not lowercase kebab-case', () => {
    const result = parsePluginMetadata(validMetadata({ id: 'SVG_Exporter' }));
    expect(result.success).toBe(false);
  });

  it('rejects a capability outside the controlled vocabulary', () => {
    const result = parsePluginMetadata(validMetadata({ capabilities: ['teleport'] }));
    expect(result.success).toBe(false);
  });

  it('rejects duplicate capabilities', () => {
    const result = parsePluginMetadata(validMetadata({ capabilities: ['export', 'export'] }));
    expect(result.success).toBe(false);
  });

  it('rejects a purpose that reads as two purposes joined together', () => {
    const result = parsePluginMetadata(
      validMetadata({
        purpose: 'Export frames as SVG and also sync design tokens to GitHub',
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a non-semver version', () => {
    const result = parsePluginMetadata(validMetadata({ version: 'v1' }));
    expect(result.success).toBe(false);
  });

  it('requires allowedGroups when visibility is internal', () => {
    const result = parsePluginMetadata(validMetadata({ visibility: 'internal', allowedGroups: [] }));
    expect(result.success).toBe(false);
  });

  it('accepts internal visibility when allowedGroups is non-empty', () => {
    const result = parsePluginMetadata(
      validMetadata({ visibility: 'internal', allowedGroups: ['design-team'] }),
    );
    expect(result.success).toBe(true);
  });

  it('requires a non-empty owner', () => {
    const result = parsePluginMetadata(validMetadata({ owner: '' }));
    expect(result.success).toBe(false);
  });

  it('reports a readable issue path and message on failure', () => {
    const result = parsePluginMetadata(validMetadata({ owner: '' }));
    if (result.success) throw new Error('expected failure');
    expect(result.issues[0]).toContain('owner');
  });
});
