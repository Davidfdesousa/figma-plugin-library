import { describe, expect, it } from 'vitest';

import { claudeDesktopConfigPath, detectRepoPath, mergeMcpServerEntry } from './setup-lib.js';

describe('detectRepoPath', () => {
  it('goes up two levels from the setup script directory', () => {
    expect(detectRepoPath('C:\\repo\\tools\\mcp-server')).toBe('C:\\repo');
  });
});

describe('claudeDesktopConfigPath', () => {
  it('resolves the Windows path under AppData/Roaming when no appData override is given', () => {
    const path = claudeDesktopConfigPath({ platform: 'win32', home: 'C:\\Users\\ada' });
    expect(path).toBe('C:\\Users\\ada\\AppData\\Roaming\\Claude\\claude_desktop_config.json');
  });

  it('prefers an explicit appData override on Windows', () => {
    const path = claudeDesktopConfigPath({
      platform: 'win32',
      home: 'C:\\Users\\ada',
      appData: 'D:\\CustomAppData',
    });
    expect(path).toBe('D:\\CustomAppData\\Claude\\claude_desktop_config.json');
  });

  it('resolves the macOS path', () => {
    const path = claudeDesktopConfigPath({ platform: 'darwin', home: '/Users/ada' });
    expect(path).toBe('/Users/ada/Library/Application Support/Claude/claude_desktop_config.json');
  });

  it('falls back to an XDG-style path on other platforms', () => {
    const path = claudeDesktopConfigPath({ platform: 'linux', home: '/home/ada' });
    expect(path).toBe('/home/ada/.config/Claude/claude_desktop_config.json');
  });
});

describe('mergeMcpServerEntry', () => {
  const entry = { command: 'npx', args: ['tsx', '/repo/tools/mcp-server/src/index.ts'] };

  it('creates mcpServers from scratch when no config exists yet', () => {
    const result = mergeMcpServerEntry(undefined, 'plugin-factory', entry);
    expect(result).toEqual({ mcpServers: { 'plugin-factory': entry } });
  });

  it('adds to an existing mcpServers object without touching other servers', () => {
    const existing = { mcpServers: { other: { command: 'other-cmd', args: [] } } };
    const result = mergeMcpServerEntry(existing, 'plugin-factory', entry);
    expect(result).toEqual({
      mcpServers: {
        other: { command: 'other-cmd', args: [] },
        'plugin-factory': entry,
      },
    });
  });

  it('preserves unrelated top-level keys', () => {
    const existing = { mcpServers: {}, someOtherSetting: true };
    const result = mergeMcpServerEntry(existing, 'plugin-factory', entry);
    expect(result.someOtherSetting).toBe(true);
  });

  it('overwrites a stale plugin-factory entry on re-run, without duplicating', () => {
    const existing = { mcpServers: { 'plugin-factory': { command: 'old', args: [] } } };
    const result = mergeMcpServerEntry(existing, 'plugin-factory', entry);
    expect((result.mcpServers as Record<string, unknown>)['plugin-factory']).toEqual(entry);
  });

  it('falls back to an empty base when the existing config is malformed (not an object)', () => {
    const result = mergeMcpServerEntry('not an object', 'plugin-factory', entry);
    expect(result).toEqual({ mcpServers: { 'plugin-factory': entry } });
  });

  it('falls back to an empty mcpServers when the existing mcpServers value is malformed', () => {
    const existing = { mcpServers: 'oops' };
    const result = mergeMcpServerEntry(existing, 'plugin-factory', entry);
    expect(result).toEqual({ mcpServers: { 'plugin-factory': entry } });
  });
});
