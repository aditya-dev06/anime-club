import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { fireEgg } from '../../lib/eggBus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { playSound } from '../../lib/audio';

/**
 * "Return by Death" — a Re:Zero-inspired fan tribute easter egg (original
 * copy, no copyrighted assets). Type the secret word anywhere on the page
 * (letter by letter) to be sent back to where the page began.
 *
 * Renders no DOM of its own until triggered; the mist overlay is a React-
 * rendered fixed layer (z-55, pointer-events-none, aria-hidden). The body
 * glitch + drifting blobs are GSAP-driven and fully cleaned up.
 */

const TRIGGER_WORD = 'return';
const IDLE_RESET_MS = 1500;
const COOLDOWN_MS = 8000;
const HOLD_MS = 1400;
const FADE_MS = 550;

const EGG = {
  id: 'return-by-death',
  title: 'RETURN BY DEATH',
  subtitle:
    "You were sent back to where this page began. Don't tell anyone.",
  accent: 'purple',
} as const;

export default function ReturnByDeath() {
  const reduced = usePrefersReducedMotion();

  // Mirror for the keydown listener so it never needs re-binding.
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const [overlayOn, setOverlayOn] = useState(false);
  const [lit, setLit] = useState(false);

  const mistRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  const bufferRef = useRef('');
  const idleTimerRef = useRef(0);
  const lastFireRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);
  const glitchRef = useRef<gsap.core.Timeline | null>(null);

  /* Drifting witch-mist blobs (and a slow mist pulse) while overlay is up. */
  useEffect(() => {
    if (!overlayOn || reduced) return;
    const blobs = [blob1Ref.current, blob2Ref.current, blob3Ref.current];
    blobs.forEach((blob, i) => {
      if (!blob) return;
      tweensRef.current.push(
        gsap.to(blob, {
          x: (i % 2 === 0 ? 1 : -1) * (90 + i * 45),
          y: (i % 2 === 0 ? -1 : 1) * (70 + i * 35),
          duration: 7 + i * 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }),
      );
    });
    if (mistRef.current) {
      tweensRef.current.push(
        gsap.to(mistRef.current, {
          opacity: 0.72,
          duration: 1.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }),
      );
    }
    return () => {
      tweensRef.current.forEach((t) => t.kill());
      tweensRef.current = [];
    };
  }, [overlayOn, reduced]);

  /* Full teardown on unmount: timers, tweens, and any body styles. */
  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      window.clearTimeout(idleTimerRef.current);
      glitchRef.current?.kill();
      tweensRef.current.forEach((t) => t.kill());
      gsap.set(document.body, { clearProps: 'filter,transform' });
    },
    [],
  );

  useEffect(() => {
    const scheduleIdleReset = () => {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        bufferRef.current = '';
      }, IDLE_RESET_MS);
    };

    const runEffect = () => {
      /* Reduced motion: no overlay, no glitch — toast + instant jump. */
      if (reducedRef.current) {
        playSound('/sounds/return-by-death.webm', 0.8);
        fireEgg(EGG);
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      /* Fade the mist overlay in. */
      playSound('/sounds/return-by-death.webm', 0.8);
      setOverlayOn(true);
      setLit(false);
      timersRef.current.push(
        window.setTimeout(() => setLit(true), 30),
      );

      /* Return to where the page began. */
      window.scrollTo({ top: 0, behavior: 'smooth' });

      /* ~0.85s reality glitch on the body itself (amplitude <= 4px). */
      const body = document.body;
      const glitch = gsap.timeline({
        onComplete: () => gsap.set(body, { clearProps: 'filter,transform' }),
      });
      glitch
        .to(body, { filter: 'blur(2px) saturate(1.4)', duration: 0.14 }, 0)
        .to(body, { x: 2, y: -1, duration: 0.06, ease: 'none' }, 0);
      for (let i = 0; i < 8; i++) {
        glitch.to(
          body,
          {
            x: (Math.random() * 2 - 1) * 4,
            y: (Math.random() * 2 - 1) * 3,
            duration: 0.08,
            ease: 'none',
          },
          0.1 + i * 0.07,
        );
      }
      glitch.to(body, {
        x: 0,
        y: 0,
        filter: 'blur(0px) saturate(1)',
        duration: 0.12,
      });
      glitchRef.current = glitch;

      /* Hold the mist, then fade out and fire the toast as it lifts. */
      timersRef.current.push(
        window.setTimeout(() => {
          setLit(false);
          fireEgg(EGG);
        }, HOLD_MS),
      );
      timersRef.current.push(
        window.setTimeout(() => setOverlayOn(false), HOLD_MS + FADE_MS + 60),
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      /* Never hijack typing inside form fields. */
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

      /* Ignore special keys (Shift, Backspace, ...) without breaking buffer. */
      if (e.key.length !== 1) return;

      const ch = e.key.toLowerCase();
      const next = bufferRef.current + ch;
      if (TRIGGER_WORD.startsWith(next)) {
        bufferRef.current = next;
      } else {
        /* Mismatch: restart from this key if it begins the word. */
        bufferRef.current = ch === TRIGGER_WORD[0] ? ch : '';
      }
      scheduleIdleReset();

      if (bufferRef.current === TRIGGER_WORD) {
        bufferRef.current = '';
        window.clearTimeout(idleTimerRef.current);
        const now = Date.now();
        if (now - lastFireRef.current < COOLDOWN_MS) return; /* once / 8s */
        lastFireRef.current = now;
        runEffect();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!overlayOn) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
      style={{ opacity: lit ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
    >
      {/* Layered radial witch-mist over a darkened veil. */}
      <div
        ref={mistRef}
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(1100px 720px at 18% 28%, rgba(109,74,255,0.26), transparent 62%)',
            'radial-gradient(900px 640px at 80% 68%, rgba(139,92,246,0.20), transparent 65%)',
            'radial-gradient(1500px 950px at 50% 45%, rgba(109,74,255,0.14), transparent 70%)',
            'linear-gradient(180deg, rgba(7,7,12,0.55), rgba(11,11,19,0.72))',
          ].join(', '),
        }}
      />

      {/* Drifting blurred blobs. */}
      <div
        ref={blob1Ref}
        className="absolute rounded-full will-change-transform"
        style={{
          width: '44vmax',
          height: '44vmax',
          left: '-8%',
          top: '2%',
          background:
            'radial-gradient(circle, rgba(109,74,255,0.30) 0%, rgba(109,74,255,0.12) 45%, transparent 70%)',
          filter: 'blur(52px)',
        }}
      />
      <div
        ref={blob2Ref}
        className="absolute rounded-full will-change-transform"
        style={{
          width: '38vmax',
          height: '38vmax',
          right: '-6%',
          top: '28%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0.10) 45%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        ref={blob3Ref}
        className="absolute rounded-full will-change-transform"
        style={{
          width: '30vmax',
          height: '30vmax',
          left: '34%',
          bottom: '-14%',
          background:
            'radial-gradient(circle, rgba(109,74,255,0.24) 0%, transparent 65%)',
          filter: 'blur(44px)',
        }}
      />

      {/* Vignette to pull the eye to the centre. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(7,7,12,0.78) 100%)',
        }}
      />
    </div>
  );
}
