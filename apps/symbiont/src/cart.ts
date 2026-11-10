import type { OfferQuote } from '@microverse/mycelium';
/** Cart models and rules belong to SYMBIONT, not shared infrastructure. */
export interface CartItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  unitPricePaise: number;
  quantity: number;
  stock: number;
}
export interface CartTotals {
  itemCount: number;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  shippingPaise: number;
  shippingDiscountPaise: number;
}
export interface OrderReceipt {
  id: string;
  createdAt: string;
  items: readonly CartItem[];
  totals: CartTotals;
  offerCode: string | null;
}
export interface CartState {
  items: readonly CartItem[];
  phase: 'cart' | 'processing' | 'confirmed';
  order: OrderReceipt | null;
  notice: string;
  offer: OfferQuote | null;
}
export type CartAction =
  | { type: 'add'; product: Omit<CartItem, 'quantity'>; quantity: number }
  | { type: 'quantity'; id: string; quantity: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'restore'; items: readonly CartItem[] }
  | { type: 'checkout'; id: string; createdAt: string }
  | { type: 'complete' };

/** SYMBIONT composes bounded monetary quotes; MUTANT owns all promotional rules. */
export function calculateTotals(
  items: readonly CartItem[],
  offer: OfferQuote | null = null,
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce(
    (sum, item) => sum + item.unitPricePaise * item.quantity,
    0,
  );
  const shippingPaise = itemCount ? 9900 : 0;
  const discountPaise = Math.min(
    subtotalPaise,
    Math.max(0, offer?.discountPaise ?? 0),
  );
  const shippingDiscountPaise = Math.min(
    shippingPaise,
    Math.max(0, offer?.shippingDiscountPaise ?? 0),
  );
  return {
    itemCount,
    subtotalPaise,
    discountPaise,
    shippingPaise,
    shippingDiscountPaise,
    totalPaise:
      subtotalPaise - discountPaise + shippingPaise - shippingDiscountPaise,
  };
}
export function createCart(items: readonly CartItem[]): CartState {
  return {
    items: items.map((item) => ({ ...item })),
    phase: 'cart',
    order: null,
    notice: '',
    offer: null,
  };
}
export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'complete') {
    if (state.phase !== 'processing') return state;
    return {
      ...state,
      phase: 'confirmed',
      offer: null,
      items: [],
      notice: 'Demo order confirmed. Your cart is now empty.',
    };
  }
  if (state.phase === 'processing') return state;
  if (action.type === 'restore')
    return { ...createCart(action.items), notice: 'Sample cart restored.' };
  if (state.phase !== 'cart' && action.type !== 'add') return state;
  switch (action.type) {
    case 'add': {
      const existing = state.items.find(
        (item) => item.id === action.product.id,
      );
      const stock = existing?.stock ?? action.product.stock;
      const quantity = (existing?.quantity ?? 0) + action.quantity;
      if (
        !Number.isInteger(action.quantity) ||
        action.quantity < 1 ||
        quantity > stock
      )
        return {
          ...state,
          notice: `${action.product.name}: the available quantity is already in your cart.`,
        };
      return {
        ...state,
        phase: 'cart',
        order: null,
        offer: null,
        items: existing
          ? state.items.map((item) =>
              item.id === existing.id ? { ...item, quantity } : item,
            )
          : [...state.items, { ...action.product, quantity }],
        notice: `${action.product.name} added to your cart.`,
      };
    }
    case 'quantity': {
      const item = state.items.find((item) => item.id === action.id);
      if (
        !item ||
        !Number.isInteger(action.quantity) ||
        action.quantity < 1 ||
        action.quantity > item.stock
      )
        return state;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item,
        ),
        offer: null,
        notice: `${item.name} quantity updated to ${action.quantity}.`,
      };
    }
    case 'remove': {
      const item = state.items.find((item) => item.id === action.id);
      if (!item) return state;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
        offer: null,
        notice: `${item.name} removed.`,
      };
    }
    case 'clear':
      return { ...state, items: [], offer: null, notice: 'Cart cleared.' };
    case 'checkout': {
      if (!state.items.length) return state;
      return {
        ...state,
        phase: 'processing',
        order: {
          id: action.id,
          createdAt: action.createdAt,
          items: state.items.map((item) => ({ ...item })),
          totals: calculateTotals(state.items, state.offer),
          offerCode: state.offer?.code ?? null,
        },
        notice: 'Simulating checkout. No payment is taken.',
      };
    }
  }
}
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});
export function formatMoney(paise: number) {
  return currency.format(paise / 100);
}
