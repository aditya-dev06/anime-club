import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { playSound } from '../../lib/audio';
import WitchMiasmaCanvas, { type ReturnPhase } from './return/WitchMiasmaCanvas';
import EyelidAwakening from './return/EyelidAwakening';
import { createReturnVfxController, type ReturnVfxController } from './return/returnVfxController';

/**
 * "Return by Death" — Re:Zero Cinematic Easter Egg
 *
 * Sequence Synchronized to the 7.02s Audio Clip:
 *   0.00s – 1.20s [death]    : Instant negative invert flash. Desaturates reality into bleak
 *                              high-contrast monochrome. Crimson cardiac arrest flatline.
 *   1.20s – 4.50s [miasma]   : The Witch of Envy's Unseen Hands creep from the borders.
 *                              In the center, THE WITCH'S EYE SLOWLY OPENS, PIERCINGLY GAZES,
 *                              AND BLINKS! Heartbeat shock pulses shudder the screen.
 *                              Ghostly whisper: "愛してる (Aishiteru... I love you...)".
 *   4.50s – 6.20s [rewind]   : Temporal Singularity: Cosmic Roman-numeral clock spins backwards;
 *                              the page rewinds rapidly back to top: 0 (the save point).
 *   6.20s – 7.20s [reawaken] : Subaru gasps awake! First-person eyelid opening & blinking sequence
 *                              as blinding morning sunlight floods into the eyes.
 *   7.20s        [idle]     : Complete restoration & "RETURN BY DEATH" toast.
 */

const TRIGGER_WORD = 'return';
const IDLE_RESET_MS = 1500;
const COOLDOWN_MS = 9000;

const EGG = {
  id: 'return-by-death',
  title: 'RETURN BY DEATH',
  subtitle: "You were sent back to where this page began. Don't tell anyone.",
  accent: 'purple',
} as const;

export default function ReturnByDeath() {
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const [phase, setPhase] = useState<ReturnPhase>('idle');
  const [heartbeatActive, setHeartbeatActive] = useState(false);
  const [whisperActive, setWhisperActive] = useState(false);

  const controllerRef = useRef<ReturnVfxController | null>(null);
  const bufferRef = useRef('');
  const idleTimerRef = useRef(0);
  const lastFireRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  // Initialize and clean controller
  useEffect(() => {
    controllerRef.current = createReturnVfxController(reduced);
    return () => {
      controllerRef.current?.cleanup();
    };
  }, [reduced]);

  // Teardown all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      window.clearTimeout(idleTimerRef.current);
      controllerRef.current?.cleanup();
    };
  }, []);

  const triggerEgg = () => {
    if (reducedRef.current) {
      playSound('/sounds/return-by-death.webm', 0.85);
      window.scrollTo({ top: 0, behavior: 'auto' });
      fireEgg(EGG);
      return;
    }

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
      return id;
    };

    const controller = controllerRef.current || createReturnVfxController(false);

    // 0.00s: Audio starts, death impact, negative flash & monochrome
    playSound('/sounds/return-by-death.webm', 0.85);
    setPhase('death');
    controller.startDeathPhase();

    // 1.20s: The eerie chant begins -> Miasma, Unseen Hands, and the Witch's Blinking Eye!
    later(() => {
      setPhase('miasma');
      setWhisperActive(true);
    }, 1200);

    // Heartbeat pulses synced to the audio bass thumps
    later(() => {
      setHeartbeatActive(true);
      controller.triggerHeartbeat(1.0);
      later(() => setHeartbeatActive(false), 260);
    }, 1800);

    later(() => {
      setHeartbeatActive(true);
      controller.triggerHeartbeat(1.25);
      later(() => setHeartbeatActive(false), 260);
    }, 2900);

    later(() => {
      setHeartbeatActive(true);
      controller.triggerHeartbeat(1.4);
      later(() => setHeartbeatActive(false), 280);
    }, 4000);

    // 4.50s: Reality breakdown & Temporal Singularity Rewind back to top: 0
    later(() => {
      setWhisperActive(false);
      setPhase('rewind');
      controller.startRewindScroll(1.65);
    }, 4500);

    // 6.20s: Subaru gasps awake! First-person Eyelid opening and blinking into sunlight!
    later(() => {
      setPhase('reawaken');
      controller.triggerAwakening();
    }, 6200);

    // 7.20s: Full restoration & Save Point Victory Toast
    later(() => {
      setPhase('idle');
      fireEgg(EGG);
      controller.cleanup();
    }, 7250);
  };

  useEffect(() => {
    const scheduleIdleReset = () => {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        bufferRef.current = '';
      }, IDLE_RESET_MS);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key.length !== 1) return;

      const ch = e.key.toLowerCase();
      const next = bufferRef.current + ch;
      if (TRIGGER_WORD.startsWith(next)) {
        bufferRef.current = next;
      } else {
        bufferRef.current = ch === TRIGGER_WORD[0] ? ch : '';
      }
      scheduleIdleReset();

      if (bufferRef.current === TRIGGER_WORD) {
        bufferRef.current = '';
        window.clearTimeout(idleTimerRef.current);
        const now = Date.now();
        if (now - lastFireRef.current < COOLDOWN_MS) return;
        lastFireRef.current = now;
        triggerEgg();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (phase === 'idle') return null;

  const heartbeatVignetteStyle: CSSProperties = {
    opacity: heartbeatActive ? 0.85 : 0,
    transition: heartbeatActive ? 'opacity 30ms ease-out' : 'opacity 250ms ease-in',
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 56 }}
    >
      {/* 1. Atmospheric Deep Witch-Mist Veil */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse at 50% 50%, rgba(88,28,135,0.38) 0%, rgba(20,5,35,0.82) 70%, rgba(5,1,10,0.95) 100%)',
          ].join(', '),
          opacity: phase === 'reawaken' ? 0.3 : 1,
        }}
      />

      {/* 2. High-Performance Canvas (Unseen Hands, Witch's Blinking Eye, Clock, Particles) */}
      <WitchMiasmaCanvas phase={phase} reduced={reduced} />

      {/* 3. Cardiac Arrest & Heartbeat Pulse Vignette */}
      <div
        className="absolute inset-0"
        style={{
          ...heartbeatVignetteStyle,
          background:
            'radial-gradient(circle at 50% 50%, transparent 40%, rgba(220, 38, 38, 0.45) 75%, rgba(88, 28, 135, 0.75) 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* 4. The Witch's Whisper ("愛してる... Aishiteru... I love you...") */}
      <div
        className="absolute inset-x-0 bottom-24 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none"
        style={{
          opacity: whisperActive ? 1 : 0,
          transform: whisperActive ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        <span
          className="font-serif tracking-[0.4em] text-3xl sm:text-4xl text-purple-200/90 drop-shadow-[0_0_18px_rgba(216,180,254,0.9)] animate-pulse"
          style={{ letterSpacing: '0.35em' }}
        >
          愛してる
        </span>
        <span className="mt-1 text-xs tracking-widest text-purple-300/60 uppercase">
          ...aishiteru...
        </span>
      </div>

      {/* 5. First-Person Eyelid Opening & Blinking Animation at the Save Point */}
      <EyelidAwakening
        active={phase === 'reawaken'}
        onAwakened={() => {
          // Handled via main timeline
        }}
      />
    </div>
  );
}
