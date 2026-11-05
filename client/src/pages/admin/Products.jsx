import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import ProductArt from '../../components/store/ProductArt.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { money } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Products() {
  const { data, loading, error, reload } = useAdminData('/products');
  const categories = useAdminData('/categories');
  const request = useAdminRequest();
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [actionError, setActionError] = useState('');

  async function remove(p) {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone. Tip: set it to inactive instead to hide it from the store.`)) return;
    try {
      await request(`/products/${p.id}`, { method: 'DELETE' });
      notify(`Deleted ${p.name}.`);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  const catName = (id) => categories.data?.find((c) => c.id === id)?.name || id;
  const rows = (data || []).filter((p) =>
    (cat === 'all' || p.category === cat) && (!q || `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <div className="admin-header">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn"><Plus size={18} aria-hidden="true" /> Add product</Link>
      </div>
      {actionError && <div className="mb-2"><Alert type="error">{actionError}</Alert></div>}
      <div className="panel">
        <div className="panel-head">
          <div className="filters">
            <div className="search-box">
              <Search size={16} aria-hidden="true" />
              <label htmlFor="admin-product-search" className="visually-hidden">Search products</label>
              <input id="admin-product-search" className="input" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <label htmlFor="admin-product-cat" className="visually-hidden">Category</label>
            <select id="admin-product-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <span className="small muted">{rows.length} product(s)</span>
        </div>
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && rows.length === 0 && <EmptyState title="No products found" />}
        {rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="thumb"><ProductArt product={p} /></span>
                        <Link to={`/admin/products/${p.id}`}>{p.name}</Link>
                      </div>
                    </td>
                    <td>{catName(p.category)}</td>
                    <td className="num">{money(p.price)}</td>
                    <td className="num">{p.inventory <= 5 ? <span className="badge badge-warning">{p.inventory}</span> : p.inventory}</td>
                    <td>
                      <span className={`badge ${p.active ? 'badge-success' : ''}`}>{p.active ? 'Active' : 'Hidden'}</span>{' '}
                      {p.featured && <span className="badge badge-gold">Featured</span>}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/admin/products/${p.id}`} className="btn btn-ghost btn-sm" aria-label={`Edit ${p.name}`}><Pencil size={15} aria-hidden="true" /></Link>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={15} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
