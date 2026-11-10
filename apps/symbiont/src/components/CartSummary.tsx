import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { SurfaceCard } from '@microverse/shared-ui';
import type { CartTotals } from '../cart';
import { formatMoney } from '../cart';

export function CartSummary({
  totals,
  offerCode,
  processing,
  onCheckout,
}: {
  totals: CartTotals;
  offerCode: string | null;
  processing: boolean;
  onCheckout: () => void;
}) {
  return (
    <SurfaceCard
      component="aside"
      aria-label="Order summary"
      sx={{
        bgcolor: '#19231f',
        position: { lg: 'sticky' },
        top: 24,
        borderColor: '#494354',
      }}
    >
      <Typography variant="overline" color="secondary.main">
        A LITTLE MUTUAL BENEFIT
      </Typography>
      <Typography variant="h2" sx={{ mt: 1, mb: 3 }}>
        Order summary
      </Typography>
      <Stack
        component="dl"
        spacing={2}
        sx={{
          m: 0,
          '& > div': {
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
          },
          '& dt, & dd': { m: 0 },
          '& dd': { fontVariantNumeric: 'tabular-nums' },
        }}
      >
        <Box>
          <Typography component="dt" color="text.secondary">
            Subtotal ({totals.itemCount} items)
          </Typography>
          <Typography component="dd" data-testid="subtotal">
            {formatMoney(totals.subtotalPaise)}
          </Typography>
        </Box>
        <Box>
          <Typography component="dt" color="secondary.main">
            {offerCode ?? 'Coupon discount'}
          </Typography>
          <Typography
            component="dd"
            color="secondary.main"
            data-testid="discount"
          >
            −{formatMoney(totals.discountPaise)}
          </Typography>
        </Box>
        <Box>
          <Typography component="dt" color="text.secondary">
            Demo delivery
          </Typography>
          <Typography component="dd">
            {formatMoney(totals.shippingPaise)}
          </Typography>
        </Box>
        {totals.shippingDiscountPaise > 0 && (
          <Box>
            <Typography component="dt" color="secondary.main">
              Delivery saving
            </Typography>
            <Typography component="dd" color="secondary.main">
              −{formatMoney(totals.shippingDiscountPaise)}
            </Typography>
          </Box>
        )}
        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography component="dt" sx={{ fontWeight: 600 }}>
            Total
          </Typography>
          <Typography
            component="dd"
            data-testid="total"
            sx={{ fontSize: '1.5rem', fontWeight: 600 }}
          >
            {formatMoney(totals.totalPaise)}
          </Typography>
        </Box>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1 }}
      >
        INR · ₹99 demo delivery; no additional tax charges.
      </Typography>
      <Button
        fullWidth
        variant="contained"
        color="secondary"
        disabled={processing || totals.itemCount === 0}
        onClick={onCheckout}
        endIcon={!processing && <ArrowForwardIcon />}
        sx={{ mt: 3, py: 1.5 }}
      >
        {processing ? 'Simulating checkout…' : 'Simulate checkout'}
      </Button>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
      >
        A local demonstration. No payment is taken.
      </Typography>
      <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 3, pt: 2.5 }}>
        <Typography variant="overline" color="secondary.main">
          BETTER TOGETHER
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose a coupon in Offers. MUTANT confirms its eligibility and savings
          for this cart; coupons do not stack.
        </Typography>
      </Box>
    </SurfaceCard>
  );
}
