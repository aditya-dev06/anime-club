import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { playSound, stopAllSounds } from '../../lib/audio';
import AtomicCanvas, { type AtomicVfxPhase } from './atomic/AtomicCanvas';
import WebsiteShatter from './atomic/WebsiteShatter';
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
 *                              Neon purple tempered glass cracks spiderweb across the viewport.
 *                              Pre-blast vacuum implosion right before the strike.
 *   6.37s – 7.80s [detonate] : "...ATOMIC!" — SEARING VIOLET LIGHT DETONATION BLAST!
 *                              THE ACTUAL WEBSITE SHATTERS INTO 18 3D GLASS PIECES THAT FLY AWAY!
 *                              You literally see the real website content flying across the screen
 *                              amidst violet shockwaves and lightning bolts.
 *   7.80s – 8.70s [ruins]    : The shattered website pieces float drifting in the atomic void.
 *   8.70s – 10.2s [restore]  : Magical Rewind: reverse gravitational vortex pulls all the shattered
 *                              pieces of the website flying back to center; they snap together into
 *                              their exact puzzle slots, cracks seal shut, and the real site is 100% restored.
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
  const [shatterActive, setShatterActive] = useState(false);
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

    // 2. Reality Cracks Phase (3.60s) — Progressive spiderweb fracture spreads across viewport
    later(() => {
      setPhase('crack');
    }, 3600);

    // 3. ATOMIC DETONATION (6.37s) — SEARING VIOLET LIGHT BLAST & ACTUAL WEBSITE SHATTER!
    later(() => {
      setPhase('detonate');
      setVioletBlastActive(true);
      setShatterActive(true);
      controller.triggerDetonation();
      // Fast 240ms bloom decay so the shattered website pieces are immediately visible!
      later(() => setVioletBlastActive(false), 240);
    }, 6370);

    // 4. Transition to Ruins (7.80s)
    later(() => {
      setPhase('ruins');
    }, 7800);

    // 5. Magical Rewind & Reconstruction Phase (8.20s) — Smooth, cinematic, graceful rewind
    later(() => {
      setPhase('restore');
      setVignetteActive(false);
      controller.triggerRestoration();
    }, 8200);

    // 6. Complete restoration & Victory Toast (10.80s)
    later(() => {
      setPhase('idle');
      setShatterActive(false);
      fireEgg(TOAST);
      controller.cleanup();
    }, 10800);
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

  const blastStyle: CSSProperties = {
    opacity: violetBlastActive ? 1 : 0,
    transition: violetBlastActive ? 'opacity 20ms ease-out' : 'opacity 340ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 60 }}
    >
      {/* 1. Creeping Obsidian Atmosphere Vignette (dims reality during chant) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10, 6, 18, 0) 35%, rgba(20, 10, 35, 0.55) 65%, rgba(6, 3, 12, 0.88) 100%)',
          ...vignetteStyle,
        }}
      />

      {/* 2. High-performance VFX Canvas (Death Ray, Shockwaves, God Rays, Cracks, Golden Seal) */}
      <AtomicCanvas phase={phase} reduced={reducedMotion} />

      {/* 3. The actual website broken into 3D glass shards flying away and returning! */}
      <WebsiteShatter
        active={shatterActive}
        phase={phase === 'rune' || phase === 'crack' ? 'idle' : phase}
        onRestored={() => setShatterActive(false)}
      />

      {/* 4. Searing Supernova Whiteout / Violet Blast Dome */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(250,232,255,0.98) 22%, rgba(232,121,249,0.9) 45%, rgba(147,51,234,0.7) 70%, rgba(30,10,60,0.4) 100%)',
          mixBlendMode: 'screen',
          ...blastStyle,
        }}
      />

      {/* 5. Vertical Searing Violet Pillar of Light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.3) 32%, rgba(255,255,255,0.98) 50%, rgba(168,85,247,0.3) 68%, transparent 100%)',
          mixBlendMode: 'screen',
          ...blastStyle,
        }}
      />
    </div>
  );
}
