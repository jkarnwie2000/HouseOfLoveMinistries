import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import { PageHero } from '../components/ui/Section.jsx';
import EventCard from '../components/EventCard.jsx';
import { EmptyState, ErrorState, Loading, Placeholder } from '../components/ui/Feedback.jsx';
import { useApi, usePageMeta } from '../lib/hooks.js';
import { serviceSchedule } from '../data/site.js';

export default function Events() {
  usePageMeta('Events', 'Upcoming worship services, Bible studies, prayer meetings, conferences, outreach and youth & family events at House of Love International Ministries.');
  const { data, loading, error, reload } = useApi('/events');
  const [filter, setFilter] = useState('All');
  const categories = useMemo(() => ['All', ...new Set((data || []).map((e) => e.category).filter(Boolean))], [data]);
  const shown = (data || []).filter((e) => filter === 'All' || e.category === filter);
  const { hash } = useLocation();

  // Events load asynchronously, so scroll to a linked event (e.g. #sunday-worship) once it renders.
  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [data, hash]);

  return (
    <>
      <PageHero eyebrow="Events" title="Gather, worship and grow together" crumbs={[{ label: 'Events' }]}>
        Join us for weekly worship and special gatherings throughout the year. All are welcome.
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />

      <section className="section-tight bg-ivory" aria-labelledby="weekly-title">
        <div className="container">
          <div className="flex justify-between items-center wrap gap-2">
            <h2 id="weekly-title" className="mb-0" style={{ fontSize: '1.8rem' }}>Weekly services</h2>
            <Placeholder>Service times to be confirmed</Placeholder>
          </div>
          <div className="grid grid-3 mt-3">
            {serviceSchedule.map((s) => (
              <div className="card card-body" key={s.day}>
                <span className="eyebrow mb-0">{s.day}</span>
                <h3 className="mb-0">{s.name}</h3>
                <p className="muted mb-0">{s.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="calendar-title">
        <div className="container">
          <div className="flex justify-between items-center wrap gap-2 mb-3">
            <h2 id="calendar-title" className="mb-0">Upcoming events</h2>
            <div className="filter-chips" role="group" aria-label="Filter events by type">
              {categories.map((c) => (
                <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>
          </div>
          <p className="mb-3"><Placeholder>Event details are editable placeholders – manage them from the admin dashboard</Placeholder></p>
          {loading && <Loading label="Loading events…" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && shown.length === 0 && (
            <EmptyState icon={CalendarX} title="No upcoming events">Please check back soon for new gatherings.</EmptyState>
          )}
          <div className="grid grid-2">
            {shown.map((e) => <EventCard key={e.id} event={e} onRegistered={reload} />)}
          </div>
        </div>
      </section>
    </>
  );
}
