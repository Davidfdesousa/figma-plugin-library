#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverPlugins, findDuplicateIdentifiers } from './discover';

async function main(): Promise<void> {
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const repoRoot = join(packageRoot, '..', '..');
  const pluginsRoot = join(repoRoot, 'plugins');

  const { valid, errors } = await discoverPlugins(pluginsRoot);
  const duplicates = findDuplicateIdentifiers(valid);

  if (errors.length > 0) {
    console.error(`${errors.length} plugin(s) have an invalid plugin.meta.json:`);
    for (const error of errors) {
      console.error(`  ${error.dir}`);
      for (const issue of error.issues) console.error(`    - ${issue}`);
    }
  }

  if (duplicates.length > 0) {
    console.error(`${duplicates.length} duplicate identifier(s) found:`);
    for (const duplicate of duplicates) {
      console.error(`  ${duplicate.kind} "${duplicate.value}" used by: ${duplicate.plugins.join(', ')}`);
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    pluginCount: valid.length,
    plugins: valid,
  };

  const outDir = join(packageRoot, 'dist');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'catalog.json');
  await writeFile(outPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`wrote ${outPath} (${valid.length} plugin(s))`);

  if (errors.length > 0 || duplicates.length > 0) {
    process.exitCode = 1;
  }
}

main();
