import { RemoteDisabledError } from './nucleus/errors';
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMycelium, events } from '@microverse/mycelium';
import { useCartConnection } from './useCartConnection';
import { loadCartService } from './federation/loadSymbiont';

vi.mock('./federation/loadSymbiont', () => ({ loadCartService: vi.fn() }));
const bus = createMycelium('symbiont');
function Connection() {
  const { count, status } = useCartConnection();
  return (
    <p data-testid="connection">
      {status}:{count ?? 'unknown'}
    </p>
  );
}
function updated(itemCount: number, revision: number) {
  bus.publish(events.CART_UPDATED, {
    itemCount,
    revision,
    subtotalPaise: 100 * itemCount,
    discountPaise: 10 * itemCount,
    totalPaise: 90 * itemCount,
  });
}
beforeEach(() => {
  vi.mocked(loadCartService).mockReset();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
describe('Host MYCELIUM count projection', () => {
  it('observes restored state and subsequent cart facts without reading remote business state', async () => {
    const stop = vi.fn();
    vi.mocked(loadCartService).mockResolvedValue({
      startCartService: () => {
        updated(2, 1);
        return stop;
      },
    });
    const view = render(<Connection />);
    expect(await screen.findByText('ready:2')).toBeVisible();
    act(() => updated(4, 2));
    expect(screen.getByTestId('connection')).toHaveTextContent('ready:4');
    act(() => updated(1, 1));
    expect(screen.getByTestId('connection')).toHaveTextContent('ready:4');
    act(() =>
      bus.publish(events.CART_CLEARED, { reason: 'user', revision: 3 }),
    );
    expect(screen.getByTestId('connection')).toHaveTextContent('ready:0');
    view.unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
  it('keeps the Host usable and the count unknown if the service cannot load', async () => {
    vi.mocked(loadCartService).mockRejectedValue(new Error('Offline'));
    render(
      <>
        <nav>Host navigation</nav>
        <Connection />
      </>,
    );
    expect(await screen.findByText('unavailable:unknown')).toBeVisible();
    expect(screen.getByRole('navigation')).toBeVisible();
    act(() => updated(1, 1));
    expect(screen.getByTestId('connection')).toHaveTextContent('ready:1');
  });
  it('does not start a service whose async load finishes after unmount', async () => {
    let finish:
      ((module: { startCartService: () => () => void }) => void) | undefined;
    vi.mocked(loadCartService).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = render(<Connection />);
    view.unmount();
    const start = vi.fn(() => vi.fn());
    await act(async () => {
      finish?.({ startCartService: start });
    });
    expect(start).not.toHaveBeenCalled();
  });
  it('distinguishes a disabled background capability from a network outage', async () => {
    vi.mocked(loadCartService).mockRejectedValue(new RemoteDisabledError());
    render(<Connection />);
    expect(await screen.findByText('disabled:unknown')).toBeVisible();
  });
  it('handles StrictMode lifetime replay without duplicate starts or leaked subscriptions', async () => {
    const stop = vi.fn();
    const start = vi.fn(() => {
      updated(0, 0);
      return stop;
    });
    vi.mocked(loadCartService).mockResolvedValue({ startCartService: start });
    const view = render(
      <StrictMode>
        <Connection />
      </StrictMode>,
    );
    expect(await screen.findByText('ready:0')).toBeVisible();
    expect(start).toHaveBeenCalledOnce();
    view.unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
});
