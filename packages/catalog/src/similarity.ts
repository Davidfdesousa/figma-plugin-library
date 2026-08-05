import type { PluginMetadata } from './schema';

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'for',
  'in',
  'on',
  'with',
  'from',
  'into',
  'that',
  'this',
  'it',
  'its',
  'as',
  'is',
  'are',
  'be',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 1 && !STOPWORDS.has(word)),
  );
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface SimilarityBreakdown {
  readonly purpose: number;
  readonly capabilities: number;
  readonly keywords: number;
}

export interface SimilarityMatch {
  readonly candidate: PluginMetadata;
  readonly score: number;
  readonly breakdown: SimilarityBreakdown;
}

export interface SimilarityQuery {
  readonly purpose: string;
  readonly capabilities: readonly string[];
  readonly keywords: readonly string[];
}

export interface FindSimilarPluginsOptions {
  /** Minimum combined score (0-1) to be considered a candidate at all. */
  readonly threshold?: number;
  readonly limit?: number;
}

const DEFAULT_THRESHOLD = 0.35;
const DEFAULT_LIMIT = 5;

// Capabilities come from a controlled vocabulary, so overlap there is the most
// reliable signal; keywords are free text but curated; purpose is prose, noisiest.
const WEIGHTS: SimilarityBreakdown = { capabilities: 0.4, keywords: 0.35, purpose: 0.25 };

export function scoreSimilarity(query: SimilarityQuery, candidate: PluginMetadata): SimilarityMatch {
  const breakdown: SimilarityBreakdown = {
    purpose: jaccard(tokenize(query.purpose), tokenize(candidate.purpose)),
    capabilities: jaccard(new Set(query.capabilities), new Set(candidate.capabilities)),
    keywords: jaccard(new Set(query.keywords), new Set(candidate.keywords)),
  };

  const score =
    breakdown.purpose * WEIGHTS.purpose +
    breakdown.capabilities * WEIGHTS.capabilities +
    breakdown.keywords * WEIGHTS.keywords;

  return { candidate, score, breakdown };
}

/**
 * The mechanism behind "consult the catalog before creating anything" — see
 * the discovery/anti-duplication skill. Call this with the proposed plugin's
 * purpose/capabilities/keywords before scaffolding a new plugin.
 */
export function findSimilarPlugins(
  query: SimilarityQuery,
  candidates: readonly PluginMetadata[],
  options: FindSimilarPluginsOptions = {},
): SimilarityMatch[] {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const limit = options.limit ?? DEFAULT_LIMIT;

  return candidates
    .map((candidate) => scoreSimilarity(query, candidate))
    .filter((match) => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
