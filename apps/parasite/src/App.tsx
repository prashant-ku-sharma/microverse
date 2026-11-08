import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import { Alert, Button, Snackbar, Stack, Typography } from '@mui/material';
import { LoadingIndicator, SurfaceCard } from '@microverse/shared-ui';
import type { Product } from '@microverse/shared-types';
import { ProductLayout } from './components/ProductLayout';
import { products } from './data/products';

const Catalog = lazy(() =>
  import('./pages/Catalog').then((module) => ({ default: module.Catalog })),
);
const ProductDetail = lazy(() =>
  import('./pages/ProductDetail').then((module) => ({
    default: module.ProductDetail,
  })),
);

export default function App() {
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const product = products.find(
      (item) => `/products/${item.id}` === pathname,
    );
    document.title = `${pathname === '/' ? 'The collection' : (product?.name ?? 'Page not found')} | PARASITE`;
    document.getElementById('product-main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  function requestCart(product: Product) {
    if (product.stock <= 0) return;
    // Stage 3 acknowledges intent only. Cart state and events belong to later stages.
    setCartNotice(
      `${product.name}: cart connection is coming in a later stage. No item has been added.`,
    );
  }

  return (
    <>
      <Routes>
        <Route element={<ProductLayout />}>
          <Route
            index
            element={
              <Suspense
                fallback={<LoadingIndicator label="Loading products…" />}
              >
                <Catalog onRequest={requestCart} />
              </Suspense>
            }
          />
          <Route
            path="/products/:productId"
            element={
              <Suspense
                fallback={<LoadingIndicator label="Loading product details…" />}
              >
                <ProductDetail onRequest={requestCart} />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <SurfaceCard>
                <Stack spacing={3}>
                  <Typography variant="h1">Page not found</Typography>
                  <Typography color="text.secondary">
                    This path is outside the collection.
                  </Typography>
                  <Button component={Link} to="/">
                    Back to collection
                  </Button>
                </Stack>
              </SurfaceCard>
            }
          />
        </Route>
      </Routes>
      <Snackbar
        open={cartNotice !== null}
        onClose={() => setCartNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          onClose={() => setCartNotice(null)}
          sx={{
            maxWidth: 560,
            bgcolor: '#1c302c',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {cartNotice}
        </Alert>
      </Snackbar>
    </>
  );
}
