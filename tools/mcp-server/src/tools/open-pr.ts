import { GitHubClient, type GitHubPullRequest } from '@plugin-factory/core';

import { commitAll, createBranch, push, type GitOptions } from '../git.js';

export interface OpenPluginPrInput {
  readonly id: string;
  readonly title: string;
  readonly body?: string;
}

export interface OpenPluginPrOptions {
  readonly repoPath: string;
  readonly githubToken: string;
  readonly repositoryOwner: string;
  readonly repositoryName: string;
  readonly baseBranch: string;
}

function branchNameFor(id: string): string {
  return `plugin/${id}`;
}

/**
 * Creates a branch, commits everything currently changed in the working
 * tree, pushes it, and opens a PR. Assumes `createPlugin`/edits already
 * changed files on disk — this doesn't scaffold anything itself.
 */
export async function openPluginPr(
  options: OpenPluginPrOptions,
  input: OpenPluginPrInput,
  githubClient: Pick<GitHubClient, 'openPullRequest'> = new GitHubClient({ token: options.githubToken }),
): Promise<GitHubPullRequest> {
  const gitOptions: GitOptions = { cwd: options.repoPath };
  const branch = branchNameFor(input.id);

  await createBranch(branch, gitOptions);
  await commitAll(input.title, gitOptions);
  await push(branch, gitOptions);

  return githubClient.openPullRequest(options.repositoryOwner, options.repositoryName, {
    title: input.title,
    head: branch,
    base: options.baseBranch,
    body: input.body,
  });
}
