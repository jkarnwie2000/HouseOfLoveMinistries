import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Target } from 'lucide-react';
import { PageHero, Reveal, SectionHeading } from '../components/ui/Section.jsx';
import Artwork from '../components/ui/Artwork.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Placeholder } from '../components/ui/Feedback.jsx';
import { usePageMeta } from '../lib/hooks.js';
import { beliefs, coreValues, history, leadership, ministries, mission, outreachHighlights, photos, vision } from '../data/site.js';

export default function About() {
  usePageMeta('About Us', 'Learn about the history, mission, vision, core values, beliefs and leadership of House of Love International Ministries.');

  return (
    <>
      <PageHero eyebrow="About us" title="Rooted in faith. Growing in love." crumbs={[{ label: 'About Us' }]}>
        Discover who we are, what we believe and the vision God has placed on our hearts.
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />

      <section className="section" aria-labelledby="history-title">
        <div className="container split">
          <Reveal>
            <span className="eyebrow">Our history</span>
            <h2 id="history-title">The story of House of Love</h2>
            <p className="mb-3"><Placeholder>Editable placeholder – the ministry will provide its official history</Placeholder></p>
            <div className="timeline">
              {history.map((h) => (
                <div className="timeline-item" key={h.label}>
                  <h3>{h.label}</h3>
                  <p>{h.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="split-media" delay={120}>
            <Artwork src={photos['about-history']} alt="House of Love church family" icon="Church" caption="History photo placeholder" />
          </Reveal>
        </div>
      </section>

      <section className="section bg-wine" aria-labelledby="mv-title">
        <div className="container">
          <h2 id="mv-title" className="visually-hidden">Mission and vision</h2>
          <div className="mv-grid">
            <Reveal className="mv-card">
              <span className="icon-circle"><Target size={26} aria-hidden="true" /></span>
              <span className="eyebrow">Our mission</span>
              <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>{mission}</p>
            </Reveal>
            <Reveal className="mv-card" delay={120}>
              <span className="icon-circle"><Compass size={26} aria-hidden="true" /></span>
              <span className="eyebrow">Our vision</span>
              <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>{vision}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <SectionHeading eyebrow="What guides us" title="Our Core Christian Values" center id="values-title" />
          <div className="grid grid-3">
            {coreValues.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 90}>
                <div className="card value-card">
                  <span className="icon-circle"><Icon name={v.icon} size={24} /></span>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ivory bg-pattern-soft" aria-labelledby="beliefs-title">
        <div className="container">
          <SectionHeading eyebrow="Statement of faith" title="What We Believe" id="beliefs-title">
            Our faith rests on the truth of God’s Word. <Placeholder>Please confirm against the ministry’s official doctrine</Placeholder>
          </SectionHeading>
          <div className="belief-list">
            {beliefs.map((b) => (
              <div className="belief" key={b.title}>
                <div><h3>{b.title}</h3><p>{b.text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="leaders-title">
        <div className="container">
          <SectionHeading eyebrow="Shepherds & servants" title="Leadership & Pastoral Team" center id="leaders-title">
            Our leaders serve the church family with humility, prayer and love.
          </SectionHeading>
          <p className="text-center mb-3"><Placeholder>Leadership names, photos and biographies to be provided by the ministry</Placeholder></p>
          <div className="grid grid-4">
            {leadership.map((l, i) => (
              <Reveal key={l.id} delay={i * 80}>
                <article className="card leader-card">
                  <Artwork src={photos[`leader-${l.id}`]} alt={`${l.role} portrait`} icon="Users" tone={i % 2 ? 'charcoal' : 'wine'} caption="Portrait placeholder" />
                  <div className="card-body">
                    <h3>{l.name}</h3>
                    <div className="role">{l.role}</div>
                    <p className="small muted mt-1 mb-0">{l.bio}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ivory" aria-labelledby="community-title">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Our community" title="Church Life & Outreach" id="community-title">
              Through our ministries and outreach, we live out the love of Christ every day of the week.
            </SectionHeading>
            <Link to="/ministries" className="btn btn-outline">Explore ministries <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="grid grid-3">
            {outreachHighlights.map((o) => (
              <div className="card value-card" key={o.id}>
                <span className="icon-circle gold"><Icon name={o.icon} size={24} /></span>
                <h3>{o.title}</h3>
                <p>{o.text}</p>
              </div>
            ))}
          </div>
          <div className="btn-row mt-4" style={{ justifyContent: 'center' }}>
            {ministries.map((m) => <Link key={m.id} to={`/ministries/${m.id}`} className="chip">{m.name}</Link>)}
          </div>
        </div>
      </section>
    </>
  );
}
