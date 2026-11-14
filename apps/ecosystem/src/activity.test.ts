import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMycelium, events } from '@microverse/mycelium';
import { createActivityFeed } from './activity';
const stops: (() => void)[] = [];
beforeEach(() => vi.spyOn(console, 'debug').mockImplementation(() => {}));
afterEach(() => stops.splice(0).forEach((stop) => stop()));
describe('Host activity observation', () => {
  it('observes validated cross-owner facts without retaining profile or business payloads', () => {
    const feed = createActivityFeed();
    stops.push(feed.start());
    const event = createMycelium('commensal').publish(events.PROFILE_UPDATED, {
      scope: 'browser-tab',
    });
    expect(feed.getSnapshot()).toEqual([
      {
        id: event.id,
        name: event.name,
        source: 'commensal',
        timestamp: event.timestamp,
        correlationId: event.correlationId,
      },
    ]);
    expect(feed.getSnapshot()[0]).not.toHaveProperty('payload');
    window.dispatchEvent(new CustomEvent(event.name, { detail: event }));
    expect(feed.getSnapshot()).toHaveLength(1);
    window.dispatchEvent(
      new CustomEvent(events.PROFILE_UPDATED, {
        detail: { ...event, payload: { email: 'private@example.com' } },
      }),
    );
    expect(feed.getSnapshot()).toHaveLength(1);
  });
  it('bounds memory and removes event listeners and view subscribers', () => {
    const feed = createActivityFeed(),
      listener = vi.fn(),
      stopView = feed.subscribe(listener),
      stop = feed.start();
    stops.push(stop);
    for (let i = 0; i < 35; i++)
      createMycelium('commensal').publish(events.PROFILE_UPDATED, {
        scope: 'browser-tab',
      });
    expect(feed.getSnapshot()).toHaveLength(30);
    stopView();
    stop();
    const calls = listener.mock.calls.length,
      snapshot = feed.getSnapshot();
    createMycelium('commensal').publish(events.PROFILE_UPDATED, {
      scope: 'browser-tab',
    });
    expect(feed.getSnapshot()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(calls);
  });
});
