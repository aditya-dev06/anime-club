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
    ];
    return elements.filter((el): el is HTMLElement => el !== null);
  };

  const startTremor = () => {
    if (reduced) return;
    const root = getSiteRoot();
    if (!root) return;

    tremorTimeline.clear();

    // 0.0s to 4.5s: Continuous mysterious camera rumble across the chant
    const earlySteps = 35;
    for (let i = 0; i < earlySteps; i++) {
      const progress = i / earlySteps;
      const amp = 1.5 + progress * 3.5;
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * amp,
          y: (Math.random() - 0.5) * amp,
          rotation: (Math.random() - 0.5) * (0.2 + progress * 0.4),
          duration: 0.1,
          ease: 'none',
        },
        i * 0.12,
      );
    }

    // 4.5s to 6.0s: Escalating violent seismic earthquake ("...AM...")
    const intenseSteps = 22;
    for (let i = 0; i < intenseSteps; i++) {
      const progress = i / intenseSteps;
      const ampX = 6 + progress * 16;
      const ampY = 5 + progress * 12;
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * ampX,
          y: (Math.random() - 0.5) * ampY,
          rotation: (Math.random() - 0.5) * 1.8,
          duration: 0.065,
          ease: 'none',
        },
        4.5 + i * 0.068,
      );
    }

    // 6.0s to 6.37s: Pre-detonation vacuum implosion (screen sucks inward)
    tremorTimeline.to(
      root,
      {
        x: 0,
        y: 0,
        scale: 0.95,
        rotation: 0,
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

    // 1. Instant 80ms nuclear color inversion flash that immediately clears
    blastTimeline.to(
      root,
      {
        filter: 'invert(1) contrast(2.5) hue-rotate(270deg)',
        duration: 0.08,
      },
      0,
    );
    blastTimeline.to(
      root,
      {
        filter: 'none',
        duration: 0.15,
      },
      0.08,
    );

    // 2. Severe 3D Viewport Fracture & Tilt
    blastTimeline.to(
      root,
      {
        transformPerspective: 1000,
        rotateX: 14,
        rotateY: -9,
        rotateZ: 4,
        scale: 0.92,
        y: 45,
        duration: 0.45,
        ease: 'power4.out',
      },
      0.06,
    );

    // 3. Dislodge individual UI components into clearly visible floating rubble!
    const nav = root.querySelector<HTMLElement>('nav');
    if (nav) {
      blastTimeline.to(
        nav,
        {
          y: 70,
          x: -45,
          rotateZ: -12,
          opacity: 0.9,
          duration: 0.5,
          ease: 'power3.out',
        },
        0.05,
      );
    }

    const title = root.querySelector<HTMLElement>('.title-hero') || root.querySelector<HTMLElement>('.title-warp');
    if (title) {
      blastTimeline.to(
        title,
        {
          y: -60,
          x: 50,
          rotateZ: 16,
          scale: 1.15,
          duration: 0.5,
          ease: 'power3.out',
        },
        0.06,
      );
    }

    const footer = root.querySelector<HTMLElement>('footer');
    if (footer) {
      blastTimeline.to(
        footer,
        {
          y: 50,
          x: 25,
          rotateZ: -6,
          duration: 0.6,
          ease: 'power3.out',
        },
        0.08,
      );
    }

    // Scatter event cards like cards blown apart by shockwave
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.glass'));
    cards.forEach((card, idx) => {
      const dirX = idx % 2 === 0 ? 1 : -1;
      const offsetX = dirX * (45 + (idx * 25) % 80);
      const offsetY = (idx % 2 === 0 ? -1 : 1) * (30 + ((idx * 19) % 50));
      const rot = (idx % 2 === 0 ? 1 : -1) * (10 + (idx * 5) % 18);

      blastTimeline.to(
        card,
        {
          x: offsetX,
          y: offsetY,
          rotateZ: rot,
          rotateX: (idx % 3) * 8,
          scale: 0.9,
          opacity: 0.92,
          duration: 0.55 + (idx % 3) * 0.1,
          ease: 'power3.out',
        },
        0.08 + idx * 0.03,
      );
    });

    // 4. Subtle lingering wreckage tremors (website visibly floating in pieces)
    for (let i = 0; i < 12; i++) {
      blastTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 8,
          y: 45 + (Math.random() - 0.5) * 6,
          duration: 0.14,
          ease: 'sine.inOut',
        },
        0.55 + i * 0.15,
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

    // Magical spring reassembly of the whole site
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
        ease: 'back.out(1.5)',
      },
      0,
    );

    fragments.forEach((frag) => {
      restoreTimeline.to(
        frag,
        {
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          filter: 'none',
          duration: 0.9,
          ease: 'power3.out',
        },
        0.05,
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
