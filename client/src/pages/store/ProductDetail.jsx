import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HandHeart, Lock, ShoppingBag, Truck } from 'lucide-react';
import ProductArt from '../../components/store/ProductArt.jsx';
import QtyStepper from '../../components/store/QtyStepper.jsx';
import { AvailabilityBadge } from '../../components/store/ProductCard.jsx';
import { Alert, ErrorState, FieldError, Loading } from '../../components/ui/Feedback.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi, usePageMeta } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import NotFound from '../NotFound.jsx';

export default function ProductDetail() {
  const { productId } = useParams();
  const { data: product, loading, error, reload } = useApi(`/products/${encodeURIComponent(productId)}`);
  const categories = useApi('/categories');
  const { addItem, items } = useCart();
  const { notify } = useToast();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState({});

  usePageMeta(product?.name || 'Product', product?.description?.slice(0, 155));

  useEffect(() => {
    if (product) {
      setColor(product.colors?.[0]?.name || '');
      setSize('');
      setQty(1);
    }
  }, [product]);

  if (loading) return <div className="section"><Loading label="Loading product…" /></div>;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="section container"><ErrorState error={error} onRetry={reload} /></div>;

  const category = categories.data?.find((c) => c.id === product.category);
  const inCart = items.filter((i) => i.productId === product.id).reduce((n, i) => n + i.quantity, 0);
  const remaining = Math.max(0, product.inventory - inCart);
  const soldOut = product.availability === 'out_of_stock';
  const selectedHex = product.colors.find((c) => c.name === color)?.hex;

  function onAdd(e) {
    e.preventDefault();
    const errs = {};
    if (product.sizes.length && !size) errs.size = 'Please choose a size.';
    if (product.colors.length && !color) errs.color = 'Please choose a color.';
    if (qty > remaining) errs.qty = remaining > 0 ? `Only ${remaining} more available.` : 'You already have all available stock in your cart.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    addItem(product, { size, color, quantity: qty });
    notify(`${qty} × ${product.name} added to your cart.`, { link: { to: '/cart', label: 'View cart & checkout →' } });
    setQty(1);
  }

  return (
    <section className="section-tight">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/store">Store</Link></li>
            {category && <li><Link to={`/store?category=${category.id}`}>{category.name}</Link></li>}
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="product-detail">
          <div className="product-gallery">
            <ProductArt product={product} colorHex={selectedHex} showCaption={!product.image} />
          </div>

          <div className="product-info">
            <span className="eyebrow">{category?.name || product.category}</span>
            <h1>{product.name}</h1>
            <div className="flex items-center gap-2 wrap mb-2">
              <span className="product-price mb-0">{money(product.price)}</span>
              <AvailabilityBadge availability={product.availability} inventory={product.inventory} />
              {!soldOut && product.availability === 'in_stock' && <span className="badge badge-success">In stock</span>}
            </div>
            <p className="description">{product.description}</p>

            <form onSubmit={onAdd} noValidate className="mt-3">
              {product.colors.length > 0 && (
                <fieldset className="option-group" aria-describedby={errors.color ? 'err-color' : undefined}>
                  <legend>Color: <span className="selected">{color || 'choose one'}</span></legend>
                  <div className="option-list">
                    {product.colors.map((c) => (
                      <label key={c.name} className="swatch-option" title={c.name}>
                        <input type="radio" name="color" value={c.name} checked={color === c.name} onChange={() => setColor(c.name)} />
                        <span style={{ background: c.hex }} />
                        <span className="visually-hidden">{c.name}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="err-color" message={errors.color} />
                </fieldset>
              )}

              {product.sizes.length > 0 && (
                <fieldset className="option-group" aria-describedby={errors.size ? 'err-size' : undefined}>
                  <legend>Size: <span className="selected">{size || 'choose one'}</span></legend>
                  <div className="option-list">
                    {product.sizes.map((s) => (
                      <label key={s} className="option-pill">
                        <input type="radio" name="size" value={s} checked={size === s} onChange={() => { setSize(s); setErrors((er) => ({ ...er, size: undefined })); }} />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="err-size" message={errors.size} />
                </fieldset>
              )}

              <div className="option-group">
                <span className="label" style={{ fontWeight: 800, display: 'block', marginBottom: 8, fontSize: '0.92rem' }}>Quantity</span>
                <QtyStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(20, remaining))} />
                <FieldError id="err-qty" message={errors.qty} />
              </div>

              {soldOut ? (
                <Alert type="info">This item is currently sold out. Please check back soon.</Alert>
              ) : (
                <div className="add-row">
                  <button type="submit" className="btn btn-lg" disabled={remaining === 0}>
                    <ShoppingBag size={20} aria-hidden="true" /> Add to cart – {money(product.price * qty)}
                  </button>
                  {inCart > 0 && <Link to="/cart" className="btn btn-outline btn-lg">View cart ({inCart})</Link>}
                </div>
              )}
            </form>

            <ul className="perks">
              <li><Truck size={18} aria-hidden="true" /> Free standard shipping on orders of $75+, or pick up at church</li>
              <li><Lock size={18} aria-hidden="true" /> Secure checkout powered by Stripe</li>
              <li><HandHeart size={18} aria-hidden="true" /> Proceeds support House of Love ministries and outreach</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
