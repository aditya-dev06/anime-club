/*
 * Admin console — "Bookings & Gate" tab.
 *
 * Reads ticket bookings from localStorage ('ac-bookings', written by the
 * booking flow on the main site) and lets the host verify payments, undo
 * verifications, delete stray bookings, and jump to the /verify gate
 * scanner. Recent gate check-ins come from the shared check-in log
 * (see lib/ticketCode.ts).
 */

import { useEffect, useMemo, useState } from 'react';
import { loadCheckins, type CheckinRecord } from '../lib/ticketCode';
import type { TicketRecord, TicketStatus } from '../types';

const BOOKINGS_KEY = 'ac-bookings';

function normalizeBooking(b: Partial<TicketRecord>): TicketRecord {
  return {
    ref: typeof b.ref === 'string' ? b.ref : 'AC-??-0000',
    eventId: b.eventId ?? 'unknown',
    eventTitle: b.eventTitle ?? b.eventId ?? 'Unknown event',
    name: b.name ?? '—',
    email: b.email ?? '',
    seats: typeof b.seats === 'number' ? b.seats : 1,
    amount: typeof b.amount === 'number' ? b.amount : 0,
    status: b.status === 'pending' || b.status === 'checked_in' ? b.status : 'active',
    createdAt: b.createdAt ?? new Date(0).toISOString(),
  };
}

function loadBookings(): TicketRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? '[]') as TicketRecord[];
    return Array.isArray(parsed) ? parsed.map(normalizeBooking) : [];
  } catch {
    return [];
  }
}

function persistBookings(list: TicketRecord[]): void {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — keep working in-memory */
  }
}

function rupees(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

/* Wrap a CSV cell in quotes (and double any inner quotes) when needed. */
function csvCell(value: string | number): string {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* Download the given bookings as anime-club-bookings-<date>.csv. */
function downloadBookingsCsv(rows: TicketRecord[]): void {
  const header = ['ref', 'status', 'eventTitle', 'name', 'email', 'seats', 'amount', 'createdAt'];
  const lines = rows.map((b) =>
    [b.ref, b.status, b.eventTitle, b.name, b.email, b.seats, b.amount, b.createdAt]
      .map(csvCell)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anime-club-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function epochOf(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

const STATUS_META: Record<TicketStatus, { label: string; className: string }> = {
  pending: {
    label: 'PENDING',
    className: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  },
  active: {
    label: 'ACTIVE',
    className: 'border-straw-500/50 bg-straw-500/10 text-straw-300',
  },
  checked_in: {
    label: 'CHECKED IN',
    className: 'border-white/10 bg-white/5 text-cream/50',
  },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

interface StatCard {
  label: string;
  value: string;
  hint: string;
}

function Stat({ stat }: { stat: StatCard }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <p className="font-display text-3xl leading-none text-straw-400 sm:text-4xl">{stat.value}</p>
      <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream/80">
        {stat.label}
      </p>
      <p className="mt-1 text-xs text-cream/40">{stat.hint}</p>
    </div>
  );
}

export default function TicketsManager() {
  const [bookings, setBookings] = useState<TicketRecord[]>(loadBookings);
  const [checkins, setCheckins] = useState<CheckinRecord[]>(loadCheckins);
  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [confirmingRef, setConfirmingRef] = useState<string | null>(null);

  /* Reset a half-armed delete if the pointer moves away from that row. */
  useEffect(() => {
    if (!confirmingRef) return;
    const clear = () => setConfirmingRef(null);
    window.addEventListener('click', clear);
    return () => window.removeEventListener('click', clear);
  }, [confirmingRef]);

  const updateBookings = (next: TicketRecord[]) => {
    setBookings(next);
    persistBookings(next);
  };

  const setStatus = (ref: string, status: TicketStatus) => {
    updateBookings(bookings.map((b) => (b.ref === ref ? { ...b, status } : b)));
  };

  const deleteBooking = (ref: string) => {
    updateBookings(bookings.filter((b) => b.ref !== ref));
  };

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => epochOf(b.createdAt) - epochOf(a.createdAt)),
    [bookings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((b) => {
      if (eventFilter !== 'all' && b.eventTitle !== eventFilter) return false;
      if (!q) return true;
      return [b.ref, b.name, b.email, b.eventTitle].some((v) =>
        String(v ?? '').toLowerCase().includes(q),
      );
    });
  }, [sorted, query, eventFilter]);

  /* Distinct event titles for the per-event filter dropdown. */
  const eventTitles = useMemo(
    () => [...new Set(bookings.map((b) => b.eventTitle))].sort((a, b) => a.localeCompare(b)),
    [bookings],
  );

  /* Drop the event filter if its event disappears from the records. */
  useEffect(() => {
    if (eventFilter !== 'all' && !eventTitles.includes(eventFilter)) setEventFilter('all');
  }, [eventTitles, eventFilter]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings],
  );

  const stats: StatCard[] = useMemo(() => {
    const seatsSold = bookings.reduce((sum, b) => sum + b.seats, 0);
    const revenue = bookings.reduce((sum, b) => (b.status === 'active' ? sum + b.amount : sum), 0);
    return [
      { label: 'Tickets issued', value: String(bookings.length), hint: 'All bookings on record' },
      { label: 'Seats sold', value: String(seatsSold), hint: 'Across every event' },
      {
        label: 'Expected revenue',
        value: rupees(revenue),
        hint: 'Verified (active) bookings only',
      },
      {
        label: 'Awaiting verification',
        value: String(pendingCount),
        hint: 'Pending payment proof',
      },
    ];
  }, [bookings, pendingCount]);

  /* Verified revenue + seats per event, sorted by revenue (desc). */
  const revenueByEvent = useMemo(() => {
    const map = new Map<string, { title: string; revenue: number; seats: number }>();
    for (const b of bookings) {
      const row = map.get(b.eventTitle) ?? { title: b.eventTitle, revenue: 0, seats: 0 };
      if (b.status === 'active') row.revenue += b.amount;
      row.seats += b.seats;
      map.set(b.eventTitle, row);
    }
    return [...map.values()].sort(
      (a, b) => b.revenue - a.revenue || a.title.localeCompare(b.title),
    );
  }, [bookings]);

  const totalVerifiedRevenue = useMemo(
    () => revenueByEvent.reduce((sum, r) => sum + r.revenue, 0),
    [revenueByEvent],
  );

  const checkedInSeats = useMemo(
    () => checkins.reduce((sum, c) => sum + (typeof c.seats === 'number' ? c.seats : 0), 0),
    [checkins],
  );

  const sortedCheckins = useMemo(
    () => [...checkins].sort((a, b) => epochOf(String(b.at)) - epochOf(String(a.at))),
    [checkins],
  );

  const fmtCheckinTime = (at: string | number): string => {
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
  };

  return (
    <section aria-label="Bookings and gate manager" className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="font-display text-4xl tracking-wide text-cream sm:text-5xl">
            Bookings &amp; Gate
          </h2>
          {pendingCount > 0 && (
            <span
              title="Bookings awaiting payment verification"
              className="inline-flex items-center whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-amber-300"
            >
              {pendingCount} pending verification
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-cream/50">
          Verify payments, manage e-tickets and run the door on event night.
        </p>
      </header>

      {/* Stats */}
      <div
        aria-live="polite"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <Stat key={s.label} stat={s} />
        ))}
      </div>

      {/* Revenue by event */}
      {bookings.length > 0 && (
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-2xl tracking-wide text-cream">Revenue by event</h3>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-cream/40">
              Verified only
            </span>
          </div>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {revenueByEvent.map((row) => {
              const pct =
                totalVerifiedRevenue > 0
                  ? Math.round((row.revenue / totalVerifiedRevenue) * 100)
                  : 0;
              /* Keep a visible sliver for events with any verified revenue. */
              const share = row.revenue > 0 ? Math.max(2, pct) : 0;
              return (
                <li key={row.title}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold text-cream/80">
                      {row.title}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-straw-400">
                      {rupees(row.revenue)}
                      <span className="ml-2 text-cream/40">
                        · {row.seats} {row.seats === 1 ? 'seat' : 'seats'}
                      </span>
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${share}% of verified revenue`}
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5"
                  >
                    <div
                      className="h-full rounded-full bg-straw-500"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bookings table */}
      <div className="glass rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h3 className="font-display text-2xl tracking-wide text-cream">Bookings</h3>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative block w-full sm:w-56">
              <span className="sr-only">Search bookings</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ref, name, email, event…"
                className="w-full rounded-xl border border-white/10 bg-ink-900/80 px-4 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none"
              />
            </label>
            <label className="min-w-0 flex-1 sm:flex-none">
              <span className="sr-only">Filter by event</span>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink-900/80 px-3 py-2 text-sm text-cream focus:border-straw-500/60 focus:outline-none sm:w-48"
              >
                <option value="all">All events</option>
                {eventTitles.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => downloadBookingsCsv(filtered)}
              disabled={filtered.length === 0}
              title="Download the current view as CSV"
              className="shrink-0 whitespace-nowrap rounded-lg border border-straw-500/40 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-straw-300 transition-colors hover:bg-straw-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-2xl tracking-wide text-cream/70">No bookings yet</p>
            <p className="mt-2 text-sm text-cream/40">
              Once fans book tickets on the site, they will show up here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-2xl tracking-wide text-cream/70">No matches</p>
            <p className="mt-2 text-sm text-cream/40">
              {query.trim()
                ? `Nothing matches “${query.trim()}”${
                    eventFilter === 'all' ? '' : ` under “${eventFilter}”`
                  }. Try a different reference or name.`
                : `No bookings for “${eventFilter}” yet. Try another event.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-cream/40">
                  <th scope="col" className="px-5 py-3 font-extrabold">Ref</th>
                  <th scope="col" className="px-3 py-3 font-extrabold">Attendee</th>
                  <th scope="col" className="px-3 py-3 font-extrabold">Event</th>
                  <th scope="col" className="px-3 py-3 font-extrabold">Seats</th>
                  <th scope="col" className="px-3 py-3 font-extrabold">Amount</th>
                  <th scope="col" className="px-3 py-3 font-extrabold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-extrabold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((b) => (
                  <tr key={b.ref} className="align-middle transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-straw-400">{b.ref}</span>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-cream">{b.name}</p>
                      <p className="text-xs text-cream/40">{b.email}</p>
                    </td>
                    <td className="px-3 py-4 text-cream/70">{b.eventTitle}</td>
                    <td className="px-3 py-4 text-cream/70">{b.seats}</td>
                    <td className="px-3 py-4 font-semibold text-cream/80">
                      {b.amount > 0 ? rupees(b.amount) : 'FREE'}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setStatus(b.ref, 'active')}
                            className="rounded-lg border border-straw-500/40 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-straw-300 transition-colors hover:bg-straw-500/10"
                          >
                            Verify payment
                          </button>
                        )}
                        {b.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setStatus(b.ref, 'pending')}
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cream/70 transition-colors hover:bg-white/5"
                          >
                            Undo verify
                          </button>
                        )}
                        {confirmingRef === b.ref ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBooking(b.ref);
                              setConfirmingRef(null);
                            }}
                            className="rounded-lg border border-ember-500/60 bg-ember-500/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ember-400 transition-colors hover:bg-ember-500/20"
                          >
                            Sure?
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Delete booking ${b.ref}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmingRef(b.ref);
                            }}
                            className="rounded-lg border border-transparent px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cream/40 transition-colors hover:border-ember-500/40 hover:text-ember-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gate */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5 sm:p-6">
          <h3 className="font-display text-2xl tracking-wide text-cream">Gate Scanner</h3>
          <p className="mt-2 text-sm leading-relaxed text-cream/60">
            On event night, open <span className="font-mono text-xs text-straw-400">/verify</span>{' '}
            on the door device to scan each attendee&apos;s e-ticket QR. The scanner validates the
            signed ticket code offline, flags re-entries, and logs every check-in below.
          </p>
          <a href="/verify" className="btn-gold mt-5">
            Open gate scanner
          </a>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl tracking-wide text-cream">Recent check-ins</h3>
            <button
              type="button"
              onClick={() => setCheckins(loadCheckins())}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cream/70 transition-colors hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
          <p className="mt-1 text-xs text-cream/40">
            {checkedInSeats} {checkedInSeats === 1 ? 'seat' : 'seats'} checked in at the gate
          </p>

          {sortedCheckins.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm font-semibold text-cream/60">No check-ins yet</p>
              <p className="mt-1 text-xs text-cream/40">
                Scans performed at the gate will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {sortedCheckins.map((c, i) => (
                <li
                  key={`${c.ref}-${c.at}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-cream">{c.name}</p>
                    <p className="font-mono text-[11px] text-straw-400/80">{c.ref}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-cream/70">
                      {c.seats} {c.seats === 1 ? 'seat' : 'seats'}
                    </p>
                    <p className="text-[11px] text-cream/40">{fmtCheckinTime(c.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
