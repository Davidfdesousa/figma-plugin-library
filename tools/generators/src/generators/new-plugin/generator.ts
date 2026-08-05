import { join } from 'node:path';

import {
  formatFiles,
  joinPathFragments,
  names,
  readJson,
  visitNotIgnoredFiles,
  workspaceRoot,
  writeJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import {
  discoverPlugins,
  findSimilarPlugins,
  isCapability,
  parsePluginMetadata,
  type Capability,
} from '@plugin-factory/catalog';

import type { NewPluginGeneratorSchema } from './schema';

const TEMPLATE_DIR = 'templates/plugin-base';
const PLUGINS_DIR = 'plugins';

// Regenerated with real content after the copy — everything else in the
// template (manifest.json, README.md, src/**, scripts/**, tsconfig*, eslint
// config) is identical for every plugin and gets copied verbatim.
const REGENERATED_FILES = new Set(['package.json', 'plugin.meta.json', 'project.json']);

export default async function newPluginGenerator(
  tree: Tree,
  options: NewPluginGeneratorSchema,
): Promise<GeneratorCallback> {
  const id = names(options.name).fileName;
  const targetDir = joinPathFragments(PLUGINS_DIR, id);

  if (tree.exists(targetDir)) {
    throw new Error(
      `plugins/${id} already exists. Pick a different name, or edit that plugin directly instead of creating a new one — see the discovery/anti-duplication skill.`,
    );
  }

  const capabilities = validateCapabilities(options.capabilities);
  const keywords = parseKeywords(options.keywords, id);

  await warnOnSimilarPlugins({ purpose: options.purpose, capabilities, keywords });

  copyTemplateInto(tree, targetDir);
  writePackageJson(tree, targetDir, id);
  writeProjectJson(tree, targetDir, id);
  const meta = writePluginMeta(tree, targetDir, {
    id,
    name: options.name,
    purpose: options.purpose,
    capabilities,
    keywords,
    owner: options.owner,
    visibility: options.visibility ?? 'internal',
  });

  warnIfMetadataInvalid(meta);

  await formatFiles(tree);

  return () => {
    const steps = [
      `Review plugins/${id}/manifest.json's networkAccess — keep only the hosts this plugin actually calls.`,
    ];
    if ((options.visibility ?? 'internal') === 'internal') {
      steps.push(
        `Fill in plugins/${id}/src/main/auth-config.ts with authorized Figma user ids (or wire resolveAuthorization).`,
      );
    }
    steps.push(`Build it: nx run @plugin-factory/${id}:build`);

    console.log(`\nCreated plugins/${id}.`);
    console.log('Next steps:');
    steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
  };
}

function validateCapabilities(capabilities: string[]): Capability[] {
  return capabilities.map((capability) => {
    if (!isCapability(capability)) {
      throw new Error(
        `"${capability}" is not in the capability controlled vocabulary (packages/catalog/src/capabilities.ts).`,
      );
    }
    return capability;
  });
}

function parseKeywords(rawKeywords: string | undefined, fallback: string): string[] {
  const parsed = (rawKeywords ?? '')
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? Array.from(new Set(parsed)) : [fallback];
}

async function warnOnSimilarPlugins(query: {
  purpose: string;
  capabilities: readonly string[];
  keywords: readonly string[];
}): Promise<void> {
  const { valid } = await discoverPlugins(join(workspaceRoot, PLUGINS_DIR));
  const matches = findSimilarPlugins(query, valid);
  if (matches.length === 0) return;

  console.warn(
    '\n⚠ Found existing plugin(s) that look similar — consider extending one of these instead:\n',
  );
  for (const match of matches) {
    console.warn(`  - ${match.candidate.name} (plugins/${match.candidate.id}), score ${match.score.toFixed(2)}`);
    console.warn(`    "${match.candidate.purpose}"`);
  }
  console.warn('\nContinuing anyway — if none of these are a real match, ignore this warning.\n');
}

function copyTemplateInto(tree: Tree, targetDir: string): void {
  visitNotIgnoredFiles(tree, TEMPLATE_DIR, (filePath) => {
    const relativePath = filePath.slice(TEMPLATE_DIR.length + 1);
    if (REGENERATED_FILES.has(relativePath)) return;
    const content = tree.read(filePath);
    if (content) {
      tree.write(joinPathFragments(targetDir, relativePath), content);
    }
  });
}

function writePackageJson(tree: Tree, targetDir: string, id: string): void {
  const templatePkg = readJson(tree, `${TEMPLATE_DIR}/package.json`);
  // Each plugin's description belongs in plugin.meta.json's `purpose`, not here.
  delete templatePkg.description;
  writeJson(tree, joinPathFragments(targetDir, 'package.json'), {
    ...templatePkg,
    name: `@plugin-factory/${id}`,
  });
}

function writeProjectJson(tree: Tree, targetDir: string, id: string): void {
  const templateProjectJson = readJson(tree, `${TEMPLATE_DIR}/project.json`);
  writeJson(tree, joinPathFragments(targetDir, 'project.json'), {
    ...templateProjectJson,
    name: `@plugin-factory/${id}`,
  });
}

interface PluginMetaInput {
  id: string;
  name: string;
  purpose: string;
  capabilities: Capability[];
  keywords: string[];
  owner: string;
  visibility: 'internal' | 'org';
}

function writePluginMeta(tree: Tree, targetDir: string, input: PluginMetaInput): unknown {
  const meta = {
    id: input.id,
    name: input.name,
    purpose: input.purpose,
    capabilities: input.capabilities,
    keywords: input.keywords,
    owner: input.owner,
    maintainer: 'design-system-foundation',
    status: 'active',
    visibility: input.visibility,
    allowedGroups: input.visibility === 'internal' ? ['<fill in — e.g. product-design>'] : [],
    version: '0.1.0',
  };
  writeJson(tree, joinPathFragments(targetDir, 'plugin.meta.json'), meta);
  return meta;
}

function warnIfMetadataInvalid(meta: unknown): void {
  const result = parsePluginMetadata(meta);
  if (result.success) return;
  console.warn('\n⚠ plugin.meta.json needs attention before this plugin passes CI:\n');
  for (const issue of result.issues) console.warn(`  - ${issue}`);
  console.warn('');
}
