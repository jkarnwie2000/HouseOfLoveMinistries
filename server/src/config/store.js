/**
 * Store configuration owned by the ministry. All amounts are in cents.
 * These are EDITABLE PLACEHOLDERS – confirm real shipping rates before launch.
 */
export const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Shipping',
    description: '5–8 business days. Free on orders of $75 or more.',
    amount: 695,
    freeOver: 7500,
    minDays: 5,
    maxDays: 8,
    requiresAddress: true,
  },
  {
    id: 'express',
    label: 'Express Shipping',
    description: '2–3 business days.',
    amount: 1495,
    freeOver: null,
    minDays: 2,
    maxDays: 3,
    requiresAddress: true,
  },
  {
    id: 'pickup',
    label: 'Pick Up at Church',
    description: 'Collect your order after a Sunday service. We will email you when it is ready.',
    amount: 0,
    freeOver: null,
    minDays: null,
    maxDays: null,
    requiresAddress: false,
  },
];

export const MAX_QTY_PER_LINE = 20;

export const DONATION = {
  presets: [10, 25, 50, 100, 250, 500],
  minAmount: 1,
  maxAmount: 50000,
  funds: [
    { id: 'general', label: 'Where it is needed most' },
    { id: 'outreach', label: 'Community Outreach' },
    { id: 'missions', label: 'Evangelism & Missions' },
    { id: 'youth', label: 'Youth Development' },
    { id: 'family', label: 'Family Support Programs' },
    { id: 'building', label: 'Ministry Expansion' },
  ],
};

export const ORDER_FULFILLMENT_STATUSES = ['unfulfilled', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'canceled'];

export function getShippingOption(id) {
  return SHIPPING_OPTIONS.find((o) => o.id === id) || null;
}

export function shippingCostFor(optionId, subtotal) {
  const option = getShippingOption(optionId);
  if (!option) return null;
  if (option.freeOver != null && subtotal >= option.freeOver) return 0;
  return option.amount;
}
