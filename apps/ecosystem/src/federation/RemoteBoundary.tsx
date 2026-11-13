import { Component } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Stack, Typography } from '@mui/material';
import { SurfaceCard } from '@microverse/shared-ui';
import { RemoteDisabledError } from '../nucleus/errors';
import type { RemoteId } from '../nucleus/schema';
import { RemoteFailure } from '../immune/errors';
import { immune } from '../immune/store';
import { retryRemote } from '../immune/recovery';
interface Props {
  children: ReactNode;
  organism: string;
  title: string;
  application: string;
  remoteId?: RemoteId;
}
interface BoundaryProps extends Props {
  id: RemoteId;
  clearTestFault: () => boolean;
}
class Boundary extends Component<
  BoundaryProps,
  { error: unknown; failed: boolean; epoch: number }
> {
  state = { error: null as unknown, failed: false, epoch: 0 };
  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }
  componentDidCatch(error: unknown) {
    if (
      !(error instanceof RemoteFailure) &&
      !(error instanceof RemoteDisabledError)
    )
      immune.renderFailed(this.props.id);
  }
  render() {
    if (this.state.failed) {
      const disabled = this.state.error instanceof RemoteDisabledError;
      const failure =
        this.state.error instanceof RemoteFailure ? this.state.error : null;
      const renderFailure = !disabled && !failure;
      const timedOut = failure?.kind === 'timed-out',
        incompatible = failure?.kind === 'incompatible';
      const title = disabled
        ? `${this.props.organism} is disabled.`
        : timedOut
          ? `${this.props.organism} took too long.`
          : incompatible
            ? `${this.props.organism} needs a compatible release.`
            : this.props.title;
      return (
        <SurfaceCard role={disabled ? 'status' : 'alert'}>
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="overline" color="warning.main">
              {this.props.organism} /{' '}
              {disabled
                ? 'RUNTIME FEATURE DISABLED'
                : timedOut
                  ? 'TIMED OUT'
                  : incompatible
                    ? 'INCOMPATIBLE'
                    : renderFailure
                      ? 'VIEW FAILURE'
                      : 'CONNECTION UNAVAILABLE'}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: '2rem' }}>
              {title}
            </Typography>
            <Typography color="text.secondary">
              {disabled
                ? 'This application is turned off in the runtime registry. Other parts of the ecosystem remain available.'
                : (failure?.message ??
                  `The ${this.props.application} view could not render. Other organisms remain available.`)}
            </Typography>
            {!disabled && (
              <Typography variant="body2" color="text.secondary">
                {renderFailure
                  ? 'Retry view restarts this view while keeping the ecosystem open.'
                  : 'Retry remote opens a fresh page to clear failed import caches and reload trusted configuration.'}
              </Typography>
            )}
            <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
              {renderFailure && (
                <Button
                  variant="contained"
                  onClick={() => {
                    immune.retry(this.props.id, 'view');
                    if (this.props.clearTestFault()) return;
                    this.setState((previous) => ({
                      error: null,
                      failed: false,
                      epoch: previous.epoch + 1,
                    }));
                  }}
                >
                  Retry view
                </Button>
              )}
              {!disabled && (
                <Button
                  variant="outlined"
                  onClick={() => retryRemote(this.props.id)}
                >
                  Retry remote
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Reload page
              </Button>
              <Button component={Link} to="/ecosystem">
                View monitoring
              </Button>
              <Button component={Link} to="/">
                Back to overview
              </Button>
            </Stack>
          </Stack>
        </SurfaceCard>
      );
    }
    return <div key={this.state.epoch}>{this.props.children}</div>;
  }
}
export function RemoteBoundary(props: Props) {
  const navigate = useNavigate(),
    location = useLocation();
  const id = props.remoteId ?? (props.organism.toLowerCase() as RemoteId);
  return (
    <Boundary
      key={new URLSearchParams(location.search).get('immune-render') ?? ''}
      {...props}
      id={id}
      clearTestFault={() => {
        const search = new URLSearchParams(location.search);
        if (!search.has('immune-render')) return false;
        search.delete('immune-render');
        navigate(
          {
            pathname: location.pathname,
            search: search.toString(),
            hash: location.hash,
          },
          { replace: true },
        );
        return true;
      }}
    />
  );
}
