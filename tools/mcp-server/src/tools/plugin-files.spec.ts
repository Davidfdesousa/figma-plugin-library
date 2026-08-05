import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listPluginFiles, readPluginFile, resolvePluginFilePath, writePluginFile } from './plugin-files.js';

describe('plugin-files', () => {
  let repoPath: string;

  beforeEach(async () => {
    repoPath = await mkdtemp(join(tmpdir(), 'plugin-factory-mcp-files-'));
    const pluginDir = join(repoPath, 'plugins', 'svg-batch-exporter');
    await mkdir(join(pluginDir, 'src', 'main'), { recursive: true });
    await writeFile(join(pluginDir, 'manifest.json'), '{}', 'utf8');
    await writeFile(join(pluginDir, 'src', 'main', 'index.ts'), 'export {};', 'utf8');
    // simulate a build artifact that should never show up in listPluginFiles
    await mkdir(join(pluginDir, 'dist'), { recursive: true });
    await writeFile(join(pluginDir, 'dist', 'code.js'), '/* built */', 'utf8');
  });

  afterEach(async () => {
    await rm(repoPath, { recursive: true, force: true });
  });

  describe('resolvePluginFilePath', () => {
    it('resolves a normal relative path inside the plugin directory', () => {
      const resolved = resolvePluginFilePath(repoPath, 'svg-batch-exporter', 'manifest.json');
      expect(resolved).toBe(join(repoPath, 'plugins', 'svg-batch-exporter', 'manifest.json'));
    });

    it('rejects an id that is not lowercase kebab-case', () => {
      expect(() => resolvePluginFilePath(repoPath, 'Not Kebab', 'manifest.json')).toThrow(
        /doesn't look like a plugin id/,
      );
    });

    it('rejects a path that escapes the plugin directory via ..', () => {
      expect(() => resolvePluginFilePath(repoPath, 'svg-batch-exporter', '../other-plugin/secret.json')).toThrow(
        /resolves outside/,
      );
    });

    it('rejects a path that escapes the repo entirely', () => {
      expect(() =>
        resolvePluginFilePath(repoPath, 'svg-batch-exporter', '../../../../../../etc/passwd'),
      ).toThrow(/resolves outside/);
    });

    it('rejects an absolute path that points elsewhere', () => {
      expect(() => resolvePluginFilePath(repoPath, 'svg-batch-exporter', 'C:/Windows/System32')).toThrow(
        /resolves outside/,
      );
    });
  });

  describe('listPluginFiles', () => {
    it('lists files recursively, excluding build artifacts', async () => {
      const files = await listPluginFiles(repoPath, 'svg-batch-exporter');
      expect(files).toContain('manifest.json');
      expect(files).toContain('src/main/index.ts');
      expect(files.some((f) => f.startsWith('dist/'))).toBe(false);
    });
  });

  describe('readPluginFile / writePluginFile', () => {
    it('reads an existing file', async () => {
      const content = await readPluginFile(repoPath, 'svg-batch-exporter', 'manifest.json');
      expect(content).toBe('{}');
    });

    it('writes a new file, creating parent directories as needed', async () => {
      await writePluginFile(repoPath, 'svg-batch-exporter', 'src/ui/index.ts', 'console.log(1);');
      const content = await readPluginFile(repoPath, 'svg-batch-exporter', 'src/ui/index.ts');
      expect(content).toBe('console.log(1);');
    });

    it('overwrites an existing file', async () => {
      await writePluginFile(repoPath, 'svg-batch-exporter', 'manifest.json', '{"updated":true}');
      const content = await readPluginFile(repoPath, 'svg-batch-exporter', 'manifest.json');
      expect(content).toBe('{"updated":true}');
    });

    it('refuses to write outside the plugin directory', async () => {
      await expect(
        writePluginFile(repoPath, 'svg-batch-exporter', '../other-plugin/injected.ts', 'evil'),
      ).rejects.toThrow(/resolves outside/);
    });
  });
});
