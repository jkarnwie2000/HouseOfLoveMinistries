import {
  Baby, BookOpen, Building2, Church, Flame, Flower2, Gift, Globe2, HandHeart, Heart, HeartPulse, Music,
  Shield, ShieldCheck, ShoppingBasket, Sparkles, Users,
} from 'lucide-react';

// Explicit map keeps the bundle small (only these icons are included).
const ICONS = {
  Baby, BookOpen, Building2, Church, Flame, Flower2, Gift, Globe2, HandHeart, Heart, HeartPulse, Music,
  Shield, ShieldCheck, ShoppingBasket, Sparkles, Users,
};

export default function Icon({ name, size = 24, ...rest }) {
  const Cmp = ICONS[name] || Heart;
  return <Cmp size={size} aria-hidden="true" {...rest} />;
}

/** Simple social glyphs (Lucide no longer ships brand logos). */
export function SocialIcon({ id, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'currentColor' };
  switch (id) {
    case 'facebook':
      return <svg {...common}><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.4V21h3.1z" /></svg>;
    case 'instagram':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'youtube':
      return <svg {...common}><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" /></svg>;
    case 'whatsapp':
      return <svg {...common}><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm0 16.4a7.4 7.4 0 0 1-3.8-1l-.3-.2-2.7.7.7-2.6-.2-.3A7.4 7.4 0 1 1 12 19.4zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6 6 0 0 1-3-2.6c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.5 2.5 0 0 0-.8 1.9 4.4 4.4 0 0 0 .9 2.3 10 10 0 0 0 3.8 3.4c1.4.6 2 .6 2.7.5.4-.1 1.3-.5 1.5-1 .2-.5.2-1 .1-1-.1-.2-.2-.2-.4-.3z" /></svg>;
    default:
      return null;
  }
}
