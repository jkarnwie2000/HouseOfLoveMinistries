import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarHeart, HandHeart, Heart, Lock, Repeat, ShieldCheck } from 'lucide-react';
import { PageHero } from '../components/ui/Section.jsx';
import Field from '../components/ui/Field.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Alert, FieldError, Spinner } from '../components/ui/Feedback.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { api } from '../lib/api.js';
import { usePageMeta } from '../lib/hooks.js';
import { money } from '../lib/format.js';
import { email, focusFirstError, required, validateFields } from '../lib/validation.js';
import { donationDisclosure, givingImpact, photos } from '../data/site.js';

export default function Give() {
  usePageMeta('Support Our Ministry – Give Today', 'Give securely to House of Love International Ministries. One-time and monthly donations support worship, outreach, missions, youth and families.');
  const { donation: cfg, paymentsEnabled, loaded } = useConfig();
  const [params] = useSearchParams();
  const initialAmount = Number(params.get('amount'));
  const isPreset = cfg.presets.includes(initialAmount);

  const [frequency, setFrequency] = useState(params.get('frequency') === 'monthly' ? 'monthly' : 'one-time');
  const [preset, setPreset] = useState(isPreset ? initialAmount : initialAmount > 0 ? 'custom' : 50);
  const [custom, setCustom] = useState(!isPreset && initialAmount > 0 ? String(initialAmount) : '');
  const [values, setValues] = useState({ name: '', email: '', message: '', fund: 'general', anonymous: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const formRef = useRef(null);
  const canceled = params.get('donation') === 'canceled';

  const amount = preset === 'custom' ? Number(custom) : preset;
  const validAmount = Number.isFinite(amount) && amount >= cfg.minAmount && amount <= cfg.maxAmount;
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (status.state === 'loading' || status.state === 'redirecting') return;
    const errs = validateFields({ ...values, amount: preset === 'custom' ? custom : amount }, {
      amount: [
        [(v) => String(v).trim() !== '' && Number.isFinite(Number(v)), 'Please choose or enter an amount.'],
        [(v) => Number(v) >= cfg.minAmount, `The minimum gift is ${money(cfg.minAmount * 100)}.`],
        [(v) => Number(v) <= cfg.maxAmount, `For gifts above ${money(cfg.maxAmount * 100)}, please contact the church office.`],
        [(v) => /^\d+(\.\d{1,2})?$/.test(String(v).trim()), 'Use at most two decimal places.'],
      ],
      name: values.anonymous ? [] : [[(v) => v.trim().length >= 2, 'Please enter your full name, or choose to give anonymously.']],
      email: [required('Please enter your email address for your receipt.'), email()],
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus({ state: 'error', message: 'Please correct the highlighted fields.' });
      return focusFirstError(formRef.current);
    }
    setStatus({ state: 'loading', message: '' });
    try {
      const res = await api('/donations/session', {
        method: 'POST',
        body: { amount: Number(amount), frequency, fund: values.fund, anonymous: values.anonymous, name: values.anonymous ? '' : values.name, email: values.email, message: values.message },
      });
      setStatus({ state: 'redirecting', message: '' });
      window.location.assign(res.url);
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setStatus({ state: 'error', message: err.message });
    }
  }

  const busy = status.state === 'loading' || status.state === 'redirecting';

  return (
    <>
      <PageHero eyebrow="Give" title="Support Our Ministry – Give Today" crumbs={[{ label: 'Give' }]} image={photos['give-hero']}>
        “Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.” – 2 Corinthians 9:7
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />

      <section className="section bg-ivory">
        <div className="container give-layout">
          <div>
            <span className="eyebrow">Your generosity at work</span>
            <h2>Every gift helps share the love of Christ</h2>
            <p className="lead">
              House of Love International Ministries is sustained by the faithful generosity of people like you. Your
              donation – whether once or every month – directly strengthens our church and the communities we serve.
            </p>
            <ul className="impact-list">
              {givingImpact.map((g) => (
                <li key={g.title}>
                  <span className="icon-circle"><Icon name={g.icon} size={20} /></span>
                  <div><strong>{g.title}</strong><span>{g.text}</span></div>
                </li>
              ))}
            </ul>
            <div className="card card-body">
              <h3 className="flex items-center gap-1" style={{ fontSize: '1.35rem' }}><Repeat size={20} aria-hidden="true" color="var(--gold-600)" /> Become a monthly partner</h3>
              <p className="muted mb-0">Monthly gifts give our ministries steady, reliable support to plan ahead. You can change or cancel at any time by contacting the church office.</p>
            </div>
          </div>

          <div className="card give-card">
            <h2 style={{ fontSize: '2rem' }}>Make a donation</h2>
            {canceled && <div className="mb-2"><Alert type="info" title="Donation canceled">Your donation was not completed and you have not been charged.</Alert></div>}
            {loaded && !paymentsEnabled && <div className="mb-2"><Alert type="error" title="Online giving is not available yet">Please contact the church office to give.</Alert></div>}

            <form ref={formRef} className="form-grid" onSubmit={onSubmit} noValidate>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="visually-hidden">Donation frequency</legend>
                <div className="segmented">
                  <label>
                    <input type="radio" name="frequency" value="one-time" checked={frequency === 'one-time'} onChange={() => setFrequency('one-time')} />
                    <span><Heart size={16} aria-hidden="true" /> One-time</span>
                  </label>
                  <label>
                    <input type="radio" name="frequency" value="monthly" checked={frequency === 'monthly'} onChange={() => setFrequency('monthly')} />
                    <span><CalendarHeart size={16} aria-hidden="true" /> Monthly</span>
                  </label>
                </div>
              </fieldset>

              <fieldset style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={errors.amount ? 'amount-err' : undefined}>
                <legend className="label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>Choose an amount</legend>
                <div className="amount-grid">
                  {cfg.presets.map((a) => (
                    <label key={a} className="amount-option">
                      <input type="radio" name="amount" value={a} checked={preset === a} onChange={() => { setPreset(a); setErrors((er) => ({ ...er, amount: undefined })); }} />
                      <span>${a}</span>
                    </label>
                  ))}
                </div>
                <div className="field mt-2">
                  <label htmlFor="custom-amount">Or enter a custom amount</label>
                  <div className="custom-amount">
                    <span className="currency" aria-hidden="true">$</span>
                    <input
                      id="custom-amount"
                      className="input"
                      type="number"
                      inputMode="decimal"
                      min={cfg.minAmount}
                      max={cfg.maxAmount}
                      step="0.01"
                      placeholder="Other amount"
                      value={custom}
                      aria-invalid={errors.amount && preset === 'custom' ? 'true' : undefined}
                      onFocus={() => setPreset('custom')}
                      onChange={(e) => { setCustom(e.target.value); setPreset('custom'); setErrors((er) => ({ ...er, amount: undefined })); }}
                    />
                  </div>
                </div>
                <FieldError id="amount-err" message={errors.amount} />
              </fieldset>

              <Field label="Designate my gift to" as="select" value={values.fund} onChange={set('fund')}>
                {cfg.funds.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </Field>

              <label className="checkbox">
                <input type="checkbox" checked={values.anonymous} onChange={set('anonymous')} />
                <span><strong>Give anonymously</strong><br /><span className="small muted">Your name will not be recorded with this gift. We still need your email to send your receipt.</span></span>
              </label>

              {!values.anonymous && (
                <Field label="Full name" required value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={120} />
              )}
              <Field label="Email" type="email" required value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" hint="We’ll send your donation receipt here." />
              <Field label="Message or prayer request (optional)" as="textarea" rows={3} value={values.message} onChange={set('message')} maxLength={500} style={{ minHeight: 90 }} />

              <div className="give-summary" aria-live="polite">
                <span>{frequency === 'monthly' ? 'Your monthly gift' : 'Your gift'}</span>
                <strong>{validAmount ? money(Math.round(amount * 100)) : '—'}{frequency === 'monthly' && validAmount && <small style={{ fontSize: '1rem' }}>/mo</small>}</strong>
              </div>

              {status.state === 'error' && <Alert type="error">{status.message}</Alert>}

              <button type="submit" className="btn btn-gold btn-lg btn-block" disabled={busy || (loaded && !paymentsEnabled)}>
                {busy ? <Spinner /> : <HandHeart size={20} aria-hidden="true" />}
                {status.state === 'redirecting' ? 'Redirecting to secure payment…' : frequency === 'monthly' ? 'Give monthly' : 'Give now'}
              </button>
              <p className="secure-note"><Lock size={14} aria-hidden="true" /> Secure payment by Stripe. <ShieldCheck size={14} aria-hidden="true" /> We never store your card details.</p>
              <p className="disclosure">{donationDisclosure} <Link to="/terms#donations">Donation terms</Link>.</p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
