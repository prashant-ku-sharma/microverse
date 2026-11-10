import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import Routes from './routes';
import { demoProfile, PROFILE_KEY, readProfile, saveProfile } from './profile';
beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllEnvs());
describe('COMMENSAL owned profile', () => {
  it('shows its standalone shell, avatar, profile fields, and preferences', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toHaveTextContent('COMMENSAL');
    expect(
      screen.getByRole('img', { name: 'Avery Rao avatar' }),
    ).toHaveTextContent('AR');
    expect(screen.getByLabelText('Email')).toHaveValue(demoProfile.email);
    expect(screen.getByLabelText('Street address')).toHaveValue('24 Fern Lane');
    expect(screen.getByRole('switch', { name: 'Order updates' })).toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'Offers and coupons' }),
    ).not.toBeChecked();
  });
  it('saves name, email, address and notification edits, and restores them on remount', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    for (const [label, value] of [
      ['Name', 'Jordan Rao'],
      ['Email', 'jordan@example.com'],
      ['City', 'Pune'],
    ] as const) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), value!);
    }
    await user.click(
      screen.getByRole('switch', { name: 'Offers and coupons' }),
    );
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByRole('status')).toHaveTextContent('Profile saved');
    expect(readProfile().profile).toMatchObject({
      name: 'Jordan Rao',
      email: 'jordan@example.com',
      address: { city: 'Pune' },
      notifications: { offers: true },
    });
    first.unmount();
    render(<App />);
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Rao');
    expect(
      screen.getByRole('img', { name: 'Jordan Rao avatar' }),
    ).toHaveTextContent('JR');
  });
  it('keeps draft edits separate until save and discards them on cancel', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Unsaved name');
    expect(readProfile().profile.name).toBe('Avery Rao');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Avery Rao');
    expect(sessionStorage.getItem(PROFILE_KEY)).toBeNull();
  });
  it('validates invalid input without overwriting saved profile data', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' ' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'bad-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(sessionStorage.getItem(PROFILE_KEY)).toBeNull();
  });
  it('preserves the draft and existing data if storage fails', () => {
    saveProfile(demoProfile);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New name' },
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByText(/Profile could not be saved/)).toBeVisible();
    expect(screen.getByLabelText('Name')).toHaveValue('New name');
    expect(readProfile().profile.name).toBe('Avery Rao');
  });
  it('reports unsupported saved data without replacing it automatically', () => {
    sessionStorage.setItem(PROFILE_KEY, '{bad');
    render(<App />);
    expect(screen.getByText(/Saved profile could not be read/)).toBeVisible();
    expect(sessionStorage.getItem(PROFILE_KEY)).toBe('{bad');
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo profile' }));
    expect(readProfile().error).toBeNull();
  });
  it('uses Host layout and title in embedded mode', () => {
    document.title = 'Profile | MICROVERSE';
    render(
      <main>
        <Routes mode="embedded" />
      </main>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(document.title).toBe('Profile | MICROVERSE');
  });
  it('supports the standalone brand override', () => {
    vi.stubEnv('VITE_APP_LABEL', 'Local profile');
    render(<App />);
    expect(screen.getByRole('banner')).toHaveTextContent('Local profile');
  });
});
