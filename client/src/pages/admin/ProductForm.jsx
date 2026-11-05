import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Plus, Save, X } from 'lucide-react';
import Field from '../../components/ui/Field.jsx';
import ProductArt from '../../components/store/ProductArt.jsx';
import { Alert, ErrorState, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = {
  name: '', description: '', price: '', category: '', image: '', sizes: '', colors: [{ name: 'Burgundy', hex: '#6B1E2E' }],
  inventory: 0, active: true, featured: false,
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const request = useAdminRequest();
  const { notify } = useToast();
  const categories = useAdminData('/categories');
  const [values, setValues] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    request(`/products/${id}`)
      .then((p) => setValues({ ...p, price: (p.price / 100).toFixed(2), sizes: (p.sizes || []).join(', '), colors: p.colors || [] }))
      .catch(setLoadError)
      .finally(() => setLoading(false));
  }, [id, isNew, request]);

  useEffect(() => {
    if (isNew && !values.category && categories.data?.[0]) setValues((v) => ({ ...v, category: categories.data[0].id }));
  }, [categories.data, isNew, values.category]);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setColor = (i, k, val) => setValues((v) => ({ ...v, colors: v.colors.map((c, j) => (j === i ? { ...c, [k]: val } : c)) }));

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors((er) => ({ ...er, image: 'Images must be 5 MB or smaller.' })); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await request('/uploads', { method: 'POST', formData: fd });
      setValues((v) => ({ ...v, image: res.url }));
      setErrors((er) => ({ ...er, image: undefined }));
    } catch (err) {
      setErrors((er) => ({ ...er, image: err.message }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const price = Math.round(Number(values.price) * 100);
    const errs = {};
    if (values.name.trim().length < 2) errs.name = 'Please enter a product name.';
    if (!values.description.trim()) errs.description = 'Please enter a description.';
    if (!Number.isFinite(price) || price < 50) errs.price = 'Enter a price of at least $0.50.';
    if (!values.category) errs.category = 'Choose a category.';
    if (!(Number(values.inventory) >= 0)) errs.inventory = 'Inventory must be 0 or more.';
    values.colors.forEach((c, i) => { if (!c.name.trim()) errs[`colors.${i}.name`] = 'Name required'; });
    setErrors(errs);
    if (Object.keys(errs).length) { setStatus({ state: 'error', message: 'Please fix the highlighted fields.' }); return; }

    const body = {
      name: values.name, description: values.description, price, category: values.category, image: values.image || '',
      sizes: values.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: values.colors.filter((c) => c.name.trim()),
      inventory: Number(values.inventory), active: values.active, featured: values.featured,
    };
    setStatus({ state: 'loading', message: '' });
    try {
      const saved = await request(isNew ? '/products' : `/products/${id}`, { method: isNew ? 'POST' : 'PUT', body });
      notify(`${saved.name} saved.`);
      navigate('/admin/products');
    } catch (err) {
      setErrors(err.fieldErrors);
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (loading) return <Loading />;
  if (loadError) return <ErrorState error={loadError} />;

  return (
    <>
      <div className="admin-header">
        <div>
          <Link to="/admin/products" className="link-arrow small"><ArrowLeft size={16} aria-hidden="true" /> Products</Link>
          <h1>{isNew ? 'Add product' : 'Edit product'}</h1>
        </div>
        {!isNew && values.active && <a className="btn btn-outline btn-sm" href={`/store/${id}`} target="_blank" rel="noreferrer">View in store</a>}
      </div>
      <form onSubmit={onSubmit} noValidate className="admin-cols">
        <div>
          <div className="panel"><div className="panel-body form-grid">
            {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
            <Field label="Product name" required value={values.name} onChange={set('name')} error={errors.name} maxLength={120} />
            <Field label="Description" as="textarea" required rows={5} value={values.description} onChange={set('description')} error={errors.description} maxLength={2000} />
            <div className="form-row">
              <Field label="Price (USD)" required type="number" min="0.5" step="0.01" value={values.price} onChange={set('price')} error={errors.price} />
              <Field label="Inventory quantity" required type="number" min="0" step="1" value={values.inventory} onChange={set('inventory')} error={errors.inventory} />
              <Field label="Category" as="select" required value={values.category} onChange={set('category')} error={errors.category}>
                {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Field>
            </div>
            <Field label="Available sizes" value={values.sizes} onChange={set('sizes')} hint="Comma separated, e.g. S, M, L, XL. Leave empty for one-size items." />

            <div className="field">
              <span className="label">Available colors</span>
              <div className="color-rows">
                {values.colors.map((c, i) => (
                  <div className="color-row" key={i}>
                    <input className="input" aria-label={`Color ${i + 1} name`} value={c.name} onChange={(e) => setColor(i, 'name', e.target.value)} aria-invalid={errors[`colors.${i}.name`] ? 'true' : undefined} placeholder="Color name" maxLength={40} />
                    <input type="color" aria-label={`Color ${i + 1} value`} value={c.hex} onChange={(e) => setColor(i, 'hex', e.target.value.toUpperCase())} />
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setValues((v) => ({ ...v, colors: v.colors.filter((_, j) => j !== i) }))} aria-label={`Remove color ${c.name || i + 1}`}><X size={18} aria-hidden="true" /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline btn-sm mt-1" style={{ alignSelf: 'flex-start' }} onClick={() => setValues((v) => ({ ...v, colors: [...v.colors, { name: '', hex: '#C9A24B' }] }))}>
                <Plus size={15} aria-hidden="true" /> Add color
              </button>
            </div>

            <div className="toggle-row">
              <label className="checkbox"><input type="checkbox" checked={values.active} onChange={set('active')} /> <span><strong>Active</strong><br /><span className="small muted">Visible in the store</span></span></label>
              <label className="checkbox"><input type="checkbox" checked={values.featured} onChange={set('featured')} /> <span><strong>Featured</strong><br /><span className="small muted">Shown on the home page</span></span></label>
            </div>
          </div></div>
        </div>

        <div>
          <div className="panel">
            <div className="panel-head"><h2>Product image</h2></div>
            <div className="panel-body form-grid">
              <div className="preview" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <ProductArt product={{ ...values, category: values.category }} colorHex={values.colors[0]?.hex} />
              </div>
              <label className="btn btn-outline btn-block" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? <Spinner /> : <ImagePlus size={18} aria-hidden="true" />} {uploading ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} className="visually-hidden" disabled={uploading} />
              </label>
              <Field label="…or image URL" value={values.image} onChange={set('image')} error={errors.image} hint="JPG/PNG/WebP up to 5 MB, or an https:// link. Leave empty to show an illustration." />
              {values.image && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setValues((v) => ({ ...v, image: '' }))}>Remove image</button>}
            </div>
          </div>
          <button type="submit" className="btn btn-lg btn-block" disabled={status.state === 'loading' || uploading}>
            {status.state === 'loading' ? <Spinner /> : <Save size={18} aria-hidden="true" />} {isNew ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  );
}
