import { beforeEach, expect, it, vi } from 'vitest';
import { events, subscribe } from '@microverse/mycelium';
import { demoProfile, PROFILE_KEY, saveProfile } from './profile';
beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
it('announces only a successful owner commit and never publishes profile fields', () => {
  const receive = vi.fn();
  const stop = subscribe(events.PROFILE_UPDATED, receive);
  try {
    saveProfile({ ...demoProfile, name: 'Jordan Rao' });
    expect(receive).toHaveBeenCalledOnce();
    expect(receive.mock.calls[0]?.[0].payload).toEqual({
      scope: 'browser-tab',
    });
    expect(JSON.parse(sessionStorage.getItem(PROFILE_KEY)!).profile.name).toBe(
      'Jordan Rao',
    );
    expect(() => saveProfile({ ...demoProfile, name: '' })).toThrow();
    expect(receive).toHaveBeenCalledOnce();
  } finally {
    stop();
  }
});
