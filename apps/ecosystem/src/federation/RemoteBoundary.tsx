import { RemoteDisabledError } from '../nucleus/errors';
import { Component } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button, Stack, Typography } from '@mui/material';
import { SurfaceCard } from '@microverse/shared-ui';

export class RemoteBoundary extends Component<
  { children: ReactNode; organism: string; title: string; application: string },
  { failed: boolean; disabled: boolean }
> {
  state = { failed: false, disabled: false };
  static getDerivedStateFromError(error: unknown) {
    return { failed: true, disabled: error instanceof RemoteDisabledError };
  }
  render() {
    if (this.state.failed)
      return (
        <SurfaceCard role={this.state.disabled ? 'status' : 'alert'}>
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="overline" color="warning.main">
              {this.props.organism} /{' '}
              {this.state.disabled
                ? 'RUNTIME FEATURE DISABLED'
                : 'CONNECTION UNAVAILABLE'}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: '2rem' }}>
              {this.state.disabled
                ? `${this.props.organism} is disabled.`
                : this.props.title}
            </Typography>
            <Typography color="text.secondary">
              {this.state.disabled
                ? 'This application is turned off in the runtime registry. Other parts of the ecosystem remain available.'
                : `The ${this.props.application} application could not be loaded. You can keep exploring the ecosystem and reload this page when the connection returns.`}
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
