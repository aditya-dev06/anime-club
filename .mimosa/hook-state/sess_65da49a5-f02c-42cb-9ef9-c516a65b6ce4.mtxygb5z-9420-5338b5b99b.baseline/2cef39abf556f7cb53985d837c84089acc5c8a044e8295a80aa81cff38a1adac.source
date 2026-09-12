import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import PosterArt from './PosterArt';
import type { EventItem } from '../types';

interface Props {
  event: EventItem;
  onBook: (e: EventItem) => void;
}

/* ── Scoped styles (ec- prefix). Motion is fully disabled under
   prefers-reduced-motion. ─────────────────────────────────────────────── */
const EC_CSS = `
.ec-card{transition:transform 300ms ease,border-color 300ms ease,box-shadow 300ms ease}
.ec-card:hover{
  border-color:var(--ac-soft,rgba(226,169,74,.5));
  box-shadow:0 24px 60px -24px rgba(0,0,0,.7),0 0 46px -8px var(--ac-glow,rgba(226,169,74,.35));
}
.ec-ribbon{
  position:relative;display:inline-block;padding:6px 13px 7px 11px;
  transform:skewY(-4deg);transform-origin:100% 100%;
  box-shadow:0 8px 20px -8px rgba(0,0,0,.65);
}
.ec-ribbon::after{ /* folded corner under the band's left end */
  content:'';position:absolute;top:100%;left:0;
  border-style:solid;border-width:6px 9px 0 0;
  border-color:var(--ec-fold,#8f2126) transparent transparent transparent;
}
.ec-ribbon-ember{background:linear-gradient(180deg,#f0655c,#d5383e);color:#fff7ec;--ec-fold:#8f2126}
.ec-ribbon-green{background:linear-gradient(180deg,#4cc98c,#1f9d63);color:#06130c;--ec-fold:#136043}
.ec-ribbon-pulse{animation:ec-ribbon-pulse 1.25s ease-in-out infinite}
@keyframes ec-ribbon-pulse{0%,100%{transform:skewY(-4deg) scale(1)}50%{transform:skewY(-4deg) scale(1.07)}}
.ec-burst{opacity:0;transform:scale(0) rotate(-12deg);transform-origin:70% 70%;pointer-events:none}
.group:hover .ec-burst{animation:ec-burst-pop 460ms cubic-bezier(.3,1.4,.4,1) both}
@keyframes ec-burst-pop{
  0%{opacity:0;transform:scale(0) rotate(-12deg)}
  62%{opacity:1;transform:scale(1.15) rotate(-12deg)}
  100%{opacity:1;transform:scale(1) rotate(-12deg)}
}
.ec-shimmer{animation:ec-shimmer 1.7s linear infinite}
@keyframes ec-shimmer{from{background-position:0% 0}to{background-position:200% 0}}
.ec-dot{animation:ec-dot-pulse 1.1s ease-in-out infinite}
@keyframes ec-dot-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
@media (prefers-reduced-motion: reduce){
  .ec-shimmer,.ec-dot,.ec-ribbon-pulse{animation:none}
  .group:hover .ec-burst{animation:none;opacity:1;transform:scale(1) rotate(-12deg)}
}
`;

/* 12-spike comic star for the "!" sticker (computed once, 36x36 grid). */
const BURST_POINTS = (() => {
  const cx = 18;
  const cy = 18;
  const outer = 16.2;
  const inner = 10.2;
  const spikes = 12;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(',');
})();

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-straw-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="1.5" y="3" width="13" height="11.5" rx="2" />
      <path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-straw-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14.5s5.5-5 5.5-9a5.5 5.5 0 1 0-11 0c0 4 5.5 9 5.5 9Z" />
      <circle cx="8" cy="5.5" r="1.8" />
    </svg>
  );
}

/* Straw star burst + ink "!" — pops on card hover. */
function BurstSticker() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]" focusable="false">
      <polygon points={BURST_POINTS} fill="#f0c66a" stroke="#07070c" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="16.1" y="7.6" width="3.8" height="11.6" rx="1.9" fill="#07070c" />
      <circle cx="18" cy="24" r="2.2" fill="#07070c" />
    </svg>
  );
}

/** #rgb/#rrggbb → rgba(); falls back to the raw value for other formats. */
function withAlpha(color: string, alpha: number): string {
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return color;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Ribbon {
  label: string;
  tone: 'ember' | 'green';
  pulse: boolean;
}

export default function EventCard({ event, onBook }: Props) {
  const cardRef = useRef<HTMLElement>(null);

  /* Subtle 3D tilt on pointer-devices only. */
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = cardRef.current!;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-6px)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const seatRatio = event.seatsTotal > 0 ? event.seatsLeft / event.seatsTotal : 1;
  const scarce = seatRatio < 0.3;
  const bookedPct = Math.round(((event.seatsTotal - event.seatsLeft) / event.seatsTotal) * 100);

  /* Urgency ribbon: scarcity beats free-entry messaging. */
  const ribbon: Ribbon | null =
    seatRatio < 0.12
      ? { label: 'ALMOST GONE', tone: 'ember', pulse: true }
      : seatRatio < 0.3
        ? { label: 'FILLING FAST', tone: 'ember', pulse: false }
        : event.price === 0
          ? { label: 'FREE ENTRY', tone: 'green', pulse: false }
          : null;

  /* Accent (event.accent[0]) drives the hover border/glow tint. */
  const accentVars = {
    '--ac': event.accent[0],
    '--ac-soft': withAlpha(event.accent[0], 0.5),
    '--ac-glow': withAlpha(event.accent[0], 0.35),
  } as CSSProperties;

  return (
    <article
      ref={cardRef}
      className="ec-card group relative flex flex-col overflow-hidden rounded-3xl glass shadow-card transition-transform duration-300 will-change-transform"
      style={accentVars}
    >
      <style>{EC_CSS}</style>
      <div className="relative overflow-hidden">
        <PosterArt event={event} className="aspect-[5/4] w-full transition-transform duration-500 group-hover:scale-[1.06]" />
        <div className="card-shine" aria-hidden="true" />
        <div className="absolute left-4 top-4 rounded-full bg-ink-950/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-straw-300 backdrop-blur">
          {event.tagline}
        </div>

        {/* Status ribbon (top-right, under the burst sticker). */}
        {ribbon && (
          <div aria-hidden="true" className="absolute right-0 top-12 z-20 font-display text-[12px] leading-none tracking-[0.18em]">
            <span className={`ec-ribbon ${ribbon.tone === 'green' ? 'ec-ribbon-green' : 'ec-ribbon-ember'}${ribbon.pulse ? ' ec-ribbon-pulse' : ''}`}>
              {ribbon.label}
            </span>
          </div>
        )}

        {/* Comic "!" burst sticker — pops in on card hover. */}
        <span aria-hidden="true" className="ec-burst absolute right-2.5 top-2.5 z-20 block">
          <BurstSticker />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="font-display text-3xl leading-none tracking-wide text-cream">{event.title}</h3>
        <ul className="space-y-1.5 text-[13px] text-cream/70">
          <li className="flex items-center gap-2.5">
            <CalendarIcon />
            <span>
              {event.date} · {event.time}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <PinIcon />
            <span>{event.venue}</span>
          </li>
        </ul>
        <p className="clamp-2 text-sm leading-relaxed text-cream/60">{event.desc}</p>

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex items-end justify-between">
            <span className="font-display text-[26px] leading-none text-straw-300">
              {event.price === 0 ? 'FREE' : `₹${event.price}`}
            </span>
            {scarce ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-ember-400">
                <span aria-hidden="true" className="ec-dot h-1.5 w-1.5 shrink-0 rounded-full bg-ember-400" />
                {event.seatsLeft} of {event.seatsTotal} seats left
              </span>
            ) : (
              <span className="text-[11px] text-cream/50">
                {event.seatsLeft} of {event.seatsTotal} seats left
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] duration-700${scarce ? ' ec-shimmer' : ''}`}
              style={
                scarce
                  ? {
                      width: `${bookedPct}%`,
                      backgroundImage: `linear-gradient(90deg, ${event.accent[0]}, ${event.accent[1]}, rgba(255,243,205,0.8), ${event.accent[0]})`,
                      backgroundSize: '200% 100%',
                    }
                  : { width: `${bookedPct}%`, background: `linear-gradient(90deg, ${event.accent[0]}, ${event.accent[1]})` }
              }
            />
          </div>
          <button className="btn-gold w-full" onClick={() => onBook(event)}>
            Book Now
          </button>
        </div>
      </div>
    </article>
  );
}
