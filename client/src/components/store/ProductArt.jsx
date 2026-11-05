import { useState } from 'react';

function shade(hex, amount) {
  const n = parseInt((hex || '#6B1E2E').slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amount * (amount < 0 ? c : 255 - c))));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const isLight = (hex) => {
  const n = parseInt((hex || '#000000').slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 170;
};

function Crest({ x, y, s = 1, light }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 9C-6 4.5-9 1.5-9-2.3-9-5-7-7-4.5-7-2.7-7-1.1-6 0-4.4 1.1-6 2.7-7 4.5-7 7-7 9-5 9-2.3 9 1.5 6 4.5 0 9z" fill={light ? '#6B1E2E' : '#C9A24B'} />
      <path d="M-.9-4.6h1.8v3h2.6V.2H.9v4.4H-.9V.2h-2.6v-1.8h2.6z" fill={light ? '#C9A24B' : '#6B1E2E'} />
    </g>
  );
}

function KenteStripe({ x, y, w, h = 6 }) {
  const cols = ['#C9A24B', '#2B2622', '#2F4A3A', '#C9A24B', '#6B1E2E'];
  const seg = w / 10;
  return <g>{Array.from({ length: 10 }, (_, i) => <rect key={i} x={x + i * seg} y={y} width={seg} height={h} fill={cols[i % cols.length]} />)}</g>;
}

const ILLUSTRATIONS = {
  't-shirts': (c) => {
    const dark = shade(c, -0.25);
    return (
      <>
        <path d="M70 38 50 46 24 74l20 18 12-12v86q44 6 88 0V80l12 12 20-18-26-28-20-8q-6 16-30 16T70 38z" fill={c} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M70 38q6 16 30 16t30-16" fill="none" stroke={dark} strokeWidth="5" strokeLinecap="round" />
        <path d="M56 80V92M144 80V92" stroke={dark} strokeWidth="1.5" opacity=".5" />
        <Crest x={100} y={98} s={1.9} light={isLight(c)} />
        <KenteStripe x={60} y={150} w={80} h={5} />
      </>
    );
  },
  'sweaters-hoodies': (c) => {
    const dark = shade(c, -0.22);
    const darker = shade(c, -0.45);
    return (
      <>
        <path d="M64 50 40 60 20 132l20 6 16-46v78q44 6 88 0V92l16 46 20-6-20-72-24-10z" fill={c} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M66 54q0-36 34-38 34 2 34 38-14 14-34 14T66 54z" fill={dark} />
        <path d="M80 52q20 18 40 0-6-18-20-18T80 52z" fill={darker} />
        <path d="M92 62v22M108 62v22" stroke="#F3EBDB" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 128h56l8 30H64z" fill="none" stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
        <Crest x={100} y={104} s={1.6} light={isLight(c)} />
        <KenteStripe x={24} y={118} w={22} h={5} />
        <KenteStripe x={154} y={118} w={22} h={5} />
      </>
    );
  },
  caps: (c) => {
    const dark = shade(c, -0.3);
    return (
      <>
        <path d="M38 124q0-66 62-68 62 2 62 68z" fill={c} stroke={dark} strokeWidth="2.5" />
        <path d="M100 58q-6 30-2 66M70 66q-14 26-14 58M130 66q14 26 14 58" fill="none" stroke={dark} strokeWidth="1.6" opacity=".55" />
        <circle cx="100" cy="57" r="5" fill={dark} />
        <path d="M32 122q70-16 150 6 8 14-12 18-62-12-132-6-12-6-6-18z" fill={dark} />
        <Crest x={100} y={96} s={2} light={isLight(c)} />
      </>
    );
  },
  bangers: (c) => {
    const dark = shade(c, -0.3);
    return (
      <>
        <ellipse cx="100" cy="112" rx="66" ry="40" fill="none" stroke={dark} strokeWidth="24" />
        <ellipse cx="100" cy="106" rx="66" ry="40" fill="none" stroke={c} strokeWidth="22" />
        <path d="M44 96q56-34 112 0" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
        <Crest x={100} y={146} s={1.7} light={isLight(c)} />
      </>
    );
  },
  bibles: (c) => {
    const dark = shade(c, -0.35);
    return (
      <>
        <rect x="56" y="30" width="96" height="142" rx="6" fill="#F3EBDB" stroke="#d8c9a8" strokeWidth="2" />
        <rect x="48" y="26" width="98" height="146" rx="7" fill={c} stroke={dark} strokeWidth="2.5" />
        <rect x="48" y="26" width="14" height="146" rx="5" fill={dark} />
        <rect x="70" y="36" width="68" height="126" rx="4" fill="none" stroke="#C9A24B" strokeWidth="1.5" />
        <path d="M100 62v62M84 82h32" stroke="#C9A24B" strokeWidth="6" strokeLinecap="round" />
        <text x="104" y="146" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" letterSpacing="2" fill="#C9A24B">HOLY BIBLE</text>
        <path d="M124 172v18l6-5 6 5v-18" fill="#C9A24B" />
      </>
    );
  },
  'key-holders': (c) => {
    const dark = shade(c, -0.3);
    return (
      <>
        <circle cx="100" cy="46" r="22" fill="none" stroke="#9EA3A8" strokeWidth="6" />
        <path d="M100 68v14" stroke="#9EA3A8" strokeWidth="5" strokeLinecap="round" />
        <path d="M100 172c-30-22-46-38-46-58 0-14 10-26 24-26 9 0 17 5 22 13 5-8 13-13 22-13 14 0 24 12 24 26 0 20-16 36-46 58z" fill={c} stroke={dark} strokeWidth="3" />
        <path d="M95 104h10v14h14v10h-14v24H95v-24H81v-10h14z" fill={isLight(c) ? '#6B1E2E' : '#F3EBDB'} />
      </>
    );
  },
};

/** Product image, or a coloured illustration of the product type until a photo is uploaded. */
export default function ProductArt({ product, colorHex, showCaption = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  const color = colorHex || product?.colors?.[0]?.hex || '#6B1E2E';
  const draw = ILLUSTRATIONS[product?.category];

  if (product?.image && !failed) {
    return (
      <div className={`product-art ${className}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={`product-art ${className}`}>
      <svg viewBox="0 0 200 200" role="img" aria-label={`${product?.name || 'Product'} illustration`}>
        {draw ? draw(color) : (
          <g>
            <circle cx="100" cy="100" r="60" fill={color} />
            <Crest x={100} y={100} s={3} light={isLight(color)} />
          </g>
        )}
      </svg>
      {showCaption && <span className="art-caption">Illustration – product photo coming soon</span>}
    </div>
  );
}
