import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { playSound } from '../../lib/audio';

/**
 * AtomicEgg — "I AM ATOMIC" easter egg (original fan-tribute copy, no assets).
 *
 * Trigger: type "atomic" letter-by-letter on window. The buffer resets on a
 * mismatch, after 1.5s of idle, or while focus sits in a form field. Runs at
 * most once every 8 seconds. A small phase machine drives purely
 * presentational fixed overlays:
 *
 *   shadow  -> darkness converges over the page (~0.6s) and holds (~0.5s)
 *   bloom   -> blinding white-gold flash + shockwave rings + gold streaks
 *   fade    -> bloom decays (~0.9s), overlay fades, all visuals unmount
 *   reduced -> prefers-reduced-motion: brief dark dip + toast, no flash
 *
 * The toast fires as the bloom begins to decay, so it slides in while the
 * light is still dissipating. Everything is pointer-events-none and fully
 * removed from the DOM when the sequence ends.
 */

const TARGET = 'atomic';
const COOLDOWN_MS = 8_000;
const IDLE_RESET_MS = 1_500;

const TOAST = {
  id: 'iam-atomic',
  title: 'I AM ATOMIC',
  subtitle: 'The shadow has spoken. All light in the vicinity has been graciously borrowed.',
  accent: 'shadow' as const,
};

type Phase = 'idle' | 'shadow' | 'bloom' | 'fade' | 'reduced';

/** Deterministic streak geometry: 14 gold rays fanned evenly around the bloom. */
const STREAKS = Array.from({ length: 14 }, (_, i) => ({
  angle: (i * 360) / 14,
  length: 11 + ((i * 7) % 11), // vmax
  distance: 52 + ((i * 5) % 3) * 5, // vmax (end offset from center)
  delay: i * 22, // ms
}));

const RING_DELAYS = [0, 130, 260]; // ms

export default function AtomicEgg() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [armed, setArmed] = useState(false);
  const reducedRef = useRef(false);
  const lastFireRef = useRef(0);
  const bufferRef = useRef('');
  const idleTimerRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const trigger = useCallback(() => {
    lastFireRef.current = Date.now();
    bufferRef.current = '';
    clearTimers();
    if (reducedRef.current) {
      // Reduced motion: instant dark dip (~400ms) + toast, no flash.
      setPhase('reduced');
      playSound('/sounds/atomic.webm', 0.8);
      fireEgg(TOAST);
      later(() => setPhase('idle'), 700);
      return;
    }
    setPhase('shadow');
    playSound('/sounds/atomic.webm', 0.8);
    later(() => setPhase('bloom'), 1150); // 0.6s converge + ~0.55s hold
    later(() => {
      setPhase('fade');
      fireEgg(TOAST);
    }, 1480); // bloom snapped 120ms + brief hold, then decay
    later(() => setPhase('idle'), 2500);
  }, [clearTimers, later]);

  /* Keyboard sequence detector: "atomic", letter-by-letter, 1.5s idle reset. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.key.length !== 1) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        return;
      }
      if (Date.now() - lastFireRef.current < COOLDOWN_MS) return;

      const ch = e.key.toLowerCase();
      if (!/[a-z]/.test(ch)) {
        bufferRef.current = '';
        return;
      }
      const next = bufferRef.current + ch;
      bufferRef.current = TARGET.startsWith(next) ? next : ch === TARGET[0] ? ch : '';

      window.clearTimeout(idleTimerRef.current);
      if (bufferRef.current === TARGET) {
        trigger();
        return;
      }
      idleTimerRef.current = window.setTimeout(() => {
        bufferRef.current = '';
      }, IDLE_RESET_MS);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(idleTimerRef.current);
    };
  }, [trigger]);

  /* Unmount cleanup: kill every pending timer. */
  useEffect(
    () => () => {
      window.clearTimeout(idleTimerRef.current);
      timersRef.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /*
   * Arm per phase: paint the phase's initial styles first, then flip `armed`
   * on the next frame so CSS transitions actually run (double rAF).
   */
  useEffect(() => {
    if (phase === 'idle') {
      setArmed(false);
      return;
    }
    setArmed(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setArmed(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase]);

  if (phase === 'idle') return null;

  /* ---- Per-phase styles ------------------------------------------------ */

  const blackoutStyle: CSSProperties =
    phase === 'shadow'
      ? { opacity: armed ? 1 : 0, transition: 'opacity 600ms cubic-bezier(0.55, 0, 0.85, 0.36)' }
      : phase === 'bloom'
        ? { opacity: 1, transition: 'none' }
        : phase === 'fade'
          ? { opacity: 0, transition: 'opacity 850ms ease-in' }
          : armed /* reduced */
            ? { opacity: 0, transition: 'opacity 250ms ease-out' }
            : { opacity: 1, transition: 'none' };

  const vignetteStyle: CSSProperties =
    phase === 'shadow'
      ? {
          transform: armed ? 'scale(1)' : 'scale(3.2)',
          transition: 'transform 620ms cubic-bezier(0.55, 0, 0.85, 0.36)',
        }
      : phase === 'fade'
        ? {
            transform: 'scale(1)',
            opacity: 0,
            transition: 'opacity 850ms ease-in',
          }
        : /* bloom */ { transform: 'scale(1)', transition: 'none' };

  const bloomStyle: CSSProperties =
    phase === 'bloom'
      ? { opacity: armed ? 1 : 0, transition: 'opacity 120ms ease-out' }
      : { opacity: 0, transition: 'opacity 900ms ease-in' };

  const burstActive = phase === 'fade' || armed; // rings/streaks keep final styles through fade

  const ringStyle = (delay: number): CSSProperties => ({
    transform: burstActive ? 'scale(3)' : 'scale(0.2)',
    opacity: burstActive ? 0 : 0.85,
    transition: `transform 950ms cubic-bezier(0.17, 0.84, 0.44, 1) ${delay}ms, opacity 900ms ease-out ${delay}ms`,
  });

  const streakStyle = (angle: number, distance: number, delay: number): CSSProperties => ({
    transform: burstActive
      ? `rotate(${angle}deg) translateY(-${distance}vmax)`
      : `rotate(${angle}deg) translateY(-3vmax)`,
    opacity: burstActive ? 0 : 0.9,
    transition: `transform 760ms cubic-bezier(0.2, 0.75, 0.3, 1) ${delay}ms, opacity 620ms ease-out ${delay}ms`,
  });

  /* ---- Render ---------------------------------------------------------- */

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 55 }}
    >
      {/* 1. The shadow falls: converging vignette + pitch-black wash */}
      {phase !== 'reduced' && (
        <div
          className="absolute"
          style={{
            inset: '-80%',
            background:
              'radial-gradient(circle at 50% 50%, rgba(4,3,8,0) 0%, rgba(4,3,8,0.35) 18%, rgba(4,3,8,0.96) 36%, rgba(4,3,8,0.98) 60%)',
            willChange: 'transform',
            ...vignetteStyle,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(4,3,8,0.98)', ...blackoutStyle }}
      />

      {/* 3. ATOMIC: white-gold bloom, shockwave rings, radiating streaks */}
      {phase !== 'shadow' && phase !== 'reduced' && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255,244,214,1) 0%, rgba(255,240,200,0.98) 18%, rgba(255,214,140,0.55) 42%, rgba(255,190,90,0) 70%)',
              ...bloomStyle,
            }}
          />
          {RING_DELAYS.map((delay) => (
            <div
              key={delay}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: '48vmax',
                height: '48vmax',
                margin: '-24vmax 0 0 -24vmax',
                border: '2px solid rgba(255,214,140,0.8)',
                boxShadow: '0 0 26px rgba(255,214,140,0.35), inset 0 0 26px rgba(255,214,140,0.25)',
                ...ringStyle(delay),
              }}
            />
          ))}
          {STREAKS.map((s) => (
            <div
              key={s.angle}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: '2px',
                height: `${s.length}vmax`,
                marginLeft: '-1px',
                marginTop: `${-(s.length / 2)}vmax`,
                background:
                  'linear-gradient(to top, rgba(255,244,214,0.95), rgba(255,214,140,0))',
                ...streakStyle(s.angle, s.distance, s.delay),
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
