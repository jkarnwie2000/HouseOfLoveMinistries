import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import { PageHero } from '../../components/ui/Section.jsx';
import ProductCard, { ProductCardSkeleton } from '../../components/store/ProductCard.jsx';
import { EmptyState, ErrorState, Placeholder } from '../../components/ui/Feedback.jsx';
import { useApi, useDebounced, usePageMeta } from '../../lib/hooks.js';

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name: A–Z' },
];

export default function Store() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'featured';
  const [query, setQuery] = useState(params.get('q') || '');
  const debounced = useDebounced(query.trim(), 300);

  const categories = useApi('/categories');
  const currentCat = categories.data?.find((c) => c.id === category);
  usePageMeta(
    currentCat ? `${currentCat.name} – House of Love Store` : 'House of Love Store',
    'Shop church-branded T-shirts, hoodies, caps, Holy Bibles and Christian key holders. Every purchase supports House of Love International Ministries.',
  );

  // Keep the search term in the URL so results are shareable.
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debounced) next.set('q', debounced); else next.delete('q');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const qs = new URLSearchParams();
  if (category !== 'all') qs.set('category', category);
  if (debounced) qs.set('q', debounced);
  qs.set('sort', sort);
  const products = useApi(`/products?${qs}`);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || (key === 'sort' && value === 'featured')) next.delete(key); else next.set(key, value);
    setParams(next);
  };
  const catName = (id) => categories.data?.find((c) => c.id === id)?.name;
  const totalCount = categories.data?.reduce((n, c) => n + c.productCount, 0);

  return (
    <>
      <PageHero eyebrow="House of Love Store" title="Wear your faith. Support the ministry." crumbs={[{ label: 'Store' }]}>
        Church-branded apparel, Holy Bibles and Christian gifts. Every purchase helps fund our outreach.
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />

      <section className="section-tight">
        <div className="container">
          <div className="store-toolbar">
            <div className="search-box">
              <Search size={18} aria-hidden="true" />
              <label htmlFor="store-search" className="visually-hidden">Search products</label>
              <input
                id="store-search"
                type="search"
                className="input"
                placeholder="Search T-shirts, Bibles, caps…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
              />
              {query && (
                <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div>
              <label htmlFor="store-sort" className="visually-hidden">Sort products</label>
              <select id="store-sort" className="select sort-select" value={sort} onChange={(e) => update('sort', e.target.value)}>
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-chips" role="group" aria-label="Filter by category">
            <button type="button" className="chip" aria-pressed={category === 'all'} onClick={() => update('category', 'all')}>
              All {totalCount != null && <span className="count">({totalCount})</span>}
            </button>
            {categories.data?.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => update('category', c.id)}>
                {c.name} <span className="count">({c.productCount})</span>
              </button>
            ))}
          </div>

          {currentCat && (
            <div className="category-banner mt-3">
              <strong>{currentCat.name}</strong>
              <p>{currentCat.description}</p>
            </div>
          )}

          <div className="store-meta" aria-live="polite">
            <span>
              {products.loading ? 'Loading products…' : `${products.data?.length ?? 0} product${products.data?.length === 1 ? '' : 's'}`}
              {debounced && !products.loading && <> for “{debounced}”</>}
            </span>
            <Placeholder>Product photos & prices are editable placeholders</Placeholder>
          </div>

          {products.error && <ErrorState error={products.error} onRetry={products.reload} />}
          {!products.loading && !products.error && products.data?.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="No products found"
              action={<button type="button" className="btn btn-outline btn-sm" onClick={() => { setQuery(''); setParams({}); }}>Clear filters</button>}
            >
              Try a different search term or category.
            </EmptyState>
          )}
          <div className="grid grid-4">
            {products.loading && !products.data && Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
            {products.data?.map((p) => <ProductCard key={p.id} product={p} categoryName={catName(p.category)} />)}
          </div>
        </div>
      </section>
    </>
  );
}
