import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteProfile } from './RemoteProfile';
import { RemoteOffers } from './RemoteOffers';
import { loadCommensal, loadMutant } from './loadAdditionalRemotes';
vi.mock('./loadAdditionalRemotes', () => ({
  loadCommensal: vi.fn(),
  loadMutant: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(loadCommensal).mockReset();
  vi.mocked(loadMutant).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
describe.each([
  [RemoteProfile, loadCommensal, 'COMMENSAL', 'Your profile is resting.'],
  [RemoteOffers, loadMutant, 'MUTANT', 'Offers are resting.'],
] as const)('%s route isolation', (Remote, loader, name, failure) => {
  function mount() {
    return render(
      <MemoryRouter>
        <nav>
          <Link to="/other">Other Host route</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Remote />} />
          <Route path="/other" element={<h1>Host still works</h1>} />
        </Routes>
      </MemoryRouter>,
    );
  }
  it('shows loading and then renders its embedded entry', async () => {
    vi.mocked(loader).mockReturnValueOnce(new Promise(() => {}));
    const first = mount();
    expect(screen.getByRole('status')).toHaveTextContent(
      `Connecting to ${name}`,
    );
    first.unmount();
    vi.mocked(loader).mockResolvedValue({
      default: ({ mode }) => (
        <h1>
          {name} {mode}
        </h1>
      ),
    });
    mount();
    expect(
      await screen.findByRole('heading', { name: `${name} embedded` }),
    ).toBeVisible();
  });
  it('contains a load rejection and keeps Host navigation working', async () => {
    const user = userEvent.setup();
    vi.mocked(loader).mockRejectedValue(new Error('Offline'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(failure);
    await user.click(screen.getByRole('link', { name: 'Other Host route' }));
    expect(
      screen.getByRole('heading', { name: 'Host still works' }),
    ).toBeVisible();
  });
});
