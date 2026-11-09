import { useEffect } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { OrganismMark } from '@microverse/shared-ui';
import SymbiontRoutes from './routes';

/** Standalone shell only; the federation expose contains no root or theme provider. */
export default function App() {
  const brand = import.meta.env.VITE_APP_LABEL?.trim() || 'SYMBIONT';
  useEffect(() => {
    document.title = `${brand} | Cart & checkout`;
  }, [brand]);
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
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <OrganismMark accent="violet" size={36} />
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '.12em',
                    fontSize: '.9rem',
                  }}
                >
                  {brand}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  A MICROVERSE organism
                </Typography>
              </Box>
            </Stack>
            <Typography
              variant="overline"
              color="secondary.main"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              CART & CHECKOUT / 02
            </Typography>
          </Stack>
        </Container>
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <SymbiontRoutes />
      </Container>
    </>
  );
}
