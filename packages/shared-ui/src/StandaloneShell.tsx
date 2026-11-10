import type { ReactNode } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { OrganismMark } from './components';
import type { OrganismAccent } from './tokens';

/** Presentation only; each standalone application owns its providers and business state. */
export function StandaloneShell({
  name,
  description,
  accent,
  children,
}: {
  name: string;
  description: string;
  accent: OrganismAccent;
  children: ReactNode;
}) {
  return (
    <>
      <Box
        component="header"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#0e1713' }}
      >
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <OrganismMark accent={accent} size={38} />
              <Box>
                <Typography sx={{ fontWeight: 700, letterSpacing: '.12em' }}>
                  {name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  A MICROVERSE organism
                </Typography>
              </Box>
            </Stack>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {description}
            </Typography>
          </Stack>
        </Container>
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {children}
      </Container>
    </>
  );
}
