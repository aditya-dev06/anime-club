import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Manga SFX cut-ins — comic-book energy for the gold buttons.
 *
 * Self-contained: renders nothing until a delegated window `click` lands on a
 * `.btn-gold`, then pops a starburst cut-in (`.cut-in-pop`, styled in
 * index.css) near the click point, with a brief speed-lines flicker behind it.
 * Skips entirely under prefers-reduced-motion.
 */

const WORDS = ['NICE!', 'GO!', 'BOOM!', 'YOSH!', 'MAX!'];
const BURST_SIZE = 90; // on-screen px
const BURST_MS = 900; // must match the `.cut-in-pop` animation duration
const THROTTLE_MS = 1800;
const MAX_CONCURRENT = 2;

type Burst = {
  id: number;
  x: number; // clamped viewport coords (position: fixed)
  y: number;
  word: string;
  rot: number; // per-instance tilt, ±8°
};

// 12-spike manga starburst, 100×100 viewBox, mildly irregular for punch.
const BURST_POINTS = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 40 + ((i * 53) % 9) : 24;
    const a = (Math.PI * i) / 12 - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
})();

export default function SfxCutIns() {
  const reduced = usePrefersReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const idRef = useRef(0);
  const lastFireRef = useRef(-Infinity);
  const hoveredGoldRef = useRef(false);
  const timersRef = useRef(new Set<number>());

  useEffect(() => {
    if (reduced) return;

    const spawn = (x: number, y: number) => {
      const now = performance.now();
      if (now - lastFireRef.current < THROTTLE_MS) return;
      lastFireRef.current = now;

      const id = ++idRef.current;
      const half = BURST_SIZE / 2 + 8; // keep the whole burst on-screen
      const burst: Burst = {
        id,
        x: Math.min(Math.max(x, half), window.innerWidth - half),
        y: Math.min(Math.max(y, half), window.innerHeight - half),
        word: WORDS[Math.floor(Math.random() * WORDS.length)],
        rot: Math.random() * 16 - 8,
      };

      setBursts((prev) => {
        const next = [...prev, burst];
        return next.length > MAX_CONCURRENT ? next.slice(next.length - MAX_CONCURRENT) : next;
      });
      const t = window.setTimeout(() => {
        timersRef.current.delete(t);
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, BURST_MS);
      timersRef.current.add(t);
    };

    const onClick = (e: MouseEvent) => {
      const btn = e.target instanceof Element ? e.target.closest('.btn-gold') : null;
      if (!btn) return;
      let { clientX: x, clientY: y } = e;
      if (x === 0 && y === 0) {
        // Keyboard activation has no coordinates — aim for the button's centre.
        const r = btn.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      spawn(x, y);
    };

    // Delegated hover tracking (pointerenter doesn't bubble → capture phase).
    // Intentionally no visual effect of its own; only used to know the click
    // came from a real pointer hover when deciding to flicker the speed lines.
    const onPointerEnter = (e: PointerEvent) => {
      hoveredGoldRef.current = e.target instanceof Element && !!e.target.closest('.btn-gold');
    };

    window.addEventListener('click', onClick);
    window.addEventListener('pointerenter', onPointerEnter, true);
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('pointerenter', onPointerEnter, true);
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
      setBursts([]);
    };
  }, [reduced]);

  if (reduced || bursts.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[65]">
      {bursts.map((b) => (
        <BurstSprite key={b.id} burst={b} />
      ))}
    </div>
  );
}

/** One starburst cut-in plus its brief speed-lines flicker. */
function BurstSprite({ burst }: { burst: Burst }) {
  // 3-frame speed-lines flicker: on → dim → on → gone (bars then stay hidden).
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t1 = window.setTimeout(() => setFrame(1), 70);
    const t2 = window.setTimeout(() => setFrame(2), 140);
    const t3 = window.setTimeout(() => setFrame(3), 240);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const tilt = burst.rot * 3; // speed lines cross wider than the pop tilt
  const barAlpha = frame === 1 ? 0.15 : frame === 3 ? 0 : 0.85;
  const barStyle = (angle: number, dy: number): CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 116,
    height: 2,
    borderRadius: 2,
    background: 'linear-gradient(90deg, transparent, rgba(246, 217, 139, 0.95), transparent)',
    transform: `translate(-50%, -50%) translateY(${dy}px) rotate(${angle}deg)`,
    opacity: barAlpha,
    transition: 'opacity 60ms linear',
  });

  const popStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: BURST_SIZE,
    height: BURST_SIZE,
    '--cut-rot': `${burst.rot}deg`,
  } as CSSProperties;

  const textProps = {
    textAnchor: 'middle' as const,
    dominantBaseline: 'central' as const,
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontWeight: 900,
    fontSize: burst.word.length >= 4 ? 17 : 21,
  };

  return (
    <div className="absolute" style={{ left: burst.x, top: burst.y }}>
      {/* speed lines: two thin rotated bars flickering behind the burst */}
      <div style={barStyle(tilt, -7)} />
      <div style={barStyle(tilt + 16, 9)} />
      {/* starburst cut-in (pop + fade handled by the .cut-in-pop keyframe) */}
      <div className="cut-in-pop" style={popStyle}>
        <svg viewBox="0 0 100 100" width={BURST_SIZE} height={BURST_SIZE}>
          <polygon points={BURST_POINTS} fill="#e5484d" transform="translate(2.5 3)" />
          <polygon
            points={BURST_POINTS}
            fill="#f6d98b"
            stroke="#07070c"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <text x={51.5} y={51.5} fill="#e5484d" {...textProps}>
            {burst.word}
          </text>
          <text x={50} y={50} fill="#07070c" {...textProps}>
            {burst.word}
          </text>
        </svg>
      </div>
    </div>
  );
}
