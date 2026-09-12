import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  loadCheckins,
  parseTicketCode,
  saveCheckin,
  type CheckinRecord,
} from '../lib/ticketCode';

type Phase = 'idle' | 'scanning' | 'invalid' | 'valid';

interface ValidResult {
  ref: string;
  eventId: string;
  name: string;
  seats: number;
  issuedAt: string;
  alreadyCheckedIn: CheckinRecord | null;
}

function HatLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <ellipse cx="32" cy="30" rx="30" ry="7.5" fill="#a87c2f" />
      <ellipse cx="32" cy="28" rx="30" ry="7.5" fill="#e2a94a" />
      <path d="M15 28C15 13.5 22 6.5 32 6.5s17 7 17 21.5Z" fill="#f0c66a" />
      <path d="M15.4 20.5c10-2.6 23.2-2.6 33.2 0l.4 7.2c-10-2.9-24-2.9-34 0Z" fill="#c8413c" />
      <ellipse cx="25.5" cy="13.5" rx="3.4" ry="4.2" fill="#f9dc9a" opacity="0.6" />
    </svg>
  );
}

/** Pull a raw AC1.… code out of a pasted code, URL, or query string. */
function extractCode(input: string): string {
  const m = input.match(/AC1\.[A-Za-z0-9_-]+\.[0-9a-f]+/);
  if (m) return m[0];
  try {
    const url = new URL(input.trim());
    const q = url.searchParams.get('code');
    if (q) return q;
  } catch {
    /* not a URL */
  }
  return input.trim();
}

export default function Verify() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [manual, setManual] = useState('');
  const [scanError, setScanError] = useState('');
  const [invalidReason, setInvalidReason] = useState('');
  const [valid, setValid] = useState<ValidResult | null>(null);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setCheckins(loadCheckins()), []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  /* Deep link: /verify?code=AC1.… verifies immediately. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('code');
    if (q) handleVerify(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async () => {
    setScanError('');
    try {
      const getStream = async (): Promise<MediaStream> => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            return await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' } },
            });
          } catch {
            return await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          }
        }

        const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
        const legacy =
          nav?.getUserMedia ||
          nav?.webkitGetUserMedia ||
          nav?.mozGetUserMedia ||
          nav?.msGetUserMedia;

        if (legacy) {
          return new Promise((resolve, reject) => {
            legacy.call(navigator, { video: true }, resolve, reject);
          });
        }

        throw new Error(
          'Camera API is not supported in this browser. Please use Chrome, Edge, or Safari, or enter the code manually.',
        );
      };

      const stream = await getStream();
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video player element is not mounted');
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      try {
        await video.play();
      } catch (playErr) {
        console.warn('video.play() warning:', playErr);
      }

      setPhase('scanning');

      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Unable to create 2D canvas context');
      }

      let lastDecode = 0;
      let alive = true;

      const tick = (t: number) => {
        if (!alive || !streamRef.current) return;
        if (video.readyState >= 2 && t - lastDecode > 120) {
          lastDecode = t;
          const w = 480;
          const h = Math.max(1, Math.round((video.videoHeight / (video.videoWidth || 1)) * w) || 360);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const found = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
          if (found?.data) {
            alive = false;
            handleVerify(found.data);
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const errName = err instanceof Error ? err.name : 'Error';
      console.error('Camera scanner error:', err);

      if (errName === 'NotAllowedError' || msg.includes('Permission') || msg.includes('denied')) {
        setScanError('Camera permission denied — check your browser URL bar (lock/camera icon) to grant access.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setScanError('No camera found on this device — connect a webcam or use image upload below.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setScanError('Camera is currently in use by another application (Zoom/Teams/OBS).');
      } else {
        setScanError(`Camera error (${errName}: ${msg}) — try manual entry or upload below.`);
      }

      stopCamera();
      setPhase('idle');
    }
  };

  function handleVerify(raw: string) {
    stopCamera();
    const code = extractCode(raw);
    const parsed = parseTicketCode(code);
    if (!parsed.ok) {
      setInvalidReason(parsed.reason);
      setValid(null);
      setPhase('invalid');
      return;
    }
    const p = parsed.payload;
    const prev = loadCheckins().find((c) => c.ref === p.ref) ?? null;
    setValid({
      ref: p.ref,
      eventId: p.eventId,
      name: p.name,
      seats: p.seats,
      issuedAt: new Date(p.ts).toLocaleString('en-IN'),
      alreadyCheckedIn: prev,
    });
    setPhase('valid');
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setScanError('Unable to process image context.');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const found = jsQR(imgData.data, img.width, img.height);
        if (found?.data) {
          handleVerify(found.data);
        } else {
          setScanError('No ticket QR code detected in this image. Ensure the QR code is clear.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const checkIn = () => {
    if (!valid || valid.alreadyCheckedIn) return;
    setCheckins(
      saveCheckin({ ref: valid.ref, name: valid.name, seats: valid.seats, at: new Date().toISOString() }),
    );
    setValid({ ...valid, alreadyCheckedIn: { ref: valid.ref, name: valid.name, seats: valid.seats, at: new Date().toISOString() } });
  };

  const reset = () => {
    stopCamera();
    setValid(null);
    setManual('');
    setScanError('');
    setPhase('idle');
  };

  const totalSeats = checkins.reduce((sum, c) => sum + c.seats, 0);

  return (
    <div className="min-h-screen bg-ink-950 px-4 py-8 text-cream">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <HatLogo className="h-9 w-12" />
          <div className="leading-none">
            <h1 className="font-display text-3xl tracking-[0.14em] text-cream">GATE CONTROL</h1>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.42em] text-straw-300/80">
              Otaku Club · VIT Bhopal
            </p>
          </div>
        </header>

        {phase === 'idle' && (
          <div className="space-y-6">
            <button className="btn-gold w-full py-4 text-base" onClick={startScanner}>
              Start scanner
            </button>
            {scanError && (
              <p role="alert" className="text-xs font-semibold text-ember-400">
                {scanError}
              </p>
            )}
            <div className="relative rounded-2xl glass p-5">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-straw-300/80">
                Or verify a code manually
              </p>
              <textarea
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                rows={3}
                placeholder="Paste the AC1.….… code from a ticket"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-xs text-cream placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none"
              />
              <button
                className="btn-gold mt-3 w-full"
                onClick={() => manual.trim() && handleVerify(manual)}
                disabled={!manual.trim()}
              >
                Verify code
              </button>
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <video ref={videoRef} muted playsInline className="aspect-video w-full bg-black object-cover" />
              <div
                className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 animate-pulse bg-straw-300 shadow-[0_0_12px_2px_rgba(226,169,74,0.8)]"
                aria-hidden="true"
              />
            </div>
            <p className="text-center text-xs text-cream/60">Point the camera at the ticket's QR panel…</p>
            <button className="w-full rounded-xl border border-white/12 px-4 py-3 text-sm font-bold text-cream/70 transition hover:bg-white/5" onClick={reset}>
              Cancel
            </button>
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </div>
        )}

        {phase === 'invalid' && (
          <div aria-live="polite" className="rounded-2xl border-2 border-ember-500/70 bg-ember-500/10 p-6 text-center">
            <p className="font-display text-5xl tracking-wide text-ember-400">INVALID TICKET</p>
            <p className="mt-3 text-sm text-cream/70">{invalidReason}</p>
            <button className="btn-gold mt-6 w-full" onClick={reset}>
              Scan next
            </button>
          </div>
        )}

        {phase === 'valid' && valid && (
          <div aria-live="polite" className="overflow-hidden rounded-2xl glass">
            <div
              className={`px-5 py-3 text-center font-display text-3xl tracking-wide ${
                valid.alreadyCheckedIn ? 'bg-straw-500/20 text-straw-200' : 'bg-straw-500 text-ink-950'
              }`}
            >
              {valid.alreadyCheckedIn ? 'ALREADY CHECKED IN' : 'VALID TICKET'}
            </div>
            <div className="space-y-3 p-5">
              <p className="font-display text-4xl leading-none text-cream">{valid.name}</p>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream/50">Admit</span>
                <span className="font-display text-3xl text-straw-300">
                  {valid.seats} {valid.seats === 1 ? 'seat' : 'seats'}
                </span>
              </div>
              <dl className="space-y-1.5 text-sm text-cream/70">
                <div className="flex justify-between gap-3">
                  <dt className="text-cream/45">Reference</dt>
                  <dd className="font-mono font-bold text-straw-300">{valid.ref}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-cream/45">Event</dt>
                  <dd className="text-right">{valid.eventId}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-cream/45">Issued</dt>
                  <dd>{valid.issuedAt}</dd>
                </div>
              </dl>
              {!valid.alreadyCheckedIn && (
                <button className="btn-gold w-full py-4 text-base" onClick={checkIn}>
                  Check in {valid.seats} {valid.seats === 1 ? 'seat' : 'seats'}
                </button>
              )}
              <button
                className="w-full rounded-xl border border-white/12 px-4 py-3 text-sm font-bold text-cream/70 transition hover:bg-white/5"
                onClick={reset}
              >
                Scan next
              </button>
            </div>
          </div>
        )}

        {/* Recent check-ins */}
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl tracking-wide text-cream">Recent check-ins</h2>
            <span className="text-xs text-cream/50">{totalSeats} seats in</span>
          </div>
          {checkins.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-xs text-cream/40">
              No check-ins yet tonight.
            </p>
          ) : (
            <ul className="space-y-2">
              {checkins.slice(0, 8).map((c) => (
                <li key={c.ref + c.at} className="flex items-center justify-between rounded-xl glass px-4 py-2.5 text-sm">
                  <span className="truncate">
                    <span className="font-mono text-xs text-straw-300">{c.ref}</span>
                    <span className="ml-2 text-cream/80">{c.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-cream/50">
                    {c.seats}× · {new Date(c.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-center text-[10px] leading-relaxed text-cream/35">
          Demo mode — ticket signatures verify offline. A production build signs tickets server-side.
        </p>
      </div>
    </div>
  );
}
