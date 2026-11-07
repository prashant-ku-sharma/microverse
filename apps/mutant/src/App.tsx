import BiotechIcon from '@mui/icons-material/Biotech';
import { Box, Chip, Container, Paper, Stack, Typography } from '@mui/material';

export default function App() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: { xs: 6, sm: 12 } }}>
      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, sm: 5 }, borderColor: 'divider' }}
      >
        <Stack spacing={3}>
          <Box sx={{ color: 'primary.main' }}>
            <BiotechIcon fontSize="large" />
          </Box>
          <Typography variant="overline" color="primary">
            MICROVERSE / FOUNDATION
          </Typography>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
          >
            {import.meta.env.VITE_APP_LABEL?.trim() || 'MUTANT'}
          </Typography>
          <Typography color="text.secondary">Coupons and promotions</Typography>
          <Chip
            label="Stage 1 · Standalone application"
            variant="outlined"
            sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
          />
          <Typography variant="body2" color="text.secondary">
            Development port: 5004. Business features arrive in later stages.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
