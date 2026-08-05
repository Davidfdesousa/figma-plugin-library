import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkAuthorization, getCurrentUser, runIfAuthorized } from './guard';

describe('checkAuthorization', () => {
  it('authorizes a user id present in allowedUserIds', async () => {
    const result = await checkAuthorization(
      { id: 'u1', name: 'Ada' },
      { allowedUserIds: ['u1', 'u2'] },
    );
    expect(result).toEqual({ authorized: true });
  });

  it('denies a user id absent from allowedUserIds with no resolver', async () => {
    const result = await checkAuthorization({ id: 'u3', name: 'Grace' }, { allowedUserIds: ['u1'] });
    expect(result.authorized).toBe(false);
  });

  it('falls back to resolveAuthorization when allowedUserIds does not match', async () => {
    const resolveAuthorization = vi.fn().mockResolvedValue({ authorized: true });
    const result = await checkAuthorization(
      { id: 'u3', name: 'Grace' },
      { allowedUserIds: ['u1'], resolveAuthorization },
    );
    expect(resolveAuthorization).toHaveBeenCalledWith({ id: 'u3', name: 'Grace' });
    expect(result).toEqual({ authorized: true });
  });
});

describe('getCurrentUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when figma has no identifiable user', () => {
    vi.stubGlobal('figma', { currentUser: null });
    expect(getCurrentUser()).toBeNull();
  });

  it('returns null when figma.currentUser.id is missing', () => {
    vi.stubGlobal('figma', { currentUser: { id: null, name: 'Anonymous' } });
    expect(getCurrentUser()).toBeNull();
  });

  it('returns the user when an id is present', () => {
    vi.stubGlobal('figma', { currentUser: { id: 'u1', name: 'Ada' } });
    expect(getCurrentUser()).toEqual({ id: 'u1', name: 'Ada' });
  });
});

describe('runIfAuthorized', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs onAuthorized when the current user is allowed', async () => {
    vi.stubGlobal('figma', { currentUser: { id: 'u1', name: 'Ada' } });
    const onAuthorized = vi.fn().mockReturnValue('ran');
    const onUnauthorized = vi.fn();

    const result = await runIfAuthorized({ allowedUserIds: ['u1'] }, onAuthorized, onUnauthorized);

    expect(result).toBe('ran');
    expect(onAuthorized).toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('runs onUnauthorized and skips onAuthorized when denied', async () => {
    vi.stubGlobal('figma', { currentUser: { id: 'u9', name: 'Stranger' } });
    const onAuthorized = vi.fn();
    const onUnauthorized = vi.fn();

    const result = await runIfAuthorized({ allowedUserIds: ['u1'] }, onAuthorized, onUnauthorized);

    expect(result).toBeUndefined();
    expect(onAuthorized).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledWith(
      expect.objectContaining({ authorized: false }),
    );
  });

  it('denies when there is no identifiable Figma user at all', async () => {
    vi.stubGlobal('figma', { currentUser: null });
    const onUnauthorized = vi.fn();

    await runIfAuthorized({ allowedUserIds: ['u1'] }, () => 'ran', onUnauthorized);

    expect(onUnauthorized).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'no identifiable Figma user available' }),
    );
  });
});
