import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductArt from './ProductArt.jsx';
import { money } from '../../lib/format.js';

export function AvailabilityBadge({ availability, inventory }) {
  if (availability === 'out_of_stock') return <span className="badge badge-error">Sold out</span>;
  if (availability === 'low_stock') return <span className="badge badge-warning">Only {inventory} left</span>;
  return null;
}

export default function ProductCard({ product, categoryName }) {
  return (
    <Link to={`/store/${product.id}`} className="card card-hover product-card" aria-label={`${product.name}, ${money(product.price)}`}>
      <div style={{ position: 'relative' }}>
        <div className="product-badges">
          {product.featured && <span className="badge badge-gold">Featured</span>}
          <AvailabilityBadge availability={product.availability} inventory={product.inventory} />
        </div>
        <ProductArt product={product} />
      </div>
      <div className="card-body">
        <span className="category">{categoryName || product.category}</span>
        <h3>{product.name}</h3>
        {product.colors?.length > 0 && (
          <div className="swatches" aria-label={`Available colors: ${product.colors.map((c) => c.name).join(', ')}`}>
            {product.colors.map((c) => <span key={c.name} className="swatch-dot" style={{ background: c.hex }} title={c.name} />)}
          </div>
        )}
        <div className="row">
          <span className="price">{money(product.price)}</span>
          <span className="link-arrow small" aria-hidden="true">
            {product.availability === 'out_of_stock' ? 'View' : 'Choose options'} <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 0 }} />
      <div className="card-body">
        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 22, width: '80%', marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 18, width: '30%' }} />
      </div>
    </div>
  );
}
