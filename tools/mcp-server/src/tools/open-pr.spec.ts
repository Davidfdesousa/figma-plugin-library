import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openPluginPr } from './open-pr.js';

const execFileAsync = promisify(execFile);

async function runGit(args: string[], cwd: string): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

describe('openPluginPr', () => {
  let root: string;
  let repoDir: string;
  let remoteDir: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'plugin-factory-mcp-openpr-'));
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

  it('branches, commits, pushes, and calls openPullRequest with the right arguments', async () => {
    await writeFile(join(repoDir, 'plugin.meta.json'), '{}', 'utf8');

    const openPullRequest = vi.fn().mockResolvedValue({
      number: 1,
      html_url: 'https://github.com/my-org/plugin-factory/pull/1',
      title: 'feat(svg-batch-exporter): add plugin',
      state: 'open',
      head: { ref: 'plugin/svg-batch-exporter' },
      base: { ref: 'main' },
    });

    const pr = await openPluginPr(
      {
        repoPath: repoDir,
        githubToken: 'ghp_fake',
        repositoryOwner: 'my-org',
        repositoryName: 'plugin-factory',
        baseBranch: 'main',
      },
      { id: 'svg-batch-exporter', title: 'feat(svg-batch-exporter): add plugin', body: 'Adds the plugin.' },
      { openPullRequest },
    );

    expect(pr.html_url).toBe('https://github.com/my-org/plugin-factory/pull/1');
    expect(openPullRequest).toHaveBeenCalledWith('my-org', 'plugin-factory', {
      title: 'feat(svg-batch-exporter): add plugin',
      head: 'plugin/svg-batch-exporter',
      base: 'main',
      body: 'Adds the plugin.',
    });

    const branches = await execFileAsync('git', ['ls-remote', '--heads', 'origin'], { cwd: repoDir });
    expect(branches.stdout).toContain('refs/heads/plugin/svg-batch-exporter');
  });
});
