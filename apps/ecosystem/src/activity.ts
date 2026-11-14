import { events, subscribe } from '@microverse/mycelium';
import type { EventEnvelope } from '@microverse/mycelium';
/** Host diagnostics only: never retain product, profile, cart or offer payloads. */
export type ActivityEntry = Pick<
  EventEnvelope,
  'id' | 'name' | 'source' | 'timestamp' | 'correlationId'
>;
export function createActivityFeed() {
  let entries: readonly ActivityEntry[] = [];
  const listeners = new Set<() => void>();
  function receive(event: EventEnvelope) {
    const { id, name, source, timestamp, correlationId } = event;
    if (entries.some((entry) => entry.id === id)) return;
    entries = [
      { id, name, source, timestamp, correlationId },
      ...entries,
    ].slice(0, 30);
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot: () => entries,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      const stops = Object.values(events).map((name) =>
        subscribe(name, receive),
      );
      return () => stops.forEach((stop) => stop());
    },
  };
}
export const activity = createActivityFeed();
