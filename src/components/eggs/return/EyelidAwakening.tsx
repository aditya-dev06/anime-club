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
  // Aperture ratio: 0.0 = completely shut, 1.0 = normal gaze, 1.4 = fully cleared
  const [aperture, setAperture] = useState(0);
  const [hemoAlpha, setHemoAlpha] = useState(0);
  const [sunlightBloom, setSunlightBloom] = useState(0);
  const [diplopiaOffset, setDiplopiaOffset] = useState(0);
  const [tearMeniscus, setTearMeniscus] = useState(0);
  const [vignetteRadius, setVignetteRadius] = useState(35);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setAperture(0);
      setHemoAlpha(0);
      setSunlightBloom(0);
      setDiplopiaOffset(0);
      setTearMeniscus(0);
      setVignetteRadius(35);
      return;
    }

    const state = {
      k: 0,
      blur: 22,
      brightness: 2.8,
      contrast: 0.62,
      saturate: 0.40,
      diplopia: 16,
      hemo: 0.95,
      tear: 0.90,
      light: 0,
      vignetteR: 35,
      camY: 0,
      camRot: 0,
      camScale: 1.0,
    };

    const root = document.getElementById('site-root') || document.body;

    const syncState = () => {
      setAperture(state.k);
      setHemoAlpha(state.hemo);
      setSunlightBloom(state.light);
      setDiplopiaOffset(state.diplopia);
      setTearMeniscus(state.tear);
      setVignetteRadius(state.vignetteR);

      // Apply real-time optical blur, retinal overexposure, and miosis tone mapping to website root
      const blurVal = Math.max(0, state.blur);
      const brightVal = Math.max(0.5, state.brightness);
      const contVal = Math.max(0.4, state.contrast);
      const satVal = Math.max(0.2, state.saturate);

      root.style.filter = `blur(${blurVal.toFixed(1)}px) brightness(${brightVal.toFixed(2)}) contrast(${contVal.toFixed(2)}) saturate(${satVal.toFixed(2)})`;
    };

    const syncCamera = () => {
      root.style.transform = `translateY(${state.camY.toFixed(1)}px) rotate(${state.camRot.toFixed(2)}deg) scale(${state.camScale.toFixed(3)})`;
    };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(root, { clearProps: 'transform,filter' });
        root.style.transform = '';
        root.style.filter = '';
        onAwakened?.();
      },
    });

    // Initial state: Deep black unconsciousness with sunlight through eyelids
    syncState();

    // -------------------------------------------------------------------------
    // 0.00s – 0.45s: Stage 1: Groggy Slit (Coming out of death coma)
    // Eyelids crack open a sliver. Blinding white morning light floods dilated pupils.
    // -------------------------------------------------------------------------
    tl.to(
      state,
      {
        k: 0.22,
        blur: 18,
        brightness: 2.6,
        contrast: 0.65,
        saturate: 0.45,
        diplopia: 15,
        hemo: 0.15,
        light: 0.95,
        vignetteR: 48,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate: syncState,
      },
      0,
    );

    // -------------------------------------------------------------------------
    // 0.45s – 0.72s: Stage 2: Photophobic Corneal Reflex (Pain from Daylight)
    // Involuntary protective reflex: eyes wince and snap shut against the glare.
    // -------------------------------------------------------------------------
    tl.to(
      state,
      {
        k: 0.03,
        blur: 20,
        brightness: 1.35,
        contrast: 0.78,
        saturate: 0.55,
        diplopia: 10,
        hemo: 0.85,
        light: 0.15,
        vignetteR: 36,
        duration: 0.24,
        ease: 'power3.in',
        onUpdate: syncState,
      },
      0.45,
    );

    // -------------------------------------------------------------------------
    // 0.72s – 1.55s: Stage 3: THE VIOLENT INSPIRATORY GASP & WIDE SHOCK
    // Subaru gasps desperately for air (audio rush plays). Viewport jolts with chest heave.
    // Eyelids snap wide open to 0.88! Blur drops as cornea begins to focus.
    // -------------------------------------------------------------------------
    // Somatic chest heave recoil
    tl.to(
      state,
      {
        camY: -22,
        camRot: 1.15,
        camScale: 1.035,
        duration: 0.14,
        ease: 'power4.out',
        onUpdate: syncCamera,
      },
      0.72,
    ).to(
      state,
      {
        camY: 0,
        camRot: 0,
        camScale: 1.0,
        duration: 0.65,
        ease: 'elastic.out(1, 0.45)',
        onUpdate: syncCamera,
      },
      0.86,
    );

    // Eyelids fly wide open and light floods in
    tl.to(
      state,
      {
        k: 0.88,
        blur: 6.5,
        brightness: 1.60,
        contrast: 0.90,
        saturate: 0.78,
        diplopia: 4.5,
        hemo: 0.0,
        light: 0.55,
        vignetteR: 78,
        tear: 0.65,
        duration: 0.55,
        ease: 'power3.out',
        onUpdate: syncState,
      },
      0.74,
    );

    // -------------------------------------------------------------------------
    // 1.55s – 2.05s: Stage 4: Rapid Tear-Clearing Flutter Blink (Micro-blinks)
    // Two rapid micro-blinks to clear tears and lubricate the cornea.
    // -------------------------------------------------------------------------
    tl.to(
      state,
      {
        k: 0.26,
        blur: 5.5,
        brightness: 1.30,
        duration: 0.075,
        ease: 'power2.in',
        onUpdate: syncState,
      },
      1.55,
    )
      .to(
        state,
        {
          k: 0.84,
          blur: 3.2,
          brightness: 1.22,
          duration: 0.085,
          ease: 'power2.out',
          onUpdate: syncState,
        },
        1.625,
      )
      .to(
        state,
        {
          k: 0.42,
          blur: 2.8,
          brightness: 1.14,
          duration: 0.065,
          ease: 'power2.in',
          onUpdate: syncState,
        },
        1.73,
      )
      .to(
        state,
        {
          k: 0.94,
          blur: 1.2,
          brightness: 1.08,
          duration: 0.095,
          ease: 'power2.out',
          onUpdate: syncState,
        },
        1.795,
      );

    // -------------------------------------------------------------------------
    // 2.05s – 2.85s: Stage 5: Focus Lock & Crystal Daylight Normalization
    // Eyelids sweep completely away, blur drops to 0, vision is 100% crisp.
    // -------------------------------------------------------------------------
    tl.to(
      state,
      {
        k: 1.38,
        blur: 0,
        brightness: 1.0,
        contrast: 1.0,
        saturate: 1.0,
        diplopia: 0,
        light: 0,
        tear: 0,
        vignetteR: 125,
        duration: 0.80,
        ease: 'power3.out',
        onUpdate: syncState,
      },
      2.05,
    );

    return () => {
      tl.kill();
      gsap.set(root, { clearProps: 'transform,filter' });
      root.style.transform = '';
      root.style.filter = '';
    };
  }, [active, onAwakened]);

  if (!active) return null;

  // ---------------------------------------------------------------------------
  // Binocular Dual-Orb Anatomical Geometry
  // Left eye centered at X=30%, Right eye centered at X=70%, nasal dip at X=50%
  // ---------------------------------------------------------------------------
  const kNorm = Math.max(0, Math.min(1.4, aperture));

  // Orbital eyelid vertical displacement
  // Upper lid sweeps downward from brow (0%) to closed midline (~50%)
  const upperY = 50 - kNorm * 68; // at k=0: 50, at k=1: -18
  // Lower lid sweeps upward from cheek (100%) to closed midline (~50%), moving only ~28% as much as upper lid
  const lowerY = 50 + kNorm * 52; // at k=0: 50, at k=1: 102

  const nasalUpperY = 50 - kNorm * 52;
  const nasalLowerY = 50 + kNorm * 44;

  const templeUpperY = 50 - kNorm * 42;
  const templeLowerY = 50 + kNorm * 38;

  // Dual-Orb Upper Lid Contour: Temple L -> Left Eye Arch -> Nasal Dip -> Right Eye Arch -> Temple R
  const upperEyelidPath = `
    M -10,-10
    L 110,-10
    L 110,${templeUpperY}
    C 88,${templeUpperY + 4} 78,${upperY} 68,${upperY}
    C 58,${upperY} 54,${nasalUpperY} 50,${nasalUpperY}
    C 46,${nasalUpperY} 42,${upperY} 32,${upperY}
    C 22,${upperY} 12,${templeUpperY + 4} -10,${templeUpperY}
    Z
  `;

  // Dual-Orb Lower Lid Contour: Temple L -> Left Lower Arch -> Nasal Dip -> Right Lower Arch -> Temple R
  const lowerEyelidPath = `
    M -10,110
    L 110,110
    L 110,${templeLowerY}
    C 88,${templeLowerY - 3} 78,${lowerY} 68,${lowerY}
    C 58,${lowerY} 54,${nasalLowerY} 50,${nasalLowerY}
    C 46,${nasalLowerY} 42,${lowerY} 32,${lowerY}
    C 22,${lowerY} 12,${templeLowerY - 3} -10,${templeLowerY}
    Z
  `;

  // Waterline specular rim curves (moist eyelid margins catching sunlight)
  const upperWaterline = `
    M -5,${templeUpperY}
    C 12,${templeUpperY + 4} 22,${upperY} 32,${upperY}
    C 42,${upperY} 46,${nasalUpperY} 50,${nasalUpperY}
    C 54,${nasalUpperY} 58,${upperY} 68,${upperY}
    C 78,${upperY} 88,${templeUpperY + 4} 105,${templeUpperY}
  `;

  const lowerWaterline = `
    M -5,${templeLowerY}
    C 12,${templeLowerY - 3} 22,${lowerY} 32,${lowerY}
    C 42,${lowerY} 46,${nasalLowerY} 50,${nasalLowerY}
    C 54,${nasalLowerY} 58,${lowerY} 68,${lowerY}
    C 78,${lowerY} 88,${templeLowerY - 3} 105,${templeLowerY}
  `;

  // ---------------------------------------------------------------------------
  // Generate Out-Of-Focus Eyelash Cilia Strands along Upper Eyelids
  // ---------------------------------------------------------------------------
  const lashes: Array<{ x1: number; y1: number; cx: number; cy: number; x2: number; y2: number }> = [];
  if (kNorm < 1.15) {
    // Left eye lashes (X: 14% to 48%)
    for (let i = 0; i <= 14; i++) {
      const frac = i / 14;
      const x = 15 + frac * 32;
      const arch = Math.sin(frac * Math.PI);
      const y = upperY + (1 - arch) * (templeUpperY - upperY);
      const len = (3.5 + arch * 4.5) * Math.max(0.2, 1 - kNorm * 0.7);
      const curl = (frac - 0.5) * 4.0;
      lashes.push({
        x1: x,
        y1: y,
        cx: x + curl * 0.4,
        cy: y + len * 0.6,
        x2: x + curl,
        y2: y + len,
      });
    }
    // Right eye lashes (X: 52% to 86%)
    for (let i = 0; i <= 14; i++) {
      const frac = i / 14;
      const x = 53 + frac * 32;
      const arch = Math.sin(frac * Math.PI);
      const y = upperY + (1 - arch) * (templeUpperY - upperY);
      const len = (3.5 + arch * 4.5) * Math.max(0.2, 1 - kNorm * 0.7);
      const curl = (frac - 0.5) * 4.0;
      lashes.push({
        x1: x,
        y1: y,
        cx: x + curl * 0.4,
        cy: y + len * 0.6,
        x2: x + curl,
        y2: y + len,
      });
    }
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden select-none"
    >
      {/* 1. Dawn Hemoglobin Subsurface Transillumination (Crimson glow through closed eyelids) */}
      {hemoAlpha > 0.01 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity"
          style={{
            opacity: hemoAlpha,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.90) 0%, rgba(153, 27, 27, 0.94) 45%, rgba(69, 10, 10, 0.98) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* 2. Binocular Diplopia (Chromatic double vision ghosting) */}
      {diplopiaOffset > 0.4 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            boxShadow: `inset ${diplopiaOffset * 2}px 0 35px rgba(56, 189, 248, 0.35), inset -${diplopiaOffset * 2}px 0 35px rgba(244, 63, 94, 0.35)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 3. Binocular Anatomical Dual-Orb Eyelids with Cilia Penumbra Blur & Specular Rims */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Eyelid margin penumbra blur (near-field defocus right in front of retina) */}
          <filter id="eyelidPenumbra" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>

          {/* Eyelash cilia soft defocus filter */}
          <filter id="ciliaBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>

          {/* Specular Fresnel wet rim catching bright morning light along waterline */}
          <linearGradient id="wetRimGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#e9d5ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Eyelash hair gradient */}
          <linearGradient id="lashGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b2e" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#060209" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Upper & Lower Dual-Orb Eyelid Masses with Soft Penumbra */}
        <path d={upperEyelidPath} fill="#050208" filter="url(#eyelidPenumbra)" />
        <path d={lowerEyelidPath} fill="#050208" filter="url(#eyelidPenumbra)" />

        {/* Soft Eyelash Cilia Strands hanging from Upper Eyelid Arch */}
        {lashes.length > 0 && (
          <g filter="url(#ciliaBlur)">
            {lashes.map((lash, idx) => (
              <path
                key={idx}
                d={`M ${lash.x1},${lash.y1} Q ${lash.cx},${lash.cy} ${lash.x2},${lash.y2}`}
                fill="none"
                stroke="url(#lashGrad)"
                strokeWidth="0.45"
                strokeLinecap="round"
                opacity={0.82}
              />
            ))}
          </g>
        )}

        {/* Wet Waterline Specular Highlight (Fresnel Catchlight on Eyelid Margin) */}
        {kNorm < 1.15 && (
          <>
            <path
              d={upperWaterline}
              fill="none"
              stroke="url(#wetRimGrad)"
              strokeWidth="0.75"
              opacity={0.88}
            />
            <path
              d={lowerWaterline}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.55"
              opacity={0.75}
            />
          </>
        )}
      </svg>

      {/* 4. Peripheral Orbital Vignetting (Darkness of skull/eye socket around the visual field) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          background: `radial-gradient(ellipse ${vignetteRadius}% ${vignetteRadius * 0.75}% at 50% 50%, transparent 45%, rgba(5, 2, 8, 0.70) 75%, rgba(3, 1, 6, 0.98) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* 5. Lacrimal Meniscus Vertical Astigmatic Flare Streaks (Wet Cornea Light Streaking) */}
      {tearMeniscus > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: tearMeniscus,
            background:
              'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(255, 255, 255, 0.09) 40px, transparent 42px)',
            filter: 'blur(1.5px)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 6. Blinding Daylight Retinal Overexposure Bloom (Morning Sunlight Wash) */}
      {sunlightBloom > 0.01 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: sunlightBloom,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 250, 0.98) 0%, rgba(254, 240, 138, 0.80) 42%, rgba(216, 180, 254, 0.45) 75%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
}
