import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronDown, Clock, Compass, HandHeart, Heart, Mail, Target, Users } from 'lucide-react';
import Artwork from '../components/ui/Artwork.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Reveal, SectionHeading } from '../components/ui/Section.jsx';
import { ErrorState, Placeholder } from '../components/ui/Feedback.jsx';
import MinistryCard from '../components/MinistryCard.jsx';
import EventCard from '../components/EventCard.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/store/ProductCard.jsx';
import NewsletterForm from '../components/NewsletterForm.jsx';
import { useApi, usePageMeta } from '../lib/hooks.js';
import { coreValues, ministries, mission, outreachHighlights, photos, serviceSchedule, vision } from '../data/site.js';

function HeroSeal() {
  return (
    <div className="hero-seal" aria-hidden="true">
      <svg viewBox="0 0 300 300">
        <defs>
          <path id="seal-circle" d="M150 150m-118 0a118 118 0 1 1 236 0a118 118 0 1 1-236 0" />
        </defs>
        <circle cx="150" cy="150" r="146" fill="rgba(248,241,228,0.04)" stroke="rgba(232,210,154,0.35)" />
        <g className="spin-slow">
          <text fill="#E8D29A" fontSize="15" fontWeight="700" letterSpacing="5.2" fontFamily="Manrope, sans-serif">
            <textPath href="#seal-circle">HOUSE OF LOVE · FAITH · HOPE · LOVE · UNITY · SERVICE ·</textPath>
          </text>
        </g>
        <circle cx="150" cy="150" r="96" fill="#6B1E2E" stroke="#C9A24B" strokeWidth="2" />
        <circle cx="150" cy="150" r="86" fill="none" stroke="#C9A24B" strokeWidth="1" strokeDasharray="4 5" />
        <path d="M150 207c-36-26-54-44-54-67 0-17 12-30 28-30 11 0 20 6 26 15 6-9 15-15 26-15 16 0 28 13 28 30 0 23-18 41-54 67z" fill="#C9A24B" />
        <path d="M144 124h12v22h20v12h-20v32h-12v-32h-20v-12h20z" fill="#6B1E2E" />
      </svg>
    </div>
  );
}

export default function Home() {
  usePageMeta(null, 'House of Love International Ministries – a Christian church family rooted in faith, African heritage and love for our community. Join us in worship, shop the House of Love Store, or give today.');
  const events = useApi('/events?limit=3');
  const products = useApi('/products?featured=true');
  const categories = useApi('/categories');
  const catName = (id) => categories.data?.find((c) => c.id === id)?.name;

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media">
          {photos.hero ? <img src={photos.hero} alt="" fetchpriority="high" /> : <div className="hero-fallback" />}
        </div>
        <div className="container hero-content">
          <div>
            <span className="eyebrow hero-eyebrow">Welcome Home</span>
            <h1 id="hero-title">A house built on <em>love</em>, rooted in faith.</h1>
            <p className="lead">
              We are a Christ-centred church family celebrating our African heritage and welcoming people of every nation.
              Come worship, grow and serve with us.
            </p>
            <div className="btn-row">
              <Link to="/events#sunday-worship" className="btn btn-gold btn-lg">
                <Users size={20} aria-hidden="true" /> Join Us in Worship
              </Link>
              <Link to="/give" className="btn btn-outline-light btn-lg">
                <HandHeart size={20} aria-hidden="true" /> Donate Now
              </Link>
            </div>
            <div className="hero-times">
              {serviceSchedule.map((s) => (
                <div className="hero-time" key={s.day}>
                  <Clock size={20} aria-hidden="true" />
                  <div><strong>{s.day} · {s.time}</strong><span>{s.name}</span></div>
                </div>
              ))}
            </div>
          </div>
          <HeroSeal />
        </div>
        {!photos.hero && <div className="hero-photo-tag"><Placeholder>Hero photo placeholder</Placeholder></div>}
        <a href="#welcome" className="hero-scroll" aria-label="Scroll to welcome section"><ChevronDown size={28} aria-hidden="true" /></a>
      </section>
      <div className="kente-band" aria-hidden="true" />

      {/* ---------------- Welcome ---------------- */}
      <section className="section" id="welcome" aria-labelledby="welcome-title">
        <div className="container split">
          <Reveal className="split-media">
            <Artwork src={photos.welcome} alt="Church members gathered in fellowship" icon="Users" caption="Fellowship photo placeholder" />
            <div className="split-media-badge">
              <span className="icon-circle gold"><Heart size={24} aria-hidden="true" /></span>
              <div><strong>Everyone is welcome</strong><div className="small muted">Come as you are</div></div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow">Who we are</span>
            <h2 id="welcome-title">A family of faith, love and belonging</h2>
            <p className="lead">
              House of Love International Ministries is a Bible-believing Christian church where African heritage and the
              Gospel of Jesus Christ meet in joyful worship, genuine fellowship and practical love for our neighbours.
            </p>
            <ul className="check-list">
              <li><Check size={20} aria-hidden="true" /> Spirit-filled, multicultural worship</li>
              <li><Check size={20} aria-hidden="true" /> Biblical teaching for every stage of life</li>
              <li><Check size={20} aria-hidden="true" /> Ministries for children, youth, women and men</li>
              <li><Check size={20} aria-hidden="true" /> Compassionate outreach in our community and beyond</li>
            </ul>
            <div className="btn-row">
              <Link to="/about" className="btn">Our Story <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/contact" className="btn btn-ghost">Plan a visit</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Mission & Vision ---------------- */}
      <section className="section bg-wine" aria-labelledby="mv-title">
        <div className="container">
          <SectionHeading eyebrow="Why we exist" title="Our Mission & Vision" center id="mv-title" />
          <div className="mv-grid">
            <Reveal className="mv-card">
              <span className="icon-circle"><Target size={26} aria-hidden="true" /></span>
              <h3>Our Mission</h3>
              <p>{mission}</p>
            </Reveal>
            <Reveal className="mv-card" delay={120}>
              <span className="icon-circle"><Compass size={26} aria-hidden="true" /></span>
              <h3>Our Vision</h3>
              <p>{vision}</p>
            </Reveal>
          </div>
          <div className="values-strip">
            {coreValues.map((v) => <span key={v.title}>{v.title}</span>)}
          </div>
        </div>
      </section>

      {/* ---------------- Ministries ---------------- */}
      <section className="section" aria-labelledby="ministries-title">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Get connected" title="Featured Ministries" id="ministries-title">
              There is a place for everyone to belong, grow and serve.
            </SectionHeading>
            <Link to="/ministries" className="btn btn-outline">All ministries <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="grid grid-4">
            {ministries.slice(0, 4).map((m, i) => (
              <Reveal key={m.id} delay={i * 90}><MinistryCard ministry={m} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Scripture ---------------- */}
      <section className="section-tight bg-ivory bg-pattern-soft scripture" aria-label="Scripture">
        <div className="container">
          <Reveal as="figure" style={{ margin: 0 }}>
            <span className="quote-mark" aria-hidden="true">“</span>
            <blockquote>
              <p>Dear friends, let us love one another, for love comes from God. Everyone who loves has been born of God and knows God.</p>
            </blockquote>
            <figcaption><cite>1 John 4:7</cite></figcaption>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Events ---------------- */}
      <section className="section" aria-labelledby="events-title">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Join us" title="Upcoming Events" id="events-title">
              Worship, learn and serve alongside our church family.
            </SectionHeading>
            <Link to="/events" className="btn btn-outline"><CalendarDays size={18} aria-hidden="true" /> Full calendar</Link>
          </div>
          {events.error && <ErrorState error={events.error} onRetry={events.reload} />}
          <div className="grid grid-3">
            {events.loading && [1, 2, 3].map((n) => <div key={n} className="skeleton" style={{ height: 280 }} aria-hidden="true" />)}
            {events.data?.map((e, i) => <Reveal key={e.id} delay={i * 90}><EventCard event={e} onRegistered={events.reload} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ---------------- Store ---------------- */}
      <section className="section bg-ivory" aria-labelledby="store-title">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading eyebrow="House of Love Store" title="Wear your faith with pride" id="store-title">
              Every purchase supports our ministry and outreach.
            </SectionHeading>
            <Link to="/store" className="btn">Visit the store <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          {products.error && <ErrorState error={products.error} onRetry={products.reload} />}
          <div className="grid grid-4">
            {products.loading && [1, 2, 3, 4].map((n) => <ProductCardSkeleton key={n} />)}
            {products.data?.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}><ProductCard product={p} categoryName={catName(p.category)} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Outreach ---------------- */}
      <section className="section" aria-labelledby="outreach-title">
        <div className="container">
          <SectionHeading eyebrow="Love in action" title="Community Outreach" center id="outreach-title">
            Faith becomes visible when we serve. Here are some of the ways we share Christ’s love beyond our walls.
          </SectionHeading>
          <div className="grid grid-3">
            {outreachHighlights.map((o, i) => (
              <Reveal key={o.id} delay={i * 100} className="outreach-card">
                <Artwork src={photos[`outreach-${o.id}`]} alt={o.title} icon={o.icon} tone={['wine', 'forest', 'charcoal'][i % 3]} caption="" />
                <div className="outreach-card-body">
                  <span className="icon-circle gold mb-2"><Icon name={o.icon} size={24} /></span>
                  <h3>{o.title}</h3>
                  <p>{o.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/ministries/outreach" className="link-arrow">Get involved in outreach <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      {/* ---------------- Give ---------------- */}
      <section className="section bg-wine" aria-labelledby="give-title">
        <div className="container give-band">
          <div>
            <span className="eyebrow">Generosity</span>
            <h2 id="give-title">Your gift makes a difference</h2>
            <p className="lead">
              Every gift helps us worship, disciple, serve families and reach the nations with the love of Christ.
              Give once or become a monthly partner – securely, in under a minute.
            </p>
            <Link to="/give" className="btn btn-gold btn-lg mt-2"><HandHeart size={20} aria-hidden="true" /> Give Today</Link>
          </div>
          <div className="give-band-amounts" role="list" aria-label="Quick give amounts">
            {[25, 50, 100, 250, 500].map((a) => (
              <Link role="listitem" key={a} to={`/give?amount=${a}`} aria-label={`Give $${a}`}>${a}</Link>
            ))}
            <Link role="listitem" to="/give?frequency=monthly" style={{ fontSize: '1.05rem', fontFamily: 'var(--font-body)' }}>Monthly</Link>
          </div>
        </div>
      </section>

      {/* ---------------- Newsletter ---------------- */}
      <section className="section-tight bg-ivory" aria-labelledby="news-title">
        <div className="container">
          <div className="newsletter">
            <div>
              <span className="eyebrow"><Mail size={14} aria-hidden="true" /> Stay connected</span>
              <h2 id="news-title">Receive news, events & encouragement</h2>
              <p className="muted mb-0">Occasional updates from our church family. Unsubscribe any time.</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
