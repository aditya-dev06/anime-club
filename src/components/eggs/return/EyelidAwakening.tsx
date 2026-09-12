import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface EyelidAwakeningProps {
  active: boolean;
  onAwakened?: () => void;
}

/**
 * Cinematic First-Person Awakening POV (Re:Zero Subaru Return by Death)
 *
 * Simulates the true physiological & optical physics of a human suddenly gasping awake:
 * 1. Somatic Diaphragmatic Shock: Convulsive inspiratory chest heave jolting the viewport (-16px recoil).
 * 2. Retinal Overexposure: Dilated pupils (8mm) blown out by bright morning daylight (brightness 1.95x).
 * 3. Binocular Diplopia: Extraocular muscle divergence creating double vision that fuses into single focus.
 * 4. Anatomical Asymmetric Eyelids: Offset apex, lacrimal canthus dip, and cilia penumbra defocus blur.
 * 5. Wet Lacrimal Meniscus: Specular Fresnel light reflection and vertical astigmatic glare streaks.
 * 6. Photophobic Corneal Reflex: 90ms involuntary snap-blink from blinding sunlight, followed by miosis.
 */
export default function EyelidAwakening({ active, onAwakened }: EyelidAwakeningProps) {
  // Aperture ratio: 0.0 = tightly shut, 1.2 = swept off-screen
  const [k, setK] = useState(0);
  const [hemoAlpha, setHemoAlpha] = useState(0);
  const [sunlightBloom, setSunlightBloom] = useState(0);
  const [diplopiaOffset, setDiplopiaOffset] = useState(0);
  const [tearMeniscus, setTearMeniscus] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setK(0);
      setHemoAlpha(0);
      setSunlightBloom(0);
      setDiplopiaOffset(0);
      setTearMeniscus(0);
      return;
    }

    const state = {
      k: 0,
      hemo: 0.9,
      light: 0,
      diplopia: 14,
      tear: 0.9,
      camY: 0,
      camRot: 0,
    };

    const root = document.getElementById('site-root') || document.body;

    const syncState = () => {
      setK(state.k);
      setHemoAlpha(state.hemo);
      setSunlightBloom(state.light);
      setDiplopiaOffset(state.diplopia);
      setTearMeniscus(state.tear);

      // Pupillary miosis tone mapping applied to the viewport root
      const brightness = 1 + state.light * 0.95;
      const contrast = 1 - state.light * 0.15;
      root.style.filter = `brightness(${brightness}) contrast(${contrast})`;
    };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(root, { clearProps: 'transform,filter' });
        root.style.transform = '';
        root.style.filter = '';
        onAwakened?.();
      },
    });

    // 0.00s: Violent Inspiratory Diaphragm Shock (Subaru gasps for air -> chest heave camera recoil)
    tl.to(state, {
      camY: -16,
      camRot: 0.75,
      duration: 0.12,
      ease: 'power4.out',
      onUpdate: () => {
        root.style.transform = `translateY(${state.camY}px) rotate(${state.camRot}deg)`;
      },
    }).to(
      state,
      {
        camY: 0,
        camRot: 0,
        duration: 0.45,
        ease: 'elastic.out(1, 0.4)',
        onUpdate: () => {
          root.style.transform = `translateY(${state.camY}px) rotate(${state.camRot}deg)`;
        },
      },
      '-=0.02',
    );

    // 1. Initial Slit Crack (0.00s – 0.26s): Eyelids crack open; blinding glare strikes dilated pupils
    tl.to(
      state,
      {
        k: 0.30,
        hemo: 0.25,
        light: 0.98,
        diplopia: 12,
        tear: 0.85,
        duration: 0.26,
        ease: 'power3.out',
        onUpdate: syncState,
      },
      0,
    );

    // 2. Photophobic Corneal Reflex Blink (0.26s – 0.35s): Involuntary 90ms snap shut from blinding light
    tl.to(state, {
      k: 0.03,
      hemo: 0.70,
      light: 0.20,
      diplopia: 8,
      tear: 0.60,
      duration: 0.09,
      ease: 'power3.in',
      onUpdate: syncState,
    });

    // 3. Secondary Viscous Reopening & Pupillary Miosis (0.35s – 0.82s)
    tl.to(state, {
      k: 0.75,
      hemo: 0.0,
      light: 0.65,
      diplopia: 4,
      tear: 0.40,
      duration: 0.47,
      ease: 'power2.out',
      onUpdate: syncState,
    });

    // 4. Tear-Film Flutter Blink (0.82s – 0.94s): Natural 110ms micro-blink clearing lacrimal fluid
    tl.to(state, {
      k: 0.36,
      light: 0.40,
      duration: 0.055,
      ease: 'sine.in',
      onUpdate: syncState,
    }).to(state, {
      k: 0.82,
      light: 0.50,
      duration: 0.065,
      ease: 'sine.out',
      onUpdate: syncState,
    });

    // 5. Final Aperture Sweep, Diplopia Fusion & Focus Lock (0.94s – 1.35s)
    tl.to(state, {
      k: 1.20,
      light: 0.0,
      diplopia: 0,
      tear: 0.0,
      duration: 0.40,
      ease: 'power3.out',
      onUpdate: syncState,
    });

    return () => {
      tl.kill();
      gsap.set(root, { clearProps: 'transform,filter' });
      root.style.transform = '';
      root.style.filter = '';
    };
  }, [active, onAwakened]);

  if (!active) return null;

  // Asymmetric Anatomical Palpebral Fissure Coordinates
  const clampK = Math.max(0, Math.min(1.2, k));
  const nasalY = 51 + (1 - clampK) * 1.6;
  const temporalY = 48 - (1 - clampK) * 2.2;
  const upperApexY = 50 - clampK * 86;
  const upperMidLateralY = 49 - clampK * 81;
  const lowerApexY = 50 + clampK * 72;
  const lowerMidLateralY = 50 + clampK * 66;

  const upperPath = `M 0,0 L 100,0 L 100,${temporalY} C 78,${upperMidLateralY} 58,${upperApexY} 0,${nasalY} Z`;
  const lowerPath = `M 0,100 L 100,100 L 100,${temporalY} C 74,${lowerMidLateralY} 46,${lowerApexY} 0,${nasalY} Z`;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {/* 1. Dawn Hemoglobin Subsurface Transillumination (Crimson glow through closed eyelids) */}
      {hemoAlpha > 0.01 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity"
          style={{
            opacity: hemoAlpha,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.88) 0%, rgba(153, 27, 27, 0.94) 50%, rgba(69, 10, 10, 0.98) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* 2. Binocular Diplopia (Double Vision split image and chromatic divergence) */}
      {diplopiaOffset > 0.5 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            boxShadow: `inset ${diplopiaOffset}px 0 20px rgba(59, 130, 246, 0.25), inset -${diplopiaOffset}px 0 20px rgba(239, 68, 68, 0.25)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 3. Anatomical Curved Eyelids with Cilia Penumbra Blur & Specular Wet Rim */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Eyelid near-field penumbra blur (eyelids out-of-focus close to retina) */}
          <filter id="ciliaPenumbra" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          {/* Specular Fresnel wet rim catching bright morning light */}
          <linearGradient id="wetRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#fef08a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Eyelid Obsidian Masses with Soft Penumbra */}
        <path d={upperPath} fill="#060209" filter="url(#ciliaPenumbra)" />
        <path d={lowerPath} fill="#060209" filter="url(#ciliaPenumbra)" />

        {/* Wet Eyelid Margin Specular Rim Highlight (Fresnel Light Catch) */}
        {clampK < 1.05 && (
          <>
            <path
              d={`M 0,${nasalY} C 58,${upperApexY} 78,${upperMidLateralY} 100,${temporalY}`}
              fill="none"
              stroke="url(#wetRim)"
              strokeWidth="0.8"
              opacity={0.85}
            />
            <path
              d={`M 0,${nasalY} C 46,${lowerApexY} 74,${lowerMidLateralY} 100,${temporalY}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity={0.6}
            />
          </>
        )}
      </svg>

      {/* 4. Lacrimal Meniscus Vertical Astigmatic Flare Streaks (Wet Cornea Light Streaking) */}
      {tearMeniscus > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: tearMeniscus,
            background:
              'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255, 255, 255, 0.08) 42px, transparent 44px)',
            filter: 'blur(2px)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 5. Blinding Daylight Retinal Overexposure Bloom (Pupillary Glare) */}
      {sunlightBloom > 0.01 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: sunlightBloom,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.96) 0%, rgba(254, 240, 138, 0.75) 40%, rgba(216, 180, 254, 0.40) 75%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
}
