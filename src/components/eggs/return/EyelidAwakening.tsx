import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface EyelidAwakeningProps {
  active: boolean;
  onAwakened?: () => void;
}

export default function EyelidAwakening({ active, onAwakened }: EyelidAwakeningProps) {
  const [openRatio, setOpenRatio] = useState(0); // 0 = closed, 1 = fully open
  const [sunlightAlpha, setSunlightAlpha] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setOpenRatio(0);
      setSunlightAlpha(0);
      return;
    }

    const state = { open: 0, light: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        onAwakened?.();
      },
    });

    // 6.20s: Eyes closed in darkness
    tl.set(state, { open: 0, light: 0 });

    // 1. First peek open: Eyelids slit open as bright light floods in
    tl.to(state, {
      open: 0.28,
      light: 0.85,
      duration: 0.22,
      ease: 'power2.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    });

    // 2. First quick blink: Eyelids shut from the sudden brightness!
    tl.to(state, {
      open: 0.05,
      light: 0.4,
      duration: 0.12,
      ease: 'power2.in',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    });

    // 3. Second opening: Eyelids open wider, pupils adjusting
    tl.to(state, {
      open: 0.65,
      light: 0.7,
      duration: 0.24,
      ease: 'power2.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    });

    // 4. Second subtle flutter-blink
    tl.to(state, {
      open: 0.4,
      duration: 0.09,
      ease: 'sine.inOut',
      onUpdate: () => setOpenRatio(state.open),
    });

    // 5. Fully open! Eyelids part all the way, golden morning sunlight clears
    tl.to(state, {
      open: 1.0,
      light: 0,
      duration: 0.32,
      ease: 'power3.inOut',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    });

    return () => {
      tl.kill();
    };
  }, [active, onAwakened]);

  if (!active && openRatio >= 1) return null;

  // Upper and lower curved eyelid clip boundaries
  const topCoverHeight = Math.max(0, (1 - openRatio) * 50);
  const bottomCoverHeight = Math.max(0, (1 - openRatio) * 50);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58] overflow-hidden"
    >
      {/* Upper Eyelid with organic curvature */}
      <div
        className="absolute top-0 left-0 right-0 bg-[#07020d]"
        style={{
          height: `${topCoverHeight}%`,
          borderBottom: '2px solid rgba(147, 51, 234, 0.4)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.95), inset 0 -10px 25px rgba(0,0,0,0.8)',
          transition: 'height 10ms linear',
        }}
      />

      {/* Lower Eyelid with organic curvature */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#07020d]"
        style={{
          height: `${bottomCoverHeight}%`,
          borderTop: '2px solid rgba(147, 51, 234, 0.3)',
          boxShadow: '0 -15px 40px rgba(0, 0, 0, 0.95), inset 0 10px 25px rgba(0,0,0,0.8)',
          transition: 'height 10ms linear',
        }}
      />

      {/* Blinding morning sunlight flooding into the eyes upon awakening */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: sunlightAlpha,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(254, 240, 138, 0.45) 0%, rgba(255, 255, 255, 0.65) 40%, rgba(192, 132, 252, 0.35) 80%, transparent 100%)',
          mixBlendMode: 'screen',
          filter: `blur(${Math.max(0, (1 - openRatio) * 12)}px)`,
          transition: 'opacity 30ms linear',
        }}
      />
    </div>
  );
}
