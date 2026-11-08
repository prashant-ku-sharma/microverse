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
        description="A shared habitat for independent applications. The Host provides the structure; each organism will own its own behavior."
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
            label="Stage 4 · Federation integration"
            tone="success"
          />
          <Typography variant="h2" sx={{ mt: 3, mb: 2 }}>
            A home for independent applications
          </Typography>
          <Typography color="text.secondary">
            Ecosystem owns navigation, page composition, and the application
            shell. Products loads PARASITE through Module Federation; the other
            three organism routes remain Host-owned placeholders.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            PARASITE is loaded from its own server and isolated by a Host-owned
            error boundary. Runtime registry and authentication simulation
            remain future milestones. No application imports another
            application’s source.
          </Typography>
          <Button component={Link} to="/" sx={{ mt: 3 }}>
            Return to overview
          </Button>
        </SurfaceCard>
      </Box>
    </Stack>
  );
}
