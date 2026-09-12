import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { makeTicketCode } from '../../lib/ticketCode';
import type { EventItem, TicketRecord, TicketStatus } from '../../types';

/**
 * Manga-page e-ticket: cream paper, angled ink panels separated by paper
 * gutters, halftone grain, speed lines and the club's straw-hat motif.
 * The QR encodes the signed ticket code from lib/ticketCode.ts — the host
 * scans it offline at entry. The status ribbon + blurred QR handle the
 * unpaid "pending" state.
 */

const RIBBON: Record<TicketStatus, { label: string; cls: string }> = {
  pending: { label: 'AWAITING PAYMENT VERIFICATION', cls: 'bg-straw-500 text-ink-950' },
  active: { label: 'CONFIRMED — VALID ENTRY PASS', cls: 'bg-[#4c7a3f] text-cream' },
  checked_in: { label: 'ALREADY CHECKED IN', cls: 'bg-[#a79d87] text-[#2e2a22]' },
};

export default function ETicket({
  record,
  event,
  onDone,
}: {
  record: TicketRecord;
  event: EventItem;
  onDone: () => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [code, setCode] = useState('');
  const pending = record.status === 'pending';
  const ribbon = RIBBON[record.status];
  const amount = record.amount === 0 ? 'FREE' : `₹${record.amount}`;

  useEffect(() => {
    setCode(
      makeTicketCode({
        ref: record.ref,
        eventId: record.eventId,
        name: record.name,
        seats: record.seats,
        ts: Date.parse(record.createdAt),
      }),
    );
  }, [record]);

  return (
    <div className="mx-auto w-full max-w-md">
      {/* ==================== the paper ==================== */}
      <div className="eticket-print relative overflow-hidden rounded-2xl border-2 border-ink-900 bg-[#ece4d0] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.85),0_0_0_1px_rgba(226,169,74,0.16)]">
        {/* halftone paper grain, under the panels */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id={`ht-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.05" fill="#0b0b13" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#ht-${uid})`} opacity="0.06" />
        </svg>

        {/* status ribbon */}
        <div
          className={`relative flex min-h-9 items-center justify-center gap-1.5 border-b-2 border-ink-900 px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] ${ribbon.cls}`}
        >
          <RibbonIcon status={record.status} />
          {ribbon.label}
        </div>

        {/* ===== header panel: club identity + straw hat ===== */}
        <div className="relative px-3 pt-3">
          <div className="relative -rotate-1 overflow-hidden rounded-[3px] bg-ink-900 p-4 shadow-[4px_5px_0_rgba(11,11,19,0.15)]">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <pattern id={`hth-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
                  <circle cx="3.5" cy="3.5" r="1.15" fill="#ece4d0" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#hth-${uid})`} opacity="0.1" />
            </svg>
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold tracking-[0.3em] text-straw-400">
                  Otaku Club
                </div>
                <div className="mt-1.5 font-display text-[30px] leading-[0.9] tracking-[0.05em] text-cream">
                  E-TICKET
                </div>
                <div className="mt-1 text-[9px] font-bold tracking-[0.26em] text-cream/55">
                  VIT BHOPAL · EST. 2021
                </div>
              </div>
              <StrawHat className="w-[92px] shrink-0" />
            </div>
          </div>
        </div>

        {/* ===== event details panel ===== */}
        <div className="relative mt-2.5 px-3">
          <div className="relative rotate-[0.7deg] rounded-[3px] bg-ink-900 p-4 shadow-[4px_5px_0_rgba(11,11,19,0.15)]">
            <div className="text-[9px] font-extrabold tracking-[0.3em] text-straw-500">
              NOW SHOWING
            </div>
            <h3 className="mt-1.5 max-w-[calc(100%-5.5rem)] font-display text-[30px] leading-[0.92] tracking-[0.03em] text-cream">
              {event.title}
            </h3>
            <div className="mt-2 h-[3px] w-14 bg-straw-500" />

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <MetaRow icon={<IconCal />} label={event.date} />
              <MetaRow icon={<IconClock />} label={event.time} />
            </div>
            <MetaRow className="mt-2" icon={<IconPin />} label={event.venue} />

            <div className="mt-3.5 border-t border-dashed border-cream/20 pt-3">
              <div className="grid grid-cols-[1.5fr_0.6fr_0.9fr] gap-3">
                <Field label="ATTENDEE" value={record.name} />
                <Field label="SEATS" value={String(record.seats)} />
                <Field label="AMOUNT" value={amount} accent={record.amount === 0} />
              </div>
            </div>

            <AdmitStamp seats={record.seats} />
          </div>
        </div>

        {/* ===== perforated tear line ===== */}
        <div className="relative my-3.5 h-7" aria-hidden="true">
          <Scissors className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-900/45" />
          <div className="absolute inset-x-11 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-ink-900/35" />
          <div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#07070c] shadow-[inset_0_0_0_1px_rgba(236,228,208,0.12)]" />
          <div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#07070c] shadow-[inset_0_0_0_1px_rgba(236,228,208,0.12)]" />
        </div>

        {/* ===== QR panel (the stub you keep) ===== */}
        <div className="relative px-3">
          <div className="relative -rotate-[0.7deg] rounded-[3px] bg-ink-900 px-4 py-4 shadow-[4px_5px_0_rgba(11,11,19,0.15)]">
            <div className="flex items-center justify-center gap-2.5">
              <Sparkle className="h-3.5 w-3.5 text-straw-400" />
              <span className="font-display text-[19px] leading-none tracking-[0.22em] text-straw-400">
                SCAN AT ENTRY
              </span>
              <Sparkle className="h-3.5 w-3.5 text-straw-400" />
            </div>

            <div className="relative mx-auto mt-4 w-fit">
              {/* viewfinder corners */}
              <span aria-hidden="true" className="absolute -left-2.5 -top-2.5 h-4 w-4 border-l-[3px] border-t-[3px] border-straw-500" />
              <span aria-hidden="true" className="absolute -right-2.5 -top-2.5 h-4 w-4 border-r-[3px] border-t-[3px] border-straw-500" />
              <span aria-hidden="true" className="absolute -bottom-2.5 -left-2.5 h-4 w-4 border-b-[3px] border-l-[3px] border-straw-500" />
              <span aria-hidden="true" className="absolute -bottom-2.5 -right-2.5 h-4 w-4 border-b-[3px] border-r-[3px] border-straw-500" />

              <div className="relative rounded-[3px] bg-[#ece4d0] p-3">
                {code ? (
                  <div className={pending ? 'pointer-events-none opacity-50 blur-[3px]' : undefined}>
                    <QRCodeSVG value={code} size={150} level="M" fgColor="#0b0b13" bgColor="#ece4d0" />
                  </div>
                ) : (
                  <div className="grid h-[150px] w-[150px] animate-pulse place-items-center rounded-[3px]">
                    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-ink-900/15 border-t-straw-600 motion-reduce:animate-none" />
                  </div>
                )}
                {pending && (
                  <div className="absolute inset-0 grid place-items-center p-3">
                    <p className="text-center text-[10.5px] font-extrabold leading-snug text-ink-900">
                      Unlocks once the host verifies your payment
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-center font-mono text-[10.5px] tracking-wide text-cream/70">
              Verification code: <span className="font-bold text-straw-300">{record.ref}</span>
            </p>
          </div>
        </div>

        {/* ===== straw footer strip ===== */}
        <div className="relative mt-4 flex items-center justify-between gap-2 rounded-b-[14px] bg-[linear-gradient(160deg,#f6d98b,#e2a94a_55%,#c9862d)] px-4 py-2.5">
          <span className="font-display text-[15px] leading-none tracking-[0.12em] text-ink-950">
            Otaku Club · VIT BHOPAL
          </span>
          <span className="shrink-0 text-[8.5px] font-extrabold tracking-[0.2em] text-ink-950/70">
            NON-TRANSFERABLE
          </span>
        </div>
      </div>

      {/* ==================== controls ==================== */}
      <div className="mt-6">
        <button type="button" onClick={onDone} className="btn-gold w-full">
          Done
        </button>
        <p className="mt-3.5 flex items-center justify-center gap-2 text-center text-[11.5px] font-medium text-cream/55">
          <IconCamera className="h-3.5 w-3.5 shrink-0" />
          Screenshot this ticket — it scans offline.
        </p>
      </div>
    </div>
  );
}

/* ==================== pieces ==================== */

function MetaRow({ icon, label, className = '' }: { icon: ReactNode; label: string; className?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span className="shrink-0 text-straw-400">{icon}</span>
      <span className="truncate text-[12.5px] font-semibold text-cream/90">{label}</span>
    </div>
  );
}

function Field({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-extrabold tracking-[0.22em] text-straw-500">{label}</div>
      <div className={`mt-0.5 truncate text-sm font-extrabold ${accent ? 'text-straw-300' : 'text-cream'}`}>
        {value}
      </div>
    </div>
  );
}

/** Rotated "ADMIT N" ink stamp, like a mark pressed onto the ticket. */
function AdmitStamp({ seats }: { seats: number }) {
  return (
    <div className="absolute right-2 top-2.5 -rotate-12 select-none" aria-hidden="true">
      <div className="rounded-full border-[2.5px] border-straw-500/90 p-[3px]">
        <div className="grid w-[72px] place-items-center rounded-full border border-dashed border-straw-500/60 px-2 py-1.5">
          <span className="text-[8px] font-extrabold tracking-[0.3em] text-straw-400">ADMIT</span>
          <span className="font-display text-[26px] leading-none text-straw-400">{seats}</span>
        </div>
      </div>
    </div>
  );
}

/* ==================== inline art ==================== */

/** Original straw-hat silhouette with speed streaks — the club's motif. */
function StrawHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 76" className={className} aria-hidden="true">
      <g stroke="#e2a94a" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
        <line x1="2" y1="24" x2="24" y2="24" />
        <line x1="10" y1="40" x2="30" y2="40" />
        <line x1="4" y1="56" x2="22" y2="56" />
      </g>
      <g transform="translate(26 6)">
        <ellipse cx="50" cy="50" rx="48" ry="11" fill="#92651f" />
        <ellipse cx="50" cy="47" rx="48" ry="11" fill="#e2a94a" />
        <path d="M22 47C22 24 33 12 50 12s28 12 28 35Z" fill="#f0c66a" stroke="#0b0b13" strokeWidth="2.4" />
        <path d="M22.8 36.5c16-4 40.4-4 54.4 0l.8 10.5c-15.6-4.4-40.4-4.4-56 0Z" fill="#c73a3a" stroke="#0b0b13" strokeWidth="1.7" />
        <ellipse cx="39" cy="24" rx="4.6" ry="6" fill="#ffe9b8" opacity="0.7" />
      </g>
    </svg>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="currentColor" />
    </svg>
  );
}

function Scissors({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.3 7.4 20 18M8.3 16.6 20 6" />
    </svg>
  );
}

function RibbonIcon({ status }: { status: TicketStatus }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (status === 'pending') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  }
  if (status === 'active') {
    return (
      <svg {...common}>
        <path d="M4.5 12.5 10 18 19.5 6.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M2.5 12.5 8 18 17.5 6.5" />
      <path d="M13.5 16.5 15 18 21.5 6.5" opacity="0.55" />
    </svg>
  );
}

/* ==================== tiny row icons ==================== */

function IconCal() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7l1.5-2.5h3L15 7" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}
