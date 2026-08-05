/**
 * Controlled vocabulary for `plugin.meta.json`'s `capabilities` field. A plugin's
 * capabilities are verbs from this list, not free text — that's what makes
 * similarity search (see similarity.ts) meaningful instead of guesswork.
 *
 * Extend this list as real needs show up; don't let a plugin invent its own verb.
 */
export const CAPABILITY_VOCABULARY = [
  'export',
  'import',
  'generate',
  'validate',
  'sync',
  'audit',
  'convert',
  'organize',
  'annotate',
  'measure',
  'rename',
  'document',
  'publish',
  'lint',
  'extract',
  'inject',
  'analyze',
  'transform',
  'schedule',
  'notify',
] as const;

export type Capability = (typeof CAPABILITY_VOCABULARY)[number];

export function isCapability(value: string): value is Capability {
  return (CAPABILITY_VOCABULARY as readonly string[]).includes(value);
}
