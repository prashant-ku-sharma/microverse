import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegistryStatus } from './RegistryStatus';
import { createRegistryClient } from './registry';
import development from '../../public/nucleus/config.json';
import remotes from '../../public/nucleus/remotes.json';
function client(...bodies: unknown[]) {
  return createRegistryClient(
    vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () => new Response(JSON.stringify(bodies.shift())),
      ),
  );
}
describe('Runtime configuration visibility', () => {
  it('shows loading and version metadata from the resolved snapshot', async () => {
    render(<RegistryStatus client={client(development, remotes)} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading NUCLEUS');
    expect(
      await screen.findByText('development · primary snapshot · schema 1'),
    ).toBeVisible();
    expect(screen.getAllByText('v1.0.0')).toHaveLength(4);
    expect(screen.getAllByText('Enabled')).toHaveLength(4);
  });
  it('discloses fallback and a disabled remote', async () => {
    const data = structuredClone(remotes);
    data.remotes.mutant.enabled = false;
    render(<RegistryStatus client={client(development, {}, data)} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'validated fallback',
    );
    expect(screen.getByText('Disabled')).toBeVisible();
  });
  it('leaves the Host usable if no trusted snapshot can be loaded', async () => {
    render(
      <>
        <h1>Host shell</h1>
        <RegistryStatus client={client({})} />
      </>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Remote loading is blocked',
    );
    expect(screen.getByRole('heading', { name: 'Host shell' })).toBeVisible();
  });
});
