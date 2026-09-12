import { useEffect, useRef, useState } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

interface Petal {
  id: number;
  left: number;
  sway: number;
  delay: number;
  duration: number;
  size: number;
  hue: number;
}

/** Konami code → OTAKU MODE + a sakura-petal drizzle. */
export default function KonamiEgg() {
  const reduced = usePrefersReducedMotion();
  const [petals, setPetals] = useState<Petal[]>([]);
  const buffer = useRef<string[]>([]);
  const cooldownUntil = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (Date.now() < cooldownUntil.current) return;
      buffer.current = [...buffer.current, e.key].slice(-KONAMI.length);
      if (buffer.current.join('|').toLowerCase() === KONAMI.join('|').toLowerCase()) {
        buffer.current = [];
        cooldownUntil.current = Date.now() + 30_000;
        fireEgg({
          id: 'konami',
          title: 'OTAKU MODE UNLOCKED',
          subtitle: 'Cheat code accepted — say "OTAKU10" at the gate for 10% off merch.',
          accent: 'green',
        });
        if (reduced) return;
        const fresh: Petal[] = Array.from({ length: 24 }, (_, i) => ({
          id: Date.now() + i,
          left: (i * 4.17 + ((i * 7919) % 40) - 20 + 100) % 100,
          sway: (i % 2 ? 1 : -1) * (4 + ((i * 17) % 5)),
          delay: ((i * 353) % 30) / 10,
          duration: 7 + ((i * 127) % 40) / 10,
          size: 8 + ((i * 331) % 7),
          hue: (i * 47) % 20,
        }));
        setPetals(fresh);
        timers.current.push(window.setTimeout(() => setPetals([]), 13_000));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      timers.current.forEach(clearTimeout);
    };
  }, [reduced]);

  if (petals.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[54] overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes konami-fall {
          0%   { transform: translateY(-4vh) translateX(0) rotate(0deg); opacity: 0; }
          8%   { opacity: 0.9; }
          100% { transform: translateY(106vh) translateX(var(--sway, 5vw)) rotate(540deg); opacity: 0.15; }
        }
      `}</style>
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute -top-5"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            ['--sway' as string]: `${p.sway}vw`,
            animation: `konami-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        >
          <svg viewBox="0 0 12 12" width={p.size} height={p.size}>
            <path
              d="M6 0C9 2.5 11 5 10.4 7.6 9.8 10 7.6 11.6 5 12 4.4 9 4.8 6 6 0Z"
              fill={`hsl(${330 + p.hue} 70% 78%)`}
              opacity="0.85"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
