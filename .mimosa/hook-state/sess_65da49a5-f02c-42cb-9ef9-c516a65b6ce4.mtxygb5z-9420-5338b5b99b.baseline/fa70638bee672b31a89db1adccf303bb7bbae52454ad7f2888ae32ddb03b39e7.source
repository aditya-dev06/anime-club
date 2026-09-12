import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Ambient straw-gold glow that trails the cursor on desktop — a subtle
 * cinematic "energy" that widens when the pointer moves fast and shifts
 * hue with page scroll (gold -> orchid at mid-document -> gold).
 */

const GOLD = { r: 232, g: 182, b: 76 };
const ORCHID = { r: 139, g: 92, b: 246 };
// Quantize scroll progress to 24 steps so the gradient string is only
// rebuilt when the color actually changes (no per-frame string churn).
const STEPS = 24;
export default function CursorGlow() {
  const reduced = usePrefersReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const el = glowRef.current!;
    let x = -999;
    let y = -999;
    let tx = -999;
    let ty = -999;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let lastStep = -1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
      el.style.transform = `translate(-50%, -50%) scale(${speed > 1.5 ? 1.35 : 1})`;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };

    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      // Scroll-phase hue: gold at top -> orchid around mid-document -> gold at end.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 1) {
        const p = window.scrollY / max;
        const q = p < 0 ? 0 : p > 1 ? 1 : p;
        const step = Math.round(q * STEPS);
        if (step !== lastStep) {
          lastStep = step;
          const u = step / STEPS;
          const m = u < 0.5 ? u * 2 : (1 - u) * 2; // 0 at ends, 1 at middle
          const r = Math.round(GOLD.r + (ORCHID.r - GOLD.r) * m);
          const g = Math.round(GOLD.g + (ORCHID.g - GOLD.g) * m);
          const b = Math.round(GOLD.b + (ORCHID.b - GOLD.b) * m);
          el.style.background = `radial-gradient(circle, rgba(${r},${g},${b},0.14) 0%, rgba(${r},${g},${b},0.05) 45%, transparent 70%)`;
        }
      }

      if (!document.hidden) raf = requestAnimationFrame(tick);
      else raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed z-[8] h-[340px] w-[340px] rounded-full transition-[scale] duration-300"
      style={{
        left: -999,
        top: -999,
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle, rgba(232,182,76,0.14) 0%, rgba(232,182,76,0.05) 45%, transparent 70%)',
        mixBlendMode: 'screen',
        willChange: 'left, top',
      }}
    />
  );
}
