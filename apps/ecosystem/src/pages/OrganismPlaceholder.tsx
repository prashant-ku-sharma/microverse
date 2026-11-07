import { Link } from 'react-router';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  OrganismMark,
  PageHeader,
  StatusIndicator,
  SurfaceCard,
} from '@microverse/shared-ui';
import type { organisms } from '../organisms';

export function OrganismPlaceholder({
  organism,
}: {
  organism: (typeof organisms)[number];
}) {
  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow={`${organism.name} / ORGANISM`}
        title={organism.title}
        description={organism.description}
      />
      <SurfaceCard component="section">
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          <OrganismMark accent={organism.accent} size={80} />
          <StatusIndicator label="Host-owned placeholder" tone="warning" />
          <Typography variant="h2">
            A space for {organism.role.toLowerCase()}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
            This organism has a place in the habitat. Its independent
            application will be connected in a later stage.
          </Typography>
          <Box sx={{ borderLeft: 2, borderColor: 'divider', pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No remote is loaded here. Business features and live application
              status are not implemented yet.
            </Typography>
          </Box>
          <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>
            Back to overview
          </Button>
        </Stack>
      </SurfaceCard>
    </Stack>
  );
}
