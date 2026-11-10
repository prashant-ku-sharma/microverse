import { Link, useSearchParams } from 'react-router';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { SurfaceCard } from '@microverse/shared-ui';
import type { Product } from '@microverse/shared-types';
import {
  allCategories,
  readFilters,
  selectProducts,
  sortOptions,
} from '../catalog';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/client';
import { LoadingIndicator } from '@microverse/shared-ui';
import { Alert } from '@mui/material';
import { ProductCard } from '../components/ProductCard';

export function Catalog({
  onRequest,
}: {
  onRequest: (product: Product) => void;
}) {
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const products = query.data ?? [];
  const categories = [
    allCategories,
    ...new Set(products.map((product) => product.category)),
  ];
  const filters = readFilters(params, categories);
  const catalogSearch = params.toString();
  const results = selectProducts(products, filters);
  const hasFilters =
    filters.query !== '' ||
    filters.category !== allCategories ||
    filters.sort !== 'featured' ||
    filters.inStockOnly;
  const heroProduct = products[0];
  function update(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: key === 'q', preventScrollReset: true },
    );
  }

  if (query.isPending) return <LoadingIndicator label="Loading collection…" />;
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={() => void query.refetch()}>Retry products</Button>
        }
      >
        {query.error.message}
      </Alert>
    );
  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          gap: { xs: 3, md: 6 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ py: { xs: 1, md: 2 } }}>
          <Typography variant="overline" color="info.main">
            PARASITE / THE CONSIDERED COLLECTION
          </Typography>
          <Typography variant="h1" sx={{ mt: 2 }}>
            Good things.
            <br />
            <Box component="span" sx={{ color: 'primary.main' }}>
              Grown from intention.
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 500, mt: 2.5 }}>
            For the spaces we work in, the things we carry, and the little
            worlds we grow. Find something worth keeping.
          </Typography>
          <Button
            component="a"
            href="#collection"
            variant="outlined"
            endIcon={<ArrowOutwardIcon />}
            sx={{ mt: 3 }}
          >
            Explore the collection
          </Button>
        </Box>
        {heroProduct && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr',
              bgcolor: '#1c3024',
              border: 1,
              borderColor: '#3c5543',
              borderRadius: '16px',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <Box
              component="img"
              src={heroProduct.image}
              alt="Self-watering planter with sculptural green leaves"
              width={400}
              height={360}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                minHeight: 240,
              }}
            />
            <Stack
              spacing={2}
              sx={{
                p: { xs: 2, sm: 3 },
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <Typography variant="overline" color="primary">
                A LITTLE ROOM TO GROW
              </Typography>
              <Typography variant="h2" component="p">
                Make space
                <br />
                for green.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Meet the Moss planter. A small ritual for your everyday.
              </Typography>
              <Button
                component={Link}
                to={{
                  pathname: `/products/${heroProduct.id}`,
                  search: catalogSearch ? `?${catalogSearch}` : '',
                }}
                endIcon={<ArrowOutwardIcon />}
                sx={{ px: 0 }}
              >
                Take a closer look
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
      <Box
        component="section"
        id="collection"
        aria-labelledby="collection-title"
        sx={{ scrollMarginTop: 24 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
          }}
        >
          <Box>
            <Typography id="collection-title" variant="h2">
              The collection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Everyday essentials, a little closer to nature.
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            LOCAL COLLECTION / {products.length.toString().padStart(3, '0')}
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' },
            gap: { xs: 3, lg: 4 },
            alignItems: 'start',
          }}
        >
          <SurfaceCard
            component="aside"
            aria-label="Product filters"
            sx={{ p: 2.5 }}
          >
            <Typography variant="overline" color="text.secondary">
              BROWSE BY HABITAT
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 2, mb: 2 }}>
              {categories.map((category) => (
                <Button
                  key={category}
                  aria-pressed={filters.category === category}
                  onClick={() =>
                    update(
                      'category',
                      category === allCategories ? '' : category,
                    )
                  }
                  variant={filters.category === category ? 'contained' : 'text'}
                  sx={{
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    color:
                      filters.category === category
                        ? 'primary.contrastText'
                        : 'text.secondary',
                    fontSize: '.83rem',
                    px: 1.5,
                  }}
                >
                  <span>{category}</span>
                  <Box
                    component="span"
                    aria-hidden="true"
                    sx={{ opacity: 0.7 }}
                  >
                    {category === allCategories
                      ? products.length
                      : products.filter(
                          (product) => product.category === category,
                        ).length}
                  </Box>
                </Button>
              ))}
            </Stack>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={filters.inStockOnly}
                    onChange={(event) =>
                      update('stock', event.target.checked ? 'available' : '')
                    }
                  />
                }
                label={<Typography variant="body2">In stock only</Typography>}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 2, lineHeight: 1.8 }}
            >
              A local sample collection.
              <br />
              Add requests are saved through MYCELIUM. Open Cart in the Host to
              review confirmed quantities.
            </Typography>
          </SurfaceCard>
          <Box sx={{ minWidth: 0, containerType: 'inline-size' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <TextField
                label="Search products"
                placeholder="Try planter, linen, or herbs…"
                value={filters.query}
                onChange={(event) => update('q', event.target.value)}
                size="small"
                fullWidth
                type="search"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                select
                label="Sort by"
                value={filters.sort}
                onChange={(event) =>
                  update(
                    'sort',
                    event.target.value === 'featured' ? '' : event.target.value,
                  )
                }
                slotProps={{ select: { native: true } }}
                size="small"
                sx={{ minWidth: { xs: 0, sm: 195 } }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Stack>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 42,
                mb: 2,
                gap: 1,
              }}
            >
              <Typography
                role="status"
                aria-live="polite"
                aria-atomic="true"
                variant="body2"
                color="text.secondary"
              >
                {results.length} {results.length === 1 ? 'product' : 'products'}
                {filters.category !== allCategories
                  ? ` in ${filters.category}`
                  : ' to discover'}
              </Typography>
              {hasFilters && (
                <Button
                  size="small"
                  startIcon={<RestartAltIcon />}
                  onClick={() => setParams({})}
                >
                  Reset filters
                </Button>
              )}
            </Stack>
            {results.length ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  '@container (min-width: 520px)': {
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  },
                  '@container (min-width: 800px)': {
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2.5,
                }}
              >
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onRequest={onRequest}
                  />
                ))}
              </Box>
            ) : (
              <SurfaceCard sx={{ py: 7, textAlign: 'center' }}>
                <SearchOutlinedIcon
                  sx={{ fontSize: 36, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h3" component="h3">
                  No products found
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                  Try another search or give your filters a little more room.
                </Typography>
                <Button variant="outlined" onClick={() => setParams({})}>
                  Clear all filters
                </Button>
              </SurfaceCard>
            )}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
