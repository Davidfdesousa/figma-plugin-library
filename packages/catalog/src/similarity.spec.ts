import { describe, expect, it } from 'vitest';

import { findSimilarPlugins, scoreSimilarity } from './similarity';
import type { PluginMetadata } from './schema';

function makePlugin(overrides: Partial<PluginMetadata> = {}): PluginMetadata {
  return {
    id: 'svg-batch-exporter',
    name: 'SVG Batch Exporter',
    purpose: 'Export every selected frame as an SVG file',
    capabilities: ['export'],
    keywords: ['svg', 'export', 'batch'],
    owner: 'ana',
    maintainer: 'design-system-foundation',
    status: 'active',
    visibility: 'org',
    allowedGroups: [],
    version: '1.0.0',
    ...overrides,
  };
}

describe('scoreSimilarity', () => {
  it('scores an identical query against a candidate at 1', () => {
    const candidate = makePlugin();
    const { score } = scoreSimilarity(
      { purpose: candidate.purpose, capabilities: candidate.capabilities, keywords: candidate.keywords },
      candidate,
    );
    expect(score).toBeCloseTo(1, 5);
  });

  it('scores a completely unrelated query near 0', () => {
    const candidate = makePlugin();
    const { score } = scoreSimilarity(
      {
        purpose: 'Notify the team on Slack when a release ships',
        capabilities: ['notify'],
        keywords: ['slack', 'release'],
      },
      candidate,
    );
    expect(score).toBeLessThan(0.1);
  });

  it('weighs capability overlap more than purpose text overlap', () => {
    const candidate = makePlugin();
    const sameCapabilityDifferentWords = scoreSimilarity(
      { purpose: 'totally different wording here', capabilities: ['export'], keywords: [] },
      candidate,
    );
    const sameWordsDifferentCapability = scoreSimilarity(
      { purpose: candidate.purpose, capabilities: ['import'], keywords: [] },
      candidate,
    );
    expect(sameCapabilityDifferentWords.score).toBeGreaterThan(sameWordsDifferentCapability.score);
  });
});

describe('findSimilarPlugins', () => {
  const svgExporter = makePlugin();
  const pngExporter = makePlugin({
    id: 'png-batch-exporter',
    name: 'PNG Batch Exporter',
    purpose: 'Export every selected frame as a PNG file',
    capabilities: ['export'],
    keywords: ['png', 'export', 'batch'],
  });
  const unrelated = makePlugin({
    id: 'github-pr-notifier',
    name: 'GitHub PR Notifier',
    purpose: 'Notify the team on Slack when a release ships',
    capabilities: ['notify'],
    keywords: ['slack', 'release'],
  });

  it('finds and ranks similar plugins above the threshold', () => {
    const matches = findSimilarPlugins(
      { purpose: 'Export selected frames as SVG', capabilities: ['export'], keywords: ['svg', 'export'] },
      [svgExporter, pngExporter, unrelated],
    );
    expect(matches.map((m) => m.candidate.id)).toContain('svg-batch-exporter');
    expect(matches.map((m) => m.candidate.id)).not.toContain('github-pr-notifier');
  });

  it('respects the limit option', () => {
    const matches = findSimilarPlugins(
      { purpose: 'Export frames', capabilities: ['export'], keywords: ['export'] },
      [svgExporter, pngExporter, unrelated],
      { threshold: 0, limit: 1 },
    );
    expect(matches).toHaveLength(1);
  });
});
