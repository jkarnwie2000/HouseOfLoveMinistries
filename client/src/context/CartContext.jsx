import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { safeStorage } from '../lib/hooks.js';

const STORAGE_KEY = 'holim_cart_v1';
const MAX_QTY = 20;
const CartContext = createContext(null);

const lineKey = (productId, size, color) => `${productId}|${size || ''}|${color || ''}`;
const clampQty = (qty, max) => Math.max(1, Math.min(Number(qty) || 1, MAX_QTY, max ?? MAX_QTY));

function load() {
  try {
    const raw = safeStorage()?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.productId && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

function reducer(items, action) {
  switch (action.type) {
    case 'add': {
      const { product, size = '', color = '', quantity = 1 } = action;
      const key = lineKey(product.id, size, color);
      const existing = items.find((i) => i.key === key);
      const max = product.inventory;
      if (existing) {
        return items.map((i) => (i.key === key ? { ...i, quantity: clampQty(i.quantity + quantity, max), maxQty: max, price: product.price } : i));
      }
      const colorHex = product.colors?.find((c) => c.name === color)?.hex || '';
      return [...items, {
        key, productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category,
        size, color, colorHex, quantity: clampQty(quantity, max), maxQty: max,
      }];
    }
    case 'update':
      return items.map((i) => (i.key === action.key ? { ...i, quantity: clampQty(action.quantity, i.maxQty) } : i));
    case 'remove':
      return items.filter((i) => i.key !== action.key);
    case 'clear':
      return [];
    case 'sync':
      return action.items;
    default:
      return items;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);

  // Persist the cart so it survives refreshes and navigation.
  useEffect(() => {
    try { safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* storage full or blocked */ }
  }, [items]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_KEY) dispatch({ type: 'sync', items: load() }); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = useCallback((product, opts) => dispatch({ type: 'add', product, ...opts }), []);
  const updateQuantity = useCallback((key, quantity) => dispatch({ type: 'update', key, quantity }), []);
  const removeItem = useCallback((key) => dispatch({ type: 'remove', key }), []);
  const clearCart = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    // Display estimate only – the server re-prices every checkout from trusted data.
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items, count, subtotal, addItem, updateQuantity, removeItem, clearCart,
      checkoutItems: items.map(({ productId, quantity, size, color }) => ({ productId, quantity, size, color })),
    };
  }, [items, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export const CART_MAX_QTY = MAX_QTY;
