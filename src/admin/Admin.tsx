import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

const PASSCODE = 'vitb-admin-2026';
const AUTH_KEY = 'ac-admin-auth';

interface OverviewStats {
  events: number;
  tickets: number;
  seats: number;
  revenue: number;
  pending: number;
  checkins: number;
}

function readOverview(): OverviewStats {
  const read = <T,>(key: string): T[] => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const events = read<Record<string, unknown>>('ac-events');
  const bookings = read<{ seats?: number; amount?: number; status?: string }>('ac-bookings');
  const checkins = read<{ seats?: number }>('ac-checkins');
  const active = bookings.filter((b) => b.status === 'active');
  return {
    events: events.length,
    tickets: bookings.length,
    seats: bookings.reduce((s, b) => s + (typeof b.seats === 'number' ? b.seats : 0), 0),
    revenue: active.reduce((s, b) => s + (typeof b.amount === 'number' ? b.amount : 0), 0),
    pending: bookings.filter((b) => b.status === 'pending').length,
    checkins: checkins.reduce((s, c) => s + (typeof c.seats === 'number' ? c.seats : 0), 0),
  };
}

function readAuthFlag(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

/** Original straw-hat mark: gold brim + dome + red band. */
function StrawHatMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 44" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="32" cy="33" rx="29" ry="8" fill="#92651f" />
      <ellipse cx="32" cy="31" rx="29" ry="8" fill="#e2a94a" />
      <ellipse cx="32" cy="30.2" rx="24" ry="6" fill="#f0c66a" opacity="0.45" />
      <path d="M17 31c0-14 6.5-21.5 15-21.5S47 17 47 31Z" fill="#f0c66a" />
      <path d="M17.5 23.5c9.5-2.9 19.5-2.9 29 0l.5 7.5c-9.9-2.9-20.1-2.9-30 0Z" fill="#c73a3a" />
      <ellipse cx="25.5" cy="15.5" rx="2.8" ry="3.8" fill="#ffe9b8" opacity="0.5" />
    </svg>
  );
}

/** Halftone manga-dot strip used at the top of the login card. */
function HalftoneStrip() {
  return (
    <div
      aria-hidden="true"
      className="h-10 w-full shrink-0 border-b border-white/10"
      style={{
        backgroundImage: 'radial-gradient(rgba(226, 169, 74, 0.55) 1.3px, transparent 1.4px)',
        backgroundSize: '9px 9px',
        backgroundPosition: '2px 3px',
        maskImage: 'linear-gradient(180deg, #000 25%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, #000 25%, transparent 100%)',
      }}
    />
  );
}

export default function Admin({
  tabs,
  onNavigate,
}: {
  tabs: Array<{ id: string; label: string; content: ReactNode }>;
  onNavigate?: (tabId: string) => void;
}) {
  const [authed, setAuthed] = useState<boolean>(readAuthFlag);
  const [pass, setPass] = useState('');
  const [wrong, setWrong] = useState(false);
  const [activeId, setActiveId] = useState<string>(tabs[0]?.id ?? '');
  const [overview, setOverview] = useState<OverviewStats>(() => readOverview());

  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authed) inputRef.current?.focus();
  }, [authed]);

  /* Overview stats refresh: interval + cross-tab storage events. */
  useEffect(() => {
    if (!authed) return;
    const refresh = () => setOverview(readOverview());
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ac-')) refresh();
    };
    const id = window.setInterval(refresh, 5000);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', onStorage);
    };
  }, [authed]);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const triggerShake = () => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove('ac-shake');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('ac-shake');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pass.trim() === PASSCODE) {
      try {
        sessionStorage.setItem(AUTH_KEY, '1');
      } catch {
        /* storage unavailable — session-only auth */
      }
      setWrong(false);
      setPass('');
      setAuthed(true);
    } else {
      setWrong(true);
      setPass('');
      triggerShake();
      inputRef.current?.focus();
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setAuthed(false);
    setPass('');
    setWrong(false);
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink-950 font-body text-cream">
      {/* Scoped keyframes (shake on wrong passcode) */}
      <style>{`
        @keyframes ac-shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .ac-shake { animation: ac-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        @media (prefers-reduced-motion: reduce) { .ac-shake { animation: none; } }
      `}</style>

      <div aria-hidden="true" className="hero-bg pointer-events-none fixed inset-0 -z-10" />

      {!authed ? (
        /* ---------------- Passcode gate ---------------- */
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div
            ref={cardRef}
            className="glass relative w-full max-w-md overflow-hidden rounded-3xl shadow-card"
          >
            <HalftoneStrip />
            <div className="px-6 pb-8 pt-6 sm:px-9">
              <div className="flex flex-col items-center text-center">
                <StrawHatMark className="h-12 w-16" />
                <h1 className="title-hero font-display mt-3 text-4xl tracking-[0.08em] sm:text-5xl">
                  ADMIN CONSOLE
                </h1>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-cream/50 sm:text-xs">
                  Otaku Club · VIT Bhopal
                </p>
                <p className="mt-4 text-sm leading-relaxed text-cream/60">
                  Crew only. Enter the club passcode to manage events and gate bookings.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
                <label htmlFor="ac-pass" className="sr-only">
                  Passcode
                </label>
                <input
                  ref={inputRef}
                  id="ac-pass"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Passcode"
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value);
                    if (wrong) setWrong(false);
                  }}
                  aria-invalid={wrong || undefined}
                  aria-describedby={wrong ? 'ac-pass-error' : undefined}
                  className="w-full rounded-xl border border-white/10 bg-ink-900/70 px-4 py-3 text-center text-cream tracking-[0.3em] transition placeholder:text-sm placeholder:tracking-normal placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none focus:ring-2 focus:ring-straw-500/30"
                />
                <button type="submit" className="btn-gold w-full">
                  Enter console
                </button>
                {wrong && (
                  <p
                    id="ac-pass-error"
                    role="alert"
                    className="text-center text-sm font-semibold text-ember-400"
                  >
                    Wrong passcode — this console is for club crew.
                  </p>
                )}
              </form>

              <div className="mt-6 border-t border-white/5 pt-4 text-center">
                <a
                  href={import.meta.env.BASE_URL}
                  className="text-xs font-semibold text-cream/40 transition hover:text-cream/70"
                >
                  &larr; Back to site
                </a>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ---------------- Authenticated console ---------------- */
        <>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-5xl items-center gap-2.5 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
              <StrawHatMark className="h-8 w-11 shrink-0 sm:h-10 sm:w-14" />
              <div className="min-w-0 flex-1">
                <h1 className="title-hero font-display text-xl leading-none tracking-[0.08em] sm:text-3xl">
                  ADMIN CONSOLE
                </h1>
                <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.24em] text-cream/50 sm:text-xs">
                  Otaku Club · VIT Bhopal
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <a
                  href={import.meta.env.BASE_URL}
                  className="text-[11px] font-semibold text-cream/50 transition hover:text-straw-300 sm:text-xs"
                >
                  &larr; <span className="hidden sm:inline">Back to site</span>
                </a>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cream/70 transition hover:border-ember-500/50 hover:text-ember-400 sm:text-xs"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Dashboard overview strip */}
          <section aria-label="Overview" className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {([
                ['Events live', String(overview.events), 'events'],
                ['Tickets issued', String(overview.tickets), 'tickets'],
                ['Seats sold', String(overview.seats), 'tickets'],
                ['Expected revenue', overview.revenue > 0 ? `₹${overview.revenue.toLocaleString('en-IN')}` : '₹0', 'tickets'],
                ['Pending', String(overview.pending), 'tickets'],
              ] as Array<[string, string, string]>).map(([label, value, tab]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNavigate?.(tab)}
                  className="glass rounded-2xl p-3.5 text-left transition hover:border-straw-500/40 sm:p-4"
                >
                  <p className="font-display text-2xl leading-none text-straw-300 sm:text-3xl">{value}</p>
                  <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-cream/60">{label}</p>
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-straw-500/40 bg-straw-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-straw-300">
                {overview.checkins} seats checked in at the gate
              </span>
              <span className="text-[11px] text-cream/35">Click a stat to open its section.</span>
            </div>
          </section>

          <nav aria-label="Admin sections" className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto py-3 sm:py-4">
              {tabs.map((tab) => {
                const isActive = tab.id === active?.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveId(tab.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={
                      'whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all duration-200 sm:px-5 ' +
                      (isActive
                        ? 'bg-gradient-to-b from-straw-300 to-straw-500 text-ink-950 shadow-[0_8px_24px_-8px_rgba(226,169,74,0.65)]'
                        : 'border border-white/10 bg-white/[0.03] text-cream/60 hover:border-straw-500/40 hover:text-cream')
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-14 pt-2 sm:px-6 sm:pt-3">
            {active ? <div key={active.id}>{active.content}</div> : null}
          </main>
        </>
      )}

      <footer className="border-t border-white/5 py-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 text-[11px] text-cream/40 sm:flex-row sm:px-6">
          <p>Demo console - data lives in this browser's localStorage.</p>
          <a
            href={`${import.meta.env.BASE_URL}verify.html`}
            className="font-semibold text-straw-400/80 underline-offset-4 transition hover:text-straw-300 hover:underline"
          >
            Gate scanner &rarr;
          </a>
        </div>
      </footer>
    </div>
  );
}
