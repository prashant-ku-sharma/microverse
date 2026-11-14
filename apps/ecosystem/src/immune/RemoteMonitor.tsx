import { useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { SurfaceCard } from '@microverse/shared-ui';
import { nucleus } from '../nucleus/registry';
import { remoteIds } from '../nucleus/schema';
import { immune } from './store';
import { remotePaths, retryRemote } from './recovery';
import { runtimeLabels as labels } from './labels';
const when = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
export function RemoteMonitor() {
  const diagnostics = useSyncExternalStore(
    immune.subscribe,
    immune.getSnapshot,
  );
  const config = useSyncExternalStore(nucleus.subscribe, nucleus.getSnapshot);
  return (
    <Stack
      component="section"
      aria-label="IMMUNE SYSTEM monitoring"
      spacing={3}
    >
      <Box>
        <Typography variant="overline" color="primary.main">
          IMMUNE SYSTEM / OBSERVED RUNTIME
        </Typography>
        <Typography variant="h2" sx={{ mt: 1 }}>
          Independent, even when resting.
        </Typography>
      </Box>
      <Alert severity="info">
        Available means a validated module export loaded or a view committed. No
        health-check endpoint is configured; this is not continuous uptime or
        API health monitoring. Previous observations are labeled with their
        time.
      </Alert>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0,1fr)',
            lg: 'repeat(2,minmax(0,1fr))',
          },
          gap: 3,
        }}
      >
        {remoteIds.map((id) => {
          const observed = diagnostics.remotes[id],
            remote =
              config.status === 'ready'
                ? config.snapshot.registry.remotes[id]
                : null;
          const loading = Object.entries(observed.operations)
            .filter(([, op]) => op.status === 'loading')
            .map(([name]) => name);
          const failed = ['failed', 'timed-out', 'incompatible'].includes(
            observed.status,
          );
          return (
            <SurfaceCard
              component="section"
              aria-label={`${id} runtime observation`}
              key={id}
              sx={{ minWidth: 0 }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography variant="h3" component="h3">
                  {remote?.name ?? id.toUpperCase()}
                </Typography>
                <Chip
                  color={
                    failed
                      ? 'error'
                      : observed.status === 'available'
                        ? 'success'
                        : 'default'
                  }
                  label={labels[observed.status]}
                />
              </Stack>
              <Typography sx={{ mt: 2 }}>
                Current configured version: {remote?.version ?? 'Unknown'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, overflowWrap: 'anywhere' }}
              >
                Deployment URL:{' '}
                {remote?.entry ?? 'No trusted configuration loaded'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading status:{' '}
                {loading.length
                  ? loading.join(', ')
                  : 'No requests in progress'}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {Object.entries(observed.operations).map(([name, op]) => (
                  <Typography
                    key={name}
                    variant="caption"
                    color="text.secondary"
                  >
                    {name}: {labels[op.status]}
                  </Typography>
                ))}
              </Stack>
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2">
                  Last failure:{' '}
                  {observed.lastFailure
                    ? `${observed.lastFailure.message} ${when(observed.lastFailure.at)} · ${observed.lastFailure.phase}`
                    : 'None recorded'}
                </Typography>
                {observed.lastFailure && (
                  <Typography variant="caption" color="text.secondary">
                    Failure version: {observed.lastFailure.version ?? 'Unknown'}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Last known module load:{' '}
                  {observed.lastModuleLoad
                    ? `${when(observed.lastModuleLoad.at)} · ${observed.lastModuleLoad.operation} · v${observed.lastModuleLoad.version ?? 'unknown'}`
                    : 'No successful module load recorded'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last known health: no genuine health check performed.
                </Typography>
              </Box>
              <Stack direction="row" sx={{ mt: 2, gap: 1, flexWrap: 'wrap' }}>
                <Button component={Link} to={remotePaths[id]}>
                  Open {remote?.name ?? id}
                </Button>
                {failed && (
                  <Button variant="outlined" onClick={() => retryRemote(id)}>
                    Retry {remote?.name ?? id}
                  </Button>
                )}
              </Stack>
            </SurfaceCard>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Diagnostics retain at most 50 local metadata records in this tab. No
        business payloads or external telemetry are collected. A fresh page
        resets current runtime status; past module loads are historical
        observations.
      </Typography>
    </Stack>
  );
}
