import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { createImmuneSystem } from './store';
import { RemoteFailure } from './errors';
const fixtures = vi.hoisted(() => ({
  monitor: {} as ReturnType<typeof createImmuneSystem>,
}));
vi.mock('./store', async (original) => {
  const actual = await original<typeof import('./store')>();
  fixtures.monitor = actual.createImmuneSystem();
  return { ...actual, immune: fixtures.monitor };
});
vi.mock('../nucleus/registry', () => {
  const snapshot = { status: 'error', message: 'No registry' };
  return {
    nucleus: { subscribe: () => () => {}, getSnapshot: () => snapshot },
  };
});
import { RemoteMonitor } from './RemoteMonitor';
describe('Honest runtime monitoring', () => {
  it('does not label untouched remotes healthy and reports no genuine health check', () => {
    render(
      <MemoryRouter>
        <RemoteMonitor />
      </MemoryRouter>,
    );
    const parasite = within(
      screen.getByRole('region', { name: 'parasite runtime observation' }),
    );
    expect(parasite.getByText('Not loaded')).toBeVisible();
    expect(
      parasite.getByText(/No successful module load recorded/),
    ).toBeVisible();
    expect(
      parasite.getByText(/no genuine health check performed/),
    ).toBeVisible();
  });
  it('shows current state, failure metadata and recovery while retaining the last failure', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <RemoteMonitor />
      </MemoryRouter>,
    );
    let token = 0;
    act(() => {
      token = fixtures.monitor.begin('parasite', 'routes', 'load');
    });
    const card = within(
      screen.getByRole('region', { name: 'parasite runtime observation' }),
    );
    expect(card.getByText('Loading')).toBeVisible();
    act(() => {
      fixtures.monitor.fail(
        'parasite',
        'routes',
        token,
        new RemoteFailure('timed-out', 'load', 'The remote timed out.'),
        'load',
      );
    });
    expect(card.getByText('Timed out')).toBeVisible();
    expect(card.getByText(/Last failure: The remote timed out/)).toBeVisible();
    act(() => {
      const retry = fixtures.monitor.begin('parasite', 'routes', 'load');
      fixtures.monitor.finish('parasite', 'routes', retry);
    });
    expect(card.getByText('Available')).toBeVisible();
    expect(card.getByText(/Last failure: The remote timed out/)).toBeVisible();
  });
});
