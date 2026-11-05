import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import Field from '../../components/ui/Field.jsx';
import ProductArt from '../../components/store/ProductArt.jsx';
import { Alert, Spinner } from '../../components/ui/Feedback.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';
import { api } from '../../lib/api.js';
import { usePageMeta } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import { email, focusFirstError, minLen, required, validateFields } from '../../lib/validation.js';

const COUNTRIES = [
  ['US', 'United States'], ['CA', 'Canada'], ['GB', 'United Kingdom'], ['NG', 'Nigeria'], ['GH', 'Ghana'], ['KE', 'Kenya'],
  ['ZA', 'South Africa'], ['CM', 'Cameroon'], ['UG', 'Uganda'], ['ZW', 'Zimbabwe'], ['LR', 'Liberia'], ['SL', 'Sierra Leone'],
];

export default function Checkout() {
  usePageMeta('Checkout', 'Secure checkout for the House of Love Store.');
  const { items, checkoutItems, count } = useCart();
  const { shippingOptions, paymentsEnabled, loaded } = useConfig();
  const [params] = useSearchParams();
  const [shippingOption, setShippingOption] = useState(() => {
    const s = params.get('shipping');
    return ['standard', 'express', 'pickup'].includes(s) ? s : 'standard';
  });
  const [values, setValues] = useState({
    name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US',
  });
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState({ loading: true, data: null, error: null });
  const [submit, setSubmit] = useState({ state: 'idle', message: '' });
  const formRef = useRef(null);

  const needsAddress = shippingOptions.find((o) => o.id === shippingOption)?.requiresAddress !== false;
  const itemsKey = useMemo(() => JSON.stringify(checkoutItems), [checkoutItems]);

  // Prices, shipping and totals always come from the server.
  useEffect(() => {
    if (!checkoutItems.length) return undefined;
    const ctrl = new AbortController();
    setQuote((q) => ({ ...q, loading: true, error: null }));
    api('/cart/quote', { method: 'POST', body: { items: checkoutItems, shippingOption }, signal: ctrl.signal })
      .then((data) => setQuote({ loading: false, data, error: null }))
      .catch((error) => { if (error.name !== 'AbortError') setQuote({ loading: false, data: null, error }); });
    return () => ctrl.abort();
  }, [itemsKey, shippingOption]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === 0 && submit.state !== 'redirecting') return <Navigate to="/cart" replace />;

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (submit.state === 'loading' || submit.state === 'redirecting') return; // prevent double submission
    const rules = {
      name: [minLen(2, 'Please enter your full name.')],
      email: [required('Please enter your email address.'), email()],
    };
    if (needsAddress) {
      Object.assign(rules, {
        line1: [required('Please enter your street address.')],
        city: [required('Please enter your city.')],
        state: [required('Please enter your state or region.')],
        postalCode: [required('Please enter your postal code.')],
      });
    }
    const errs = validateFields(values, rules);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setSubmit({ state: 'error', message: 'Please correct the highlighted fields.' });
      return focusFirstError(formRef.current);
    }

    setSubmit({ state: 'loading', message: '' });
    try {
      const res = await api('/checkout/session', {
        method: 'POST',
        body: {
          items: checkoutItems,
          shippingOption,
          customer: { name: values.name, email: values.email, phone: values.phone },
          shippingAddress: needsAddress
            ? { line1: values.line1, line2: values.line2, city: values.city, state: values.state, postalCode: values.postalCode, country: values.country }
            : null,
        },
      });
      setSubmit({ state: 'redirecting', message: '' });
      window.location.assign(res.url); // Stripe-hosted, PCI-compliant payment page
    } catch (err) {
      const fe = err.fieldErrors || {};
      const mapped = {};
      for (const [k, v] of Object.entries(fe)) mapped[k.replace(/^(customer|shippingAddress)\./, '')] = v;
      setErrors(mapped);
      setSubmit({ state: 'error', message: err.message });
    }
  }

  const q = quote.data;
  const busy = submit.state === 'loading' || submit.state === 'redirecting';

  return (
    <section className="section-tight">
      <div className="container">
        <nav className="checkout-steps" aria-label="Checkout progress">
          <Link to="/cart">Cart</Link> <span aria-hidden="true">›</span>
          <span className="on" aria-current="step">Details</span> <span aria-hidden="true">›</span>
          <span>Secure payment</span> <span aria-hidden="true">›</span>
          <span>Confirmation</span>
        </nav>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)' }}>Checkout</h1>

        {loaded && !paymentsEnabled && (
          <div className="mb-3"><Alert type="error" title="Online payments are not available yet">The store’s payment provider has not been configured. Please contact the church office to order.</Alert></div>
        )}

        <form ref={formRef} onSubmit={onSubmit} noValidate className="cart-layout">
          <div>
            {submit.state === 'error' && <div className="mb-2"><Alert type="error">{submit.message}</Alert></div>}

            <div className="card checkout-section">
              <h2><span className="step">1</span> Contact information</h2>
              <div className="form-grid">
                <Field label="Full name" required value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={120} />
                <div className="form-row">
                  <Field label="Email" type="email" required value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" hint="Your receipt and order updates will be sent here." />
                  <Field label="Phone (optional)" type="tel" value={values.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} />
                </div>
              </div>
            </div>

            <div className="card checkout-section">
              <h2><span className="step">2</span> Delivery method</h2>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="visually-hidden">Choose a delivery method</legend>
                <div className="ship-options">
                  {shippingOptions.map((o) => {
                    const cost = q && q.shippingOption.id === o.id ? q.shipping : (o.freeOver != null && q && q.subtotal >= o.freeOver ? 0 : o.amount);
                    return (
                      <label key={o.id} className="ship-option">
                        <input type="radio" name="shipping" value={o.id} checked={shippingOption === o.id} onChange={() => setShippingOption(o.id)} />
                        <span><strong>{o.label}</strong><span className="desc" style={{ display: 'block' }}>{o.description}</span></span>
                        <span className="price">{cost === 0 ? 'Free' : money(cost)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {needsAddress && (
              <div className="card checkout-section">
                <h2><span className="step">3</span> Shipping address</h2>
                <div className="form-grid">
                  <Field label="Street address" required value={values.line1} onChange={set('line1')} error={errors.line1} autoComplete="address-line1" maxLength={200} />
                  <Field label="Apartment, suite, etc. (optional)" value={values.line2} onChange={set('line2')} autoComplete="address-line2" maxLength={200} />
                  <div className="form-row">
                    <Field label="City" required value={values.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" maxLength={100} />
                    <Field label="State / Region" required value={values.state} onChange={set('state')} error={errors.state} autoComplete="address-level1" maxLength={100} />
                  </div>
                  <div className="form-row">
                    <Field label="Postal code" required value={values.postalCode} onChange={set('postalCode')} error={errors.postalCode} autoComplete="postal-code" maxLength={20} />
                    <Field label="Country" as="select" required value={values.country} onChange={set('country')} error={errors.country} autoComplete="country">
                      {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </Field>
                  </div>
                </div>
              </div>
            )}
            <Link to="/cart" className="link-arrow"><ArrowLeft size={18} aria-hidden="true" /> Back to cart</Link>
          </div>

          <aside className="card summary-card" aria-labelledby="checkout-summary">
            <h2 id="checkout-summary">Order summary</h2>
            <ul className="summary-lines">
              {items.map((i) => (
                <li key={i.key}>
                  <span className="qty-badge"><b>{i.quantity}</b><ProductArt product={{ name: i.name, category: i.category, image: i.image }} colorHex={i.colorHex} /></span>
                  <span>{i.name}<br /><span className="muted small">{[i.color, i.size].filter(Boolean).join(' · ')}</span></span>
                  <span>{money((q?.lines.find((l) => l.productId === i.productId && l.size === (i.size || '') && l.color === (i.color || ''))?.unitPrice ?? i.price) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            {quote.error && <Alert type="error">{quote.error.message} <Link to="/cart">Update your cart</Link></Alert>}
            {quote.loading && !q && <p className="muted small">Calculating totals…</p>}
            {q && (
              <>
                <div className="summary-row"><span>Subtotal</span><span>{money(q.subtotal, q.currency)}</span></div>
                <div className="summary-row"><span>Shipping ({q.shippingOption.label})</span><span>{q.shipping === 0 ? 'Free' : money(q.shipping, q.currency)}</span></div>
                <div className="summary-row total"><span>Total</span><span>{money(q.total, q.currency)}</span></div>
              </>
            )}
            <button
              type="submit"
              className="btn btn-lg btn-block mt-2"
              disabled={busy || !q || Boolean(quote.error) || (loaded && !paymentsEnabled)}
            >
              {busy ? <Spinner /> : <Lock size={18} aria-hidden="true" />}
              {submit.state === 'redirecting' ? 'Redirecting to Stripe…' : `Pay securely${q ? ` ${money(q.total, q.currency)}` : ''}`}
            </button>
            <p className="stripe-badge"><ShieldCheck size={16} aria-hidden="true" /> You’ll complete payment on Stripe’s secure checkout. We never see or store your card details.</p>
          </aside>
        </form>
      </div>
    </section>
  );
}
