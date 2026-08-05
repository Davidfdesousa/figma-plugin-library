import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { commitAll, createBranch, currentBranch, git, hasUncommittedChanges, push } from './git.js';

const execFileAsync = promisify(execFile);

async function runGit(args: string[], cwd: string): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

describe('git helpers (against a real temp repo)', () => {
  let root: string;
  let repoDir: string;
  let remoteDir: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'plugin-factory-mcp-git-'));
    repoDir = join(root, 'repo');
    remoteDir = join(root, 'remote.git');

    await runGit(['init', '--bare', '--initial-branch=main', remoteDir], root);
    await runGit(['init', '--initial-branch=main', repoDir], root);
    await runGit(['config', 'user.email', 'test@example.com'], repoDir);
    await runGit(['config', 'user.name', 'Test User'], repoDir);
    await runGit(['remote', 'add', 'origin', remoteDir], repoDir);

    await writeFile(join(repoDir, 'README.md'), '# test\n', 'utf8');
    await runGit(['add', '-A'], repoDir);
    await runGit(['commit', '-m', 'initial commit'], repoDir);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('currentBranch reports the branch git init created', async () => {
    expect(await currentBranch({ cwd: repoDir })).toBe('main');
  });

  it('hasUncommittedChanges is false right after a commit', async () => {
    expect(await hasUncommittedChanges({ cwd: repoDir })).toBe(false);
  });

  it('hasUncommittedChanges is true once a file changes', async () => {
    await writeFile(join(repoDir, 'new-file.txt'), 'hello', 'utf8');
    expect(await hasUncommittedChanges({ cwd: repoDir })).toBe(true);
  });

  it('createBranch switches to a new branch', async () => {
    await createBranch('plugin/svg-exporter', { cwd: repoDir });
    expect(await currentBranch({ cwd: repoDir })).toBe('plugin/svg-exporter');
  });

  it('commitAll stages and commits everything in the working tree', async () => {
    await writeFile(join(repoDir, 'plugin.meta.json'), '{}', 'utf8');
    await commitAll('feat: add plugin', { cwd: repoDir });

    expect(await hasUncommittedChanges({ cwd: repoDir })).toBe(false);
    const log = await git(['log', '-1', '--pretty=%s'], { cwd: repoDir });
    expect(log).toBe('feat: add plugin');
  });

  it('push publishes the branch to the remote', async () => {
    await createBranch('plugin/svg-exporter', { cwd: repoDir });
    await writeFile(join(repoDir, 'plugin.meta.json'), '{}', 'utf8');
    await commitAll('feat: add plugin', { cwd: repoDir });
    await push('plugin/svg-exporter', { cwd: repoDir });

    const branches = await git(['ls-remote', '--heads', 'origin'], { cwd: repoDir });
    expect(branches).toContain('refs/heads/plugin/svg-exporter');
  });
});
