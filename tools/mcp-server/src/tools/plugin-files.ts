import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

// Never let a model wander outside the one plugin directory it's supposed to
// be editing — no reading/writing packages/, other plugins, or anything
// outside the repo via a crafted relativePath like "../../other-plugin/x".
export function resolvePluginFilePath(repoPath: string, id: string, relativePath: string): string {
  if (!PLUGIN_ID_PATTERN.test(id)) {
    throw new Error(`"${id}" doesn't look like a plugin id (expected lowercase kebab-case).`);
  }
  const pluginDir = resolve(repoPath, 'plugins', id);
  const target = resolve(pluginDir, relativePath);
  const withinPluginDir = target === pluginDir || target.startsWith(pluginDir + sep);
  if (!withinPluginDir) {
    throw new Error(`"${relativePath}" resolves outside plugins/${id} — refusing to touch it.`);
  }
  return target;
}

const SKIP_DIRS = new Set(['dist', 'out-tsc', 'node_modules']);

export async function listPluginFiles(repoPath: string, id: string): Promise<string[]> {
  const pluginDir = resolvePluginFilePath(repoPath, id, '.');
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(relative(pluginDir, fullPath).split(sep).join('/'));
      }
    }
  }

  await walk(pluginDir);
  return files.sort();
}

export async function readPluginFile(repoPath: string, id: string, relativePath: string): Promise<string> {
  const target = resolvePluginFilePath(repoPath, id, relativePath);
  return readFile(target, 'utf8');
}

export async function writePluginFile(
  repoPath: string,
  id: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const target = resolvePluginFilePath(repoPath, id, relativePath);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content, 'utf8');
}
