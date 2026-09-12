import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { playSound } from '../../lib/audio';
import AtomicCanvas, { type AtomicVfxPhase } from './atomic/AtomicCanvas';
import { createDestructionController, type DestructionController } from './atomic/atomicDestruction';

/**
 * AtomicEgg — "I AM ATOMIC" Cinematic Website Destruction Easter Egg.
 *
 * Trigger: type "atomic" letter-by-letter anywhere on the page.
 *
 * Audio & Cinematic Timeline (10.02s track):
 *   0.00s – 4.50s [rune]     : Ominous bass hum. Violet containment array & runes form.
 *                              Ambient light drains from the website. Camera micro-tremor.
 *   4.50s – 6.37s [crack]    : "I... AM..." — Seismic tremors shake the screen violently.
 *                              Neon purple tectonic cracks spiderweb across the viewport.
 *                              Pre-blast vacuum implosion right before the strike.
 *   6.37s – 7.80s [detonate] : "...ATOMIC!" — Blinding supernova flash.
 *                              ENTIRE WEBSITE DESTROYED: 3D perspective shatter, displaced
 *                              floating UI rubble, inverted color shockwave, and 300+
 *                              glowing plasma & ash particles.
 *   7.80s – 9.20s [ruins]    : Scorched aftermath, drifting purple ash, lingering tremors.
 *   9.20s – 10.2s [restore]  : Magical Rewind: reverse gravitational vortex pulls the debris
 *                              and shards back into alignment; reality cracks weld shut.
 *   10.20s        [idle]     : Complete restoration; "I AM ATOMIC" victory toast slides in.
 */

const TARGET = 'atomic';
const COOLDOWN_MS = 12_000;
const IDLE_RESET_MS = 1_500;

const TOAST = {
  id: 'iam-atomic',
  title: 'I AM ATOMIC',
  subtitle: 'The shadow has spoken. Reality has been obliterated and graciously restored.',
  accent: 'shadow' as const,
};

export default function AtomicEgg() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<AtomicVfxPhase>('idle');
  const [bloomActive, setBloomActive] = useState(false);
  const [vignetteActive, setVignetteActive] = useState(false);

  const reducedRef = useRef(false);
  const lastFireRef = useRef(0);
  const bufferRef = useRef('');
  const idleTimerRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const controllerRef = useRef<DestructionController | null>(null);

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
      // Reduced motion: gentle dark dip + sound + toast, no violent shaking
      setPhase('rune');
      playSound('/sounds/atomic.webm', 0.8);
      later(() => {
        fireEgg(TOAST);
        setPhase('idle');
      }, 1000);
      return;
    }

    // Initialize destruction physics controller
    if (!controllerRef.current) {
      controllerRef.current = createDestructionController(false);
    }
    const controller = controllerRef.current;

    // Start audio
    playSound('/sounds/atomic.webm', 0.85);

    // 1. Ominous Build-up Phase: Runes & Tremor
    setPhase('rune');
    setVignetteActive(true);
    controller.startTremor();

    // 2. Reality Cracks Phase (4.50s)
    later(() => {
      setPhase('crack');
    }, 4500);

    // 3. ATOMIC DETONATION (6.37s)
    later(() => {
      setPhase('detonate');
      setBloomActive(true);
      controller.triggerDetonation();
    }, 6370);

    // 4. Bloom Decay into Scorched Ruins (7.80s)
    later(() => {
      setBloomActive(false);
      setPhase('ruins');
    }, 7800);

    // 5. Magical Rewind & Reconstruction Phase (9.20s)
    later(() => {
      setPhase('restore');
      setVignetteActive(false);
      controller.triggerRestoration();
    }, 9200);

    // 6. Final Clean state & Victory Toast (10.20s)
    later(() => {
      setPhase('idle');
      fireEgg(TOAST);
      controller.cleanup();
    }, 10200);
  }, [clearTimers, later]);

  /* Keyboard sequence detector: "atomic" */
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

  /* Unmount cleanup */
  useEffect(
    () => () => {
      window.clearTimeout(idleTimerRef.current);
      timersRef.current.forEach((t) => window.clearTimeout(t));
      controllerRef.current?.cleanup();
    },
    [],
  );

  if (phase === 'idle') return null;

  /* ---- Styles for Overlay Layers --------------------------------------- */

  const vignetteStyle: CSSProperties = {
    opacity: vignetteActive ? 1 : 0,
    transition: 'opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const bloomStyle: CSSProperties = {
    opacity: bloomActive ? 1 : 0,
    transition: bloomActive ? 'opacity 60ms ease-out' : 'opacity 850ms ease-in',
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 60 }}
    >
      {/* 1. Converging darkness & ethereal purple vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(4,3,8,0.1) 0%, rgba(30,10,60,0.55) 45%, rgba(4,3,8,0.92) 85%)',
          ...vignetteStyle,
        }}
      />

      {/* 2. High-performance VFX Canvas (Runes, Cracks, Shockwaves, Debris Particles) */}
      <AtomicCanvas phase={phase} reduced={reducedMotion} />

      {/* 3. Blinding Supernova White-Violet Detonation Flash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(240,210,255,0.98) 25%, rgba(168,85,247,0.7) 65%, rgba(88,28,135,0.4) 100%)',
          ...bloomStyle,
        }}
      />
    </div>
  );
}
