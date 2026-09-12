import { useEffect, useState } from 'react';
import type { SVGProps } from 'react';
import LogoHat from './LogoHat';

const HANDLES = [
  { label: '@animeclub.vitb', label2: 'Instagram' },
  { label: 'Otaku Club VIT Bhopal', label2: 'YouTube' },
  { label: 'animeclub-vitb', label2: 'Discord' },
];

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M12 3l7 3v5.2c0 4.4-2.9 7.7-7 9-4.1-1.3-7-4.6-7-9V6l7-3z" />
      <path d="M9.2 11.9l2 2 3.6-3.9" />
    </svg>
  );
}

function IconTicket(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M3 9V7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5V9a3 3 0 000 6v1.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5V15a3 3 0 000-6z" />
      <path d="M14.5 6.5v11" strokeDasharray="2.4 2.6" />
    </svg>
  );
}

function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
    </svg>
  );
}

/* My Tickets has no anchor of its own (Events.tsx is shared), so tickets are
   reached via the Events section. */
const CLUB_LINKS = [
  { href: '/admin.html', label: 'Admin Console', Icon: IconShield },
  { href: '/verify', label: 'Gate Scanner', Icon: IconTicket },
  { href: '#events', label: 'Events', Icon: IconCalendar },
] as const;

export default function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setShowTop(window.scrollY > 800);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <footer className="relative z-10 border-t border-white/5 bg-ink-950">
      {/* Club links — quick access strip */}
      <div className="mx-auto w-[min(92vw,1120px)] pt-8">
        <div className="glass flex flex-col gap-4 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-lg tracking-[0.24em] text-cream/90">Club Links</span>
          <div className="flex flex-wrap gap-2.5">
            {CLUB_LINKS.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                title={label === 'Events' ? 'Tickets live in the Events section' : undefined}
                className="group inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-cream/75 backdrop-blur transition hover:border-straw-500/50 hover:bg-straw-500/10 hover:text-straw-200"
              >
                <Icon className="h-4 w-4 shrink-0 text-straw-400 transition group-hover:text-straw-300" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-[min(92vw,1120px)] gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoHat className="h-9 w-12" />
            <div className="leading-none">
              <span className="block font-display text-2xl tracking-[0.12em] text-cream">Otaku Club</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.42em] text-straw-300/80">
                VIT Bhopal
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/50">
            A student-run community of VIT Bhopal. Screenings, cosplay, manga, quizzes and esports —
            run by fans, for fans, since 2021.
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-straw-300/80">Find us</h4>
          <ul className="mt-4 space-y-2 text-sm text-cream/55">
            <li>Student Activity Centre, Room 12</li>
            <li>VIT Bhopal University, Kotra Kalan</li>
            <li>Sehore, Madhya Pradesh 466114</li>
            <li>
              <a
                href="https://vitbhopal.ac.in"
                target="_blank"
                rel="noreferrer"
                className="text-straw-300/90 underline-offset-4 transition hover:underline"
              >
                vitbhopal.ac.in
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-straw-300/80">Follow</h4>
          <ul className="mt-4 space-y-3">
            {HANDLES.map((h) => (
              <li key={h.label2} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cream/40">{h.label2}</span>
                <span className="text-sm font-semibold text-cream/75">{h.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

        <div className="border-t border-white/5">
        <div className="mx-auto flex w-[min(92vw,1120px)] flex-col items-center justify-between gap-2 py-5 text-[11px] text-cream/35 sm:flex-row">
          <span>© 2026 Otaku Club — VIT Bhopal University. A fan community.</span>
          <span className="text-cream/30">
            This site hides secrets. The wise know: ↑↑↓↓←→←→BA, and the words <span className="text-straw-300/50">return</span> · <span className="text-straw-300/50">atomic</span>.
          </span>
        </div>
      </div>

      {/* Back to top — appears after 800px, sits above content, below toasts (z-[60]) */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
        className={`glass fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border-straw-500/40 text-straw-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-straw-400 hover:text-straw-200 hover:shadow-gold-glow sm:bottom-7 sm:right-7 ${
          showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M6.5 14.5L12 9l5.5 5.5" />
        </svg>
      </button>
    </footer>
  );
}
