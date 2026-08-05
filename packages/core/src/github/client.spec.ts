import { afterEach, describe, expect, it, vi } from 'vitest';

import { GitHubApiError, GitHubClient, GitHubDomainError } from './client';

describe('GitHubClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a baseUrl outside the allowed host', () => {
    expect(() => new GitHubClient({ token: 't', baseUrl: 'https://evil.example.com' })).toThrow(
      GitHubDomainError,
    );
  });

  it('sends an authenticated request to api.github.com and returns the parsed body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ number: 42, html_url: 'https://github.com/x/y/pull/42' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new GitHubClient({ token: 'secret-token' });
    const pr = await client.getPullRequest('owner', 'repo', 42);

    expect(pr).toEqual({ number: 42, html_url: 'https://github.com/x/y/pull/42' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/owner/repo/pulls/42');
    expect(init.headers.Authorization).toBe('Bearer secret-token');
  });

  it('throws GitHubApiError on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => 'not found' }),
    );
    const client = new GitHubClient({ token: 't' });
    await expect(client.getPullRequest('owner', 'repo', 1)).rejects.toBeInstanceOf(GitHubApiError);
  });

  it('opens a pull request with the given head/base/title', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ number: 1 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new GitHubClient({ token: 't' });
    await client.openPullRequest('owner', 'repo', {
      title: 'Add plugin',
      head: 'feature-branch',
      base: 'main',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/owner/repo/pulls');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      title: 'Add plugin',
      head: 'feature-branch',
      base: 'main',
      draft: false,
    });
  });
});
