import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface GitOptions {
  readonly cwd: string;
}

export async function git(args: readonly string[], options: GitOptions): Promise<string> {
  const { stdout } = await execFileAsync('git', args as string[], { cwd: options.cwd });
  return stdout.trim();
}

export async function currentBranch(options: GitOptions): Promise<string> {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], options);
}

export async function hasUncommittedChanges(options: GitOptions): Promise<boolean> {
  const status = await git(['status', '--porcelain'], options);
  return status.length > 0;
}

export async function createBranch(name: string, options: GitOptions): Promise<void> {
  await git(['checkout', '-b', name], options);
}

export async function commitAll(message: string, options: GitOptions): Promise<void> {
  await git(['add', '-A'], options);
  await git(['commit', '-m', message], options);
}

export async function push(branch: string, options: GitOptions): Promise<void> {
  await git(['push', '-u', 'origin', branch], options);
}
