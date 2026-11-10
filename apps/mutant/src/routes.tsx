import {
  useQuery,
  useMutation,
  QueryClientProvider,
} from '@tanstack/react-query';
import { queryClient } from './api/query';
import { getOffers, validateOffer } from './api/client';
import { LoadingIndicator } from '@microverse/shared-ui';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PageHeader, SurfaceCard } from '@microverse/shared-ui';
import type { MutantRoutesProps } from '@microverse/shared-types';
import { evaluateCoupon, money } from './offers';
import type { Coupon } from './offers';
import { offersService } from './offers-service';
const date = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

function MutantRoutes({ mode = 'standalone' }: MutantRoutesProps) {
  const state = useSyncExternalStore(
    offersService.subscribe,
    offersService.getSnapshot,
  );
  useEffect(() => offersService.start(), []);
  const query = useQuery({ queryKey: ['offers'], queryFn: getOffers });
  const validation = useMutation({
    mutationFn: async (code: string) => {
      const before = offersService.getSnapshot();
      const result = await validateOffer(code, before.cart);
      const current = offersService.getSnapshot();
      if (
        current.cart?.cartRevision !== before.cart?.cartRevision ||
        current.cart?.checkoutPending
      )
        throw new Error('Cart changed during validation. Please apply again.');
      if (!result.eligible) throw new Error(result.reason);
      offersService.apply(code);
    },
  });
  const [details, setDetails] = useState<Coupon | null>(null);
  const [preview, setPreview] = useState({ subtotal: '2500', shipping: '99' });
  const [previewError, setPreviewError] = useState('');
  const applied = Boolean(state.code && state.cart?.offerCode === state.code);
  const saving =
    (state.cart?.discountPaise ?? 0) + (state.cart?.shippingDiscountPaise ?? 0);
  if (query.isPending) return <LoadingIndicator label="Loading offers…" />;
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={() => void query.refetch()}>Retry offers</Button>
        }
      >
        {query.error.message}
      </Alert>
    );
  const coupons = query.data;
  return (
    <Box component="section" aria-label="MUTANT offers">
      <PageHeader
        eyebrow="MUTANT / UNEXPECTED VALUE"
        title="A little change. A better total."
        description="Find an offer that fits your collection. One thoughtful saving at a time."
        action={<Chip label="One coupon at a time" variant="outlined" />}
      />
      {validation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {validation.error.message}
        </Alert>
      )}
      {state.error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" onClick={offersService.reset}>
              Reset selection
            </Button>
          }
        >
          {state.error}
        </Alert>
      )}
      {mode === 'standalone' && (
        <SurfaceCard
          component="form"
          sx={{ mt: 3 }}
          onSubmit={(event) => {
            event.preventDefault();
            const subtotal = Number(preview.subtotal),
              shipping = Number(preview.shipping);
            if (
              !preview.subtotal.trim() ||
              !preview.shipping.trim() ||
              ![subtotal, shipping].every(
                (value) =>
                  Number.isFinite(value) && value >= 0 && value <= 10000000,
              )
            ) {
              setPreviewError('Enter non-negative amounts up to ₹1,00,00,000.');
              return;
            }
            setPreviewError('');
            offersService.preview(
              Math.round(subtotal * 100),
              Math.round(shipping * 100),
            );
          }}
        >
          <Typography variant="h2">Standalone cart preview</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 2 }}
          >
            Explore eligibility with a local estimate. This does not change
            SYMBIONT’s cart; use ECOSYSTEM for the connected flow.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Preview subtotal (₹)"
              value={preview.subtotal}
              onChange={(event) =>
                setPreview({ ...preview, subtotal: event.target.value })
              }
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            />
            <TextField
              label="Preview delivery (₹)"
              value={preview.shipping}
              onChange={(event) =>
                setPreview({ ...preview, shipping: event.target.value })
              }
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            />
            <Button variant="outlined" type="submit">
              Preview this cart
            </Button>
          </Stack>
          {previewError && (
            <Typography role="alert" color="error.main" sx={{ mt: 2 }}>
              {previewError}
            </Typography>
          )}
        </SurfaceCard>
      )}
      <SurfaceCard
        sx={{
          mt: 3,
          background:
            'linear-gradient(120deg, #ffab9c12, transparent), #121d18',
          borderColor: '#554039',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            justifyContent: 'space-between',
            gap: 3,
            alignItems: { sm: 'center' },
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: '#ffab9c' }}>
              {state.preview ? 'LOCAL ESTIMATE' : 'YOUR CART CONTEXT'}
            </Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              {state.cart
                ? `${money(state.cart.subtotalPaise)} in your collection`
                : 'Waiting for your collection.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {state.cart
                ? `${state.cart.itemCount} ${state.cart.itemCount === 1 ? 'item' : 'items'} · ${money(state.cart.shippingPaise)} delivery before offers`
                : 'Cart facts arrive through MYCELIUM. Start Cart to refresh eligibility.'}
            </Typography>
          </Box>
          <Button onClick={offersService.retry} variant="outlined">
            Refresh cart
          </Button>
        </Stack>
        {state.code && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{
                gap: 2,
                justifyContent: 'space-between',
                alignItems: { sm: 'center' },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {state.code} ·{' '}
                  {applied
                    ? state.preview
                      ? 'Preview applied'
                      : 'Confirmed in Cart'
                    : 'Awaiting Cart confirmation'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {applied
                    ? `${money(saving)} saved${state.preview ? ' in this estimate' : ''}`
                    : 'A saved selection becomes active only after cart confirmation.'}
                </Typography>
              </Box>
              <Button
                color="inherit"
                onClick={offersService.remove}
                disabled={state.cart?.checkoutPending}
              >
                Remove coupon
              </Button>
            </Stack>
          </>
        )}
      </SurfaceCard>
      <Typography
        role="status"
        aria-live="polite"
        sx={{ minHeight: 24, mt: 2, color: 'primary.main' }}
      >
        {state.notice}
      </Typography>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', gap: 2, mt: 2, mb: 2 }}
      >
        <Typography variant="h2">Available coupons</Typography>
        <Typography variant="overline" color="text.secondary">
          {coupons.length.toString().padStart(2, '0')} / POSSIBILITIES
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
          gap: 2.5,
        }}
      >
        {coupons.length === 0 && (
          <SurfaceCard>
            <Typography variant="h2">No offers available</Typography>
            <Typography>Check back for new possibilities.</Typography>
          </SurfaceCard>
        )}
        {coupons.map((coupon) => {
          const eligibility = evaluateCoupon(coupon, state.cart);
          const selected = state.code === coupon.code;
          return (
            <SurfaceCard
              component="article"
              aria-label={coupon.code}
              key={coupon.code}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '2px solid #ffab9c77',
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <LocalOfferOutlinedIcon
                  sx={{ color: '#ffab9c', fontSize: 28 }}
                />
                <Chip
                  label={
                    selected && applied
                      ? 'Applied'
                      : eligibility.eligible
                        ? 'Eligible'
                        : 'Not eligible'
                  }
                  color={eligibility.eligible ? 'success' : 'default'}
                  variant="outlined"
                />
              </Stack>
              <Typography
                sx={{
                  fontSize: coupon.kind === 'shipping' ? '2rem' : '3rem',
                  fontWeight: 600,
                  letterSpacing: '-.05em',
                  mt: 3,
                  color: '#ffab9c',
                }}
              >
                {coupon.kind === 'percentage'
                  ? `${coupon.percentage}%`
                  : 'Free delivery'}
              </Typography>
              <Typography variant="h3" component="h3" sx={{ mt: 1 }}>
                {coupon.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, flexGrow: 1 }}
              >
                {coupon.description}
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  py: 1.5,
                  px: 2,
                  border: '1px dashed #665047',
                  borderRadius: 2,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    letterSpacing: '.12em',
                    fontWeight: 700,
                  }}
                >
                  {coupon.code}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Valid through {date(coupon.expiresAt)} · UTC
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  minHeight: 48,
                  color: eligibility.eligible
                    ? 'primary.main'
                    : 'text.secondary',
                }}
              >
                {state.cart?.checkoutPending
                  ? 'Checkout is in progress.'
                  : eligibility.reason}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={
                    validation.isPending ||
                    !eligibility.eligible ||
                    selected ||
                    state.cart?.checkoutPending
                  }
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => validation.mutate(coupon.code)}
                  aria-label={`Apply ${coupon.code}`}
                >
                  Apply coupon
                </Button>
                <Button
                  onClick={() => setDetails(coupon)}
                  aria-label={`Details for ${coupon.code}`}
                >
                  Details
                </Button>
              </Stack>
            </SurfaceCard>
          );
        })}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Minimum values use your product subtotal before discounts and delivery.
        Coupons replace each other and are rechecked when your cart changes.
      </Typography>
      <Dialog
        open={details !== null}
        onClose={() => setDetails(null)}
        aria-labelledby="coupon-details-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="coupon-details-title">
          {details?.code} / Coupon details
        </DialogTitle>
        {details && (
          <DialogContent>
            <Stack spacing={2}>
              <Typography>{details.description}</Typography>
              <Typography>
                Benefit:{' '}
                {details.kind === 'percentage'
                  ? `${details.percentage}% off products`
                  : 'Waive the delivery charge'}
              </Typography>
              <Typography>
                Minimum product subtotal: {money(details.minimumPaise)}
              </Typography>
              <Typography>
                Valid {date(details.startsAt)} through {date(details.expiresAt)}{' '}
                (UTC).
              </Typography>
              <Typography color="text.secondary">
                One coupon per cart. Eligibility and savings are recalculated
                whenever your collection changes. This is a local demonstration.
              </Typography>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setDetails(null)}>Close coupon details</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function DataRoutes(props: Parameters<typeof MutantRoutes>[0]) {
  return (
    <QueryClientProvider client={queryClient}>
      <MutantRoutes {...props} />
    </QueryClientProvider>
  );
}
