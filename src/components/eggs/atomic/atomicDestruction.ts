import gsap from 'gsap';

export interface DestructionController {
  startTremor: () => void;
  triggerDetonation: () => void;
  triggerRestoration: (onComplete?: () => void) => void;
  cleanup: () => void;
}

export function createDestructionController(reduced = false): DestructionController {
  const tremorTimeline = gsap.timeline({ paused: true });
  const blastTimeline = gsap.timeline({ paused: true });
  const restoreTimeline = gsap.timeline({ paused: true });

  const getSiteRoot = (): HTMLElement | null => {
    return document.getElementById('site-root') || document.body;
  };

  const getFragments = (): HTMLElement[] => {
    const root = getSiteRoot();
    if (!root) return [];
    const elements: (HTMLElement | null)[] = [
      root.querySelector('nav'),
      root.querySelector('.title-hero'),
      root.querySelector('.title-warp'),
      root.querySelector('main'),
      root.querySelector('footer'),
      ...Array.from(root.querySelectorAll<HTMLElement>('.glass')),
      ...Array.from(root.querySelectorAll<HTMLElement>('button')),
      ...Array.from(root.querySelectorAll<HTMLElement>('article')),
    ];
    return Array.from(new Set(elements.filter((el): el is HTMLElement => el !== null)));
  };

  const startTremor = () => {
    if (reduced) return;
    const root = getSiteRoot();
    if (!root) return;

    tremorTimeline.clear();

    // 0.0s to 4.5s: Escalating camera vibration across the chant
    const earlySteps = 38;
    for (let i = 0; i < earlySteps; i++) {
      const progress = i / earlySteps;
      const amp = 2 + progress * 5;
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * amp,
          y: (Math.random() - 0.5) * amp,
          rotation: (Math.random() - 0.5) * (0.3 + progress * 0.6),
          duration: 0.1,
          ease: 'none',
        },
        i * 0.11,
      );
    }

    // 4.5s to 6.0s: Violent seismic earthquake ("...AM...")
    const intenseSteps = 24;
    for (let i = 0; i < intenseSteps; i++) {
      const progress = i / intenseSteps;
      const ampX = 8 + progress * 22;
      const ampY = 7 + progress * 16;
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * ampX,
          y: (Math.random() - 0.5) * ampY,
          rotation: (Math.random() - 0.5) * 2.5,
          duration: 0.06,
          ease: 'none',
        },
        4.5 + i * 0.062,
      );
    }

    // 6.0s to 6.37s: Pre-detonation vacuum implosion (screen compresses inward)
    tremorTimeline.to(
      root,
      {
        x: 0,
        y: 0,
        scale: 0.94,
        rotation: 0,
        filter: 'brightness(0.75) contrast(1.3) hue-rotate(260deg)',
        duration: 0.35,
        ease: 'power2.in',
      },
      6.02,
    );

    tremorTimeline.play(0);
  };

  const triggerDetonation = () => {
    tremorTimeline.kill();
    const root = getSiteRoot();
    if (!root) return;

    blastTimeline.clear();

    if (reduced) {
      blastTimeline.to(root, {
        scale: 0.98,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
      });
      blastTimeline.play(0);
      return;
    }

    // 1. Instant 90ms nuclear color inversion flash (blinding purple-violet radiation)
    blastTimeline.to(
      root,
      {
        filter: 'invert(1) contrast(3) hue-rotate(285deg) drop-shadow(0 0 50px rgba(168,85,247,1))',
        duration: 0.09,
      },
      0,
    );
    blastTimeline.to(
      root,
      {
        filter: 'contrast(1.4) brightness(0.8) hue-rotate(270deg)',
        duration: 0.25,
      },
      0.09,
    );

    // 2. Severe Bomb Crater 3D Deformation of the entire website
    blastTimeline.to(
      root,
      {
        transformPerspective: 750,
        rotateX: 24,
        rotateY: -16,
        rotateZ: 6.5,
        scale: 0.82,
        y: 85,
        duration: 0.55,
        ease: 'power4.out',
      },
      0.05,
    );

    // 3. Catastrophic Bomb Blast Scattering of Individual UI Components!
    // Navbar: blasted high up into the corner and tilted like ripped metal
    const nav = root.querySelector<HTMLElement>('nav');
    if (nav) {
      blastTimeline.to(
        nav,
        {
          y: -110,
          x: -85,
          rotateZ: -28,
          rotateX: 40,
          scale: 0.88,
          opacity: 0.75,
          duration: 0.6,
          ease: 'power4.out',
        },
        0.04,
      );
    }

    // Hero title / hat: blown across the screen
    const heroTitle = root.querySelector<HTMLElement>('.title-hero') || root.querySelector<HTMLElement>('.title-warp');
    if (heroTitle) {
      blastTimeline.to(
        heroTitle,
        {
          y: -130,
          x: 75,
          rotateZ: 28,
          skewX: 20,
          scale: 1.25,
          duration: 0.55,
          ease: 'power4.out',
        },
        0.05,
      );
    }

    // Straw Hat canvas / renderer container
    const hatCanvas = root.querySelector<HTMLElement>('canvas');
    if (hatCanvas) {
      blastTimeline.to(
        hatCanvas,
        {
          y: -160,
          x: -100,
          rotateZ: -45,
          scale: 1.3,
          duration: 0.6,
          ease: 'power4.out',
        },
        0.05,
      );
    }

    // Footer: blasted down and skewed
    const footer = root.querySelector<HTMLElement>('footer');
    if (footer) {
      blastTimeline.to(
        footer,
        {
          y: 140,
          x: -70,
          rotateZ: -16,
          skewX: -14,
          opacity: 0.7,
          duration: 0.65,
          ease: 'power4.out',
        },
        0.06,
      );
    }

    // All Glass & Event Cards: blown violently outward in 3D in all directions!
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.glass'));
    const blastVectors = [
      { x: -260, y: 150, rz: -42, rx: 50, s: 0.75 },
      { x: 280, y: 170, rz: 38, ry: -45, s: 0.8 },
      { x: -200, y: -140, rz: -32, rx: -40, s: 0.72 },
      { x: 230, y: -120, rz: 35, ry: 40, s: 0.76 },
      { x: -90, y: 240, rz: 28, rx: 35, s: 0.7 },
      { x: 110, y: 220, rz: -26, ry: -30, s: 0.74 },
    ];

    cards.forEach((card, idx) => {
      const vec = blastVectors[idx % blastVectors.length];
      blastTimeline.to(
        card,
        {
          x: vec.x,
          y: vec.y,
          rotateZ: vec.rz,
          rotateX: vec.rx || 0,
          rotateY: vec.ry || 0,
          scale: vec.s,
          opacity: 0.85,
          boxShadow: '0 0 30px rgba(168,85,247,0.7), inset 0 0 20px rgba(216,180,254,0.5)',
          duration: 0.6 + (idx % 3) * 0.08,
          ease: 'power3.out',
        },
        0.06 + idx * 0.02,
      );
    });

    // Buttons: scattered around
    const buttons = Array.from(root.querySelectorAll<HTMLElement>('button, .btn-gold'));
    buttons.forEach((btn, idx) => {
      const dirX = idx % 2 === 0 ? 1 : -1;
      blastTimeline.to(
        btn,
        {
          x: dirX * (50 + (idx * 30) % 120),
          y: (idx % 2 === 0 ? -1 : 1) * (40 + (idx * 25) % 90),
          rotateZ: dirX * (15 + (idx * 12) % 45),
          duration: 0.55,
          ease: 'power3.out',
        },
        0.08,
      );
    });

    // 4. Lingering post-blast earthquake rumble (destroyed pieces vibrating on the ground)
    for (let i = 0; i < 14; i++) {
      blastTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 12,
          y: 85 + (Math.random() - 0.5) * 8,
          duration: 0.12,
          ease: 'sine.inOut',
        },
        0.6 + i * 0.13,
      );
    }

    blastTimeline.play(0);
  };

  const triggerRestoration = (onComplete?: () => void) => {
    tremorTimeline.kill();
    blastTimeline.kill();
    restoreTimeline.clear();

    const root = getSiteRoot();
    if (!root) {
      onComplete?.();
      return;
    }

    const fragments = getFragments();

    // Magical Singularity Rewind: all shattered pieces snap back in 3D
    restoreTimeline.to(
      root,
      {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        filter: 'none',
        duration: 0.95,
        ease: 'back.out(1.8)',
      },
      0,
    );

    fragments.forEach((frag, idx) => {
      restoreTimeline.to(
        frag,
        {
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          skewX: 0,
          scale: 1,
          opacity: 1,
          filter: 'none',
          boxShadow: 'none',
          duration: 0.9,
          ease: 'power3.out',
        },
        0.02 + (idx % 4) * 0.02,
      );
    });

    restoreTimeline.call(() => {
      gsap.set([root, ...fragments], { clearProps: 'all' });
      onComplete?.();
    });

    restoreTimeline.play(0);
  };

  const cleanup = () => {
    tremorTimeline.kill();
    blastTimeline.kill();
    restoreTimeline.kill();
    const root = getSiteRoot();
    if (root) {
      const fragments = getFragments();
      gsap.set([root, ...fragments], { clearProps: 'all' });
    }
  };

  return {
    startTremor,
    triggerDetonation,
    triggerRestoration,
    cleanup,
  };
}
