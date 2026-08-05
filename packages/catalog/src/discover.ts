import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parsePluginMetadata, type PluginMetadata } from './schema';

export const PLUGIN_META_FILENAME = 'plugin.meta.json';

export interface DiscoveredMetadataError {
  readonly dir: string;
  readonly issues: readonly string[];
}

export interface DiscoverPluginsResult {
  readonly valid: readonly PluginMetadata[];
  readonly errors: readonly DiscoveredMetadataError[];
}

/**
 * Scans `pluginsRoot` for one level of subdirectories, reads `plugin.meta.json`
 * from each, and validates it against the schema. A directory with no
 * `plugin.meta.json` is silently skipped (not every subdirectory need be a
 * plugin); a directory with an invalid one is reported in `errors`.
 */
export async function discoverPlugins(pluginsRoot: string): Promise<DiscoverPluginsResult> {
  const valid: PluginMetadata[] = [];
  const errors: DiscoveredMetadataError[] = [];

  let entries: string[];
  try {
    entries = (await readdir(pluginsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return { valid, errors };
  }

  for (const entry of entries) {
    const dir = join(pluginsRoot, entry);
    const metaPath = join(dir, PLUGIN_META_FILENAME);

    let raw: string;
    try {
      raw = await readFile(metaPath, 'utf8');
    } catch {
      continue;
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      errors.push({ dir, issues: [`invalid JSON: ${(error as Error).message}`] });
      continue;
    }

    const result = parsePluginMetadata(json);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({ dir, issues: result.issues });
    }
  }

  return { valid, errors };
}

export interface DuplicateIdentifier {
  readonly kind: 'id' | 'name';
  readonly value: string;
  readonly plugins: readonly string[];
}

/** Cross-plugin check: no two plugins may share an `id` or a `name`. */
export function findDuplicateIdentifiers(
  plugins: readonly PluginMetadata[],
): readonly DuplicateIdentifier[] {
  const duplicates: DuplicateIdentifier[] = [];

  for (const kind of ['id', 'name'] as const) {
    const byValue = new Map<string, string[]>();
    for (const plugin of plugins) {
      const value = kind === 'id' ? plugin.id : plugin.name;
      const key = value.toLowerCase();
      const existing = byValue.get(key) ?? [];
      existing.push(plugin.id);
      byValue.set(key, existing);
    }
    for (const [value, ids] of byValue) {
      if (ids.length > 1) {
        duplicates.push({ kind, value, plugins: ids });
      }
    }
  }

  return duplicates;
}
