import { Link } from 'react-router-dom';

/** Heart-and-cross crest. PLACEHOLDER mark – replace with the ministry's official logo when available. */
export function LogoMark({ className = 'brand-mark', title }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="32" cy="32" r="31" fill="#6B1E2E" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#C9A24B" strokeWidth="1.4" strokeDasharray="2.6 2.6" />
      <path d="M32 49C20 40 14 34 14 26.5 14 21 18 17 23 17c3.6 0 6.8 2 9 5.2C34.2 19 37.4 17 41 17c5 0 9 4 9 9.5C50 34 44 40 32 49z" fill="#C9A24B" />
      <path d="M30.2 22h3.6v7h6v3.6h-6V42h-3.6v-9.4h-6V29h6z" fill="#6B1E2E" />
    </svg>
  );
}

export default function Logo({ to = '/', onClick, className = '' }) {
  return (
    <Link to={to} className={`brand ${className}`} onClick={onClick} aria-label="House of Love International Ministries – home">
      <LogoMark />
      <span className="brand-text">
        <span className="brand-name">House of Love</span>
        <span className="brand-sub">International Ministries</span>
      </span>
    </Link>
  );
}
