import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface EyelidAwakeningProps {
  active: boolean;
  onAwakened?: () => void;
}

export default function EyelidAwakening({ active, onAwakened }: EyelidAwakeningProps) {
  // openRatio: 0.0 = completely closed, 1.0 = fully open off-screen
  const [openRatio, setOpenRatio] = useState(0);
  const [sunlightAlpha, setSunlightAlpha] = useState(0);
  const [blurAmount, setBlurAmount] = useState(16);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setOpenRatio(0);
      setSunlightAlpha(0);
      setBlurAmount(16);
      return;
    }

    const state = { open: 0, light: 0, blur: 16 };
    const tl = gsap.timeline({
      onComplete: () => {
        onAwakened?.();
      },
    });

    // 0.00s: Darkness (eyes tightly shut)
    tl.set(state, { open: 0, light: 0, blur: 16 });

    // 1. Initial heavy slit open (0.00s – 0.24s): Eyelids part into an almond slit, blinding glare enters
    tl.to(state, {
      open: 0.26,
      light: 0.9,
      blur: 14,
      duration: 0.24,
      ease: 'power2.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setBlurAmount(state.blur);
      },
    });

    // 2. FIRST BLINK (0.24s – 0.33s): Reflexive snap-shut from the intense morning glare! (80ms)
    tl.to(state, {
      open: 0.03,
      light: 0.35,
      blur: 12,
      duration: 0.09,
      ease: 'power3.in',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setBlurAmount(state.blur);
      },
    });

    // 3. Second opening (0.33s – 0.60s): Eyelids flutter open wider as pupils adjust
    tl.to(state, {
      open: 0.65,
      light: 0.65,
      blur: 6,
      duration: 0.27,
      ease: 'power2.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setBlurAmount(state.blur);
      },
    });

    // 4. SECOND BLINK (0.60s – 0.70s): Quick natural flutter blink (85ms)
    tl.to(state, {
      open: 0.35,
      light: 0.45,
      duration: 0.085,
      ease: 'sine.inOut',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    });

    // 5. Full awakening (0.70s – 1.05s): Eyelids sweep completely off-screen, focus sharpens to 0px!
    tl.to(state, {
      open: 1.15,
      light: 0,
      blur: 0,
      duration: 0.35,
      ease: 'power3.inOut',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setBlurAmount(state.blur);
      },
    });

    return () => {
      tl.kill();
    };
  }, [active, onAwakened]);

  if (!active) return null;

  // Calculate natural anatomical curved eyelid paths
  // At openRatio = 0: upper meets lower at cy (50%)
  // At openRatio = 1: upper lid arches above 0%, lower lid curves below 100%
  const upperY = 50 - openRatio * 58;
  const upperArch = 50 - openRatio * 76; // center arches higher
  const lowerY = 50 + openRatio * 58;
  const lowerArch = 50 + openRatio * 72;

  // Upper eyelid SVG path (covers top half down to the upper lash curve)
  const upperPath = `M 0,0 L 100,0 L 100,${Math.max(0, upperY)} Q 50,${upperArch} 0,${Math.max(0, upperY)} Z`;

  // Lower eyelid SVG path (covers bottom half up to the lower lash curve)
  const lowerPath = `M 0,100 L 100,100 L 100,${Math.min(100, lowerY)} Q 50,${lowerArch} 0,${Math.min(100, lowerY)} Z`;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58] overflow-hidden"
    >
      {/* Dynamic lens blur as eyes adjust focus */}
      {blurAmount > 0.5 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        />
      )}

      {/* SVG Anatomical Curved Eyelids */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="eyelidShadow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#05020a" stopOpacity="1" />
            <stop offset="100%" stopColor="#0a0314" stopOpacity="0.95" />
          </radialGradient>
          <filter id="eyelidFeather" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Upper Anatomical Curved Eyelid */}
        <path
          d={upperPath}
          fill="url(#eyelidShadow)"
          filter="url(#eyelidFeather)"
        />
        {/* Upper Eyelash Rim definition */}
        <path
          d={`M 0,${Math.max(0, upperY)} Q 50,${upperArch} 100,${Math.max(0, upperY)}`}
          fill="none"
          stroke="#000000"
          strokeWidth="1.2"
        />

        {/* Lower Anatomical Curved Eyelid */}
        <path
          d={lowerPath}
          fill="url(#eyelidShadow)"
          filter="url(#eyelidFeather)"
        />
        {/* Lower Eyelash Rim definition */}
        <path
          d={`M 0,${Math.min(100, lowerY)} Q 50,${lowerArch} 100,${Math.min(100, lowerY)}`}
          fill="none"
          stroke="#000000"
          strokeWidth="0.8"
        />
      </svg>

      {/* Blinding golden morning sunlight bloom flooding into the awakening eyes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: sunlightAlpha,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(254, 240, 138, 0.55) 0%, rgba(255, 255, 255, 0.75) 35%, rgba(192, 132, 252, 0.4) 75%, transparent 100%)',
          mixBlendMode: 'screen',
          transition: 'opacity 30ms linear',
        }}
      />
    </div>
  );
}
