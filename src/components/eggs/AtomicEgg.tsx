import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { playSound } from '../../lib/audio';
import AtomicCanvas, { type AtomicVfxPhase } from './atomic/AtomicCanvas';
import { createDestructionController, type DestructionController } from './atomic/atomicDestruction';

/**
 * AtomicEgg — "I AM ATOMIC" Apocalyptic Website Destruction Easter Egg.
 *
 * Trigger: type "atomic" letter-by-letter anywhere on the page.
 *
 * Audio & Cinematic Timeline (10.02s track):
 *   0.00s – 4.50s [rune]     : Ominous bass hum. Rotating neon violet magic circle & runes.
 *                              Website visibly vibrates with escalating tremors.
 *   4.50s – 6.37s [crack]    : "...AM..." — Violent seismic earthquake shakes the website.
 *                              Neon purple tectonic cracks spiderweb across the viewport.
 *                              Pre-blast vacuum implosion right before the strike.
 *   6.37s – 7.80s [detonate] : "...ATOMIC!" — SEARING VIOLET LIGHT DETONATION BLAST!
 *                              THE ENTIRE WEBSITE GETS DESTROYED LIKE A BOMB HIT IT:
 *                              Navbar blown off, hero title/hat blasted across screen,
 *                              all event cards scattered in 3D, and 420+ plasma & rubble particles.
 *   7.80s – 9.20s [ruins]    : The site remains visibly destroyed in shattered ruins, floating,
 *                              with lingering tremors, lightning bolts, and drifting ash.
 *   9.20s – 10.2s [restore]  : Magical Rewind: reverse gravitational vortex pulls all debris
 *                              back in; shattered cards & navbar snap back into place with
 *                              elastic spring physics; cracks weld shut with golden-violet light.
 *   10.20s        [idle]     : Complete restoration; "I AM ATOMIC" toast slides in.
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
  const [violetBlastActive, setVioletBlastActive] = useState(false);
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
      setPhase('rune');
      playSound('/sounds/atomic.webm', 0.8);
      later(() => {
        fireEgg(TOAST);
        setPhase('idle');
      }, 1000);
      return;
    }

    if (!controllerRef.current) {
      controllerRef.current = createDestructionController(false);
    }
    const controller = controllerRef.current;

    // Start audio playback
    playSound('/sounds/atomic.webm', 0.9);

    // 1. Build-up Phase: Neon Runes & Progressive Website Tremor
    setPhase('rune');
    setVignetteActive(true);
    controller.startTremor();

    // 2. Reality Cracks Phase (4.50s)
    later(() => {
      setPhase('crack');
    }, 4500);

    // 3. ATOMIC DETONATION (6.37s) — SEARING VIOLET LIGHT BLAST
    later(() => {
      setPhase('detonate');
      setVioletBlastActive(true);
      controller.triggerDetonation();
      // Fast 240ms bloom decay so the destroyed website is immediately visible!
      later(() => setVioletBlastActive(false), 240);
    }, 6370);

    // 4. Transition to Ruins (7.80s)
    later(() => {
      setPhase('ruins');
    }, 7800);

    // 5. Magical Rewind & Reconstruction Phase (9.20s)
    later(() => {
      setPhase('restore');
      setVignetteActive(false);
      controller.triggerRestoration();
    }, 9200);

    // 6. Complete restoration & Victory Toast (10.20s)
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
    transition: 'opacity 600ms ease-out',
  };

  // Blinding Searing Violet Light Burst
  const blastStyle: CSSProperties = {
    opacity: violetBlastActive ? 1 : 0,
    transition: violetBlastActive ? 'opacity 25ms ease-out' : 'opacity 380ms ease-out',
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 60 }}
    >
      {/* 1. Subtle peripheral edge aura (never blocks center) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(147, 51, 234, 0.15) 80%, rgba(88, 28, 135, 0.35) 100%)',
          ...vignetteStyle,
        }}
      />

      {/* 2. High-performance VFX Canvas (Death Ray, Lightning, Runes, Cracks, Particles) */}
      <AtomicCanvas phase={phase} reduced={reducedMotion} />

      {/* 3. Searing VIOLET LIGHT Detonation Flash Dome */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(250,232,255,1) 0%, rgba(240,171,252,0.98) 18%, rgba(192,38,211,0.92) 42%, rgba(147,51,234,0.8) 68%, rgba(88,28,135,0.4) 100%)',
          mixBlendMode: 'screen',
          ...blastStyle,
        }}
      />

      {/* 4. Vertical Violet Pillar of Light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.35) 30%, rgba(255,255,255,0.95) 50%, rgba(168,85,247,0.35) 70%, transparent 100%)',
          mixBlendMode: 'screen',
          ...blastStyle,
        }}
      />
    </div>
  );
}
