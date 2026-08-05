const GITHUB_API_HOST = 'api.github.com';
const ALLOWED_HOSTS: ReadonlySet<string> = new Set([GITHUB_API_HOST]);

export class GitHubDomainError extends Error {
  constructor(hostname: string) {
    super(`Refusing to call disallowed host: ${hostname}`);
    this.name = 'GitHubDomainError';
  }
}

export class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

function assertAllowedHost(url: string): void {
  const { hostname } = new URL(url);
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new GitHubDomainError(hostname);
  }
}

export interface GitHubClientOptions {
  readonly token: string;
  /** Must resolve to an allowed host — only present for tests. */
  readonly baseUrl?: string;
}

export interface GitHubPullRequest {
  readonly number: number;
  readonly html_url: string;
  readonly title: string;
  readonly state: string;
  readonly head: { readonly ref: string };
  readonly base: { readonly ref: string };
}

export interface OpenPullRequestInput {
  readonly title: string;
  /** Branch to merge from. */
  readonly head: string;
  /** Branch to merge into. */
  readonly base: string;
  readonly body?: string;
  readonly draft?: boolean;
}

export interface ListPullRequestsOptions {
  readonly state?: 'open' | 'closed' | 'all';
}

/**
 * Minimal GitHub REST client restricted to api.github.com. The manifest's
 * `networkAccess` allowlist is the primary gate; this is defense in depth so
 * a plugin can't be tricked into calling an attacker-controlled host even if
 * `baseUrl` is ever taken from user input.
 */
export class GitHubClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(options: GitHubClientOptions) {
    this.baseUrl = options.baseUrl ?? `https://${GITHUB_API_HOST}`;
    assertAllowedHost(this.baseUrl);
    this.token = options.token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    assertAllowedHost(url);
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new GitHubApiError(response.status, await response.text());
    }
    return (await response.json()) as T;
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<GitHubPullRequest> {
    return this.request(`/repos/${owner}/${repo}/pulls/${number}`);
  }

  async listPullRequests(
    owner: string,
    repo: string,
    options: ListPullRequestsOptions = {},
  ): Promise<GitHubPullRequest[]> {
    const state = options.state ?? 'open';
    return this.request(`/repos/${owner}/${repo}/pulls?state=${state}`);
  }

  async openPullRequest(
    owner: string,
    repo: string,
    input: OpenPullRequestInput,
  ): Promise<GitHubPullRequest> {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        head: input.head,
        base: input.base,
        body: input.body,
        draft: input.draft ?? false,
      }),
    });
  }
}
