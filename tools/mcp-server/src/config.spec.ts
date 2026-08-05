import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadConfig } from './config.js';

function validConfig(repoPath: string): Record<string, unknown> {
  return {
    repoPath,
    designer: {
      name: 'Ada Lovelace',
      github: { username: 'ada', token: 'ghp_fake' },
    },
    repository: { owner: 'my-org', name: 'plugin-factory', baseBranch: 'main' },
  };
}

describe('loadConfig', () => {
  let root: string;
  let repoDir: string;
  let configPath: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'plugin-factory-mcp-config-'));
    repoDir = join(root, 'repo');
    await mkdir(repoDir, { recursive: true });
    configPath = join(root, 'config.json');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('throws a clear error when the config file is missing', () => {
    expect(() => loadConfig(join(root, 'nope.json'))).toThrow(/No Plugin Factory config found/);
  });

  it('throws when the file is not valid JSON', async () => {
    await writeFile(configPath, '{ not json', 'utf8');
    expect(() => loadConfig(configPath)).toThrow(/not valid JSON/);
  });

  it('throws when required fields are missing', async () => {
    await writeFile(configPath, JSON.stringify({ repoPath: repoDir }), 'utf8');
    expect(() => loadConfig(configPath)).toThrow(/Invalid config/);
  });

  it('throws when repoPath does not exist on disk', async () => {
    await writeFile(configPath, JSON.stringify(validConfig(join(root, 'does-not-exist'))), 'utf8');
    expect(() => loadConfig(configPath)).toThrow(/does not exist on disk/);
  });

  it('defaults repository.baseBranch to "main" when omitted', async () => {
    const config = validConfig(repoDir);
    delete (config.repository as Record<string, unknown>).baseBranch;
    await writeFile(configPath, JSON.stringify(config), 'utf8');
    expect(loadConfig(configPath).repository.baseBranch).toBe('main');
  });

  it('loads a fully valid config', async () => {
    await writeFile(configPath, JSON.stringify(validConfig(repoDir)), 'utf8');
    const config = loadConfig(configPath);
    expect(config.designer.name).toBe('Ada Lovelace');
    expect(config.designer.github.token).toBe('ghp_fake');
    expect(config.repository.owner).toBe('my-org');
  });
});
