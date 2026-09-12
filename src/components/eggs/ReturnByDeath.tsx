import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { audioManager } from '../../lib/audioManager';
import WitchMiasmaCanvas, { type ReturnPhase } from './return/WitchMiasmaCanvas';
import EyelidAwakening from './return/EyelidAwakening';
import { createReturnVfxController, type ReturnVfxController } from './return/returnVfxController';

/**
 * "Return by Death" — Re:Zero Cinematic Easter Egg
 *
 * Sequence Synchronized to the 7.02s Audio Clip:
 *   0.00s – 1.20s [death]    : Instant negative invert flash & 3-DOF screen tremor.
 *                              Website stays 100% visible with crisp contrast and supernatural violet sheen.
 *   1.20s – 4.50s [miasma]   : Satella's giant demonic Unseen Hands crawl deep across the website!
 *                              In the center, THE WITCH'S AMETHYST EYE OPENS AND REALISTICALLY BLINKS!
 *                              Audible whisper: "愛してる (Aishiteru...)" binaurally echoes in your ears.
 *                              Heartbeat shock pulses shudder the screen.
 *   4.50s – 6.20s [rewind]   : Temporal Singularity: Cosmic Roman-numeral clock spins backwards;
 *                              page rewinds rapidly back to top: 0 (the save point).
 *   6.20s – 7.20s [reawaken] : Subaru gasps awake! Anatomical curved eyelid opening & blinking sequence
 *                              as bright morning sunlight floods into the eyes and focus sharpens.
 *   7.20s        [idle]     : Complete restoration & "RETURN BY DEATH" victory toast.
 */

const TRIGGER_WORD = 'return';
const IDLE_RESET_MS = 1500;
const COOLDOWN_MS = 8500;

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
  const phaseRef = useRef<ReturnPhase>('idle');
  phaseRef.current = phase;

  const [heartbeatActive, setHeartbeatActive] = useState(false);
  const [whisperActive, setWhisperActive] = useState(false);

  const controllerRef = useRef<ReturnVfxController | null>(null);
  const bufferRef = useRef('');
  const idleTimerRef = useRef(0);
  const lastFireRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    controllerRef.current = createReturnVfxController(reduced);
    return () => {
      controllerRef.current?.cleanup();
    };
  }, [reduced]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      window.clearTimeout(idleTimerRef.current);
      audioManager.stopAll();
      controllerRef.current?.cleanup();
    };
  }, []);

  const triggerEgg = () => {
    if (reducedRef.current) {
      audioManager.play('/sounds/return-by-death.webm', { volume: 0.85 });
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

    // Immediate Web Audio unlock & sample-accurate advance scheduling:
    audioManager.unlock();

    // 0.00s: Main death impact & eerie witch call audio
    audioManager.play('/sounds/return-by-death.webm', { volume: 0.95, delay: 0 });

    // 1.80s: First intimate voice whisper in left ear: "Aishiteru..."
    audioManager.play('/sounds/aishiteru.mp3', { volume: 1.0, delay: 1.8, pan: -0.25 });

    // 3.20s: Second echoing whisper in right ear: "Aishiteru..."
    audioManager.play('/sounds/aishiteru.mp3', { volume: 0.85, delay: 3.2, pan: 0.35 });

    // 0.00s: Death impact visuals & 3-DOF tremor
    setPhase('death');
    controller.startDeathPhase();

    // 1.20s: The eerie vocal cry starts -> Miasma, giant Unseen Hands, and the Witch's Blinking Eye!
    later(() => {
      setPhase('miasma');
      setWhisperActive(true);
    }, 1200);

    // 1.80s: First heartbeat *THUMP*
    later(() => {
      setHeartbeatActive(true);
      controller.triggerHeartbeat(1.1);
      later(() => setHeartbeatActive(false), 260);
    }, 1800);

    // 2.90s: Second heartbeat *THUMP*
    later(() => {
      setHeartbeatActive(true);
      controller.triggerHeartbeat(1.3);
      later(() => setHeartbeatActive(false), 260);
    }, 2900);

    // 4.00s: Third heartbeat *THUMP*
    later(() => {
      setHeartbeatActive(true);
      controller.triggerHeartbeat(1.45);
      later(() => setHeartbeatActive(false), 280);
    }, 4000);

    // 4.50s: Reality breakdown & Temporal Singularity Rewind back to top: 0
    later(() => {
      setWhisperActive(false);
      setPhase('rewind');
      controller.startRewindScroll(1.65);
    }, 4500);

    // 6.20s: Subaru gasps awake! First-person curved anatomical eyelid awakening & blinks!
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
      // Escape key emergency panic button: cancel all timers, audio & restore instantly
      if (e.key === 'Escape') {
        if (phaseRef.current !== 'idle') {
          timersRef.current.forEach(clearTimeout);
          timersRef.current = [];
          audioManager.stopAll();
          controllerRef.current?.cleanup();
          setPhase('idle');
          setHeartbeatActive(false);
          setWhisperActive(false);
          return;
        }
      }

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
    opacity: heartbeatActive ? 0.75 : 0,
    transition: heartbeatActive ? 'opacity 30ms ease-out' : 'opacity 240ms ease-in',
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 56 }}
    >
      {/* 1. Transparent Ethereal Witch-Mist (WEBSITE REMAINS FULLY VISIBLE UNDERNEATH!) */}
      <div
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.16) 0%, rgba(126, 34, 206, 0.22) 65%, rgba(59, 7, 100, 0.38) 100%)',
          mixBlendMode: 'screen',
          opacity: phase === 'reawaken' ? 0 : 1,
        }}
      />

      {/* 2. High-Performance Canvas (Satella's Giant Unseen Hands, Witch's Blinking Eye, Reverse Clock) */}
      <WitchMiasmaCanvas phase={phase} reduced={reduced} heartbeatActive={heartbeatActive} />

      {/* 3. Cardiac Arrest & Heartbeat Pulse Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...heartbeatVignetteStyle,
          background:
            'radial-gradient(circle at 50% 50%, transparent 45%, rgba(220, 38, 38, 0.35) 75%, rgba(147, 51, 234, 0.55) 100%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* 4. The Witch's Whisper ("愛してる... Aishiteru... I love you...") */}
      <div
        className="absolute inset-x-0 bottom-28 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none"
        style={{
          opacity: whisperActive ? 1 : 0,
          transform: whisperActive ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
        }}
      >
        <span
          className="font-serif tracking-[0.45em] text-3xl sm:text-5xl text-purple-200 drop-shadow-[0_0_24px_rgba(232,121,249,0.95)] animate-pulse"
          style={{ letterSpacing: '0.4em' }}
        >
          愛してる
        </span>
        <span className="mt-1.5 text-xs sm:text-sm tracking-widest text-purple-300/80 font-mono uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
          ...aishiteru...
        </span>
      </div>

      {/* 5. First-Person Anatomical Curved Eyelid Awakening & Realistic Blinks */}
      <EyelidAwakening
        active={phase === 'reawaken'}
        onAwakened={() => {
          // Handled via main timeline
        }}
      />
    </div>
  );
}
