import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { microverseTheme } from '@microverse/shared-ui';
import { BrowserRouter, HashRouter } from 'react-router';
import App from './App';

// Bootstrap selects the static-host router; this entry is not a refresh boundary.
// eslint-disable-next-line react-refresh/only-export-components
const Router =
  import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root element');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={microverseTheme}>
      <CssBaseline />
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  </StrictMode>,
);
