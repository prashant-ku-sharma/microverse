import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createImmuneSystem, DIAGNOSTICS_KEY } from './store';
import { RemoteFailure } from './errors';
beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
const context = {
  version: '1.0.0',
  entry: 'http://127.0.0.1:5001/remoteEntry.js',
};
describe('IMMUNE SYSTEM observation semantics', () => {
  it('starts unknown and distinguishes module loading from a health check', () => {
    const store = createImmuneSystem();
    expect(store.getSnapshot().remotes.parasite.status).toBe('not-loaded');
    const token = store.begin('parasite', 'routes', 'load', context);
    expect(store.getSnapshot().remotes.parasite.status).toBe('loading');
    store.finish('parasite', 'routes', token);
    expect(store.getSnapshot().remotes.parasite).toMatchObject({
      status: 'available',
      lastModuleLoad: { phase: 'load', version: '1.0.0' },
    });
    expect(store.getSnapshot().remotes.symbiont.status).toBe('not-loaded');
  });
  it('does not let late completion erase a timeout or a newer attempt', () => {
    const store = createImmuneSystem();
    const old = store.begin('parasite', 'routes', 'load');
    store.fail(
      'parasite',
      'routes',
      old,
      new RemoteFailure('timed-out', 'load', 'Timed out'),
      'load',
    );
    store.finish('parasite', 'routes', old);
    expect(store.getSnapshot().remotes.parasite.status).toBe('timed-out');
    const next = store.begin('parasite', 'routes', 'load');
    store.finish('parasite', 'routes', old);
    expect(store.getSnapshot().remotes.parasite.status).toBe('loading');
    store.finish('parasite', 'routes', next);
    expect(store.getSnapshot().remotes.parasite.status).toBe('available');
    expect(store.getSnapshot().remotes.parasite.lastFailure?.kind).toBe(
      'timed-out',
    );
  });
  it('retains a view failure while another capability succeeds, then records view recovery', () => {
    const store = createImmuneSystem();
    store.renderFailed('symbiont');
    const token = store.begin('symbiont', 'cart-service', 'load');
    store.finish('symbiont', 'cart-service', token);
    expect(store.getSnapshot().remotes.symbiont.status).toBe('failed');
    store.viewReady('symbiont');
    expect(store.getSnapshot().remotes.symbiont.status).toBe('available');
    expect(store.getSnapshot().remotes.symbiont.lastFailure?.phase).toBe(
      'render',
    );
  });
  it('marks incompatible/disabled independently without inventing failures for other remotes', () => {
    const store = createImmuneSystem();
    const token = store.begin('parasite', 'routes', 'release');
    store.fail(
      'parasite',
      'routes',
      token,
      new RemoteFailure('incompatible', 'release', 'Unsupported release'),
      'release',
    );
    expect(store.getSnapshot().remotes.parasite.status).toBe('incompatible');
    const disabled = store.begin('mutant', 'offers-service', 'load');
    store.disabled('mutant', 'offers-service', disabled);
    expect(store.getSnapshot().remotes.mutant.status).toBe('disabled');
    expect(store.getSnapshot().remotes.mutant.lastFailure).toBeNull();
    store.fallback();
    expect(store.getSnapshot().history.at(-1)?.remote).toBeNull();
  });
  it('persists bounded history but resets current availability after reload', () => {
    const store = createImmuneSystem(sessionStorage);
    const token = store.begin('parasite', 'routes', 'load', context);
    store.finish('parasite', 'routes', token);
    store.renderFailed('parasite');
    store.retry('parasite', 'page');
    const nextDocument = createImmuneSystem(sessionStorage);
    expect(nextDocument.getSnapshot().remotes.parasite).toMatchObject({
      status: 'not-loaded',
      version: null,
      lastFailure: { phase: 'render' },
      lastModuleLoad: { version: '1.0.0' },
    });
    for (let i = 0; i < 60; i++) store.retry('parasite', 'view');
    expect(
      JSON.parse(sessionStorage.getItem(DIAGNOSTICS_KEY)!).history,
    ).toHaveLength(50);
  });
  it('isolates broken/corrupt diagnostic storage and omits raw exception payloads', () => {
    const storage = {
      getItem: () => '{bad',
      setItem: () => {
        throw new Error('Blocked');
      },
    };
    const store = createImmuneSystem(storage);
    const token = store.begin('commensal', 'routes', 'load');
    expect(() =>
      store.fail(
        'commensal',
        'routes',
        token,
        new Error('secret-profile@example.com'),
        'load',
      ),
    ).not.toThrow();
    expect(JSON.stringify(store.getSnapshot())).not.toContain('secret-profile');
    expect(store.getSnapshot().remotes.commensal.status).toBe('failed');
  });
  it('cleans up monitoring listeners', () => {
    const store = createImmuneSystem();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    stop();
    store.begin('parasite', 'routes', 'load');
    expect(listener).not.toHaveBeenCalled();
  });
});
