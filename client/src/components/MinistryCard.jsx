import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import Artwork from './ui/Artwork.jsx';
import Icon from './ui/Icon.jsx';
import { photos } from '../data/site.js';

export default function MinistryCard({ ministry, showMeta = false }) {
  return (
    <article className="card card-hover ministry-card">
      <div className="media-wrap">
        <Artwork src={photos[`ministry-${ministry.id}`]} alt={`${ministry.name} at House of Love`} icon={ministry.icon} tone={ministry.tone} />
        <span className="card-icon" aria-hidden="true"><Icon name={ministry.icon} size={26} /></span>
      </div>
      <div className="card-body">
        <h3>{ministry.name}</h3>
        <p>{ministry.summary}</p>
        {showMeta && <span className="meta"><Clock size={15} aria-hidden="true" /> {ministry.meets}</span>}
        <Link to={`/ministries/${ministry.id}`} className="link-arrow mt-1" aria-label={`Learn more about ${ministry.name}`}>
          Learn more <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
