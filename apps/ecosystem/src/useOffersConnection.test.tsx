import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loadOffersService } from './federation/loadAdditionalRemotes';
import { useOffersConnection } from './useOffersConnection';
vi.mock('./federation/loadAdditionalRemotes', () => ({
  loadOffersService: vi.fn(),
}));
function Connection() {
  useOffersConnection();
  return <p>Host shell</p>;
}
describe('Offer lifetime orchestration', () => {
  it('starts and disposes the remote without reading its business state', async () => {
    const stop = vi.fn();
    vi.mocked(loadOffersService).mockResolvedValue({
      startOffersService: () => stop,
    });
    const view = render(<Connection />);
    await act(async () => {});
    view.unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
  it('contains startup failures and skips late starts after unmount', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.mocked(loadOffersService).mockRejectedValue(new Error('Offline'));
    const first = render(<Connection />);
    await act(async () => {});
    first.unmount();
    let resolve:
      ((value: { startOffersService: () => () => void }) => void) | undefined;
    vi.mocked(loadOffersService).mockReturnValue(
      new Promise((finish) => {
        resolve = finish;
      }),
    );
    const view = render(<Connection />);
    view.unmount();
    const start = vi.fn(() => vi.fn());
    await act(async () => {
      resolve?.({ startOffersService: start });
    });
    expect(start).not.toHaveBeenCalled();
  });
});
