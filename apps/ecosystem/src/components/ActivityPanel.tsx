import { useSyncExternalStore } from 'react';
import { Box, List, ListItem, Stack, Typography } from '@mui/material';
import { SurfaceCard } from '@microverse/shared-ui';
import { activity } from '../activity';
import { immune } from '../immune/store';
const clock = (at: string) =>
  new Date(at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
export function ActivityPanel() {
  const events = useSyncExternalStore(activity.subscribe, activity.getSnapshot);
  const observations = useSyncExternalStore(
    immune.subscribe,
    immune.getSnapshot,
  );
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 2,
      }}
    >
      <SurfaceCard component="section" aria-label="Mycelium event activity">
        <Typography variant="h2">Signals across the habitat</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Validated events observed from mock applications in this tab. Payloads
          are private; the latest 30 metadata records are kept in memory.
        </Typography>
        {!events.length ? (
          <Typography sx={{ mt: 3 }}>
            No events observed yet. Explore Products or save your profile to
            create a signal.
          </Typography>
        ) : (
          <List dense aria-label="Observed Mycelium events">
            {events.slice(0, 10).map((event) => (
              <ListItem
                key={event.id}
                disableGutters
                sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5 }}
              >
                <Stack sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                    {event.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {event.source} · {clock(event.timestamp)} ·{' '}
                    {event.id.slice(0, 8)}
                  </Typography>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </SurfaceCard>
      <SurfaceCard component="section" aria-label="Recent ecosystem activity">
        <Typography variant="h2">Recent ecosystem activity</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Timestamped module and recovery observations, including history from
          earlier pages. These are not deployment records or health checks.
        </Typography>
        {!observations.history.length ? (
          <Typography sx={{ mt: 3 }}>
            No runtime observations recorded yet.
          </Typography>
        ) : (
          <List dense>
            {observations.history
              .slice(-6)
              .reverse()
              .map((item, index) => (
                <ListItem
                  key={`${item.at}-${index}`}
                  disableGutters
                  sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5 }}
                >
                  <Stack>
                    <Typography variant="body2">
                      {item.remote ?? 'NUCLEUS'} · {item.kind}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {clock(item.at)} · {item.operation} · {item.message}
                    </Typography>
                  </Stack>
                </ListItem>
              ))}
          </List>
        )}
      </SurfaceCard>
    </Box>
  );
}
