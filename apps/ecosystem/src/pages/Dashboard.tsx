import { Link } from 'react-router';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { useSyncExternalStore } from 'react';
import { nucleus } from '../nucleus/registry';
import { immune } from '../immune/store';
import { runtimeLabels } from '../immune/labels';
import { ActivityPanel } from '../components/ActivityPanel';
import { OrganismCard } from '@microverse/shared-ui';
import { organisms } from '../organisms';
import { Habitat } from '../components/Habitat';

export function Dashboard() {
  const config = useSyncExternalStore(nucleus.subscribe, nucleus.getSnapshot);
  const runtime = useSyncExternalStore(immune.subscribe, immune.getSnapshot);
  return (
    <Stack spacing={4}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' },
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', mb: 2.5 }}
          >
            <Box sx={{ width: 22, height: '1px', bgcolor: 'primary.main' }} />
            <Typography variant="overline" color="primary">
              WELCOME TO YOUR ECOSYSTEM
            </Typography>
          </Stack>
          <Typography variant="h1">
            A living system.
            <br />
            <Box component="span" sx={{ color: 'primary.main' }}>
              Independent by nature.
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2.5, maxWidth: 480 }}>
            Small organisms. Shared purpose. Explore a connected world of
            independently evolving applications.
          </Typography>
          <Button
            component={Link}
            to="/ecosystem"
            variant="outlined"
            endIcon={<ArrowOutwardIcon />}
            sx={{ mt: 3 }}
          >
            Explore the ecosystem
          </Button>
        </Box>
        <Box sx={{ position: 'relative' }}>
          <Habitat />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center' }}
          >
            CONCEPT MAP · NOT A HEALTH CHECK
          </Typography>
        </Box>
      </Box>
      <Box
        aria-label="Ecosystem overview"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          border: 1,
          borderColor: 'divider',
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: '#121d1880',
        }}
      >
        {[
          ['04', 'Independent organisms'],
          ['01', 'Host application'],
          ['06', 'Workspace routes'],
          [
            config.status === 'ready' ? '04' : '—',
            'Validated registry entries',
          ],
        ].map(([value, label]) => (
          <Box
            key={label}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            <Typography
              sx={{
                fontSize: '1.65rem',
                fontWeight: 600,
                letterSpacing: '-.04em',
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box component="section" aria-labelledby="organisms-heading">
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography variant="h2" id="organisms-heading">
              Meet the organisms
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Different roles. Room to evolve.
            </Typography>
          </Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            04 SPECIES / 01 HABITAT
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {organisms.map((organism, i) => (
            <OrganismCard
              key={organism.name}
              {...organism}
              index={`0${i + 1}`}
              statusLabel={`${config.status === 'ready' ? `v${config.snapshot.registry.remotes[organism.id].version}` : 'Version unknown'} · ${runtimeLabels[runtime.remotes[organism.id].status]}`}
              action={
                <Button
                  component={Link}
                  to={organism.route}
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                  sx={{ px: 0, color: 'text.primary' }}
                >
                  Open {organism.title.toLowerCase()}
                </Button>
              }
            />
          ))}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Runtime status describes module loads and view commits in this page. No
        genuine health check is configured. Products, cart, profile and coupons
        use local mock APIs; no live deployment status is inferred.
      </Typography>
      <ActivityPanel />
    </Stack>
  );
}
