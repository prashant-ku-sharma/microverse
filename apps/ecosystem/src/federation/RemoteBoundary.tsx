import { Component } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button, Stack, Typography } from '@mui/material';
import { SurfaceCard } from '@microverse/shared-ui';

export class RemoteBoundary extends Component<
  { children: ReactNode; organism: string; title: string; application: string },
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
              {this.props.organism} / CONNECTION UNAVAILABLE
            </Typography>
            <Typography variant="h1" sx={{ fontSize: '2rem' }}>
              {this.props.title}
            </Typography>
            <Typography color="text.secondary">
              The {this.props.application} application could not be loaded. You
              can keep exploring the ecosystem and reload this page when the
              connection returns.
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
