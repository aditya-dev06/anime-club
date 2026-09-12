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

  // Explicit tracking of every single transformed DOM element
  const affectedElements = new Set<HTMLElement>();

  const getSiteRoot = (): HTMLElement | null => {
    return document.getElementById('site-root') || document.body;
  };

  const registerElement = (el: HTMLElement | null | undefined): HTMLElement | null => {
    if (!el) return null;
    affectedElements.add(el);
    return el;
  };

  const startTremor = () => {
    if (reduced) return;
    const root = getSiteRoot();
    if (!root) return;
    registerElement(root);

    tremorTimeline.clear();

    // 0.0s to 4.5s: Escalating camera vibration across the chant
    const earlySteps = 36;
    for (let i = 0; i < earlySteps; i++) {
      const progress = i / earlySteps;
      const amp = 2 + progress * 5;
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * amp,
          y: (Math.random() - 0.5) * amp,
          rotation: (Math.random() - 0.5) * (0.3 + progress * 0.5),
          duration: 0.1,
          ease: 'none',
        },
        i * 0.12,
      );
    }

    // 4.5s to 6.0s: Violent seismic earthquake ("...AM...")
    const intenseSteps = 24;
    for (let i = 0; i < intenseSteps; i++) {
      const progress = i / intenseSteps;
      const ampX = 8 + progress * 24;
      const ampY = 7 + progress * 18;
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

    // 6.0s to 6.37s: Pre-detonation vacuum implosion
    tremorTimeline.to(
      root,
      {
        x: 0,
        y: 0,
        scale: 0.94,
        rotation: 0,
        filter: 'brightness(0.8) contrast(1.3) hue-rotate(260deg)',
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
    registerElement(root);

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

    // 1. Instant 80ms violet radiation flash
    blastTimeline.to(
      root,
      {
        filter: 'invert(1) contrast(3) hue-rotate(285deg)',
        duration: 0.08,
      },
      0,
    );
    blastTimeline.to(
      root,
      {
        filter: 'contrast(1.3) brightness(0.85) hue-rotate(270deg)',
        duration: 0.2,
      },
      0.08,
    );

    // 2. Severe Bomb Crater 3D Distortion of the entire page
    blastTimeline.to(
      root,
      {
        transformPerspective: 800,
        rotateX: 22,
        rotateY: -15,
        rotateZ: 6,
        scale: 0.84,
        y: 80,
        duration: 0.5,
        ease: 'power4.out',
      },
      0.05,
    );

    // 3. Catastrophic Bomb Blast Scattering of All Key Elements
    // Navbar
    const nav = registerElement(root.querySelector<HTMLElement>('nav'));
    if (nav) {
      blastTimeline.to(
        nav,
        {
          y: -100,
          x: -80,
          rotateZ: -26,
          rotateX: 35,
          scale: 0.88,
          opacity: 0.8,
          duration: 0.55,
          ease: 'power4.out',
        },
        0.04,
      );
    }

    // Hero title
    const heroTitle = registerElement(
      root.querySelector<HTMLElement>('.title-hero') || root.querySelector<HTMLElement>('.title-warp'),
    );
    if (heroTitle) {
      blastTimeline.to(
        heroTitle,
        {
          y: -120,
          x: 70,
          rotateZ: 25,
          skewX: 18,
          scale: 1.2,
          duration: 0.5,
          ease: 'power4.out',
        },
        0.05,
      );
    }

    // Hero Hat Canvas
    const hatCanvas = registerElement(root.querySelector<HTMLElement>('canvas'));
    if (hatCanvas) {
      blastTimeline.to(
        hatCanvas,
        {
          y: -140,
          x: -90,
          rotateZ: -38,
          scale: 1.25,
          duration: 0.55,
          ease: 'power4.out',
        },
        0.05,
      );
    }

    // Footer
    const footer = registerElement(root.querySelector<HTMLElement>('footer'));
    if (footer) {
      blastTimeline.to(
        footer,
        {
          y: 130,
          x: -60,
          rotateZ: -14,
          skewX: -12,
          opacity: 0.75,
          duration: 0.6,
          ease: 'power4.out',
        },
        0.06,
      );
    }

    // All Glass & Event Cards
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.glass'));
    const blastVectors = [
      { x: -240, y: 140, rz: -38, rx: 45, s: 0.78 },
      { x: 260, y: 160, rz: 35, ry: -40, s: 0.82 },
      { x: -180, y: -130, rz: -28, rx: -35, s: 0.75 },
      { x: 210, y: -110, rz: 32, ry: 35, s: 0.78 },
      { x: -80, y: 220, rz: 24, rx: 30, s: 0.72 },
      { x: 90, y: 200, rz: -22, ry: -28, s: 0.76 },
    ];

    cards.forEach((card, idx) => {
      registerElement(card);
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
          opacity: 0.88,
          boxShadow: '0 0 25px rgba(168,85,247,0.6)',
          duration: 0.55 + (idx % 3) * 0.08,
          ease: 'power3.out',
        },
        0.06 + idx * 0.02,
      );
    });

    // Post-blast earthquake tremors
    for (let i = 0; i < 12; i++) {
      blastTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 10,
          y: 80 + (Math.random() - 0.5) * 6,
          duration: 0.12,
          ease: 'sine.inOut',
        },
        0.55 + i * 0.12,
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
    registerElement(root);

    const allElements = Array.from(affectedElements);

    // Animate every affected element smoothly back to neutral
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
        duration: 0.85,
        ease: 'power3.inOut',
      },
      0,
    );

    allElements.forEach((el, idx) => {
      if (el === root) return;
      restoreTimeline.to(
        el,
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
          duration: 0.8,
          ease: 'back.out(1.6)',
        },
        (idx % 4) * 0.02,
      );
    });

    // GUARANTEED CLEANUP: Wipe all injected inline styles completely
    restoreTimeline.call(() => {
      gsap.set(allElements, { clearProps: 'all' });
      allElements.forEach((el) => {
        el.style.transform = '';
        el.style.filter = '';
        el.style.opacity = '';
        el.style.boxShadow = '';
        el.style.perspective = '';
      });
      affectedElements.clear();
      onComplete?.();
    });

    restoreTimeline.play(0);
  };

  const cleanup = () => {
    tremorTimeline.kill();
    blastTimeline.kill();
    restoreTimeline.kill();
    const allElements = Array.from(affectedElements);
    const root = getSiteRoot();
    if (root) allElements.push(root);

    gsap.set(allElements, { clearProps: 'all' });
    allElements.forEach((el) => {
      el.style.transform = '';
      el.style.filter = '';
      el.style.opacity = '';
      el.style.boxShadow = '';
      el.style.perspective = '';
    });
    affectedElements.clear();
  };

  return {
    startTremor,
    triggerDetonation,
    triggerRestoration,
    cleanup,
  };
}
