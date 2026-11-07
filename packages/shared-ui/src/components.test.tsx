import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CssBaseline, ThemeProvider, useTheme } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionButton,
  LoadingIndicator,
  OrganismCard,
  PageHeader,
  StatusIndicator,
  SurfaceCard,
} from './components';
import { microverseTheme } from './theme';

function ThemeProbe() {
  const theme = useTheme();
  return (
    <output>
      {theme.palette.mode} / {theme.spacing(3)} / {theme.palette.primary.main}
    </output>
  );
}

describe('shared design system', () => {
  it('applies the dark theme, emerald palette, and eight-pixel spacing', () => {
    render(
      <ThemeProvider theme={microverseTheme}>
        <CssBaseline />
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByText('dark / 24px / #73e5b0')).toBeVisible();
    expect(document.body).toHaveStyle({ backgroundColor: '#0b1210' });
  });

  it('provides primary and secondary buttons with working disabled semantics', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <>
        <ActionButton onClick={click}>Continue</ActionButton>
        <ActionButton intent="secondary" disabled onClick={click}>
          Unavailable
        </ActionButton>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveClass(
      'MuiButton-contained',
    );
    expect(screen.getByRole('button', { name: 'Unavailable' })).toHaveClass(
      'MuiButton-outlined',
    );
  });

  it('keeps status readable without relying on color and labels loading', () => {
    render(
      <>
        <StatusIndicator label="Not connected" tone="warning" />
        <LoadingIndicator label="Preparing the habitat" />
      </>,
    );
    expect(screen.getByText('Not connected')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing the habitat',
    );
  });

  it('renders semantic headers, card content, and caller-owned organism actions', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    render(
      <>
        <PageHeader
          eyebrow="HABITAT"
          title="Overview"
          description="A living system"
          action={<ActionButton>Refresh</ActionButton>}
        />
        <SurfaceCard>Shared surface</SurfaceCard>
        <OrganismCard
          name="PARASITE"
          title="Products"
          description="Independent discovery"
          accent="blue"
          index="01"
          action={<ActionButton onClick={open}>Explore products</ActionButton>}
        />
      </>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Overview' }),
    ).toBeVisible();
    expect(screen.getByText('Shared surface')).toBeVisible();
    expect(screen.getByRole('article')).toHaveTextContent('Placeholder');
    await user.click(screen.getByRole('button', { name: 'Explore products' }));
    expect(open).toHaveBeenCalledOnce();
  });
});
