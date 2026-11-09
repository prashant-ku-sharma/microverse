import { eventSchema, events } from './contracts';
import type {
  ApplicationId,
  EventCallback,
  EventName,
  EventOf,
  PayloadOf,
} from './contracts';
export * from './contracts';

export class MyceliumError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MyceliumError';
  }
}
export interface EventLogEntry {
  phase: 'published' | 'received' | 'acknowledged' | 'error';
  timestamp: string;
  eventId?: string;
  name?: EventName;
  correlationId?: string;
  message?: string;
}
const history: EventLogEntry[] = [];
function log(entry: Omit<EventLogEntry, 'timestamp'>) {
  const record = { ...entry, timestamp: new Date().toISOString() };
  history.push(record);
  if (history.length > 100) history.shift();
  // Payloads are deliberately excluded; this is transport diagnostics, not business state.
  console.debug('[MYCELIUM]', JSON.stringify(record));
}
export function getEventLog(): readonly EventLogEntry[] {
  return history.map((entry) => ({ ...entry }));
}
const prefix = 'microverse:mycelium:v1:pending:';
const registrations = new Map<EventName, Map<unknown, EventListener>>();
function storage() {
  return window.sessionStorage;
}
function storageFailure(cause: unknown): never {
  log({
    phase: 'error',
    message: 'Durable delivery storage is unavailable or invalid.',
  });
  throw new MyceliumError(
    'Unable to save or read cart requests in this browser tab.',
    { cause },
  );
}
/** Opaque envelopes only; the consumer decides whether/how a command changes its business state. */
export function pendingEvents(): EventOf<typeof events.PRODUCT_ADDED>[] {
  try {
    const store = storage();
    const pending: EventOf<typeof events.PRODUCT_ADDED>[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key?.startsWith(prefix)) continue;
      const event = eventSchema.parse(
        JSON.parse(store.getItem(key) ?? 'null') as unknown,
      );
      if (event.name !== events.PRODUCT_ADDED || key !== prefix + event.id)
        throw new MyceliumError('Invalid delivery envelope');
      pending.push(event);
    }
    return pending.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } catch (cause) {
    return storageFailure(cause);
  }
}
/** Call only after the owning consumer commits its state and applied-event ID together. */
export function acknowledge(eventId: string) {
  try {
    const key = prefix + eventId;
    storage().removeItem(key);
    log({ phase: 'acknowledged', eventId });
  } catch (cause) {
    storageFailure(cause);
  }
}
export function publish<N extends EventName>(
  name: N,
  payload: PayloadOf<N>,
  options: { source: EventOf<N>['source']; correlationId?: string },
): EventOf<N> {
  const parsed = eventSchema.safeParse({
    id: crypto.randomUUID(),
    name,
    source: options.source,
    timestamp: new Date().toISOString(),
    schemaVersion: 1,
    correlationId: options.correlationId ?? crypto.randomUUID(),
    payload,
  });
  if (!parsed.success) {
    log({ phase: 'error', message: 'Rejected invalid outgoing event.' });
    throw new MyceliumError('Invalid MYCELIUM event', { cause: parsed.error });
  }
  const event = parsed.data;
  if (event.name === events.PRODUCT_ADDED) {
    try {
      if (pendingEvents().length >= 100)
        throw new MyceliumError(
          'Cart request inbox is full. Open Cart to reconcile saved requests.',
        );
      storage().setItem(prefix + event.id, JSON.stringify(event));
    } catch (cause) {
      if (cause instanceof MyceliumError) throw cause;
      storageFailure(cause);
    }
  }
  log({
    phase: 'published',
    eventId: event.id,
    name: event.name,
    correlationId: event.correlationId,
  });
  window.dispatchEvent(new CustomEvent(name, { detail: event }));
  return event as EventOf<N>;
}
export function unsubscribe<N extends EventName>(
  name: N,
  callback: EventCallback<N>,
) {
  const map = registrations.get(name);
  const listener = map?.get(callback);
  if (listener) window.removeEventListener(name, listener);
  map?.delete(callback);
  if (map?.size === 0) registrations.delete(name);
}
export function subscribe<N extends EventName>(
  name: N,
  callback: EventCallback<N>,
): () => void {
  if (!registrations.has(name)) registrations.set(name, new Map());
  const map = registrations.get(name)!;
  if (!map.has(callback)) {
    const listener: EventListener = (nativeEvent) => {
      if (!(nativeEvent instanceof CustomEvent)) return;
      const parsed = eventSchema.safeParse(nativeEvent.detail as unknown);
      if (!parsed.success || parsed.data.name !== name) {
        log({ phase: 'error', message: 'Rejected invalid incoming event.' });
        return;
      }
      const event = parsed.data;
      log({
        phase: 'received',
        eventId: event.id,
        name: event.name,
        correlationId: event.correlationId,
      });
      const onFailure = () =>
        log({
          phase: 'error',
          eventId: event.id,
          name: event.name,
          message: 'Subscriber failed; other subscribers remain active.',
        });
      try {
        const result = callback(event as EventOf<N>);
        if (result) void result.catch(onFailure);
      } catch {
        onFailure();
      }
    };
    map.set(callback, listener);
    window.addEventListener(name, listener);
  }
  return () => unsubscribe(name, callback);
}
type NamesFor<S extends ApplicationId> = {
  [N in EventName]: S extends EventOf<N>['source'] ? N : never;
}[EventName];
/** Bind the source once, leaving publish(event, payload) at each application call site. */
export function createMycelium<S extends ApplicationId>(source: S) {
  return {
    publish<N extends NamesFor<S>>(
      name: N,
      payload: PayloadOf<N>,
      options: { correlationId?: string } = {},
    ) {
      return publish(name, payload, { ...options, source } as {
        source: EventOf<N>['source'];
        correlationId?: string;
      });
    },
    subscribe,
    unsubscribe,
  };
}
