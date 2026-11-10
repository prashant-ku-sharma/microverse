import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProfile, patchProfile } from './client';
import { PROFILE_KEY } from '../profile';
beforeEach(() => sessionStorage.clear());
describe('COMMENSAL mock API persistence', () => {
  it('merges PATCH fields and reads the saved record on subsequent GET', async () => {
    const initial = await getProfile();
    await patchProfile({
      name: 'Jordan Rao',
      preferences: { ...initial.preferences, language: 'Hindi' },
    });
    expect(await getProfile()).toMatchObject({
      name: 'Jordan Rao',
      email: initial.email,
      preferences: { language: 'Hindi' },
    });
    expect(JSON.parse(sessionStorage.getItem(PROFILE_KEY)!)).toMatchObject({
      schemaVersion: 1,
      profile: { name: 'Jordan Rao' },
    });
  });
  it('rejects invalid input without overwriting the previous profile', async () => {
    await patchProfile({ name: 'Saved name' });
    await expect(patchProfile({ email: 'invalid' })).rejects.toMatchObject({
      status: 400,
    });
    expect((await getProfile()).name).toBe('Saved name');
  });
  it('returns a storage failure and keeps saved data', async () => {
    await patchProfile({ name: 'Saved name' });
    const prior = sessionStorage.getItem(PROFILE_KEY);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    await expect(patchProfile({ name: 'Unsaved name' })).rejects.toMatchObject({
      status: 500,
    });
    expect(sessionStorage.getItem(PROFILE_KEY)).toBe(prior);
  });
});
