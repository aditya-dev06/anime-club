import MangaPanelArt from './MangaPanelArt';
import type { EventItem } from '../types';

interface Props {
  event: EventItem;
  onBook: (e: EventItem) => void;
}

/**
 * The featured event card. Fixed height `min(66vh, 560px)` everywhere —
 * the events section uses the matching `calc(50vh - min(33vh, 280px))`
 * top padding so the hero's emerged card hands off to it seamlessly.
 */
export default function FeaturedCard({ event, onBook }: Props) {
  const bookedPct = Math.round(((event.seatsTotal - event.seatsLeft) / event.seatsTotal) * 100);

  return (
    <article className="group ac-card relative flex h-[min(66vh,560px)] w-full flex-col overflow-hidden rounded-[28px] glass shadow-card sm:flex-row">
      {/* Scoped keyframes for the poster scan line + Book Now idle pulse.
          Class names are unique (ac-*) so this cannot leak to other components. */}
      <style>{`
        @keyframes ac-scan-sweep {
          0% { transform: translateY(-8px); }
          100% { transform: translateY(70vh); }
        }
        @keyframes ac-gold-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(226, 169, 74, 0.38), 0 10px 30px -10px rgba(226, 169, 74, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.5); }
          50% { box-shadow: 0 0 0 9px rgba(226, 169, 74, 0), 0 10px 30px -10px rgba(226, 169, 74, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.5); }
        }
        /* Straw scan line sweeping the poster while the card is hovered */
        .ac-scan {
          opacity: 0;
          transition: opacity 300ms ease;
          animation: ac-scan-sweep 1.8s linear infinite;
          animation-play-state: paused;
        }
        .ac-card:hover .ac-scan {
          opacity: 1;
          animation-play-state: running;
        }
        /* Idle breathing shadow on Book Now; released on hover so .btn-gold:hover keeps its own shadow */
        .ac-pulse {
          animation: ac-gold-pulse 2.6s ease-in-out infinite;
        }
        .ac-pulse:hover {
          animation: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .ac-scan { animation: none; opacity: 0 !important; }
          .ac-pulse { animation: none; }
        }
      `}</style>
      <div className="relative h-2/5 shrink-0 transform-gpu overflow-hidden sm:h-full sm:w-[37%] [&_.mp-tilt-a]:group-hover:rotate-[-5.5deg] [&_.mp-tilt-a]:group-hover:translate-y-[2px] [&_.mp-tilt-b]:group-hover:translate-x-1 [&_.mp-tilt-b]:group-hover:rotate-[-1.5deg]">
        <MangaPanelArt event={event} />
        <div className="card-shine" aria-hidden="true" />
        {/* 2px straw bar that sweeps top-to-bottom on hover (keyframes in the scoped style above) */}
        <div
          aria-hidden="true"
          className="ac-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-straw-300 to-transparent"
        />
      </div>

      <div className="relative flex flex-1 flex-col gap-3 overflow-hidden p-5 sm:gap-4 sm:p-8">
        {/* Faint manga-panel backdrop behind the text side */}
        <svg viewBox="0 0 320 200" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.045]" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="#f2ecdd" strokeWidth="2">
            <rect x="8" y="10" width="140" height="80" />
            <rect x="160" y="10" width="152" height="52" />
            <rect x="160" y="74" width="152" height="40" />
            <rect x="8" y="102" width="90" height="86" />
            <rect x="110" y="102" width="202" height="86" />
          </g>
          <g fill="#f2ecdd">
            {Array.from({ length: 40 }).map((_, i) => (
              <circle key={i} cx={12 + (i % 10) * 15} cy={16 + Math.floor(i / 10) * 22} r="1.3" />
            ))}
          </g>
        </svg>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-straw-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-straw-300">
            Featured Event
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-straw-500/40 to-transparent" aria-hidden="true" />
        </div>

        <h3 className="font-display text-4xl leading-[0.92] tracking-wide text-cream sm:text-6xl">{event.title}</h3>

        <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] text-cream/75 sm:grid-cols-2 sm:text-sm">
          <li className="flex items-center gap-2.5">
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-straw-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <rect x="1.5" y="3" width="13" height="11.5" rx="2" />
              <path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" />
            </svg>
            {event.date}
          </li>
          <li className="flex items-center gap-2.5">
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-straw-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.5V8l2.5 1.5" />
            </svg>
            {event.time}
          </li>
          <li className="flex items-center gap-2.5 sm:col-span-2">
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-straw-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 14.5s5.5-5 5.5-9a5.5 5.5 0 1 0-11 0c0 4 5.5 9 5.5 9Z" />
              <circle cx="8" cy="5.5" r="1.8" />
            </svg>
            {event.venue}
          </li>
        </ul>

        <p className="clamp-2 text-sm leading-relaxed text-cream/60 sm:clamp-none">{event.desc}</p>

        <div className="mt-auto space-y-3 pt-2">
          <div className="flex items-end justify-between">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-cream/45">Entry</span>
              <span className="font-display text-4xl leading-none text-straw-300">
                {event.price === 0 ? 'FREE' : `₹${event.price}`}
              </span>
            </div>
            <span className="flex items-center gap-1.5 pb-1 text-xs text-cream/50">
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 shrink-0 text-straw-400/90"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3.5 8.5V3.75A1.75 1.75 0 0 1 5.25 2h5.5a1.75 1.75 0 0 1 1.75 1.75V8.5" />
                <path d="M2.5 11.5v-1.25A1.75 1.75 0 0 1 4.25 8.5h7.5a1.75 1.75 0 0 1 1.75 1.75v1.25" />
                <path d="M4.25 11.5v2M11.75 11.5v2" />
              </svg>
              {event.seatsLeft} of {event.seatsTotal} seats left
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${bookedPct}%`, background: `linear-gradient(90deg, ${event.accent[0]}, ${event.accent[1]})` }}
            />
          </div>
          <button className="btn-gold ac-pulse w-full sm:w-auto sm:self-start sm:px-10" onClick={() => onBook(event)}>
            Book Now
          </button>
        </div>
      </div>
    </article>
  );
}
