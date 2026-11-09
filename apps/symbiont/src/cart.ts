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
}
export interface OrderReceipt {
  id: string;
  createdAt: string;
  items: readonly CartItem[];
  totals: CartTotals;
}
export interface CartState {
  items: readonly CartItem[];
  phase: 'cart' | 'processing' | 'confirmed';
  order: OrderReceipt | null;
  notice: string;
}
export type CartAction =
  | { type: 'quantity'; id: string; quantity: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'restore'; items: readonly CartItem[] }
  | { type: 'checkout'; id: string; createdAt: string }
  | { type: 'complete' };

/** Fixed local demo discount: 10%; round once to the nearest paise. */
export function calculateTotals(items: readonly CartItem[]): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce(
    (sum, item) => sum + item.unitPricePaise * item.quantity,
    0,
  );
  const discountPaise = Math.round(subtotalPaise / 10);
  return {
    itemCount,
    subtotalPaise,
    discountPaise,
    totalPaise: subtotalPaise - discountPaise,
  };
}
export function createCart(items: readonly CartItem[]): CartState {
  return {
    items: items.map((item) => ({ ...item })),
    phase: 'cart',
    order: null,
    notice: '',
  };
}
export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'complete') {
    if (state.phase !== 'processing') return state;
    return {
      ...state,
      phase: 'confirmed',
      items: [],
      notice: 'Demo order confirmed. Your cart is now empty.',
    };
  }
  if (state.phase === 'processing') return state;
  if (action.type === 'restore')
    return { ...createCart(action.items), notice: 'Sample cart restored.' };
  if (state.phase !== 'cart') return state;
  switch (action.type) {
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
        notice: `${item.name} quantity updated to ${action.quantity}.`,
      };
    }
    case 'remove': {
      const item = state.items.find((item) => item.id === action.id);
      if (!item) return state;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
        notice: `${item.name} removed.`,
      };
    }
    case 'clear':
      return { ...state, items: [], notice: 'Cart cleared.' };
    case 'checkout': {
      if (!state.items.length) return state;
      return {
        ...state,
        phase: 'processing',
        order: {
          id: action.id,
          createdAt: action.createdAt,
          items: state.items.map((item) => ({ ...item })),
          totals: calculateTotals(state.items),
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
