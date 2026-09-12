import { useId } from 'react';
import type { EventItem } from '../types';

/**
 * Manga-page poster: cream paper, angled black ink panels separated by paper
 * gutters, halftone screens, speed lines, star bursts and the club's straw hat
 * as a recurring panel motif. No Japanese text — pure visual language.
 */
interface MangaPanelArtProps {
  event: EventItem;
  /** Opt-in micro-motion: two ink panels tilt/drift slightly (300ms, reduced-motion safe). */
  hover?: boolean;
  /** Extra classes for the root svg. The mp-tilt-a / mp-tilt-b panel groups stay
   * targetable from outside, e.g. a parent wrapper using "[&_.mp-tilt-a]:group-hover:..." */
  className?: string;
}

export default function MangaPanelArt({ event, hover = false, className = '' }: MangaPanelArtProps) {
  const [a1, a2] = event.accent;
  const pid = `${event.id}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // Unique, CSS-safe scope so the injected <style> below can never collide
  // between multiple MangaPanelArt instances on the same page.
  const scope = `mp${pid.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      viewBox="0 0 320 400"
      className={`h-full w-full${hover ? ` ${scope}` : ''}${className ? ` ${className}` : ''}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${event.title} manga poster`}
    >
      {hover && (
        <style>{`
          /* Programmatic tilt driven by the "hover" prop. The transform lists below
             mirror Tailwind's transform template so they interpolate per-function. */
          .${scope} .mp-tilt-a { transform: translate(-2px, 2px) rotate(-5.5deg) skewX(0deg) skewY(0deg) scaleX(1) scaleY(1); transition-duration: 300ms; }
          .${scope} .mp-tilt-b { transform: translate(4px, -2px) rotate(-1.5deg) skewX(0deg) skewY(0deg) scaleX(1) scaleY(1); transition-duration: 300ms; }
          @media (prefers-reduced-motion: reduce) {
            .${scope} .mp-tilt-a { transform: translate(0px, 0px) rotate(-4deg) skewX(0deg) skewY(0deg) scaleX(1) scaleY(1); transition-duration: 0ms; }
            .${scope} .mp-tilt-b { transform: translate(0px, 0px) rotate(-3deg) skewX(0deg) skewY(0deg) scaleX(1) scaleY(1); transition-duration: 0ms; }
          }
        `}</style>
      )}
      <defs>
        <pattern id={`ht-${pid}`} width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="2.6" fill="#0b0b13" opacity="0.8" />
        </pattern>
        <pattern id={`ht2-${pid}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.4" fill="#0b0b13" opacity="0.55" />
        </pattern>
        <linearGradient id={`htfade-${pid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`panelmask-${pid}`}>
          <rect width="320" height="400" fill={`url(#htfade-${pid})`} />
        </mask>
      </defs>

      {/* paper */}
      <rect width="320" height="400" fill="#ece4d0" />
      <rect width="320" height="400" fill={`url(#ht2-${pid})`} opacity="0.1" />

      {/* ===== Panel A (top-left): event icon in a star burst ===== */}
      {/* Base tilt lives in CSS (same value/pivot as the old transform attribute)
          so group-hover transforms compose instead of snapping. */}
      <g className="mp-tilt-a transition-transform duration-500 rotate-[-4deg] origin-[89px_80px] [transform-box:view-box]">
        <rect x="14" y="16" width="150" height="128" fill="#0b0b13" stroke="#0b0b13" strokeWidth="3" />
        {/* radiating action lines */}
        <g stroke="#f2ecdd" strokeWidth="2" opacity="0.55">
          {Array.from({ length: 14 }).map((_, i) => {
            const ang = (i / 14) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={89 + Math.cos(ang) * 38}
                y1={80 + Math.sin(ang) * 38}
                x2={89 + Math.cos(ang) * 110}
                y2={80 + Math.sin(ang) * 110}
              />
            );
          })}
        </g>
        <circle cx="89" cy="80" r="36" fill="#0b0b13" stroke={a1} strokeWidth="2.5" />
        <g transform="translate(70 61) scale(0.79)" color={a1}>
          <IconGlyph name={event.icon} />
        </g>
        {/* sfx star */}
        <path
          d="M148 26l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"
          fill={a1}
          stroke="#0b0b13"
          strokeWidth="1.5"
        />
      </g>

      {/* ===== Panel B (top-right): the date, screened ===== */}
      <g transform="rotate(3 241 80)">
        <rect x="176" y="14" width="130" height="132" fill="#0b0b13" stroke="#0b0b13" strokeWidth="3" />
        <g mask={`url(#panelmask-${pid})`}>
          <rect x="176" y="14" width="130" height="132" fill={`url(#ht-${pid})`} opacity="0.5" />
        </g>
        <text
          x="241"
          y="92"
          textAnchor="middle"
          fontSize="64"
          fill="#ece4d0"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="2"
          transform="rotate(-3 241 80)"
        >
          {event.day}
        </text>
        <rect x="196" y="104" width="90" height="3" fill={a1} />
        <text
          x="241"
          y="126"
          textAnchor="middle"
          fontSize="15"
          fill={a1}
          fontFamily="Manrope, sans-serif"
          fontWeight="800"
          letterSpacing="7"
        >
          {event.month}
        </text>
      </g>

      {/* ===== Panel C (middle, wide): the straw hat in motion ===== */}
      <g transform="rotate(-2 160 234)">
        <rect x="14" y="180" width="292" height="108" fill="#101019" stroke="#0b0b13" strokeWidth="3" />
        {/* horizontal speed lines from the left */}
        <g stroke="#f2ecdd" strokeWidth="2" opacity="0.4">
          <line x1="22" y1="192" x2="96" y2="192" />
          <line x1="22" y1="202" x2="120" y2="202" />
          <line x1="22" y1="212" x2="82" y2="212" />
          <line x1="22" y1="258" x2="88" y2="258" />
          <line x1="22" y1="268" x2="112" y2="268" />
          <line x1="22" y1="278" x2="70" y2="278" />
        </g>
        <text
          x="30"
          y="240"
          fontSize="26"
          fill="#ece4d0"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="3"
        >
          ANIME CLUB
        </text>
        <text x="30" y="254" fontSize="8" fill={a1} fontFamily="Manrope, sans-serif" fontWeight="700" letterSpacing="3">
          VIT BHOPAL · EST. 2021
        </text>
        {/* straw hat silhouette */}
        <g transform="translate(178 206) scale(0.94)">
          <ellipse cx="60" cy="58" rx="58" ry="13" fill="#8a6427" />
          <ellipse cx="60" cy="55" rx="58" ry="13" fill="#e2a94a" />
          <path d="M27 55C27 27 40 14 60 14s33 13 33 41Z" fill="#f0c66a" stroke="#0b0b13" strokeWidth="2" />
          <path d="M27.6 42c18-4.6 46.8-4.6 64.8 0l.6 13.4c-18-5.2-48-5.2-66 0Z" fill="#c8413c" stroke="#0b0b13" strokeWidth="1.6" />
          <ellipse cx="46" cy="28" rx="6.5" ry="8" fill="#f9dc9a" opacity="0.7" />
          {/* motion streaks behind the hat */}
          <g stroke={a1} strokeWidth="2.5" opacity="0.85">
            <line x1="-12" y1="30" x2="14" y2="30" />
            <line x1="-4" y1="46" x2="18" y2="46" />
            <line x1="-10" y1="62" x2="12" y2="62" />
          </g>
        </g>
      </g>

      {/* ===== Panel D (bottom-left): accent block with initials ===== */}
      <g transform="rotate(2 74 344)">
        <rect x="14" y="300" width="118" height="86" fill={a2} stroke="#0b0b13" strokeWidth="3" />
        <text
          x="73"
          y="346"
          textAnchor="middle"
          fontSize="46"
          fill="#ece4d0"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="2"
          transform="rotate(-4 73 336)"
        >
          {event.title.split(' ').map((w) => w[0]).join('')}
        </text>
        <text x="73" y="368" textAnchor="middle" fontSize="8.5" fill="#0b0b13" fontFamily="Manrope, sans-serif" fontWeight="800" letterSpacing="3">
          {(event.time.match(/\d{1,2}:\d{2}\s?[AP]M/) ?? [event.time])[0]}
        </text>
      </g>

      {/* ===== Panel E (bottom-right): barcode strip ===== */}
      <g className="mp-tilt-b transition-transform duration-500 rotate-[-3deg] origin-[230px_344px] [transform-box:view-box]">
        <rect x="144" y="300" width="162" height="86" fill="#0b0b13" stroke="#0b0b13" strokeWidth="3" />
        <g transform="translate(158 316)" fill="#ece4d0" opacity="0.85">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={i * 4.6} width={i % 4 === 0 ? 2.6 : 1.4} height="30" />
          ))}
        </g>
        <text x="158" y="366" fontSize="8.5" fill={a1} fontFamily="Manrope, sans-serif" fontWeight="700" letterSpacing="2.4">
          {event.venue.split(',')[0].toUpperCase()}
        </text>
      </g>
    </svg>
  );
}

/* 48x48 stroke glyphs shared with PosterArt */
function IconGlyph({ name }: { name: string }) {
  const glyphs: Record<string, JSX.Element> = {
    moon: (
      <g>
        <path d="M30 6a16 16 0 1 0 8.5 22.5A13 13 0 0 1 30 6Z" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="40" cy="8" r="1.2" />
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
      {glyphs[name] ?? glyphs.moon}
    </svg>
  );
}
