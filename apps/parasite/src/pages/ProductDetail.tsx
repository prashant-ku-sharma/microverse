import { Link, useLocation, useParams } from 'react-router';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { StatusIndicator, SurfaceCard } from '@microverse/shared-ui';
import type { Product } from '@microverse/shared-types';
import { products } from '../data/products';
import { availability, formatPrice } from '../catalog';
import { CartIntentButton, ProductRating } from '../components/ProductCard';

export function ProductDetail({
  onRequest,
}: {
  onRequest: (product: Product) => void;
}) {
  const { productId } = useParams();
  const { search } = useLocation();
  const product = products.find((item) => item.id === productId);
  if (!product)
    return (
      <SurfaceCard>
        <Typography variant="overline" color="info.main">
          OUTSIDE THE COLLECTION
        </Typography>
        <Typography variant="h1" sx={{ mt: 2, mb: 2 }}>
          Product not found
        </Typography>
        <Typography color="text.secondary">
          This product is not in the local collection. Explore the catalog to
          find something else.
        </Typography>
        <Button
          component={Link}
          to={`/${search}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 3 }}
        >
          Back to collection
        </Button>
      </SurfaceCard>
    );
  const stock = availability(product.stock);
  return (
    <Stack spacing={4}>
      <Box>
        <Button
          component={Link}
          to={`/${search}`}
          startIcon={<ArrowBackIcon />}
          sx={{ pl: 0 }}
        >
          Back to collection
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 7 },
          alignItems: 'start',
        }}
      >
        <Box
          component="img"
          src={product.image}
          alt={product.name}
          width={400}
          height={360}
          sx={{
            width: '100%',
            height: 'auto',
            borderRadius: '16px',
            display: 'block',
          }}
        />
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="info.main">
              {product.category} / PARASITE
            </Typography>
            <Typography
              variant="h1"
              sx={{ mt: 1.5, fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
            >
              {product.name}
            </Typography>
          </Box>
          <ProductRating product={product} />
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 600 }}>
              {formatPrice(product.price)}
            </Typography>
            <StatusIndicator {...stock} />
          </Stack>
          <Typography color="text.secondary">{product.description}</Typography>
          <Box>
            <CartIntentButton product={product} onRequest={onRequest} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1.5 }}
            >
              {product.stock > 0
                ? `${product.stock} units in sample inventory.`
                : 'Currently unavailable in the sample inventory.'}{' '}
              Cart connection is coming in a later stage.
            </Typography>
          </Box>
          <Divider />
          <Box component="section" aria-labelledby="product-details-title">
            <Typography variant="h2" id="product-details-title" sx={{ mb: 2 }}>
              The considered details
            </Typography>
            <Stack
              component="ul"
              spacing={1.5}
              sx={{ p: 0, m: 0, listStyle: 'none' }}
            >
              {product.features.map((feature) => (
                <Stack
                  key={feature}
                  component="li"
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <CheckIcon
                    sx={{ fontSize: 18, color: 'primary.main', mt: 0.4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {feature}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box
            component="dl"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr)',
              columnGap: 3,
              rowGap: 1,
              m: 0,
            }}
          >
            <Typography component="dt" variant="body2" color="text.secondary">
              Materials
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0 }}>
              {product.material}
            </Typography>
            <Typography component="dt" variant="body2" color="text.secondary">
              Product ID
            </Typography>
            <Typography
              component="dd"
              variant="body2"
              sx={{ m: 0, overflowWrap: 'anywhere' }}
            >
              {product.id}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
