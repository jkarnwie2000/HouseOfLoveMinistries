import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { getShippingOption, shippingCostFor } from '../config/store.js';
import { badRequest } from '../utils/errors.js';

/**
 * Prices a cart using TRUSTED server-side product data only.
 * Any price, name or total sent by the browser is ignored.
 */
export async function priceCart(items, shippingOptionId) {
  const store = db();
  const products = new Map();
  const merged = new Map();

  for (const item of items) {
    let product = products.get(item.productId);
    if (!product) {
      product = await store.get('products', item.productId);
      if (!product || !product.active) {
        throw badRequest('An item in your cart is no longer available. Please remove it and try again.', [
          { field: 'items', productId: item.productId, message: 'Unavailable' },
        ]);
      }
      products.set(product.id, product);
    }

    let size = '';
    if (product.sizes?.length) {
      if (!product.sizes.includes(item.size)) throw badRequest(`Please choose a valid size for ${product.name}.`);
      size = item.size;
    }
    let color = '';
    if (product.colors?.length) {
      if (!product.colors.some((c) => c.name === item.color)) throw badRequest(`Please choose a valid color for ${product.name}.`);
      color = item.color;
    }

    const key = `${product.id}|${size}|${color}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else {
      merged.set(key, {
        productId: product.id,
        name: product.name,
        image: product.image || '',
        category: product.category,
        size,
        color,
        unitPrice: product.price,
        quantity: item.quantity,
      });
    }
  }

  const qtyByProduct = new Map();
  for (const line of merged.values()) {
    qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) || 0) + line.quantity);
  }
  for (const [productId, qty] of qtyByProduct) {
    const product = products.get(productId);
    if (qty > (product.inventory ?? 0)) {
      throw badRequest(
        product.inventory > 0
          ? `Only ${product.inventory} of “${product.name}” left in stock. Please reduce the quantity.`
          : `“${product.name}” is currently out of stock.`,
        [{ field: 'items', productId, message: 'Insufficient stock', available: product.inventory }],
      );
    }
  }

  const lines = [...merged.values()].map((l) => ({ ...l, lineTotal: l.unitPrice * l.quantity }));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const option = getShippingOption(shippingOptionId);
  if (!option) throw badRequest('Please choose a shipping option.');
  const shipping = shippingCostFor(option.id, subtotal);

  return {
    lines,
    subtotal,
    shipping,
    shippingOption: { id: option.id, label: option.label, description: option.description },
    total: subtotal + shipping,
    currency: env.currency,
  };
}
