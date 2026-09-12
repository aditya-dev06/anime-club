import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface EyelidAwakeningProps {
  active: boolean;
  onAwakened?: () => void;
}

export default function EyelidAwakening({ active, onAwakened }: EyelidAwakeningProps) {
  // openRatio: 0.0 = completely closed, 1.15 = fully swept off-screen
  const [openRatio, setOpenRatio] = useState(0);
  const [sunlightAlpha, setSunlightAlpha] = useState(0);
  const [hemoglobinAlpha, setHemoglobinAlpha] = useState(0);
  const [blurAmount, setBlurAmount] = useState(20);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setOpenRatio(0);
      setSunlightAlpha(0);
      setHemoglobinAlpha(0);
      setBlurAmount(20);
      return;
    }

    const state = { open: 0, light: 0, hemo: 0.8, blur: 20 };
    const tl = gsap.timeline({
      onComplete: () => {
        onAwakened?.();
      },
    });

    // 0.00s: Darkness (eyelids closed with dawn red transillumination)
    tl.set(state, { open: 0, light: 0, hemo: 0.85, blur: 20 });

    // 1. Initial Almond Slit Crack (0.00s – 0.28s)
    // Eyelids part into a narrow slit; blinding morning sunlight pierces the dilated pupil
    tl.to(state, {
      open: 0.32,
      light: 0.95,
      hemo: 0.35,
      blur: 16,
      duration: 0.28,
      ease: 'power3.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setHemoglobinAlpha(state.hemo);
        setBlurAmount(state.blur);
      },
    });

    // 2. FIRST REFLEX BLINK (0.28s – 0.38s): Explosive 80ms photophobic snap-shut!
    tl.to(state, {
      open: 0.02,
      light: 0.25,
      hemo: 0.65,
      blur: 14,
      duration: 0.09,
      ease: 'power3.in',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setHemoglobinAlpha(state.hemo);
        setBlurAmount(state.blur);
      },
    });

    // 3. Secondary Opening & Pupillary Miosis (0.38s – 0.85s)
    // Upstroke is viscously damped (~200ms); iris constricts, depth-of-field deepens
    tl.to(state, {
      open: 0.72,
      light: 0.70,
      hemo: 0.05,
      blur: 6,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setHemoglobinAlpha(state.hemo);
        setBlurAmount(state.blur);
      },
    });

    // 4. SECOND BLINK (0.85s – 0.97s): Natural micro-flutter blink to clear tear film (110ms)
    tl.to(state, {
      open: 0.30,
      light: 0.45,
      duration: 0.055,
      ease: 'sine.in',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    }).to(state, {
      open: 0.80,
      light: 0.55,
      duration: 0.055,
      ease: 'sine.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
      },
    });

    // 5. Final Focus Lock & Aperture Sweep (0.97s – 1.35s)
    // Eyelids sweep completely off-screen, focus sharpens to 0px, colors snap to crisp daylight
    tl.to(state, {
      open: 1.20,
      light: 0,
      hemo: 0,
      blur: 0,
      duration: 0.38,
      ease: 'power3.out',
      onUpdate: () => {
        setOpenRatio(state.open);
        setSunlightAlpha(state.light);
        setHemoglobinAlpha(state.hemo);
        setBlurAmount(state.blur);
      },
    });

    return () => {
      tl.kill();
    };
  }, [active, onAwakened]);

  if (!active) return null;

  // Asymmetric Anatomical Palpebral Fissure Curves
  // Upper eyelid apex is shifted laterally to ~60% width; nasal inner corner dips downward
  const k = Math.max(0, Math.min(1.2, openRatio));
  const nasalCornerY = 50 + 2 * (1 - k);
  const temporalCornerY = 50 - 3 * (1 - k);

  const upperApexY = 50 - k * 84;
  const upperMid2Y = 50 - k * 80;

  const lowerApexY = 50 + k * 74;
  const lowerMid2Y = 50 + k * 68;

  // Upper eyelid SVG path (solid obsidian eyelid mass from top down to upper lash margin)
  const upperPath = `M 0,0 L 100,0 L 100,${temporalCornerY} C 75,${upperMid2Y} 58,${upperApexY} 0,${nasalCornerY} Z`;

  // Lower eyelid SVG path (solid eyelid mass from bottom up to lower lash margin)
  const lowerPath = `M 0,100 L 100,100 L 100,${temporalCornerY} C 72,${lowerMid2Y} 45,${lowerApexY} 0,${nasalCornerY} Z`;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58] overflow-hidden"
    >
      {/* 1. Dynamic Lens Aperture Focus Blur */}
      {blurAmount > 0.5 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        />
      )}

      {/* 2. Dawn Subsurface Hemoglobin Transillumination (Red light through closed lids) */}
      {hemoglobinAlpha > 0.01 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-150"
          style={{
            opacity: hemoglobinAlpha,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.75) 0%, rgba(185, 28, 28, 0.85) 45%, rgba(69, 10, 10, 0.95) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* 3. SVG Anatomical Curved Asymmetric Eyelids */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="eyelidSkinShadow" cx="50%" cy="50%" r="55%">
            <stop offset="60%" stopColor="#040108" stopOpacity="1" />
            <stop offset="90%" stopColor="#0b0312" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#1a0624" stopOpacity="0.95" />
          </radialGradient>
          <filter id="eyelidFeatherSoft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.0" />
          </filter>
        </defs>

        {/* Upper Anatomical Eyelid */}
        <path d={upperPath} fill="url(#eyelidSkinShadow)" filter="url(#eyelidFeatherSoft)" />
        {/* Upper Eyelash Margin Stroke */}
        <path
          d={`M 0,${nasalCornerY} C 58,${upperApexY} 75,${upperMid2Y} 100,${temporalCornerY}`}
          fill="none"
          stroke="#000000"
          strokeWidth="1.4"
        />

        {/* Lower Anatomical Eyelid */}
        <path d={lowerPath} fill="url(#eyelidSkinShadow)" filter="url(#eyelidFeatherSoft)" />
        {/* Lower Eyelash Margin Stroke */}
        <path
          d={`M 0,${nasalCornerY} C 45,${lowerApexY} 72,${lowerMid2Y} 100,${temporalCornerY}`}
          fill="none"
          stroke="#000000"
          strokeWidth="0.9"
        />
      </svg>

      {/* 4. Blinding Morning Sunlight Bloom & Chromatic Flare into Waking Eyes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: sunlightAlpha,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(254, 240, 138, 0.65) 0%, rgba(255, 255, 255, 0.85) 30%, rgba(216, 180, 254, 0.45) 70%, transparent 100%)',
          mixBlendMode: 'screen',
          transition: 'opacity 35ms linear',
        }}
      />
    </div>
  );
}
