#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist');
// Figma's plugin sandbox has no DOM, so its bundle must never inline any CSS
// the UI bundle picks up — the two entry points are built independently.
const tokensCssPath = join(root, '..', '..', 'packages', 'tokens', 'dist', 'tokens.css');

async function buildMain(): Promise<void> {
  await build({
    entryPoints: [join(root, 'src/main/index.ts')],
    outfile: join(outDir, 'code.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2017',
    logLevel: 'info',
  });
}

async function buildUi(): Promise<void> {
  const result = await build({
    entryPoints: [join(root, 'src/ui/index.ts')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2017',
    write: false,
    logLevel: 'info',
  });
  const script = result.outputFiles[0].text;
  const tokensCss = await readFile(tokensCssPath, 'utf8');
  const template = await readFile(join(root, 'src/ui/index.html'), 'utf8');

  const html = template
    .replace('/* PF_TOKENS_CSS */', tokensCss)
    .replace('/* PF_UI_SCRIPT */', script);

  await writeFile(join(outDir, 'ui.html'), html, 'utf8');
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  await Promise.all([buildMain(), buildUi()]);
  console.log(`wrote ${join(outDir, 'code.js')} and ${join(outDir, 'ui.html')}`);
}

main();
