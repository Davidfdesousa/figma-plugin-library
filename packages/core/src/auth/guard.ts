export interface CurrentUser {
  readonly id: string;
  readonly name: string;
}

export interface AuthGuardResult {
  readonly authorized: boolean;
  readonly reason?: string;
}

export interface AuthGuardOptions {
  /**
   * Figma's Plugin API does not expose org/group membership — only a user id
   * and display name (`figma.currentUser`). Pick one:
   * - `allowedUserIds`: a static allowlist, checked locally, no network needed.
   * - `resolveAuthorization`: an async function the plugin supplies to check
   *   membership against an external directory/service the foundation team
   *   controls. Needs that host declared in the plugin's `manifest.json`
   *   `networkAccess`.
   * If both are given, `allowedUserIds` is checked first.
   */
  readonly allowedUserIds?: readonly string[];
  readonly resolveAuthorization?: (user: CurrentUser) => Promise<AuthGuardResult>;
}

/**
 * Reads the current Figma user. Returns `null` when Figma doesn't expose an
 * id (e.g. an anonymous/unauthenticated preview context) — an unidentifiable
 * user can never be authorized.
 */
export function getCurrentUser(): CurrentUser | null {
  const user = figma.currentUser;
  if (!user || !user.id) return null;
  return { id: user.id, name: user.name };
}

export async function checkAuthorization(
  user: CurrentUser,
  options: AuthGuardOptions,
): Promise<AuthGuardResult> {
  if (options.allowedUserIds?.includes(user.id)) {
    return { authorized: true };
  }
  if (options.resolveAuthorization) {
    return options.resolveAuthorization(user);
  }
  return {
    authorized: false,
    reason: 'user id is not in allowedUserIds and no resolveAuthorization was provided',
  };
}

/**
 * The gate every visibility:"internal" plugin runs through before doing
 * anything else. On denial, the plugin must show a restricted-access state
 * and stop — never fall through to normal behavior.
 */
export async function runIfAuthorized<T>(
  options: AuthGuardOptions,
  onAuthorized: () => T | Promise<T>,
  onUnauthorized: (result: AuthGuardResult) => void = () => undefined,
): Promise<T | undefined> {
  const user = getCurrentUser();
  const result = user
    ? await checkAuthorization(user, options)
    : { authorized: false, reason: 'no identifiable Figma user available' };

  if (result.authorized) {
    return onAuthorized();
  }
  onUnauthorized(result);
  return undefined;
}
