import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

describe('symbiont foundation page', () => {
  it('identifies its application and standalone role', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'SYMBIONT',
    );
    expect(screen.getByText('Cart and checkout')).toBeVisible();
    expect(screen.getByText(/Development port: 5002/)).toBeVisible();
  });

  it('supports a public environment label override', () => {
    vi.stubEnv('VITE_APP_LABEL', 'Local organism');
    try {
      render(<App />);
      expect(
        screen.getByRole('heading', { name: 'Local organism' }),
      ).toBeVisible();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
