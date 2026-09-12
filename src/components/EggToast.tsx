import { useEffect, useRef, useState } from 'react';
import { onEgg, type EggAccent, type EggEvent } from '../lib/eggBus';

const ACCENTS: Record<EggAccent, { ring: string; text: string; glow: string }> = {
  straw: { ring: 'border-straw-500/60', text: 'text-straw-300', glow: 'rgba(232,182,76,0.35)' },
  purple: { ring: 'border-orchid-500/60', text: 'text-orchid-400', glow: 'rgba(139,92,246,0.4)' },
  red: { ring: 'border-ember-500/60', text: 'text-ember-400', glow: 'rgba(199,58,58,0.35)' },
  green: { ring: 'border-emerald-500/60', text: 'text-emerald-300', glow: 'rgba(52,211,153,0.3)' },
  shadow: { ring: 'border-white/25', text: 'text-cream', glow: 'rgba(20,20,30,0.6)' },
};

/**
 * Manga stamp-in toast for easter eggs. Renders the latest fired egg and
 * self-dismisses; safe to mount once at the app root.
 */
export default function EggToast() {
  const [egg, setEgg] = useState<EggEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    return onEgg((e) => {
      /* Each distinct egg fires its toast once per session. */
      if (seen.current.has(e.id)) return;
      seen.current.add(e.id);
      setEgg(e);
      setVisible(true);
      timers.current.forEach(clearTimeout);
      timers.current = [
        window.setTimeout(() => setVisible(false), 4600),
        window.setTimeout(() => setEgg(null), 5100),
      ];
    });
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!egg) return null;
  const accent = ACCENTS[egg.accent ?? 'straw'];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] w-[min(92vw,420px)] -translate-x-1/2 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div
        className={`rounded-2xl glass border-2 ${accent.ring} px-5 py-4 text-center`}
        style={{ boxShadow: `0 18px 60px -18px ${accent.glow}` }}
      >
        <p className={`font-display text-3xl leading-none tracking-wide ${accent.text}`}>{egg.title}</p>
        {egg.subtitle && <p className="mt-1.5 text-xs leading-relaxed text-cream/65">{egg.subtitle}</p>}
      </div>
    </div>
  );
}
