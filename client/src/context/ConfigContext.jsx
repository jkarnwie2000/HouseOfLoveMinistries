import { createContext, useContext } from 'react';
import { useApi } from '../lib/hooks.js';

// Fallback mirrors the server defaults so pages still render if /api/config is slow.
const FALLBACK = {
  currency: 'usd',
  paymentsEnabled: true,
  shippingOptions: [
    { id: 'standard', label: 'Standard Shipping', description: '5–8 business days.', amount: 695, freeOver: 7500, requiresAddress: true },
    { id: 'express', label: 'Express Shipping', description: '2–3 business days.', amount: 1495, freeOver: null, requiresAddress: true },
    { id: 'pickup', label: 'Pick Up at Church', description: 'Collect after a Sunday service.', amount: 0, freeOver: null, requiresAddress: false },
  ],
  donation: {
    presets: [10, 25, 50, 100, 250, 500],
    minAmount: 1,
    maxAmount: 50000,
    funds: [{ id: 'general', label: 'Where it is needed most' }],
  },
};

const ConfigContext = createContext(FALLBACK);

export function ConfigProvider({ children }) {
  const { data, loading, error } = useApi('/config');
  return (
    <ConfigContext.Provider value={{ ...(data || FALLBACK), loaded: Boolean(data), loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);

export function estimateShipping(options, optionId, subtotal) {
  const o = options.find((x) => x.id === optionId);
  if (!o) return 0;
  return o.freeOver != null && subtotal >= o.freeOver ? 0 : o.amount;
}
