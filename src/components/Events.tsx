import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMemo, useState } from 'react';
import FeaturedCard from './FeaturedCard';
import EventCard from './EventCard';
import MyTickets from './MyTickets';
import LogoHat from './LogoHat';
import type { EventItem } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  reduced: boolean;
  events: EventItem[];
  onBook: (e: EventItem) => void;
}

const STATS = [
  { value: '850+', label: 'Members' },
  { value: '40+', label: 'Events hosted' },
  { value: '120+', label: 'Screening nights' },
  { value: '300+', label: 'Cosplays on stage' },
];

export default function Events({ reduced, events, onBook }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'fast' | 'month'>('all');
  const featured = events.find((e) => e.featured) ?? events[0];
  const rest = events.filter((e) => e.id !== featured.id);

  const filtered = useMemo(() => {
    const monthShort = new Date().toLocaleString('en', { month: 'short' });
    switch (filter) {
      case 'free':
        return rest.filter((e) => e.price === 0);
      case 'fast':
        return rest.filter((e) => e.seatsLeft / e.seatsTotal < 0.3);
      case 'month':
        return rest.filter((e) => e.date.includes(monthShort));
      default:
        return rest;
    }
  }, [rest, filter]);

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-enter]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 42, scale: 0.965, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
          },
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={rootRef} id="events" className="relative z-10 bg-ink-950">
      {/* Matches the hero's final card position so the handoff is seamless */}
      <div className="mx-auto w-[min(92vw,1040px)] pb-24 pt-[calc(50vh-min(33vh,280px))]">
        <FeaturedCard event={featured} onBook={onBook} />
      </div>

      {/* Header */}
      <div data-enter className="mx-auto mb-12 w-[min(92vw,1120px)] px-2">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.4em] text-straw-300/80">
              Season 2026 · Semester II
            </p>
            <h2 className="font-display text-6xl leading-[0.9] tracking-wide text-cream sm:text-7xl">ALL EVENTS</h2>
          </div>
          <LogoHat className="hidden h-12 w-16 opacity-80 sm:block" />
        </div>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-straw-500/50 via-white/10 to-transparent" aria-hidden="true" />
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/55">
          Every seat is first-come, first-served. Book through the club, carry your VIT ID to the
          venue, and be there early — the front rows always go first.
        </p>
      </div>

      {/* Filter chips */}
      <div data-enter className="mx-auto mb-8 flex w-[min(92vw,1120px)] flex-wrap items-center gap-2">
        {([
          ['all', 'All'],
          ['free', 'Free entry'],
          ['fast', 'Filling fast'],
          ['month', 'This month'],
        ] as Array<['all' | 'free' | 'fast' | 'month', string]>).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] transition-all duration-200 ${
              filter === id
                ? 'bg-gradient-to-b from-straw-300 to-straw-500 text-ink-950 shadow-gold-glow'
                : 'glass text-cream/65 hover:text-cream'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-cream/40">
          Showing {filtered.length} of {rest.length} events
        </span>
      </div>

      {/* Grid */}
      <div className="mx-auto grid w-[min(92vw,1120px)] gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ev) => (
          <div data-enter key={ev.id} className="h-full">
            <EventCard event={ev} onBook={onBook} />
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mx-auto w-[min(92vw,1120px)] rounded-2xl glass p-10 text-center">
          <p className="font-display text-2xl tracking-wide text-cream/70">No events match this filter yet.</p>
          <button className="btn-gold mt-4" onClick={() => setFilter('all')}>
            Show all
          </button>
        </div>
      )}

      {/* Ticket status lookup */}
      <div id="tickets" data-enter className="mx-auto mt-24 w-[min(92vw,1120px)] scroll-mt-24">
        <MyTickets />
      </div>

      {/* About */}
      <div id="about" data-enter className="mx-auto mt-24 w-[min(92vw,1120px)]">
        <div className="relative overflow-hidden rounded-[28px] glass p-8 sm:p-12">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(226,169,74,0.14), transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.4em] text-straw-300/80">About the club</p>
              <h3 className="font-display text-5xl leading-[0.92] tracking-wide text-cream">
                THE CREW OF VIT BHOPAL
              </h3>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-cream/65">
                The Otaku Club is VIT Bhopal’s home for everyone who has ever argued about the best
                opening sequence, stayed up for a finale, or hand-stitched a costume three nights
                before a con. We run weekly screenings, manga circles, cosplay builds, quiz leagues
                and esports brackets through the year — and every autumn we put the whole thing on
                one big stage.
              </p>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-cream/65">
                No prior watchlist required. If you are curious, you already belong.
              </p>
            </div>
            <div className="grid grid-cols-2 content-center gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center">
                  <div className="font-display text-4xl text-straw-300">{s.value}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
