import { Link, useLocation } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import type { Product } from '@microverse/shared-types';
import { StatusIndicator } from '@microverse/shared-ui';
import { availability, formatPrice } from '../catalog';

export function ProductRating({ product }: { product: Product }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Rating
        value={product.rating}
        precision={0.1}
        readOnly
        size="small"
        aria-label={`${product.rating} out of 5 stars`}
        sx={{ color: '#f1c579', fontSize: 15 }}
      />
      <Typography variant="caption" color="text.secondary">
        {product.rating.toFixed(1)}
      </Typography>
    </Stack>
  );
}

export function CartIntentButton({
  product,
  onRequest,
}: {
  product: Product;
  onRequest: (product: Product) => void;
}) {
  return (
    <Button
      variant="contained"
      disabled={product.stock <= 0}
      onClick={() => onRequest(product)}
      aria-label={`Add ${product.name} to cart`}
      startIcon={<AddShoppingCartOutlinedIcon />}
      sx={{ whiteSpace: 'nowrap' }}
    >
      Add to Cart
    </Button>
  );
}

export function ProductCard({
  product,
  onRequest,
}: {
  product: Product;
  onRequest: (product: Product) => void;
}) {
  const { search } = useLocation();
  const stock = availability(product.stock);
  return (
    <Card
      component="article"
      aria-labelledby={`product-${product.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 180ms ease',
        '&:hover': { borderColor: '#5e826d' },
      }}
    >
      <CardActionArea
        component={Link}
        to={{ pathname: `/products/${product.id}`, search }}
        aria-label={`View ${product.name}`}
        sx={{ display: 'block' }}
      >
        <Box
          component="img"
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={400}
          height={360}
          sx={{
            width: '100%',
            height: 'auto',
            aspectRatio: '400/360',
            display: 'block',
            objectFit: 'cover',
          }}
        />
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Typography variant="overline" color="text.secondary">
            {product.category}
          </Typography>
          <Typography
            id={`product-${product.id}`}
            component="h3"
            variant="h3"
            sx={{ mt: 0.5, lineHeight: 1.4 }}
          >
            {product.name}
          </Typography>
        </Box>
      </CardActionArea>
      <CardContent
        sx={{
          p: 2.5,
          pt: 1.5,
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          gap: 2,
          '&:last-child': { pb: 2.5 },
        }}
      >
        <ProductRating product={product} />
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
            {formatPrice(product.price)}
          </Typography>
          <StatusIndicator {...stock} />
        </Stack>
        <CartIntentButton product={product} onRequest={onRequest} />
      </CardContent>
    </Card>
  );
}
