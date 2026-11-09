import { useEffect, useReducer, useRef } from 'react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import {
  OrganismMark,
  SurfaceCard,
  StatusIndicator,
} from '@microverse/shared-ui';
import type { SymbiontRoutesProps } from '@microverse/shared-types';
import { calculateTotals, cartReducer, createCart, formatMoney } from './cart';
import { sampleCart } from './data/sample-cart';
import { CartLine } from './components/CartLine';
import { CartSummary } from './components/CartSummary';

export default function SymbiontRoutes({
  mode = 'standalone',
}: SymbiontRoutesProps) {
  const [state, dispatch] = useReducer(cartReducer, sampleCart, createCart);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const totals = calculateTotals(state.items);
  const processing = state.phase === 'processing';
  useEffect(() => {
    if (!processing) return;
    const timer = setTimeout(() => dispatch({ type: 'complete' }), 900);
    return () => clearTimeout(timer);
  }, [processing]);
  useEffect(() => {
    if (state.phase === 'confirmed') confirmation.current?.focus();
  }, [state.phase]);
  const restore = () => dispatch({ type: 'restore', items: sampleCart });
  return (
    <Box component="section" aria-label="SYMBIONT cart" sx={{ minWidth: 0 }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}
      >
        <Typography variant="overline" color="secondary.main">
          SYMBIONT / CART & CHECKOUT
        </Typography>
        <Chip
          label="Local sample cart"
          variant="outlined"
          sx={{ color: 'text.secondary' }}
        />
        {mode === 'embedded' && (
          <Typography variant="caption" color="text.secondary">
            Independent cart organism
          </Typography>
        )}
      </Stack>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ maxWidth: 650 }}>
          {state.phase === 'confirmed'
            ? 'A little good, on its way.'
            : 'Good things, better together.'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
          {state.phase === 'confirmed'
            ? 'Your simulated order is complete. A small step through the ecosystem.'
            : 'A considered collection. Make it yours, one choice at a time.'}
        </Typography>
      </Box>
      <Stack
        direction="row"
        aria-label="Checkout progress"
        spacing={{ xs: 1.5, sm: 3 }}
        sx={{
          alignItems: 'center',
          mb: 4,
          pb: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          flexWrap: 'wrap',
          rowGap: 1,
        }}
      >
        {['Your collection', 'Demo checkout', 'Confirmation'].map(
          (label, i) => (
            <Typography
              key={label}
              variant="caption"
              sx={{
                color:
                  (state.phase === 'confirmed' ? 2 : processing ? 1 : 0) === i
                    ? 'secondary.main'
                    : 'text.secondary',
              }}
            >
              {`0${i + 1}`} / {label}
            </Typography>
          ),
        )}
      </Stack>
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          p: 0,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      >
        {state.notice}
      </Box>
      {state.phase === 'confirmed' && state.order ? (
        <SurfaceCard sx={{ maxWidth: 760, mx: 'auto', borderColor: '#494354' }}>
          <CheckCircleOutlinedIcon
            sx={{ color: 'secondary.main', fontSize: 48, mb: 2 }}
          />
          <Typography
            ref={confirmation}
            tabIndex={-1}
            variant="h2"
            sx={{ outline: 'none' }}
          >
            Demo order confirmed
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            This is a simulation. No payment was taken and no delivery will be
            arranged.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ justifyContent: 'space-between', gap: 2, mb: 3 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                DEMO REFERENCE
              </Typography>
              <Typography>{state.order.id}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">
                CONFIRMED
              </Typography>
              <Typography>
                {new Date(state.order.createdAt).toLocaleDateString('en-IN')}
              </Typography>
            </Box>
          </Stack>
          <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0 }}>
            {state.order.items.map((item) => (
              <Stack
                component="li"
                direction="row"
                key={item.id}
                sx={{ justifyContent: 'space-between', gap: 2 }}
              >
                <Typography variant="body2">
                  {item.name} × {item.quantity}
                </Typography>
                <Typography variant="body2">
                  {formatMoney(item.unitPricePaise * item.quantity)}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Divider sx={{ my: 2.5 }} />
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', gap: 2 }}
          >
            <Typography color="text.secondary">
              Sample discount · 10%
            </Typography>
            <Typography color="secondary.main">
              −{formatMoney(state.order.totals.discountPaise)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', my: 2, gap: 2 }}
          >
            <Typography variant="h3" component="p">
              Demo total
            </Typography>
            <Typography variant="h3" component="p">
              {formatMoney(state.order.totals.totalPaise)}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {state.order.totals.itemCount} items in your receipt. Your cart is
            now empty.
          </Typography>
          <Button
            onClick={restore}
            variant="outlined"
            color="secondary"
            sx={{ mt: 3 }}
          >
            Start another sample cart
          </Button>
        </SurfaceCard>
      ) : !state.items.length ? (
        <SurfaceCard
          sx={{
            textAlign: 'center',
            py: { xs: 6, sm: 9 },
            background:
              'radial-gradient(ellipse at 50% 0%, #b9a2ff12, transparent 70%), #121d18',
          }}
        >
          <OrganismMark accent="violet" size={80} />
          <Typography variant="h2" sx={{ mt: 3 }}>
            Room for something good.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Your cart is empty. Restore the sample collection to explore.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={restore}
            sx={{ mt: 3 }}
          >
            Restore sample cart
          </Button>
        </SurfaceCard>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 1.6fr) minmax(300px, 1fr)',
            },
            gap: { xs: 3, lg: 5 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography variant="h2">
                Your collection{' '}
                <Typography
                  component="span"
                  color="text.secondary"
                  variant="body2"
                >
                  / {totals.itemCount} items
                </Typography>
              </Typography>
              <Button
                size="small"
                color="inherit"
                disabled={processing}
                onClick={() => dispatch({ type: 'clear' })}
              >
                Clear cart
              </Button>
            </Stack>
            {state.items.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                disabled={processing}
                dispatch={dispatch}
              />
            ))}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', mt: 3 }}
            >
              <ShoppingBagOutlinedIcon
                sx={{ color: 'secondary.main', fontSize: 20 }}
              />
              <Typography variant="body2" color="text.secondary">
                Sample items live in SYMBIONT. Product discovery is connected in
                a later stage.
              </Typography>
            </Stack>
          </Box>
          <CartSummary
            totals={totals}
            processing={processing}
            onCheckout={() =>
              dispatch({
                type: 'checkout',
                id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                createdAt: new Date().toISOString(),
              })
            }
          />
        </Box>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          justifyContent: 'space-between',
          gap: 1.5,
          mt: 5,
          pt: 3,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <StatusIndicator label="Local demonstration · no payments" />
        <Typography variant="caption" color="text.secondary">
          SYMBIONT · Independent by nature
        </Typography>
      </Stack>
    </Box>
  );
}
