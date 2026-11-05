import { Minus, Plus } from 'lucide-react';

export default function QtyStepper({ value, onChange, min = 1, max = 20, label = 'Quantity', size }) {
  const lower = label.charAt(0).toLowerCase() + label.slice(1);
  const set = (n) => onChange(Math.max(min, Math.min(max, Number.isFinite(n) ? n : min)));
  return (
    <div className={`qty-stepper ${size === 'sm' ? 'sm' : ''}`} role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Decrease ${lower}`}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => set(parseInt(e.target.value, 10))}
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={`Increase ${lower}`}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
