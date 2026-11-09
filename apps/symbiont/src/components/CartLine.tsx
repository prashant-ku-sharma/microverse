import { Box, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import type { CartAction, CartItem } from '../cart';
import { formatMoney } from '../cart';

export function CartLine({
  item,
  disabled,
  dispatch,
}: {
  item: CartItem;
  disabled: boolean;
  dispatch: (action: CartAction) => void;
}) {
  return (
    <Box
      component="article"
      aria-label={item.name}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '80px minmax(0, 1fr)',
          sm: '108px minmax(0, 1fr)',
        },
        gap: { xs: 2, sm: 3 },
        py: 3,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        component="img"
        src={item.image}
        alt={item.name}
        sx={{
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
          borderRadius: 2,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="overline" color="secondary.main">
              {item.category}
            </Typography>
            <Typography variant="h3" component="h3" sx={{ mt: 0.5 }}>
              {item.name}
            </Typography>
          </Box>
          <IconButton
            aria-label={`Remove ${item.name}`}
            disabled={disabled}
            onClick={() => dispatch({ type: 'remove', id: item.id })}
            size="small"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {item.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatMoney(item.unitPricePaise)} each · {item.stock} available
        </Typography>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            mt: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <IconButton
              aria-label={`Decrease ${item.name} quantity`}
              disabled={disabled || item.quantity <= 1}
              onClick={() =>
                dispatch({
                  type: 'quantity',
                  id: item.id,
                  quantity: item.quantity - 1,
                })
              }
            >
              <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography
              component="output"
              aria-label={`${item.name} quantity`}
              sx={{
                minWidth: 22,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.quantity}
            </Typography>
            <IconButton
              aria-label={`Increase ${item.name} quantity`}
              disabled={disabled || item.quantity >= item.stock}
              onClick={() =>
                dispatch({
                  type: 'quantity',
                  id: item.id,
                  quantity: item.quantity + 1,
                })
              }
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
          <Typography
            sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatMoney(item.unitPricePaise * item.quantity)}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
