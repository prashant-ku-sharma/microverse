import { z } from 'zod';
import { remoteIds } from '../nucleus/schema';
import type { RemoteId } from '../nucleus/schema';
import { describeFailure } from './errors';
import type { FailurePhase } from './errors';
export type RuntimeStatus =
  | 'not-loaded'
  | 'loading'
  | 'available'
  | 'failed'
  | 'timed-out'
  | 'incompatible'
  | 'disabled';
export interface Context {
  version: string | null;
  entry: string | null;
}
const observationSchema = z.strictObject({
  remote: z.enum(remoteIds).nullable(),
  operation: z.string().max(60),
  at: z.iso.datetime(),
  kind: z.enum([
    'available',
    'failed',
    'timed-out',
    'incompatible',
    'retry',
    'configuration-fallback',
  ]),
  phase: z.enum(['configuration', 'release', 'load', 'render', 'service']),
  version: z.string().max(64).nullable(),
  entry: z.string().max(2048).nullable(),
  message: z.string().max(200),
});
export type Observation = z.infer<typeof observationSchema>;
interface Operation {
  token: number;
  status: RuntimeStatus;
  phase: FailurePhase;
}
export interface RemoteObservation extends Context {
  status: RuntimeStatus;
  operations: Record<string, Operation>;
  lastFailure: Observation | null;
  lastModuleLoad: Observation | null;
}
interface Snapshot {
  remotes: Record<RemoteId, RemoteObservation>;
  history: Observation[];
}
export const DIAGNOSTICS_KEY = 'microverse:immune:v1:diagnostics';
const historySchema = z.strictObject({
  schemaVersion: z.literal(1),
  history: z.array(observationSchema).max(50),
});
/** Diagnostic metadata only. Storage is optional and is never a configuration or business-state authority. */
export function createImmuneSystem(
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  let history: Observation[] = [];
  try {
    const raw = storage?.getItem(DIAGNOSTICS_KEY);
    if (raw) history = historySchema.parse(JSON.parse(raw) as unknown).history;
  } catch {
    /* Diagnostics must not block the application. */
  }
  const initial = (): Snapshot => ({
    history,
    remotes: Object.fromEntries(
      remoteIds.map((id) => [
        id,
        {
          status: 'not-loaded',
          operations: {},
          version: null,
          entry: null,
          lastFailure:
            history
              .slice()
              .reverse()
              .find(
                (item) =>
                  item.remote === id &&
                  ['failed', 'timed-out', 'incompatible'].includes(item.kind),
              ) ?? null,
          lastModuleLoad:
            history
              .slice()
              .reverse()
              .find(
                (item) =>
                  item.remote === id &&
                  item.kind === 'available' &&
                  item.phase === 'load',
              ) ?? null,
        },
      ]),
    ) as Snapshot['remotes'],
  });
  let state = initial(),
    counter = 0;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  function aggregate(operations: Record<string, Operation>): RuntimeStatus {
    const values = Object.values(operations).map((item) => item.status);
    for (const status of [
      'incompatible',
      'timed-out',
      'failed',
      'loading',
      'available',
      'disabled',
    ] as const)
      if (values.includes(status)) return status;
    return 'not-loaded';
  }
  function update(
    id: RemoteId,
    operation: string,
    value: Operation,
    context?: Context,
  ) {
    const remote = state.remotes[id];
    const operations = { ...remote.operations, [operation]: value };
    state = {
      ...state,
      remotes: {
        ...state.remotes,
        [id]: {
          ...remote,
          ...context,
          operations,
          status: aggregate(operations),
        },
      },
    };
  }
  function record(
    id: RemoteId | null,
    operation: string,
    kind: Observation['kind'],
    phase: FailurePhase,
    message: string,
  ) {
    const remote = id ? state.remotes[id] : null;
    const item: Observation = {
      remote: id,
      operation,
      kind,
      phase,
      message,
      at: new Date().toISOString(),
      version: remote?.version ?? null,
      entry: remote?.entry ?? null,
    };
    history = [...state.history, item].slice(-50);
    state = {
      ...state,
      history,
      remotes:
        id && remote
          ? {
              ...state.remotes,
              [id]: {
                ...remote,
                lastFailure: ['failed', 'timed-out', 'incompatible'].includes(
                  kind,
                )
                  ? item
                  : remote.lastFailure,
                lastModuleLoad:
                  kind === 'available' && phase === 'load'
                    ? item
                    : remote.lastModuleLoad,
              },
            }
          : state.remotes,
    };
    try {
      storage?.setItem(
        DIAGNOSTICS_KEY,
        JSON.stringify({ schemaVersion: 1, history }),
      );
    } catch {
      /* Best-effort local diagnostics. */
    }
    if (
      [
        'failed',
        'timed-out',
        'incompatible',
        'configuration-fallback',
      ].includes(kind)
    )
      console.warn('[IMMUNE SYSTEM]', item);
  }
  return {
    getSnapshot: () => state,
    context(id: RemoteId, context: Context) {
      state = {
        ...state,
        remotes: {
          ...state.remotes,
          [id]: { ...state.remotes[id], ...context },
        },
      };
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    begin(
      id: RemoteId,
      operation: string,
      phase: FailurePhase,
      context?: Context,
    ) {
      const token = ++counter;
      update(id, operation, { token, status: 'loading', phase }, context);
      emit();
      return token;
    },
    finish(id: RemoteId, operation: string, token: number) {
      const current = state.remotes[id].operations[operation];
      if (current?.token !== token || current.status !== 'loading') return;
      update(id, operation, { ...current, status: 'available' });
      record(
        id,
        operation,
        'available',
        current.phase,
        'The observed operation completed successfully.',
      );
      emit();
    },
    fail(
      id: RemoteId,
      operation: string,
      token: number,
      error: unknown,
      phase: FailurePhase,
    ) {
      const current = state.remotes[id].operations[operation];
      if (current?.token !== token || current.status !== 'loading') return;
      const failure = describeFailure(error, phase);
      update(id, operation, {
        ...current,
        status: failure.kind,
        phase: failure.phase,
      });
      record(id, operation, failure.kind, failure.phase, failure.message);
      emit();
    },
    disabled(id: RemoteId, operation: string, token: number) {
      const current = state.remotes[id].operations[operation];
      if (current?.token !== token) return;
      update(id, operation, { ...current, status: 'disabled' });
      emit();
    },
    renderFailed(id: RemoteId) {
      const token = ++counter;
      update(id, 'view', { token, status: 'failed', phase: 'render' });
      record(
        id,
        'view',
        'failed',
        'render',
        'The remote view could not render.',
      );
      emit();
    },
    viewReady(id: RemoteId) {
      const token = ++counter;
      update(id, 'view', { token, status: 'available', phase: 'render' });
      emit();
    },
    retry(id: RemoteId, mode: 'view' | 'page') {
      record(
        id,
        'recovery',
        'retry',
        mode === 'view' ? 'render' : 'load',
        mode === 'view'
          ? 'User requested a view remount.'
          : 'User requested a fresh-page retry.',
      );
      emit();
    },
    fallback() {
      record(
        null,
        'registry',
        'configuration-fallback',
        'configuration',
        'Primary registry rejected; a validated fallback snapshot was selected.',
      );
      emit();
    },
  };
}
let storage: Storage | undefined;
try {
  storage = sessionStorage;
} catch {
  /* Sandboxed/blocked browser storage. */
}
export const immune = createImmuneSystem(storage);
