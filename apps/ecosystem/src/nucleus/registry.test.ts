import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRegistryClient } from './registry';
import { policySchema, validateRegistry } from './schema';
import development from '../../public/nucleus/config.json';
import remotes from '../../public/nucleus/remotes.json';
import production from '../../../../deployment/registry/production/config.json';
import productionRemotes from '../../../../deployment/registry/production/remotes.json';
const policy = policySchema.parse(development);
const reply = (body: unknown) => new Response(JSON.stringify(body));
function responses(...bodies: unknown[]) {
  return vi.fn<typeof fetch>().mockImplementation(async () => {
    const body = bodies.shift();
    if (body instanceof Error) throw body;
    return reply(body);
  });
}
afterEach(() => vi.useRealTimers());
describe('NUCLEUS schema and trust policy', () => {
  it('validates all four remotes and release metadata', () => {
    const registry = validateRegistry(remotes, policy);
    expect(Object.keys(registry.remotes)).toEqual([
      'parasite',
      'symbiont',
      'commensal',
      'mutant',
    ]);
    expect(registry.remotes.symbiont).toMatchObject({
      version: '1.0.0',
      enabled: true,
    });
    expect(
      validateRegistry(productionRemotes, policySchema.parse(production))
        .remotes.symbiont.entry,
    ).toContain('/releases/1.0.0/');
  });
  it.each([
    'missing',
    'unknown',
    'version',
    'compatibility',
    'untrusted',
    'credentials',
    'fragment',
    'scheme',
  ])('rejects %s registries', (kind) => {
    const registry = structuredClone(remotes);
    const cart = registry.remotes.symbiont;
    let candidate: unknown = registry;
    if (kind === 'missing') {
      const other = Object.fromEntries(
        Object.entries(registry.remotes).filter(([id]) => id !== 'symbiont'),
      );
      candidate = { ...registry, remotes: other };
    }
    if (kind === 'unknown') candidate = { ...registry, sneaky: true };
    if (kind === 'version') cart.version = 'latest';
    if (kind === 'compatibility') cart.compatibility.hostApi = 2;
    if (kind === 'untrusted')
      cart.entry = 'https://evil.example/remoteEntry.js';
    if (kind === 'credentials')
      cart.entry = 'http://user:pass@127.0.0.1:5002/remoteEntry.js';
    if (kind === 'fragment') cart.entry += '#alternate';
    if (kind === 'scheme') cart.entry = 'javascript:alert(1)';
    expect(() => validateRegistry(candidate, policy)).toThrow();
  });
  it('requires HTTPS/versioned production URLs and rejects lookalike origins', () => {
    const value = structuredClone(productionRemotes);
    value.remotes.symbiont.entry =
      'https://symbiont.microverse.example.evil.example/releases/1.0.0/remoteEntry.js';
    expect(() =>
      validateRegistry(value, policySchema.parse(production)),
    ).toThrow('untrusted');
    value.remotes.symbiont.entry =
      'https://symbiont.microverse.example/remoteEntry.js';
    expect(() =>
      validateRegistry(value, policySchema.parse(production)),
    ).toThrow('versioned');
    expect(() =>
      validateRegistry(remotes, { ...policy, environment: 'production' }),
    ).toThrow('insecure');
  });
});
describe('NUCLEUS loading and fallback', () => {
  it('pins one snapshot, deduplicates startup and avoids cached/redirected config', async () => {
    const fetcher = responses(development, remotes);
    const client = createRegistryClient(fetcher);
    const first = client.load();
    expect(client.load()).toBe(first);
    expect((await first).source).toBe('primary');
    expect(client.getSnapshot().status).toBe('ready');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      cache: 'no-store',
      redirect: 'error',
      credentials: 'same-origin',
    });
  });
  it.each(['unavailable', 'invalid', 'missing', 'untrusted'])(
    'uses only validated fallback after %s primary config',
    async (kind) => {
      const invalid = structuredClone(remotes);
      invalid.remotes.symbiont.entry = 'https://evil.example/remoteEntry.js';
      const primary: unknown =
        kind === 'unavailable'
          ? new Error('Offline')
          : kind === 'invalid'
            ? {}
            : kind === 'missing'
              ? { ...remotes, remotes: {} }
              : invalid;
      const fetcher = responses(development, primary, remotes);
      const result = await createRegistryClient(fetcher).load();
      expect(result.source).toBe('fallback');
      expect(result.warning).toContain('Primary');
      expect(result.registry.remotes.symbiont.entry).toBe(
        remotes.remotes.symbiont.entry,
      );
      expect(fetcher).toHaveBeenCalledTimes(3);
    },
  );
  it('fails closed if policy is invalid or both registry snapshots fail', async () => {
    const invalidPolicy = responses({
      ...development,
      registry: 'https://evil.example/config.json',
    });
    await expect(createRegistryClient(invalidPolicy).load()).rejects.toThrow(
      'trusted configuration unavailable',
    );
    expect(invalidPolicy).toHaveBeenCalledOnce();
    const client = createRegistryClient(responses(development, {}, {}));
    await expect(client.load()).rejects.toThrow(
      'trusted configuration unavailable',
    );
    expect(client.getSnapshot().status).toBe('error');
  });
  it('bounds a stalled configuration request and cleans up timers', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockReturnValue(new Promise(() => {}));
    const client = createRegistryClient(fetcher);
    const failure = expect(client.load()).rejects.toThrow(
      'trusted configuration unavailable',
    );
    await vi.advanceTimersByTimeAsync(5000);
    await failure;
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('observes a runtime URL/version change in a new document client', async () => {
    const changed = structuredClone(remotes);
    changed.remotes.symbiont.version = '1.1.0';
    changed.remotes.symbiont.entry =
      'http://127.0.0.1:5002/releases/1.1.0/remoteEntry.js';
    const first = await createRegistryClient(
      responses(development, remotes),
    ).load();
    const next = await createRegistryClient(
      responses(development, changed),
    ).load();
    expect(first.registry.remotes.symbiont.version).toBe('1.0.0');
    expect(next.registry.remotes.symbiont).toMatchObject({
      version: '1.1.0',
      entry: changed.remotes.symbiont.entry,
    });
  });
  it('rejects HTTP failures, invalid JSON and oversized payloads before using fallback', async () => {
    for (const response of [
      new Response('{}', { status: 503 }),
      new Response('<html>'),
      new Response('x'.repeat(100001)),
    ]) {
      const fetcher = responses();
      fetcher
        .mockResolvedValueOnce(reply(development))
        .mockResolvedValueOnce(response)
        .mockResolvedValueOnce(reply(remotes));
      expect((await createRegistryClient(fetcher).load()).source).toBe(
        'fallback',
      );
    }
  });
});
