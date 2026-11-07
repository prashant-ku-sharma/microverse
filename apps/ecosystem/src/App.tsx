import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import { Button, Stack } from '@mui/material';
import { PageHeader } from '@microverse/shared-ui';
import { HostLayout } from './components/HostLayout';
import { Dashboard } from './pages/Dashboard';
import { Ecosystem } from './pages/Ecosystem';
import { OrganismPlaceholder } from './pages/OrganismPlaceholder';
import { organisms } from './organisms';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page =
      organisms.find((o) => o.route === pathname)?.title ??
      (pathname === '/'
        ? 'Overview'
        : pathname === '/ecosystem'
          ? 'Ecosystem'
          : 'Page not found');
    document.title = `${page} | MICROVERSE`;
    // Move keyboard focus to the new page after client-side navigation.
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <Routes>
      <Route element={<HostLayout />}>
        <Route index element={<Dashboard />} />
        {organisms.map((organism) => (
          <Route
            key={organism.route}
            path={organism.route}
            element={<OrganismPlaceholder organism={organism} />}
          />
        ))}
        <Route path="/ecosystem" element={<Ecosystem />} />
        <Route
          path="*"
          element={
            <Stack spacing={3}>
              <PageHeader
                eyebrow="OUTSIDE THE HABITAT"
                title="Page not found"
                description="This path is not part of the ecosystem. Return to familiar ground."
              />
              <Button component={Link} to="/">
                Back to overview
              </Button>
            </Stack>
          }
        />
      </Route>
    </Routes>
  );
}
