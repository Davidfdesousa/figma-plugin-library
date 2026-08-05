import { join, posix, win32 } from 'node:path';

/** setup.ts lives at the package root (tools/mcp-server/setup.ts) — two levels up is the repo root. */
export function detectRepoPath(setupScriptDir: string): string {
  return join(setupScriptDir, '..', '..');
}

export interface PlatformPaths {
  readonly platform: string;
  readonly home: string;
  /** Windows only — falls back to `<home>/AppData/Roaming` when not given. */
  readonly appData?: string;
}

/**
 * Deliberately uses `path.win32`/`path.posix`, not the ambient `path.join` —
 * this computes a path for `paths.platform`, which is not necessarily the OS
 * this code happens to be running on (most obviously when testing the
 * Windows branch from a Mac/Linux CI runner, or vice versa). The ambient
 * `join` always uses the *executing* OS's separator regardless of which
 * platform's path is being computed, which is wrong here.
 */
export function claudeDesktopConfigPath(paths: PlatformPaths): string {
  if (paths.platform === 'win32') {
    const appData = paths.appData ?? win32.join(paths.home, 'AppData', 'Roaming');
    return win32.join(appData, 'Claude', 'claude_desktop_config.json');
  }
  if (paths.platform === 'darwin') {
    return posix.join(paths.home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  // Claude Desktop has no official Linux build as of writing; this mirrors the
  // XDG convention other desktop apps use, as a best-effort guess.
  return posix.join(paths.home, '.config', 'Claude', 'claude_desktop_config.json');
}

export interface McpServerEntry {
  readonly command: string;
  readonly args: readonly string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges one `mcpServers` entry into a possibly-already-populated
 * `claude_desktop_config.json`, preserving every other key and every other
 * configured server untouched. `existing` may be `undefined` (no file yet),
 * malformed, or a config from an entirely different tool that happens to
 * share the file — all handled by falling back to an empty object rather
 * than throwing.
 */
export function mergeMcpServerEntry(
  existing: unknown,
  serverName: string,
  entry: McpServerEntry,
): Record<string, unknown> {
  const base = isPlainObject(existing) ? existing : {};
  const mcpServers = isPlainObject(base.mcpServers) ? base.mcpServers : {};
  return {
    ...base,
    mcpServers: {
      ...mcpServers,
      [serverName]: entry,
    },
  };
}
