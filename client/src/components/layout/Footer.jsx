import { Link } from 'react-router-dom';
import { Clock, HandHeart, Mail, MapPin, Phone } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { SocialIcon } from '../ui/Icon.jsx';
import { church, ministries, serviceSchedule, socialLinks } from '../../data/site.js';

const STORE_LINKS = [
  { to: '/store', label: 'All Products' },
  { to: '/store?category=t-shirts', label: 'T-Shirts' },
  { to: '/store?category=sweaters-hoodies', label: 'Sweaters & Hoodies' },
  { to: '/store?category=caps', label: 'Baseball Caps' },
  { to: '/store?category=bibles', label: 'Holy Bibles' },
  { to: '/cart', label: 'Your Cart' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <section className="footer-cta" aria-labelledby="footer-give-title">
        <div className="container">
          <div>
            <h2 id="footer-give-title">Partner with us in sharing God’s love</h2>
            <p>Your generosity fuels worship, outreach, missions and care for families.</p>
          </div>
          <Link to="/give" className="btn btn-gold btn-lg"><HandHeart size={20} aria-hidden="true" /> Give Today</Link>
        </div>
      </section>
      <div className="kente-band thin" aria-hidden="true" />

      <div className="container footer-main">
        <div className="footer-brand">
          <Logo />
          <p>{church.description}</p>
          <div className="social-links">
            {socialLinks.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`}>
                <SocialIcon id={s.id} />
              </a>
            ))}
          </div>
        </div>

        <nav aria-labelledby="footer-quick">
          <h3 id="footer-quick">Quick Links</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/ministries">Ministries</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/give">Donate</Link></li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-ministries">
          <h3 id="footer-ministries">Ministries</h3>
          <ul>
            {ministries.slice(0, 6).map((m) => (
              <li key={m.id}><Link to={`/ministries/${m.id}`}>{m.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-store">
          <h3 id="footer-store">Store</h3>
          <ul>
            {STORE_LINKS.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
          </ul>
        </nav>

        <div>
          <h3>Visit &amp; Contact</h3>
          <ul className="footer-contact">
            <li><MapPin size={17} aria-hidden="true" /><span>{church.addressLines.join(', ')}</span></li>
            <li><Phone size={17} aria-hidden="true" /><a href={`tel:${church.phone.replace(/[^\d+]/g, '')}`}>{church.phone}</a></li>
            <li><Mail size={17} aria-hidden="true" /><a href={`mailto:${church.email}`}>{church.email}</a></li>
            {serviceSchedule.map((s) => (
              <li key={s.day}><Clock size={17} aria-hidden="true" /><span>{s.day} {s.name} · {s.time}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <span>© {year} {church.name}. All rights reserved.</span>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/admin">Staff Login</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
