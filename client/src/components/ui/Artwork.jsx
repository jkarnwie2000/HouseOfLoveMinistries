import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import Icon from './Icon.jsx';

/**
 * Shows a photo when `src` loads; otherwise a designed placeholder so the layout
 * always looks finished. Drop real photos into client/public/images to replace them.
 */
export default function Artwork({ src, alt, icon, tone = 'wine', caption = 'Photo placeholder', className = '', style, eager = false }) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className={`art ${className}`} style={style}>
      {!failed && (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
      )}
      {failed && (
        <div className={`art-placeholder tone-${tone}`} role="img" aria-label={alt}>
          <div className="art-placeholder-inner">
            <span className="art-placeholder-icon">{icon ? <Icon name={icon} size={34} /> : <ImageIcon size={30} aria-hidden="true" />}</span>
            {caption && <span className="art-caption">{caption}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
