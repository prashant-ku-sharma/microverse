import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, Link } from 'react-router';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteBoundary } from '../federation/RemoteBoundary';
import { RemoteView } from './RemoteView';
import { RemoteFailure } from './errors';
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
function Fault() {
  if (new URLSearchParams(useLocation().search).has('immune-render'))
    throw new Error('Controlled render fault');
  return <h2>Recovered products</h2>;
}
function mount(children: React.ReactNode, search = '') {
  render(
    <MemoryRouter initialEntries={['/products' + search]}>
      <h1>Host shell</h1>
      <RemoteBoundary
        remoteId="parasite"
        organism="PARASITE"
        application="product"
        title="Products are resting."
      >
        {children}
      </RemoteBoundary>
    </MemoryRouter>,
  );
}
describe('Remote boundary recovery', () => {
  it('preserves remote view state during ordinary search parameter navigation', async () => {
    function SearchView() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button onClick={() => setCount(count + 1)}>Selected {count}</button>
          <Link to="/products?search=moss">Search moss</Link>
        </>
      );
    }
    mount(<SearchView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Selected 0' }));
    await user.click(screen.getByRole('link', { name: 'Search moss' }));
    expect(screen.getByRole('button', { name: 'Selected 1' })).toBeVisible();
  });
  it('remounts a view and clears the controlled render fault without losing the Host', async () => {
    mount(
      <RemoteView id="parasite">
        <Fault />
      </RemoteView>,
      '?immune-render=parasite',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('VIEW FAILURE');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Retry view' }));
    expect(
      await screen.findByRole('heading', { name: 'Recovered products' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Host shell' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it.each([
    ['timed-out', 'PARASITE took too long.'],
    ['incompatible', 'PARASITE needs a compatible release.'],
  ] as const)(
    'explains %s and provides a fresh-page retry',
    async (kind, heading) => {
      const Broken = () => {
        throw new RemoteFailure(kind, 'release', 'The remote cannot load.');
      };
      mount(<Broken />);
      expect(
        await screen.findByRole('heading', { name: heading }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Retry remote' }),
      ).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Retry view' }),
      ).not.toBeInTheDocument();
    },
  );
});
