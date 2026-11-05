import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Clock, HandHeart, Mail, Menu, ShoppingBag, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { church, serviceSchedule } from '../../data/site.js';

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/events', label: 'Events' },
  { to: '/store', label: 'Store' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector('a,button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && drawerRef.current) {
        const els = [...drawerRef.current.querySelectorAll('a,button')];
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const toggle = toggleRef.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      toggle?.focus();
    };
  }, [open]);

  const sunday = serviceSchedule[0];

  return (
    <>
      <div className="topbar">
        <div className="container">
          <div className="topbar-info">
            <span><Clock size={14} aria-hidden="true" /> {sunday.day} {sunday.name}: {sunday.time}</span>
            <span><Mail size={14} aria-hidden="true" /> {church.email}</span>
          </div>
          <Link to="/give">Give Today →</Link>
        </div>
      </div>

      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <Logo />
          <nav className="main-nav" aria-label="Main">
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.to}><NavLink to={l.to} end={l.end}>{l.label}</NavLink></li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            <Link to="/cart" className="cart-link" aria-label={`Shopping cart, ${count} item${count === 1 ? '' : 's'}`}>
              <ShoppingBag size={21} aria-hidden="true" />
              {count > 0 && <span className="cart-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
            </Link>
            <Link to="/give" className="btn btn-gold header-give">
              <HandHeart size={18} aria-hidden="true" /> Donate Now
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={26} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="drawer" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" ref={drawerRef}>
            <div className="drawer-head">
              <Logo />
              <button type="button" className="menu-toggle" style={{ display: 'grid' }} onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={26} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile">
              <ul>
                {NAV_LINKS.map((l) => (
                  <li key={l.to}>
                    <NavLink to={l.to} end={l.end}>{l.label} <ChevronRight size={18} aria-hidden="true" /></NavLink>
                  </li>
                ))}
                <li><NavLink to="/cart">Cart {count > 0 ? `(${count})` : ''} <ChevronRight size={18} aria-hidden="true" /></NavLink></li>
              </ul>
            </nav>
            <div className="drawer-foot">
              <Link to="/give" className="btn btn-gold btn-block"><HandHeart size={18} aria-hidden="true" /> Donate Now</Link>
              <Link to="/events" className="btn btn-outline btn-block">Join Us in Worship</Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
