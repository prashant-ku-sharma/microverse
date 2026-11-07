import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import {
  layoutTokens,
  OrganismMark,
  StatusIndicator,
} from '@microverse/shared-ui';

const navigation = [
  { path: '/', label: 'Overview', icon: DashboardOutlinedIcon },
  { path: '/products', label: 'Products', icon: Inventory2OutlinedIcon },
  { path: '/cart', label: 'Cart', icon: ShoppingBagOutlinedIcon },
  { path: '/profile', label: 'Profile', icon: PersonOutlineIcon },
  { path: '/offers', label: 'Offers', icon: AutoAwesomeOutlinedIcon },
  { path: '/ecosystem', label: 'Ecosystem', icon: HubOutlinedIcon },
];

export function HostLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const current =
    navigation.find((item) => item.path === location.pathname)?.label ??
    'Page not found';
  const brand = import.meta.env.VITE_APP_LABEL?.trim() || 'MICROVERSE';

  const sidebar = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        px: 2.5,
        py: 3,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', mb: 5, px: 0.5 }}
      >
        <OrganismMark size={37} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '.88rem',
              fontWeight: 800,
              letterSpacing: '.12em',
              overflowWrap: 'anywhere',
            }}
          >
            {brand}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Independent. Interconnected.
          </Typography>
        </Box>
        {!desktop && (
          <IconButton
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Stack>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 1.5, mb: 1 }}
      >
        YOUR HABITAT
      </Typography>
      <List
        component="nav"
        aria-label="Application navigation"
        id="application-navigation"
        sx={{ display: 'grid', gap: 0.5 }}
      >
        {navigation.map(({ path, label, icon: Icon }) => (
          <ListItemButton
            key={path}
            component={NavLink}
            to={path}
            end={path === '/'}
            onClick={() => setMenuOpen(false)}
            sx={{
              borderRadius: 2,
              minHeight: 46,
              color: 'text.secondary',
              '&.active': {
                bgcolor: '#73e5b014',
                color: 'primary.main',
                boxShadow: 'inset 2px 0 #73e5b0',
              },
              '&:hover': { bgcolor: '#73e5b00c' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <Icon sx={{ fontSize: 19 }} />
            </ListItemIcon>
            <ListItemText
              primary={label}
              slotProps={{
                primary: { sx: { fontSize: '.86rem', fontWeight: 600 } },
              }}
            />
            {path !== '/' && path !== '/ecosystem' && (
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 4,
                  height: 4,
                  bgcolor: 'text.secondary',
                  opacity: 0.55,
                  borderRadius: '50%',
                }}
              />
            )}
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1, minHeight: 40 }} />
      <Box
        sx={{
          bgcolor: '#73e5b008',
          border: 1,
          borderColor: 'divider',
          p: 2,
          borderRadius: 3,
        }}
      >
        <Typography variant="overline" color="primary">
          GROWING INDEPENDENTLY
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 1.5 }}
        >
          One ecosystem.
          <br />
          Many possibilities.
        </Typography>
        <Typography
          component={Link}
          to="/ecosystem"
          onClick={() => setMenuOpen(false)}
          sx={{
            color: 'primary.main',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '.75rem',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Explore the architecture <ArrowOutwardIcon sx={{ fontSize: 15 }} />
        </Typography>
      </Box>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', mt: 3, px: 0.5 }}
      >
        <Typography variant="caption" color="text.secondary">
          HOST / ECOSYSTEM
        </Typography>
        <Typography variant="caption" color="primary">
          v0.0.0
        </Typography>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'fixed',
          left: 16,
          top: -100,
          '&:focus': { top: 12 },
          zIndex: 1600,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 1.5,
          borderRadius: 1,
        }}
      >
        Skip to content
      </Box>
      <Drawer
        variant={desktop ? 'permanent' : 'temporary'}
        open={desktop || menuOpen}
        onClose={() => setMenuOpen(false)}
        slotProps={{
          paper: {
            'aria-label': 'Application navigation panel',
            sx: {
              width: layoutTokens.sidebarWidth,
              maxWidth: '90vw',
              bgcolor: '#0d1712',
              borderRight: 1,
              borderColor: 'divider',
            },
          },
        }}
        sx={{ width: desktop ? layoutTokens.sidebarWidth : 0, flexShrink: 0 }}
      >
        {sidebar}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar
          position="static"
          color="transparent"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: '#0b1210b3',
            boxShadow: 'none',
          }}
        >
          <Toolbar sx={{ gap: 2, px: { xs: 2, sm: 4 } }}>
            {!desktop && (
              <IconButton
                aria-label="Open navigation"
                aria-expanded={menuOpen}
                aria-controls="application-navigation"
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Workspace{' '}
              <Box component="span" sx={{ mx: 1.5, color: 'divider' }}>
                /
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {current}
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <StatusIndicator label="Local foundation" tone="success" />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ my: 2 }} />
            <Avatar
              aria-label="Ecosystem host"
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#22372a',
                color: 'primary.main',
                fontSize: '.7rem',
                border: 1,
                borderColor: 'divider',
              }}
            >
              EC
            </Avatar>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            maxWidth: layoutTokens.contentMaxWidth,
            mx: 'auto',
            px: { xs: 2.5, sm: 4, lg: 5 },
            py: { xs: 3, sm: 5 },
            outline: 'none',
          }}
        >
          <Outlet />
        </Box>
        <Box
          component="footer"
          sx={{
            px: { xs: 2.5, sm: 4, lg: 5 },
            pb: 3,
            maxWidth: layoutTokens.contentMaxWidth,
            mx: 'auto',
          }}
        >
          <Divider sx={{ mb: 2 }} />
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}
          >
            <Typography variant="caption" color="text.secondary">
              MICROVERSE · A living architecture
            </Typography>
            <Typography variant="caption" color="text.secondary">
              STAGE 02 / HOST FOUNDATION
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
