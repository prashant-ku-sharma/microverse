import { Link, Outlet, useLocation } from 'react-router';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { OrganismMark } from '@microverse/shared-ui';

export function ProductLayout() {
  const location = useLocation();
  const category = new URLSearchParams(location.search).get('category');
  const brand = import.meta.env.VITE_APP_LABEL?.trim() || 'PARASITE';
  return (
    <>
      <Box
        component="a"
        href="#product-main"
        sx={{
          position: 'fixed',
          top: -100,
          left: 16,
          '&:focus': { top: 8 },
          zIndex: 1600,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 1.5,
          borderRadius: 1,
        }}
      >
        Skip to products
      </Box>
      <AppBar
        position="static"
        color="transparent"
        sx={{
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: '#0d1712',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: 84,
              gap: { xs: 2, sm: 4 },
              flexWrap: 'wrap',
              py: 1.5,
            }}
          >
            <Stack
              component={Link}
              to="/"
              direction="row"
              spacing={1.5}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                alignItems: 'center',
                mr: 'auto',
              }}
              aria-label={`${brand} catalog home`}
            >
              <OrganismMark size={38} accent="blue" />
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '.16em',
                    fontSize: '.95rem',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {brand}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Objects for a greener everyday
                </Typography>
              </Box>
            </Stack>
            <Stack
              component="nav"
              aria-label="Catalog navigation"
              direction="row"
              spacing={0.5}
              sx={{
                order: { xs: 2, md: 0 },
                width: { xs: '100%', md: 'auto' },
                flexWrap: 'wrap',
              }}
            >
              {[
                ['All products', '/'],
                ['Grow kits', '/?category=Grow+kits'],
                ['Everyday carry', '/?category=Everyday+carry'],
              ].map(([label, path]) => (
                <Button
                  key={label}
                  component={Link}
                  to={path ?? '/'}
                  aria-current={
                    location.pathname === '/' &&
                    (label === 'All products' ? !category : category === label)
                      ? 'page'
                      : undefined
                  }
                  sx={{
                    color: (
                      label === 'All products' ? !category : category === label
                    )
                      ? 'primary.main'
                      : 'text.secondary',
                    fontSize: '.8rem',
                    px: 1.5,
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{
                display: { xs: 'none', lg: 'block' },
                borderLeft: 1,
                borderColor: 'divider',
                pl: 3,
              }}
            >
              A MICROVERSE ORGANISM
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
      <Container
        component="main"
        id="product-main"
        tabIndex={-1}
        maxWidth="xl"
        sx={{ py: { xs: 3, md: 5 }, outline: 'none' }}
      >
        <Outlet />
      </Container>
      <Container component="footer" maxWidth="xl" sx={{ pb: 3, pt: 2 }}>
        <Divider sx={{ mb: 2.5 }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between' }}
        >
          <Typography variant="caption" color="text.secondary">
            PARASITE / Rooted in discovery.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Demo collection · Prices in INR · Sample inventory
          </Typography>
        </Stack>
      </Container>
    </>
  );
}
