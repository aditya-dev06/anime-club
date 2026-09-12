import type { EventItem, IconKey } from '../types';

/* Decorative inline icons (48x48 stroke drawings) used on event posters. */
const ICONS: Record<IconKey, JSX.Element> = {
  moon: (
    <g>
      <path d="M30 6a16 16 0 1 0 8.5 22.5A13 13 0 0 1 30 6Z" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="40" cy="8" r="1.2" />
      <circle cx="43" cy="16" r="1" />
    </g>
  ),
  mask: (
    <g>
      <rect x="4" y="13" width="40" height="22" rx="11" />
      <ellipse cx="16" cy="24" rx="5.5" ry="4" />
      <ellipse cx="32" cy="24" rx="5.5" ry="4" />
    </g>
  ),
  quiz: (
    <g>
      <path d="M14 18c0-6 5-9 10-9s10 3 10 8.5c0 4-2.6 6-5.5 7.5-2 1-2.5 2-2.5 4" />
      <circle cx="26" cy="37" r="2.4" />
    </g>
  ),
  book: (
    <g>
      <path d="M6 10c6-3.5 12-3.5 18 .5 6-4 12-4 18-.5v27c-6-3.5-12-3.5-18 .5-6-4-12-4-18-.5Z" />
      <path d="M24 11.5v26" />
    </g>
  ),
  fan: (
    <g>
      <ellipse cx="24" cy="25" rx="14" ry="15" />
      <ellipse cx="24" cy="25" rx="5.5" ry="15" />
      <path d="M24 4v4M24 42v2" />
    </g>
  ),
  play: (
    <g>
      <circle cx="24" cy="24" r="18" />
      <path d="M20 15.5 34 24l-14 8.5Z" />
    </g>
  ),
  game: (
    <g>
      <rect x="4" y="14" width="40" height="20" rx="9" />
      <path d="M14 19v10M9 24h10" />
      <circle cx="33" cy="21" r="1.6" />
      <circle cx="37" cy="26" r="1.6" />
    </g>
  ),
};

function Icon({ name }: { name: IconKey }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

interface Props {
  event: EventItem;
  className?: string;
}

/** Manga-panel inspired event poster, fully inline SVG. */
export default function PosterArt({ event, className = '' }: Props) {
  const [a1, a2] = event.accent;
  const pid = event.id;

  return (
    <svg
      viewBox="0 0 320 400"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${event.title} poster`}
    >
      <defs>
        <pattern id={`dots-${pid}`} width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2.1" fill={a1} opacity="0.55" />
        </pattern>
        <radialGradient id={`glow-${pid}`} cx="28%" cy="20%" r="85%">
          <stop offset="0%" stopColor={a1} stopOpacity="0.35" />
          <stop offset="100%" stopColor={a1} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fade-${pid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07070c" stopOpacity="0" />
          <stop offset="100%" stopColor="#07070c" stopOpacity="0.92" />
        </linearGradient>
      </defs>

      <rect width="320" height="400" fill="#0e0e18" />
      <rect width="320" height="400" fill={`url(#glow-${pid})`} />
      <rect width="320" height="400" fill={`url(#dots-${pid})`} opacity="0.14" />

      {/* speed lines radiating from the top-left corner */}
      <g stroke={a1} strokeWidth="2" opacity="0.3">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={-30 + i * 8} y1={-24} x2={120 + i * 38} y2={200 + i * 10} />
        ))}
      </g>

      {/* big diagonal manga panel */}
      <g transform="rotate(-8 160 210)">
        <rect
          x="26"
          y="98"
          width="268"
          height="240"
          fill={a1}
          opacity="0.07"
          stroke="#f2ecdd"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
      </g>

      {/* corner chip */}
      <g transform="skewX(-10)">
        <rect x="26" y="22" width="126" height="26" fill={a2} opacity="0.9" />
      </g>
      <text
        x="86"
        y="39"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        letterSpacing="3.5"
        fill="#0b0b13"
        fontFamily="Manrope, sans-serif"
      >
        Otaku Club
      </text>

      {/* icon medallion */}
      <circle cx="160" cy="176" r="56" fill="#0b0b13" stroke={a1} strokeOpacity="0.65" strokeWidth="2" />
      <circle cx="160" cy="176" r="63" fill="none" stroke={a1} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 7" />
      <g transform="translate(136 152)" color={a1}>
        <Icon name={event.icon} />
      </g>

      {/* date */}
      <text
        x="160"
        y="308"
        textAnchor="middle"
        fontSize="86"
        fill="#f2ecdd"
        fontFamily="'Bebas Neue', sans-serif"
        letterSpacing="4"
      >
        {event.day}
      </text>
      <text
        x="160"
        y="330"
        textAnchor="middle"
        fontSize="15"
        fill={a1}
        fontFamily="Manrope, sans-serif"
        fontWeight="800"
        letterSpacing="9"
      >
        {event.month}
      </text>

      {/* bottom block */}
      <rect y="336" width="320" height="64" fill={`url(#fade-${pid})`} />
      <text x="22" y="366" fontSize="23" fill="#f2ecdd" fontFamily="'Bebas Neue', sans-serif" letterSpacing="2">
        {event.title.toUpperCase()}
      </text>
      <text x="22" y="382" fontSize="8.5" fill={a1} fontFamily="Manrope, sans-serif" fontWeight="700" letterSpacing="1.6">
        VIT BHOPAL · {event.date.toUpperCase()}
      </text>
      <g transform="translate(238 352)" fill="#f2ecdd" opacity="0.7">
        {Array.from({ length: 13 }).map((_, i) => (
          <rect key={i} x={i * 5.2} width={i % 3 === 0 ? 3 : 1.6} height="26" />
        ))}
      </g>
    </svg>
  );
}
