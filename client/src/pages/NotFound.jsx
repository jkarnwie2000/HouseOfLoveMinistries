import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { usePageMeta } from '../lib/hooks.js';

export default function NotFound() {
  usePageMeta('Page Not Found');
  return (
    <section className="section">
      <div className="container text-center">
        <div className="state-icon icon-circle" style={{ margin: '0 auto 1.5rem', width: 80, height: 80 }}><Compass size={36} aria-hidden="true" /></div>
        <h1>Page not found</h1>
        <p className="lead" style={{ marginInline: 'auto' }}>Sorry, we couldn’t find the page you were looking for. It may have moved or no longer exists.</p>
        <div className="btn-row mt-3" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn">Go to home</Link>
          <Link to="/contact" className="btn btn-outline">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
