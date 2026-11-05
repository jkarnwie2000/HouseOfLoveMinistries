import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import { PageHero } from '../../components/ui/Section.jsx';
import ProductArt from '../../components/store/ProductArt.jsx';
import QtyStepper from '../../components/store/QtyStepper.jsx';
import { Alert, EmptyState } from '../../components/ui/Feedback.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { estimateShipping, useConfig } from '../../context/ConfigContext.jsx';
import { usePageMeta } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';

export function CartLineOptions({ item }) {
  return (
    <div className="options">
      {item.color && (
        <span><span className="swatch-dot" style={{ background: item.colorHex || '#ccc', width: 14, height: 14 }} aria-hidden="true" /> {item.color}</span>
      )}
      {item.size && <span>Size: <strong>{item.size}</strong></span>}
    </div>
  );
}

export default function Cart() {
  usePageMeta('Your Cart', 'Review the items in your House of Love Store cart.');
  const { items, subtotal, count, updateQuantity, removeItem } = useCart();
  const { shippingOptions } = useConfig();
  const [params] = useSearchParams();
  const [shipping, setShipping] = useState('standard');
  const canceled = params.get('checkout') === 'canceled';
  const shipCost = estimateShipping(shippingOptions, shipping, subtotal);
  const standard = shippingOptions.find((o) => o.id === 'standard');

  return (
    <>
      <PageHero eyebrow="House of Love Store" title="Your cart" crumbs={[{ label: 'Store', to: '/store' }, { label: 'Cart' }]} />
      <section className="section-tight">
        <div className="container">
          {canceled && (
            <div className="mb-3">
              <Alert type="info" title="Checkout canceled">Your payment was not completed and you have not been charged. Your cart has been saved.</Alert>
            </div>
          )}
          {items.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Your cart is empty" action={<Link to="/store" className="btn">Browse the store</Link>}>
              Find T-shirts, hoodies, caps, Bibles and more.
            </EmptyState>
          ) : (
            <div className="cart-layout">
              <div>
                <h2 className="visually-hidden">Items</h2>
                <ul className="cart-items">
                  {items.map((item) => (
                    <li key={item.key} className="card cart-item">
                      <Link to={`/store/${item.productId}`} tabIndex={-1} aria-hidden="true">
                        <ProductArt product={{ name: item.name, category: item.category, image: item.image }} colorHex={item.colorHex} />
                      </Link>
                      <div>
                        <h3><Link to={`/store/${item.productId}`}>{item.name}</Link></h3>
                        <CartLineOptions item={item} />
                        <div className="controls">
                          <QtyStepper size="sm" value={item.quantity} max={Math.min(20, item.maxQty ?? 20)} onChange={(q) => updateQuantity(item.key, q)} label={`Quantity for ${item.name}`} />
                          <button type="button" className="remove-btn" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name} from cart`}>
                            <Trash2 size={16} aria-hidden="true" /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="line-total">
                        {money(item.price * item.quantity)}
                        <div className="unit">{money(item.price)} each</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link to="/store" className="link-arrow mt-3"><ArrowLeft size={18} aria-hidden="true" /> Continue shopping</Link>
              </div>

              <aside className="card summary-card" aria-labelledby="summary-title">
                <h2 id="summary-title">Order summary</h2>
                <div className="summary-row"><span>Subtotal ({count} item{count === 1 ? '' : 's'})</span><span>{money(subtotal)}</span></div>
                <div className="field mt-1 mb-2">
                  <label htmlFor="cart-shipping" className="small">Estimate shipping</label>
                  <select id="cart-shipping" className="select" value={shipping} onChange={(e) => setShipping(e.target.value)}>
                    {shippingOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div className="summary-row"><span>Shipping</span><span>{shipCost === 0 ? 'Free' : money(shipCost)}</span></div>
                {shipping === 'standard' && standard?.freeOver && subtotal < standard.freeOver && (
                  <p className="small muted mb-0">Add {money(standard.freeOver - subtotal)} more for free standard shipping.</p>
                )}
                <div className="summary-row total"><span>Estimated total</span><span>{money(subtotal + shipCost)}</span></div>
                <Link to={`/checkout?shipping=${shipping}`} className="btn btn-lg btn-block mt-2">
                  Proceed to checkout <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <p className="stripe-badge"><Lock size={14} aria-hidden="true" /> Final prices are confirmed securely at checkout.</p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
