import { describe, expect, it } from 'vitest';

import { buildRunManyArgs } from './build-plugin.js';

describe('buildRunManyArgs', () => {
  it('builds the nx run-many invocation scoped to the plugin project', () => {
    expect(buildRunManyArgs('svg-batch-exporter')).toEqual([
      'nx',
      'run-many',
      '-t',
      'typecheck,lint,build',
      '--projects=@plugin-factory/svg-batch-exporter',
    ]);
  });

  it('rejects an id that is not lowercase kebab-case', () => {
    expect(() => buildRunManyArgs('SVG Batch Exporter')).toThrow(/doesn't look like a plugin id/);
  });
});
