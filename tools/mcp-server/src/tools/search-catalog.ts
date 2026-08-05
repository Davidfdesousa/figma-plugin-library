import { join } from 'node:path';

import { discoverPlugins, findSimilarPlugins, type SimilarityMatch } from '@plugin-factory/catalog';

export interface SearchCatalogQuery {
  readonly purpose: string;
  readonly capabilities: readonly string[];
  readonly keywords: readonly string[];
}

export async function searchCatalog(
  repoPath: string,
  query: SearchCatalogQuery,
): Promise<readonly SimilarityMatch[]> {
  const { valid } = await discoverPlugins(join(repoPath, 'plugins'));
  return findSimilarPlugins(query, valid);
}
