import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Link,
  Outlet as ProductOutlet,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import { Alert, Button, Snackbar, Stack, Typography } from '@mui/material';
import { LoadingIndicator, SurfaceCard } from '@microverse/shared-ui';
import type { Product, ParasiteRoutesProps } from '@microverse/shared-types';
import { CatalogPathContext } from './catalog-path';
import { ProductLayout } from './components/ProductLayout';
import { createMycelium, events } from '@microverse/mycelium';
import { products } from './data/products';

const mycelium = createMycelium('parasite');

const Catalog = lazy(() =>
  import('./pages/Catalog').then((module) => ({ default: module.Catalog })),
);
const ProductDetail = lazy(() =>
  import('./pages/ProductDetail').then((module) => ({
    default: module.ProductDetail,
  })),
);

export default function ParasiteRoutes({
  mode = 'standalone',
}: ParasiteRoutesProps) {
  const embedded = mode === 'embedded';
  const catalogPath = embedded ? '/products' : '/';
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (embedded) return;
    const product = products.find(
      (item) => `/products/${item.id}` === pathname,
    );
    document.title = `${pathname === '/' ? 'The collection' : (product?.name ?? 'Page not found')} | PARASITE`;
    document.getElementById('product-main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, embedded]);

  function requestCart(product: Product) {
    if (product.stock <= 0) return;
    try {
      mycelium.publish(events.PRODUCT_ADDED, {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          image: product.image,
          unitPricePaise: Math.round(product.price * 100),
          stock: product.stock,
        },
        quantity: 1,
      });
      setCartNotice(
        embedded
          ? `Cart request saved for ${product.name}. View Cart for confirmed quantities.`
          : `Cart request saved locally for ${product.name}. Use ECOSYSTEM for the connected product and cart flow; standalone apps on separate ports keep separate carts.`,
      );
    } catch {
      setCartNotice(
        'Your cart request could not be saved. Check browser storage or open Cart to reconcile pending requests, then try again.',
      );
    }
  }

  return (
    <CatalogPathContext value={catalogPath}>
      <Routes>
        <Route
          element={
            embedded ? (
              <section aria-label="PARASITE products">
                <ProductOutlet />
              </section>
            ) : (
              <ProductLayout />
            )
          }
        >
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
            path={embedded ? ':productId' : 'products/:productId'}
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
                  <Button component={Link} to={catalogPath}>
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
    </CatalogPathContext>
  );
}
