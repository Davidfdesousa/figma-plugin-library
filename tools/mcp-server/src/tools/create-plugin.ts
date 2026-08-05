import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CreatePluginInput {
  readonly name: string;
  readonly purpose: string;
  readonly capabilities: readonly string[];
  readonly keywords?: readonly string[];
  readonly visibility?: 'internal' | 'org';
}

// Pure and unit-testable on its own — the actual `execFile` call around it isn't.
export function buildGeneratorArgs(owner: string, input: CreatePluginInput): string[] {
  const args = [
    'nx',
    'g',
    '@plugin-factory/generators:new-plugin',
    `--name=${input.name}`,
    `--purpose=${input.purpose}`,
    `--capabilities=${input.capabilities.join(',')}`,
    `--owner=${owner}`,
    `--visibility=${input.visibility ?? 'internal'}`,
    '--no-interactive',
  ];
  if (input.keywords && input.keywords.length > 0) {
    args.push(`--keywords=${input.keywords.join(',')}`);
  }
  return args;
}

const CREATED_LINE_PATTERN = /Created plugins\/([a-z0-9-]+)\./;

// The generator (tools/generators) is the single source of truth for how a
// name becomes an id — parsing its own log line avoids re-implementing that
// kebab-casing logic a second time here, where it could drift out of sync.
export function parseCreatedPluginId(output: string): string {
  const match = CREATED_LINE_PATTERN.exec(output);
  if (!match) {
    throw new Error(`Could not find the generator's "Created plugins/<id>." line in its output:\n${output}`);
  }
  return match[1];
}

export interface CreatePluginResult {
  readonly id: string;
  readonly output: string;
}

export async function createPlugin(
  repoPath: string,
  owner: string,
  input: CreatePluginInput,
): Promise<CreatePluginResult> {
  const args = buildGeneratorArgs(owner, input);
  const { stdout, stderr } = await execFileAsync('npx', args, { cwd: repoPath });
  const output = stdout + stderr;
  return { id: parseCreatedPluginId(output), output };
}
