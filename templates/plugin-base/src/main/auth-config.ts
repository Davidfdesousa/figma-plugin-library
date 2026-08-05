/**
 * The authorization guard's real enforcement mechanism — required by default
 * for any plugin with `visibility: "internal"` in plugin.meta.json.
 *
 * Figma's Plugin API has no group/org-membership lookup, only a user id and
 * name (`figma.currentUser`). So:
 * - For a small, known set of people: list their Figma user ids below.
 * - For anything larger, or backed by a real directory: implement
 *   `resolveAuthorization` in src/main/index.ts instead (calls an external
 *   service — needs that host declared in manifest.json's networkAccess).
 *
 * plugin.meta.json's `allowedGroups` is the *human-readable* record of who
 * this is for, for the catalog and for reviewers — it does not by itself
 * enforce anything at runtime. This file is what actually enforces it.
 */
export const AUTHORIZED_USER_IDS: readonly string[] = [];
