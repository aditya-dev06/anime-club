import { useEffect, useMemo, useRef, useState } from 'react';
import type { EventItem, TicketRecord } from '../types';
import UpiCheckout from './ticket/UpiCheckout';
import ETicket from './ticket/ETicket';

interface Props {
  event: EventItem;
  onClose: () => void;
  /** Fired once when the ticket unlocks (payment verified) — updates seat meters. */
  onBooked?: (eventId: string, seats: number) => void;
}

/* Booking flow steps in order — drives the progress strip and slide direction. */
const STEPS = [
  { id: 'form', label: 'Details' },
  { id: 'upi', label: 'Payment' },
  { id: 'ticket', label: 'E-Ticket' },
] as const;

function loadBookings(): TicketRecord[] {
  try {
    return JSON.parse(localStorage.getItem('ac-bookings') ?? '[]') as TicketRecord[];
  } catch {
    return [];
  }
}

/** Upsert by ref so re-verification flips the stored status in place. */
function persistBooking(record: TicketRecord): TicketRecord[] {
  const next = [...loadBookings().filter((b) => b.ref !== record.ref), record];
  try {
    localStorage.setItem('ac-bookings', JSON.stringify(next));
  } catch {
    /* storage unavailable — booking still confirmed in-session */
  }
  return next;
}

export default function BookingModal({ event, onClose, onBooked }: Props) {
  const [step, setStep] = useState<'form' | 'upi' | 'ticket'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [seats, setSeats] = useState(1);
  const [record, setRecord] = useState<TicketRecord | null>(null);
  const [error, setError] = useState('');
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const total = event.price * seats;
  const maxSeats = Math.min(6, event.seatsLeft);
  const refCode = useMemo(
    () => `AC-${event.id.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    [event.id],
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  /* Direction-aware slide: remember the previous step index so the body slides
     left on forward moves and right when navigating back a step. */
  const prevStepIndexRef = useRef(stepIndex);
  const slideDirRef = useRef<'forward' | 'back'>('forward');
  if (stepIndex !== prevStepIndexRef.current) {
    slideDirRef.current = stepIndex > prevStepIndexRef.current ? 'forward' : 'back';
    prevStepIndexRef.current = stepIndex;
  }
  const slideDir = slideDirRef.current;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      /* Keep keyboard focus inside the dialog and restore it on close. */
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('button, input, [href], select, textarea'),
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && root.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  /* A fresh step starts from the top of the scrollable body. */
  useEffect(() => {
    scrollBodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    const booking: TicketRecord = {
      ref: refCode,
      eventId: event.id,
      eventTitle: event.title,
      name: name.trim(),
      email: email.trim(),
      seats,
      amount: event.price * seats,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    persistBooking(booking);
    setRecord(booking);
    setStep('upi');
  };

  /** The host (or demo simulation) verified the payment — unlock the ticket. */
  const verifyPayment = () => {
    if (!record) return;
    const active: TicketRecord = { ...record, status: 'active' };
    persistBooking(active);
    setRecord(active);
    onBooked?.(event.id, active.seats);
    setStep('ticket');
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Book tickets for ${event.title}`}
    >
      {/* Scoped styles: step slide transitions + current-step ring pulse.
          Motion is fully disabled under prefers-reduced-motion. */}
      <style>{`
        @keyframes bm-slide-fwd {
          from { opacity: 0; transform: translateX(32px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bm-slide-back {
          from { opacity: 0; transform: translateX(-32px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .bm-slide-fwd { animation: bm-slide-fwd 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .bm-slide-back { animation: bm-slide-back 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @keyframes bm-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(226, 169, 74, 0.35); }
          55% { box-shadow: 0 0 0 6px rgba(226, 169, 74, 0); }
        }
        .bm-step-live { animation: bm-ring-pulse 2.2s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bm-slide-fwd, .bm-slide-back, .bm-step-live { animation: none; }
        }
      `}</style>

      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-md"
      />

      {/* Panel is now a flex column: notch + step strip stay fixed on top,
          only the step body scrolls (max-height behaviour preserved). */}
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl glass shadow-card">
        {/* Ticket notch line */}
        <div className="relative shrink-0 border-b border-dashed border-white/15" aria-hidden="true">
          <span className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-ink-950" />
          <span className="absolute -bottom-2.5 -right-2.5 h-5 w-5 rounded-full bg-ink-950" />
        </div>

        {/* Step indicator — fixed chrome shown on every step */}
        <nav aria-label="Booking steps" className="shrink-0 border-b border-white/5 px-5 pb-3.5 pt-4 sm:px-7">
          <ol className="flex items-center">
            {STEPS.map((s, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              const last = i === STEPS.length - 1;
              return (
                <li key={s.id} className={`flex min-w-0 items-center ${last ? '' : 'flex-1'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (done) setStep(s.id);
                    }}
                    disabled={!done}
                    aria-current={current ? 'step' : undefined}
                    aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.label}${done ? ' — go back' : ''}`}
                    className={`flex min-w-0 items-center gap-2 rounded-full ${done ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-display text-[15px] leading-none transition-colors ${
                        done
                          ? 'border-straw-500 bg-straw-500 text-ink-950'
                          : current
                            ? 'border-2 border-straw-500 bg-straw-500/10 text-straw-300 bm-step-live'
                            : 'border-white/15 text-cream/30'
                      }`}
                    >
                      {done ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path d="M5 12.5l4.5 4.5L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={`hidden font-display text-[13px] uppercase tracking-[0.18em] sm:inline ${
                        done ? 'text-straw-300/90' : current ? 'text-cream' : 'text-cream/30'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {!last && (
                    <span
                      aria-hidden="true"
                      className={`ml-2.5 h-px flex-1 ${done ? 'bg-straw-500/60' : 'bg-white/10'}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Scrollable step body — keyed by step so it replays the slide */}
        <div ref={scrollBodyRef} className="min-h-0 flex-1 overflow-y-auto">
          <div key={step} className={slideDir === 'forward' ? 'bm-slide-fwd' : 'bm-slide-back'}>
            {step === 'form' && (
              <form onSubmit={submit} className="p-6 sm:p-8">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.34em] text-straw-300/80">Anime Club · VIT Bhopal</p>
                <h3 className="mt-1 font-display text-4xl leading-none tracking-wide text-cream">{event.title}</h3>
                <p className="mt-2 text-xs text-cream/55">
                  {event.date} · {event.venue}
                </p>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-cream/60">Name</span>
                    <input
                      ref={firstFieldRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-cream/60">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@vitbhopal.ac.in"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-cream/60">Seats</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <button
                          type="button"
                          onClick={() => setSeats((s) => Math.max(1, s - 1))}
                          className="px-4 py-3 text-lg font-bold text-cream/70 transition hover:text-straw-300 disabled:opacity-30"
                          disabled={seats <= 1}
                          aria-label="Decrease seats"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-display text-2xl text-cream">{seats}</span>
                        <button
                          type="button"
                          onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                          className="px-4 py-3 text-lg font-bold text-cream/70 transition hover:text-straw-300 disabled:opacity-30"
                          disabled={seats >= maxSeats}
                          aria-label="Increase seats"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-cream/45">max {maxSeats} per booking</span>
                    </div>
                  </div>
                </div>

                <div aria-live="polite" className="mt-6 flex items-center justify-between rounded-2xl border border-straw-500/20 bg-straw-500/[0.07] px-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cream/60">Total</span>
                  <span className="font-display text-3xl text-straw-300">
                    {total === 0 ? 'FREE' : `₹${total}`}
                  </span>
                </div>

                {error && (
                  <p role="alert" className="mt-3 text-xs font-semibold text-ember-400">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/12 px-4 py-3 text-sm font-bold text-cream/70 transition hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold flex-[1.4]">
                    {total === 0 ? 'Get Free Pass' : 'Continue to Pay'}
                  </button>
                </div>
              </form>
            )}

            {step === 'upi' && record && (
              <UpiCheckout record={record} event={event} onVerified={verifyPayment} onBack={() => setStep('form')} />
            )}

            {step === 'ticket' && record && <ETicket record={record} event={event} onDone={onClose} />}
          </div>
        </div>
      </div>
    </div>
  );
}
