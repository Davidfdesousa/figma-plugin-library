import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export interface BuildPluginResult {
  readonly success: boolean;
  readonly output: string;
}

export function buildRunManyArgs(id: string): string[] {
  if (!PLUGIN_ID_PATTERN.test(id)) {
    throw new Error(`"${id}" doesn't look like a plugin id (expected lowercase kebab-case).`);
  }
  return ['nx', 'run-many', '-t', 'typecheck,lint,build', `--projects=@plugin-factory/${id}`];
}

export async function buildPlugin(repoPath: string, id: string): Promise<BuildPluginResult> {
  const args = buildRunManyArgs(id);
  try {
    const { stdout, stderr } = await execFileAsync('npx', args, { cwd: repoPath });
    return { success: true, output: stdout + stderr };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message: string };
    return {
      success: false,
      output: (execError.stdout ?? '') + (execError.stderr ?? '') || execError.message,
    };
  }
}
