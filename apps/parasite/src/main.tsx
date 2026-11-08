import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { microverseTheme } from '@microverse/shared-ui';
import { BrowserRouter } from 'react-router';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root element');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={microverseTheme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
