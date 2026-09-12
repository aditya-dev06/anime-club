import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { EventItem, TicketRecord } from '../../types';

const UPI_ID = 'animeclubvitb@upi';
const UPI_NAME = 'Anime Club VIT Bhopal';

/**
 * Booking flow step 2: the guest pays the club's UPI ID. The host verifies the
 * payment before the e-ticket unlocks — in this demo build there is a
 * clearly-labelled instant verification shortcut.
 * State machine: 'pay' -> 'pending' -> (parent flips the ticket to active).
 */
export default function UpiCheckout({ record, event, onVerified, onBack }: {
  record: TicketRecord;
  event: EventItem;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<'pay' | 'pending'>('pay');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  /* Deep link the UPI app parses: pa = payee, pn = payee name, am = amount,
     cu = currency, tn = transaction note (we put the booking reference there). */
  const upiLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set('pa', UPI_ID);
    params.set('pn', UPI_NAME);
    if (record.amount > 0) params.set('am', String(record.amount));
    params.set('cu', 'INR');
    params.set('tn', record.ref);
    /* URLSearchParams encodes spaces as '+', but UPI apps expect '%20'. */
    return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
  }, [record.amount, record.ref]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the ID stays on screen for manual entry */
    }
  };

  const free = record.amount === 0;
  const seatsLabel = `${record.seats} ${record.seats === 1 ? 'seat' : 'seats'}`;

  return (
    <div className="p-6 sm:p-8">
      <div aria-live="polite">
        {/* Angled ink panel header, like a manga page banner */}
        <header className="relative -rotate-1 overflow-hidden rounded-2xl bg-ink-900 ring-1 ring-white/10">
          <Halftone className="absolute inset-0 h-full w-full opacity-[0.12]" />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-straw-300 via-straw-500 to-straw-600"
          />
          <div className="relative flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.34em] text-straw-400">
                Anime Club · VIT Bhopal
              </p>
              <h3 className="mt-1 font-display text-4xl leading-none tracking-wide text-cream">
                {free ? 'FREE ENTRY' : 'UPI CHECKOUT'}
              </h3>
            </div>
            {/* sfx sparkle */}
            <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0 -rotate-6" aria-hidden="true">
              <path
                d="M20 3l4.4 12.6L37 20l-12.6 4.4L20 37l-4.4-12.6L3 20l12.6-4.4Z"
                fill="#e2a94a"
                stroke="#0b0b13"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </header>

        <p className="mb-4 mt-4 text-xs text-cream/55">
          {event.title} · {seatsLabel} · {event.date}
        </p>

        {free ? (
          /* ---- Free event: no UPI UI, straight to the unlock ---- */
          <div>
            <div className="flex items-center justify-between rounded-2xl border border-straw-500/25 bg-straw-500/[0.07] px-4 py-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream/60">Total due</span>
              <span className="font-display text-4xl leading-none text-straw-300">FREE</span>
            </div>
            <button type="button" onClick={onVerified} className="btn-gold mt-5 w-full px-6 py-3.5 text-base">
              Get free ticket
            </button>
            <button
              type="button"
              onClick={onBack}
              className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-cream/65 transition hover:bg-white/5"
            >
              Back
            </button>
          </div>
        ) : step === 'pay' ? (
          /* ---- Pay step ---- */
          <div>
            <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-straw-500/25 bg-straw-500/[0.07] px-4 py-4">
              <Halftone dotColor="#e2a94a" className="absolute inset-0 h-full w-full opacity-[0.15]" />
              <span className="relative text-[10px] font-bold uppercase tracking-[0.3em] text-cream/60">Total due</span>
              <span className="relative font-display text-4xl leading-none text-straw-300">₹{record.amount}</span>
            </div>

            {/* QR on cream paper — dark modules on light ground so it scans */}
            <div className="relative mt-4 flex flex-col items-center overflow-hidden rounded-2xl bg-[#ece4d0] px-6 py-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.9)]">
              <Halftone dotColor="#0b0b13" className="absolute inset-0 h-full w-full opacity-[0.06]" />
              <QRCodeSVG
                value={upiLink}
                size={190}
                fgColor="#0b0b13"
                bgColor="#ece4d0"
                level="M"
                marginSize={2}
                title={`UPI QR code for booking ${record.ref}`}
                className="relative"
              />
              <p className="relative mt-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-ink-900/70">
                Scan with any UPI app
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-cream/40">or tap below</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Pay anchor over manga speed lines; also advances to 'pending' */}
            <div className="relative mt-4 overflow-hidden rounded-2xl py-1">
              <SpeedLines className="pointer-events-none absolute inset-0 h-full w-full" />
              <a href={upiLink} onClick={() => setStep('pending')} className="btn-gold relative w-full px-6 py-3.5 text-base">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
                  <path d="M11 18.5h2" />
                </svg>
                Pay ₹{record.amount} via UPI
              </a>
            </div>
            <p className="mt-2 text-center text-[11px] text-cream/45">Opens GPay, PhonePe, Paytm or any UPI app.</p>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.28em] text-cream/45">Club UPI ID</p>
                <p className="mt-0.5 truncate font-mono text-sm font-bold text-cream">{UPI_ID}</p>
              </div>
              <button
                type="button"
                onClick={copyUpiId}
                className={
                  copied
                    ? 'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-straw-400/70 bg-straw-500/20 px-3 py-2 text-[11px] font-extrabold uppercase tracking-widest text-straw-200 transition'
                    : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-straw-500/40 bg-straw-500/10 px-3 py-2 text-[11px] font-extrabold uppercase tracking-widest text-straw-300 transition hover:bg-straw-500/20'
                }
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <span role="status" className="sr-only">{copied ? 'UPI ID copied to clipboard' : ''}</span>

            <p className="mt-4 rounded-xl border border-dashed border-straw-500/30 bg-straw-500/[0.05] px-4 py-3 text-xs leading-relaxed text-cream/60">
              Payment reference: <span className="font-mono font-bold tracking-wider text-straw-300">{record.ref}</span> —
              keep it in the payment note.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-cream/65 transition hover:bg-white/5"
            >
              Back
            </button>
          </div>
        ) : (
          /* ---- Pending verification step ---- */
          <div className="relative overflow-hidden rounded-2xl bg-ink-900/60 px-5 py-7 text-center ring-1 ring-white/10">
            <Halftone className="absolute inset-0 h-full w-full opacity-[0.07]" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={
                      reducedMotion
                        ? 'h-2.5 w-2.5 rounded-full bg-straw-400'
                        : 'h-2.5 w-2.5 animate-pulse rounded-full bg-straw-400'
                    }
                    style={reducedMotion ? undefined : { animationDelay: `${i * 180}ms` }}
                  />
                ))}
              </div>
              <h4 className="mt-4 font-display text-3xl leading-[0.9] tracking-wide text-cream">
                WAITING FOR PAYMENT VERIFICATION…
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-cream/60">
                Our crew verifies UPI payments and unlocks your ticket. You'll get it in seconds — keep this reference
                handy.
              </p>
              <div className="mt-4 inline-block rounded-lg border border-dashed border-straw-500/40 bg-straw-500/[0.06] px-4 py-2">
                <span className="font-mono text-lg font-bold tracking-wider text-straw-300">{record.ref}</span>
              </div>
              <button type="button" onClick={onVerified} className="btn-gold mt-5 w-full px-6 py-3.5 text-base">
                Simulate host verification (demo)
              </button>
              <button
                type="button"
                onClick={onBack}
                className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-cream/65 transition hover:bg-white/5"
              >
                Back
              </button>
              <p className="mt-4 text-[11px] leading-relaxed text-cream/40">
                In production this unlocks only after the club verifies the payment in their UPI app.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Light-weight halftone dot screen, the recurring manga texture. */
function Halftone({ className, dotColor = '#f2ecdd' }: { className?: string; dotColor?: string }) {
  const id = `ht${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1.7" fill={dotColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* Converging action lines behind the pay button, manga style. */
function SpeedLines({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 340 84" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g stroke="#e2a94a" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="2" y1="8" x2="88" y2="28" />
        <line x1="2" y1="26" x2="106" y2="37" />
        <line x1="2" y1="42" x2="98" y2="42" />
        <line x1="2" y1="58" x2="106" y2="47" />
        <line x1="2" y1="76" x2="88" y2="56" />
        <line x1="338" y1="8" x2="252" y2="28" />
        <line x1="338" y1="26" x2="234" y2="37" />
        <line x1="338" y1="42" x2="242" y2="42" />
        <line x1="338" y1="58" x2="234" y2="47" />
        <line x1="338" y1="76" x2="252" y2="56" />
      </g>
    </svg>
  );
}
