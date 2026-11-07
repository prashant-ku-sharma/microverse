import { createTheme } from '@mui/material/styles';
import { organismColors } from './tokens';

export const microverseTheme = createTheme({
  spacing: 8,
  palette: {
    mode: 'dark',
    primary: { main: organismColors.emerald, contrastText: '#082319' },
    secondary: { main: organismColors.violet },
    info: { main: organismColors.blue },
    warning: { main: organismColors.amber },
    error: { main: organismColors.coral },
    success: { main: organismColors.emerald },
    background: { default: '#0b1210', paper: '#121d18' },
    text: { primary: '#edf5ef', secondary: '#a5b8ac' },
    divider: '#29372f',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    h1: {
      fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
      fontWeight: 600,
      letterSpacing: '-0.055em',
      lineHeight: 1.1,
    },
    h2: { fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.025em' },
    h3: { fontSize: '1.1rem', fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.7 },
    body2: { fontSize: '0.84rem', lineHeight: 1.7 },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: {
      fontSize: '0.65rem',
      letterSpacing: '0.16em',
      lineHeight: 1.8,
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse at 75% 0%, #18302555, transparent 55%)',
        },
        '::selection': { background: '#73e5b044' },
        ':focus-visible': { outline: '2px solid #73e5b0', outlineOffset: 4 },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 9, padding: '9px 16px', minHeight: 42 },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { backgroundImage: 'none', borderColor: '#29372f' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { fontSize: '0.7rem', fontWeight: 600 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
