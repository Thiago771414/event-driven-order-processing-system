import type { OrderItem } from '../types/order';
import type { Product } from '../types/product';
import { localStorageAdapter } from '../storage/localStorageAdapter';
import { STORAGE_KEYS } from '../utils/constants';

export interface CartLine extends OrderItem {
  name?: string;
}

export interface CartState {
  customerId?: string;
  items: CartLine[];
  updatedAt?: string;
}

type CartListener = () => void;

const emptyCart: CartState = {
  items: [],
};

let cartState: CartState = emptyCart;
const listeners = new Set<CartListener>();

export const cartStore = {
  getSnapshot() {
    return cartState;
  },

  subscribe(listener: CartListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  hydrateFromBrowserStorage() {
    const persisted =
      localStorageAdapter.get<CartState>(STORAGE_KEYS.cartSession) ?? emptyCart;
    cartState = persisted;
    emit();
  },

  persistToBrowserStorage() {
    localStorageAdapter.set(STORAGE_KEYS.cartSession, cartState);
  },

  setCustomerId(customerId: string) {
    updateCart({ ...cartState, customerId });
  },

  addProduct(product: Product, qty = 1) {
    const existingItem = cartState.items.find(
      (item) => item.productId === product.id,
    );

    const items = existingItem
      ? cartState.items.map((item) =>
          item.productId === product.id
            ? { ...item, qty: item.qty + qty }
            : item,
        )
      : [
          ...cartState.items,
          {
            productId: product.id,
            name: product.name,
            qty,
            price: product.price.amount,
          },
        ];

    updateCart({ ...cartState, items });
  },

  updateQty(productId: string, qty: number) {
    const items =
      qty <= 0
        ? cartState.items.filter((item) => item.productId !== productId)
        : cartState.items.map((item) =>
            item.productId === productId ? { ...item, qty } : item,
          );

    updateCart({ ...cartState, items });
  },

  clear() {
    updateCart(emptyCart);
    localStorageAdapter.remove(STORAGE_KEYS.cartSession);
  },
};

export function getCartTotal(state = cartState) {
  return state.items.reduce((total, item) => total + item.price * item.qty, 0);
}

function updateCart(nextState: CartState) {
  // Cart state is session state. Persisting it is a UX convenience, not server
  // truth. The backend recalculates and validates business state.
  cartState = {
    ...nextState,
    updatedAt: new Date().toISOString(),
  };

  emit();
}

function emit() {
  listeners.forEach((listener) => listener());
}
