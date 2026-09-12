import { useEffect, useState } from 'react';
import type { TicketRecord } from '../types';

function loadBookings(): TicketRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('ac-bookings') ?? '[]') as TicketRecord[];
    return Array.isArray(parsed)
      ? parsed.map((b) => ({
          ...b,
          name: b.name ?? '—',
          eventTitle: b.eventTitle ?? b.eventId ?? 'Unknown event',
          email: b.email ?? '',
          seats: typeof b.seats === 'number' ? b.seats : 1,
          amount: typeof b.amount === 'number' ? b.amount : 0,
          status: b.status === 'pending' || b.status === 'checked_in' ? b.status : 'active',
          createdAt: b.createdAt ?? new Date(0).toISOString(),
        }))
      : [];
  } catch {
    return [];
  }
}

const STATUS_UI: Record<TicketRecord['status'], { label: string; cls: string; hint: string }> = {
  pending: {
    label: 'AWAITING PAYMENT VERIFICATION',
    cls: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
    hint: 'The club is verifying your UPI payment — your e-ticket unlocks automatically.',
  },
  active: {
    label: 'CONFIRMED — VALID ENTRY PASS',
    cls: 'border-straw-500/60 bg-straw-500/10 text-straw-300',
    hint: 'Screenshot your e-ticket and bring it with your VIT ID.',
  },
  checked_in: {
    label: 'CHECKED IN',
    cls: 'border-white/15 bg-white/5 text-cream/60',
    hint: 'Already scanned at the gate. Enjoy the show!',
  },
};

/** Attendee-side ticket status lookup by booking reference. */
export default function MyTickets() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TicketRecord[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [count, setCount] = useState(0);

  const refresh = () => setCount(loadBookings().length);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ac-bookings') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const search = () => {
    const q = query.trim().toUpperCase();
    if (!q) return;
    const all = loadBookings();
    const matches = all.filter((b) => b.ref.toUpperCase().startsWith(q));
    setResults(matches);
    setNotFound(matches.length === 0);
  };

  return (
    <div className="grid gap-8 rounded-[28px] glass p-8 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.4em] text-straw-300/80">
          Already booked?
        </p>
        <h3 className="font-display text-5xl leading-[0.92] tracking-wide text-cream">MY TICKETS</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/60">
          Enter the reference from your e-ticket to check its status — including whether the club
          has verified your payment yet.
        </p>
        <p className="mt-2 text-xs text-cream/35">
          {count} {count === 1 ? 'booking' : 'bookings'} on this device.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="AC-XX-1234"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm tracking-wider text-cream placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none sm:max-w-56"
            aria-label="Booking reference"
          />
          <button className="btn-gold shrink-0" onClick={search}>
            Check status
          </button>
        </div>

        {notFound && (
          <p role="alert" className="mt-4 text-sm font-semibold text-ember-400">
            No booking found for that reference.
          </p>
        )}
      </div>

      <div aria-live="polite" className="space-y-3">
        {results && results.length === 0 && null}
        {results?.map((b) => {
          const ui = STATUS_UI[b.status];
          return (
            <div key={b.ref} className={`rounded-2xl border-2 ${ui.cls.split(' ')[0]} bg-white/[0.03] p-5`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-bold text-straw-300">{b.ref}</span>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${ui.cls}`}>
                  {ui.label}
                </span>
              </div>
              <p className="mt-2 font-display text-2xl tracking-wide text-cream">{b.eventTitle}</p>
              <p className="mt-1 text-xs text-cream/55">
                {b.name} · {b.seats} {b.seats === 1 ? 'seat' : 'seats'} · {b.amount > 0 ? `₹${b.amount}` : 'FREE'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-cream/50">{ui.hint}</p>
            </div>
          );
        })}
        {notFound && null}
      </div>
    </div>
  );
}
