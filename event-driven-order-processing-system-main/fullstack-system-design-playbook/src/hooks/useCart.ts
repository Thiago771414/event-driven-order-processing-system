import { useMemo, useSyncExternalStore } from 'react';
import { cartStore, getCartTotal } from '../state/cartStore';

export function useCart() {
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getSnapshot,
  );

  return useMemo(
    () => ({
      cart,
      total: getCartTotal(cart),
      actions: {
        addProduct: cartStore.addProduct,
        updateQty: cartStore.updateQty,
        setCustomerId: cartStore.setCustomerId,
        hydrateFromBrowserStorage: cartStore.hydrateFromBrowserStorage,
        persistToBrowserStorage: cartStore.persistToBrowserStorage,
        clear: cartStore.clear,
      },
    }),
    [cart],
  );
}
