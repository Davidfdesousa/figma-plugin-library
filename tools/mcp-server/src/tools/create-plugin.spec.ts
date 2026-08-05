import { describe, expect, it } from 'vitest';

import { buildGeneratorArgs, parseCreatedPluginId } from './create-plugin.js';

describe('buildGeneratorArgs', () => {
  it('builds the base nx generator invocation', () => {
    const args = buildGeneratorArgs('Ada Lovelace', {
      name: 'SVG Batch Exporter',
      purpose: 'Export every selected frame as an SVG file',
      capabilities: ['export'],
    });

    expect(args).toEqual([
      'nx',
      'g',
      '@plugin-factory/generators:new-plugin',
      '--name=SVG Batch Exporter',
      '--purpose=Export every selected frame as an SVG file',
      '--capabilities=export',
      '--owner=Ada Lovelace',
      '--visibility=internal',
      '--no-interactive',
    ]);
  });

  it('joins multiple capabilities with commas', () => {
    const args = buildGeneratorArgs('Ada', {
      name: 'X',
      purpose: 'Y',
      capabilities: ['export', 'audit'],
    });
    expect(args).toContain('--capabilities=export,audit');
  });

  it('only appends --keywords when keywords are given', () => {
    const withoutKeywords = buildGeneratorArgs('Ada', { name: 'X', purpose: 'Y', capabilities: ['export'] });
    expect(withoutKeywords.some((arg) => arg.startsWith('--keywords'))).toBe(false);

    const withKeywords = buildGeneratorArgs('Ada', {
      name: 'X',
      purpose: 'Y',
      capabilities: ['export'],
      keywords: ['svg', 'batch'],
    });
    expect(withKeywords).toContain('--keywords=svg,batch');
  });

  it('respects an explicit visibility', () => {
    const args = buildGeneratorArgs('Ada', {
      name: 'X',
      purpose: 'Y',
      capabilities: ['export'],
      visibility: 'org',
    });
    expect(args).toContain('--visibility=org');
  });
});

describe('parseCreatedPluginId', () => {
  it('extracts the id from the generator\'s "Created plugins/<id>." line', () => {
    const output = 'CREATE plugins/svg-batch-exporter/manifest.json\n\nCreated plugins/svg-batch-exporter.\nNext steps:\n';
    expect(parseCreatedPluginId(output)).toBe('svg-batch-exporter');
  });

  it('throws with the full output when the line is missing', () => {
    expect(() => parseCreatedPluginId('some unrelated output')).toThrow(/Could not find/);
  });
});
