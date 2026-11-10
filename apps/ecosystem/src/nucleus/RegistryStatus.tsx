import { useEffect, useSyncExternalStore } from 'react';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { SurfaceCard, LoadingIndicator } from '@microverse/shared-ui';
import { nucleus } from './registry';
import type { createRegistryClient } from './registry';
import { remoteIds } from './schema';
export function NucleusNotice() {
  const state = useSyncExternalStore(nucleus.subscribe, nucleus.getSnapshot);
  if (state.status === 'error')
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {state.message}
      </Alert>
    );
  if (state.status === 'ready' && state.snapshot.warning)
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        {state.snapshot.warning} Reload after updating NUCLEUS to use a new
        snapshot.
      </Alert>
    );
  return null;
}
export function RegistryStatus({
  client = nucleus,
}: {
  client?: ReturnType<typeof createRegistryClient>;
}) {
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot);
  useEffect(() => {
    void client.load().catch(() => {});
  }, [client]);
  return (
    <SurfaceCard component="section" aria-label="NUCLEUS runtime registry">
      <Typography variant="overline" color="primary.main">
        NUCLEUS / RUNTIME CONFIGURATION
      </Typography>
      <Typography variant="h2" sx={{ mt: 1, mb: 2 }}>
        A living registry.
      </Typography>
      {state.status === 'idle' || state.status === 'loading' ? (
        <LoadingIndicator label="Loading NUCLEUS…" />
      ) : state.status === 'error' ? (
        <Alert severity="error">{state.message}</Alert>
      ) : (
        <>
          <Typography color="text.secondary">
            {state.snapshot.environment} · {state.snapshot.source} snapshot ·
            schema 1
          </Typography>
          {state.snapshot.warning && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {state.snapshot.warning}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 3 }}>
            {remoteIds.map((id) => {
              const remote = state.snapshot.registry.remotes[id];
              return (
                <Box
                  key={id}
                  sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    pt: 2,
                    minWidth: 0,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      {remote.name}
                    </Typography>
                    <Chip label={`v${remote.version}`} />
                    <Chip
                      variant="outlined"
                      label={remote.enabled ? 'Enabled' : 'Disabled'}
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, overflowWrap: 'anywhere' }}
                  >
                    {remote.entry}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Background Cart:{' '}
            {state.snapshot.registry.features.cartEvents ? 'on' : 'off'} ·
            Background Offers:{' '}
            {state.snapshot.registry.features.offerEvents ? 'on' : 'off'}.
            Declared compatibility: Host API 1, MYCELIUM 1, React 19, MUI 9.
            Remote loaders also verify exposed release metadata.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configuration metadata, not a health check. A reload selects new
            entries; this document keeps one snapshot.
          </Typography>
        </>
      )}
    </SurfaceCard>
  );
}
