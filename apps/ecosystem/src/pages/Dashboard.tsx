import { Link } from 'react-router';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import {
  OrganismCard,
  SurfaceCard,
  StatusIndicator,
} from '@microverse/shared-ui';
import { organisms } from '../organisms';
import { Habitat } from '../components/Habitat';

export function Dashboard() {
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
            CONCEPT MAP · RUNTIME CONNECTIONS NOT YET ACTIVE
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
          ['—', 'Runtime status · not connected'],
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
        }}
      >
        <SurfaceCard component="section" aria-labelledby="status-heading">
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h2" id="status-heading">
              Habitat status
            </Typography>
            <StatusIndicator label="Preview only" tone="warning" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Application status placeholders. No health checks or remote
            connections are running.
          </Typography>
          <Stack spacing={1.5}>
            {organisms.map((o) => (
              <Stack
                key={o.name}
                direction="row"
                sx={{ justifyContent: 'space-between', gap: 1 }}
              >
                <Typography variant="body2">{o.name}</Typography>
                <StatusIndicator label="Not connected" />
              </Stack>
            ))}
          </Stack>
        </SurfaceCard>
        <SurfaceCard component="section" aria-labelledby="activity-heading">
          <Typography variant="h2" id="activity-heading">
            Recent activity
          </Typography>
          <Stack
            spacing={1.5}
            sx={{ alignItems: 'center', textAlign: 'center', py: 3 }}
          >
            <HistoryOutlinedIcon
              sx={{ color: 'text.secondary', fontSize: 30 }}
            />
            <Typography variant="h3" component="p">
              A quiet beginning
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 330 }}
            >
              Activity will appear here when organisms begin communicating. This
              is a placeholder, not a live event feed.
            </Typography>
          </Stack>
        </SurfaceCard>
      </Box>
    </Stack>
  );
}
