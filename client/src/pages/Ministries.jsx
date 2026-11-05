import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Clock, Mail } from 'lucide-react';
import { PageHero, Reveal, SectionHeading } from '../components/ui/Section.jsx';
import MinistryCard from '../components/MinistryCard.jsx';
import Artwork from '../components/ui/Artwork.jsx';
import { usePageMeta } from '../lib/hooks.js';
import { ministries, photos } from '../data/site.js';
import NotFound from './NotFound.jsx';

export default function Ministries() {
  usePageMeta('Ministries', 'Explore the ministries of House of Love International Ministries: worship and prayer, youth, women, men, children, community outreach, evangelism and missions, and Bible study.');
  return (
    <>
      <PageHero eyebrow="Ministries" title="Find your place to belong and serve" crumbs={[{ label: 'Ministries' }]}>
        Every member is gifted by God for a purpose. Explore our ministries and discover where you can grow and serve.
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />
      <section className="section" aria-label="All ministries">
        <div className="container">
          <div className="grid grid-4">
            {ministries.map((m, i) => (
              <Reveal key={m.id} delay={(i % 4) * 80}><MinistryCard ministry={m} showMeta /></Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section-tight bg-ivory text-center" aria-labelledby="serve-title">
        <div className="container container-narrow">
          <SectionHeading eyebrow="Serve with us" title="Ready to get involved?" center id="serve-title">
            Tell us which ministry interests you and a leader will reach out to help you take the next step.
          </SectionHeading>
          <Link to="/contact?subject=Joining%20a%20ministry" className="btn btn-lg">Contact us</Link>
        </div>
      </section>
    </>
  );
}

export function MinistryDetail() {
  const { slug } = useParams();
  const ministry = ministries.find((m) => m.id === slug);
  usePageMeta(ministry?.name || 'Ministry not found', ministry?.summary);
  if (!ministry) return <NotFound />;
  const others = ministries.filter((m) => m.id !== ministry.id).slice(0, 3);

  return (
    <>
      <PageHero eyebrow="Ministry" title={ministry.name} crumbs={[{ label: 'Ministries', to: '/ministries' }, { label: ministry.name }]}>
        {ministry.summary}
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />
      <section className="section">
        <div className="container detail-grid">
          <div>
            <Artwork
              src={photos[`ministry-${ministry.id}`]}
              alt={`${ministry.name} at House of Love`}
              icon={ministry.icon}
              tone={ministry.tone}
              style={{ aspectRatio: '16 / 9', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}
            />
            <h2>About this ministry</h2>
            <p className="lead">{ministry.description}</p>
            <h3 className="mt-3">What we do</h3>
            <ul className="check-list">
              {ministry.activities.map((a) => <li key={a}><Check size={20} aria-hidden="true" /> {a}</li>)}
            </ul>
            <Link to="/ministries" className="link-arrow"><ArrowLeft size={18} aria-hidden="true" /> All ministries</Link>
          </div>
          <aside className="detail-aside">
            <div className="card card-body">
              <h3>Get involved</h3>
              <ul className="info-list">
                <li><Clock size={20} aria-hidden="true" /><div><strong>When we meet</strong>{ministry.meets}</div></li>
                <li><CalendarDays size={20} aria-hidden="true" /><div><strong>Upcoming gatherings</strong><Link to="/events">See the events calendar</Link></div></li>
                <li><Mail size={20} aria-hidden="true" /><div><strong>Questions?</strong>We would love to hear from you.</div></li>
              </ul>
              <Link to={`/contact?subject=${encodeURIComponent(`${ministry.name} – I’d like to get involved`)}`} className="btn btn-block mt-3">I’d like to join</Link>
            </div>
            <div className="card card-body bg-ivory">
              <h3 style={{ fontSize: '1.3rem' }}>Support this ministry</h3>
              <p className="small muted">Your generosity equips our ministries to serve more people.</p>
              <Link to="/give" className="btn btn-gold btn-block">Give Today</Link>
            </div>
          </aside>
        </div>
      </section>
      <section className="section-tight bg-ivory" aria-labelledby="more-title">
        <div className="container">
          <h2 id="more-title" className="mb-3">More ministries</h2>
          <div className="grid grid-3">
            {others.map((m) => <MinistryCard key={m.id} ministry={m} />)}
          </div>
        </div>
      </section>
    </>
  );
}
