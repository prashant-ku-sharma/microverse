import { createTheme } from '@mui/material/styles';

export const microverseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#63e6b4' },
    secondary: { main: '#a8a4ff' },
    background: { default: '#0b1411', paper: '#14231d' },
    text: { primary: '#eef7f1', secondary: '#b1c9bd' },
  },
  shape: { borderRadius: 16 },
  typography: { fontFamily: 'Inter, system-ui, sans-serif' },
});
