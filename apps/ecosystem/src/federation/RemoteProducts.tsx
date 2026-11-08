import { Component, lazy, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button, Stack, Typography } from '@mui/material';
import { LoadingIndicator, SurfaceCard } from '@microverse/shared-ui';
import { loadParasite } from './loadParasite';

class ParasiteBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <SurfaceCard role="alert">
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="overline" color="warning.main">
              PARASITE / CONNECTION UNAVAILABLE
            </Typography>
            <Typography variant="h1" sx={{ fontSize: '2rem' }}>
              Products are resting.
            </Typography>
            <Typography color="text.secondary">
              The product application could not be loaded. You can keep
              exploring the ecosystem and reload this page when the connection
              returns.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Reload page
              </Button>
              <Button component={Link} to="/">
                Back to overview
              </Button>
            </Stack>
          </Stack>
        </SurfaceCard>
      );
    return this.props.children;
  }
}

export function RemoteProducts() {
  // Stable for this mount; a new navigation can attempt a fresh lazy load.
  const [Routes] = useState(() => lazy(loadParasite));
  return (
    <ParasiteBoundary>
      <Suspense fallback={<LoadingIndicator label="Connecting to PARASITE…" />}>
        <Routes mode="embedded" />
      </Suspense>
    </ParasiteBoundary>
  );
}
