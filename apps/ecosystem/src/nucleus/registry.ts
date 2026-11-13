import { immune } from '../immune/store';
import { policySchema, validateRegistry } from './schema';
import type { Policy, Registry } from './schema';
export interface RegistrySnapshot {
  registry: Registry;
  environment: Policy['environment'];
  source: 'primary' | 'fallback';
  warning: string | null;
}
type State =
  | { status: 'idle'; message: null }
  | { status: 'loading'; message: null }
  | { status: 'error'; message: string }
  | { status: 'ready'; snapshot: RegistrySnapshot };
/** One validated snapshot per document: routes and background services cannot mix releases. */
export function createRegistryClient(
  fetcher: typeof fetch = (...args) => fetch(...args),
  origin = location.origin,
) {
  let pending: Promise<RegistrySnapshot> | undefined;
  let state: State = { status: 'idle', message: null };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  async function json(path: string): Promise<unknown> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetcher(new URL(path, origin), {
            cache: 'no-store',
            redirect: 'error',
            credentials: 'same-origin',
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error('NUCLEUS: configuration request failed');
          const text = await response.text();
          if (text.length > 100000)
            throw new Error('NUCLEUS: configuration exceeds size limit');
          return JSON.parse(text) as unknown;
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('NUCLEUS: configuration timed out'));
          }, 5000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  async function resolve(): Promise<RegistrySnapshot> {
    // Same-origin policy is an operator-controlled trust anchor, not part of the registry payload.
    const policy = policySchema.parse(await json('/nucleus/config.json'));
    try {
      return {
        registry: validateRegistry(await json(policy.registry), policy),
        environment: policy.environment,
        source: 'primary',
        warning: null,
      };
    } catch {
      const fallback = validateRegistry(await json(policy.fallback), policy);
      immune.fallback();
      return {
        registry: fallback,
        environment: policy.environment,
        source: 'fallback',
        warning:
          'Primary configuration was unavailable or invalid. Using the validated fallback snapshot.',
      };
    }
  }
  return {
    load() {
      if (!pending) {
        state = { status: 'loading', message: null };
        notify();
        pending = resolve().then(
          (snapshot) => {
            state = { status: 'ready', snapshot };
            notify();
            return snapshot;
          },
          () => {
            state = {
              status: 'error',
              message:
                'NUCLEUS could not load trusted configuration. Remote loading is blocked; the Host remains available. Check configuration and reload.',
            };
            notify();
            throw new Error('NUCLEUS: trusted configuration unavailable');
          },
        );
      }
      return pending;
    },
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
export const nucleus = createRegistryClient();
