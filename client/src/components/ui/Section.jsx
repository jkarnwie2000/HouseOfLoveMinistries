import { Link } from 'react-router-dom';
import { useReveal } from '../../lib/hooks.js';

export function SectionHeading({ eyebrow, title, children, center = false, as: H = 'h2', id }) {
  return (
    <div className={`section-heading ${center ? 'center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <H id={id}>{title}</H>
      {children && <p className="lead" style={center ? { marginInline: 'auto' } : undefined}>{children}</p>}
    </div>
  );
}

export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  );
}

export function PageHero({ eyebrow, title, children, crumbs = [], image }) {
  return (
    <header className="page-hero">
      {image && <img className="page-hero-img" src={image} alt="" aria-hidden="true" onError={(e) => e.currentTarget.remove()} />}
      <div className="container">
        {crumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link to="/">Home</Link></li>
              {crumbs.map((c, i) => (
                <li key={c.label} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                  {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : c.label}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {children && <p className="lead">{children}</p>}
      </div>
    </header>
  );
}
