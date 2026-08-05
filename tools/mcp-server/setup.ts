#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { configSchema } from './src/config.js';
import { claudeDesktopConfigPath, detectRepoPath, mergeMcpServerEntry } from './src/setup-lib.js';

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue || '';
}

async function askRequired(question: string, defaultValue?: string): Promise<string> {
  for (;;) {
    const answer = await ask(question, defaultValue);
    if (answer) return answer;
    console.log('  This one is required — try again.');
  }
}

async function main(): Promise<void> {
  console.log('Plugin Factory MCP server setup\n');
  console.log("This asks a few questions once, then wires everything up — you won't need to");
  console.log('hand-edit any JSON files.\n');

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const detectedRepoPath = detectRepoPath(scriptDir);
  const repoPath = await ask('Path to your plugin-factory checkout', detectedRepoPath);

  const name = await askRequired('Your name (used as the plugin owner)');
  const githubUsername = await askRequired('Your GitHub username');
  console.log(
    '\nA GitHub personal access token (repo scope) is needed to open pull requests on your',
  );
  console.log('behalf later — create one at https://github.com/settings/tokens if you don\'t have');
  console.log(
    'one yet. It is written to a local file only you can read, and is never sent anywhere',
  );
  console.log("except GitHub's own API when you actually open a PR. Skip this for now (press");
  console.log('Enter) if you only want to try creating and building a plugin today.\n');
  const githubToken = await ask('  GitHub token', 'fill-in-later');

  const repositoryOwner = await askRequired('GitHub org/user this repo lives under');
  const repositoryName = await askRequired('Repository name', basename(repoPath));
  const baseBranch = await ask('Base branch', 'main');

  const candidateConfig = {
    repoPath,
    designer: { name, github: { username: githubUsername, token: githubToken } },
    repository: { owner: repositoryOwner, name: repositoryName, baseBranch },
  };

  const result = configSchema.safeParse(candidateConfig);
  if (!result.success) {
    console.error('\nSomething is wrong with those answers:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    rl.close();
    process.exitCode = 1;
    return;
  }

  const configPath = join(homedir(), '.plugin-factory', 'config.json');
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(result.data, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${configPath}`);

  const desktopConfigPath = claudeDesktopConfigPath({
    platform: platform(),
    home: homedir(),
    appData: process.env.APPDATA,
  });
  const serverEntry = {
    command: 'npx',
    args: ['tsx', join(repoPath, 'tools', 'mcp-server', 'src', 'index.ts')],
  };

  try {
    let existing: unknown;
    if (existsSync(desktopConfigPath)) {
      existing = JSON.parse(await readFile(desktopConfigPath, 'utf8'));
    }
    const merged = mergeMcpServerEntry(existing, 'plugin-factory', serverEntry);
    await mkdir(dirname(desktopConfigPath), { recursive: true });
    await writeFile(desktopConfigPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`Updated ${desktopConfigPath}`);
  } catch (error) {
    console.warn(
      `\nCouldn't update Claude Desktop's config automatically (${(error as Error).message}).`,
    );
    console.warn('Add this to it by hand:');
    console.warn(JSON.stringify({ mcpServers: { 'plugin-factory': serverEntry } }, null, 2));
  }

  if (candidateConfig.designer.github.token === 'fill-in-later') {
    console.log(
      '\nReminder: open ~/.plugin-factory/config.json later and replace "fill-in-later" with a',
    );
    console.log('real GitHub token before asking Claude to open a pull request.');
  }

  console.log('\nDone. Restart Claude Desktop, then try asking it something like:');
  console.log('  "Is there already a plugin that exports SVGs?"');

  rl.close();
}

main();
