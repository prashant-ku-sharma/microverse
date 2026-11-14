import { RemoteMonitor } from '../immune/RemoteMonitor';
import { RegistryStatus } from '../nucleus/RegistryStatus';
import { Link } from 'react-router';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PageHeader,
  StatusIndicator,
  SurfaceCard,
} from '@microverse/shared-ui';
import { Habitat } from '../components/Habitat';

export function Ecosystem() {
  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="ECOSYSTEM / THE HOST"
        title="Built to grow together."
        description="A shared habitat for independent applications. The Host provides the structure; each organism owns its own behavior."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
        }}
      >
        <SurfaceCard>
          <Habitat />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            Conceptual architecture · not a live health monitor
          </Typography>
        </SurfaceCard>
        <SurfaceCard>
          <StatusIndicator
            label="Stage 12 · Connected ecosystem"
            tone="success"
          />
          <Typography variant="h2" sx={{ mt: 3, mb: 2 }}>
            A home for independent applications
          </Typography>
          <Typography color="text.secondary">
            Ecosystem owns navigation, page composition, and the application
            shell. Products, Cart, Profile, and Offers load all four independent
            organisms through Module Federation.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            All four remotes load from their own servers and are isolated by
            Host-owned error boundaries. MYCELIUM carries validated events
            between product discovery, the cart, and the Host count. NUCLEUS
            selects trusted remote entries at runtime. Authentication simulation
            remains a future milestone. No application imports another
            application’s source.
          </Typography>
          <Button component={Link} to="/" sx={{ mt: 3 }}>
            Return to overview
          </Button>
        </SurfaceCard>
      </Box>
      <RemoteMonitor />
      <RegistryStatus />
    </Stack>
  );
}
