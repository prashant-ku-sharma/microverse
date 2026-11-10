import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from './api/test-setup';
import App from './App';
import Routes from './routes';
import { demoProfile, PROFILE_KEY, readProfile } from './profile';
beforeEach(() => {
  sessionStorage.clear();
});
async function ready() {
  const view = render(<App />);
  await screen.findByRole('button', { name: 'Edit profile' });
  return view;
}
describe('COMMENSAL API-backed profile', () => {
  it('loads its profile and independent standalone shell', async () => {
    await ready();
    expect(screen.getByRole('banner')).toHaveTextContent('COMMENSAL');
    expect(
      screen.getByRole('img', { name: 'Avery Rao avatar' }),
    ).toHaveTextContent('AR');
    expect(screen.getByLabelText('Email')).toHaveValue(demoProfile.email);
    expect(screen.getByRole('switch', { name: 'Order updates' })).toBeChecked();
  });
  it('PATCHes edits, preserves preferences, and restores saves on remount', async () => {
    const user = userEvent.setup();
    const first = await ready();
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    for (const [label, value] of [
      ['Name', 'Jordan Rao'],
      ['Email', 'jordan@example.com'],
      ['City', 'Pune'],
    ] as const) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), value);
    }
    await user.click(
      screen.getByRole('switch', { name: 'Offers and coupons' }),
    );
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Profile saved'),
    );
    expect(readProfile().profile).toMatchObject({
      name: 'Jordan Rao',
      address: { city: 'Pune' },
      notifications: { offers: true },
    });
    first.unmount();
    await ready();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Rao');
  });
  it('discards drafts and validates invalid fields without writing', async () => {
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Avery Rao');
    expect(sessionStorage.getItem(PROFILE_KEY)).toBeNull();
  });
  it('keeps the draft and prior saved profile after a failed PATCH', async () => {
    await ready();
    server.use(
      http.patch('*/api/profile', () =>
        HttpResponse.json({ message: 'Save unavailable' }, { status: 503 }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText(/Profile could not be saved/)).toBeVisible();
    expect(screen.getByLabelText('Name')).toHaveValue('New name');
    expect(readProfile().profile.name).toBe('Avery Rao');
  });
  it('reports corrupt persistence and resets only on explicit action', async () => {
    sessionStorage.setItem(PROFILE_KEY, '{bad');
    render(<App />);
    expect(
      await screen.findByText(/Saved profile could not be read/),
    ).toBeVisible();
    expect(sessionStorage.getItem(PROFILE_KEY)).toBe('{bad');
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo profile' }));
    await screen.findByRole('button', { name: 'Edit profile' });
    expect(readProfile().error).toBeNull();
  });
  it('shows network loading, failure and recovery in the Host layout', async () => {
    server.use(
      http.get('*/api/profile', async () => {
        await delay(40);
        return HttpResponse.json(
          { message: 'Profile unavailable' },
          { status: 503 },
        );
      }),
    );
    document.title = 'Profile | MICROVERSE';
    render(
      <main>
        <Routes mode="embedded" />
      </main>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading profile');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Profile unavailable',
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(document.title).toBe('Profile | MICROVERSE');
    server.resetHandlers();
    fireEvent.click(screen.getByRole('button', { name: 'Retry profile' }));
    await screen.findByRole('button', { name: 'Edit profile' });
  });
  it('reports an absent profile instead of inventing one', async () => {
    server.use(
      http.get('*/api/profile', () =>
        HttpResponse.json(
          { message: 'No profile is available.' },
          { status: 404 },
        ),
      ),
    );
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No profile is available',
    );
  });
  it('supports standalone brand overrides', async () => {
    vi.stubEnv('VITE_APP_LABEL', 'Local profile');
    await ready();
    expect(screen.getByRole('banner')).toHaveTextContent('Local profile');
    vi.unstubAllEnvs();
  });
});
