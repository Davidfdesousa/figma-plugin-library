import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { z } from 'zod';

// Nested under `github: { token }` — not `githubToken` — so the key name
// literally matches `@plugin-factory/core`'s logger's default redaction list
// (`packages/core/src/logger/index.ts`), in case this object ever gets logged.
export const configSchema = z.object({
  repoPath: z.string().min(1, 'repoPath must point at your local plugin-factory checkout'),
  designer: z.object({
    name: z.string().min(1),
    github: z.object({
      username: z.string().min(1),
      token: z.string().min(1),
    }),
  }),
  repository: z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
    baseBranch: z.string().min(1).default('main'),
  }),
});

export type PluginFactoryConfig = z.infer<typeof configSchema>;

export function defaultConfigPath(): string {
  return join(homedir(), '.plugin-factory', 'config.json');
}

export function loadConfig(configPath: string = defaultConfigPath()): PluginFactoryConfig {
  if (!existsSync(configPath)) {
    throw new Error(
      `No Plugin Factory config found at ${configPath}. Copy tools/mcp-server/config.example.json there and fill it in — see tools/mcp-server/README.md.`,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`${configPath} is not valid JSON: ${(error as Error).message}`);
  }

  const result = configSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    throw new Error(`Invalid config at ${configPath}:\n${issues.join('\n')}`);
  }

  if (!existsSync(result.data.repoPath)) {
    throw new Error(`config.repoPath "${result.data.repoPath}" does not exist on disk.`);
  }

  return result.data;
}
