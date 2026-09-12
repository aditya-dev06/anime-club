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

    // 0s to 4.5s: Subtle initial vibrations
    for (let i = 0; i < 16; i++) {
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 3,
          duration: 0.08,
          ease: 'none',
        },
        i * 0.1,
      );
    }

    // 4.5s to 6.0s: Escalating seismic tremors ("...AM...")
    for (let i = 0; i < 18; i++) {
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 14,
          y: (Math.random() - 0.5) * 10,
          rotation: (Math.random() - 0.5) * 1.2,
          filter: 'brightness(0.9) saturate(1.2)',
          duration: 0.065,
          ease: 'none',
        },
        1.6 + i * 0.08,
      );
    }

    // 6.0s to 6.37s: Pre-detonation vacuum implosion (screen sucks inward)
    tremorTimeline.to(
      root,
      {
        x: 0,
        y: 0,
        scale: 0.96,
        rotation: 0,
        filter: 'brightness(0.7) contrast(1.3) saturate(1.4)',
        duration: 0.35,
        ease: 'power2.in',
      },
      3.1,
    );

    tremorTimeline.play(0);
  };

  const triggerDetonation = () => {
    tremorTimeline.kill();
    const root = getSiteRoot();
    if (!root) return;

    blastTimeline.clear();

    if (reduced) {
      // Reduced motion: subtle dark dip without violent motion
      blastTimeline.to(root, {
        filter: 'brightness(0.5)',
        duration: 0.4,
        yoyo: true,
        repeat: 1,
      });
      blastTimeline.play(0);
      return;
    }

    const fragments = getFragments();

    // 1. Instant nuclear inverted flash (60ms)
    blastTimeline.set(root, {
      filter: 'invert(1) contrast(3) hue-rotate(280deg)',
    }, 0);

    // 2. Severe blast displacement & 3D fracture
    blastTimeline.to(
      root,
      {
        filter: 'brightness(0.7) contrast(1.35) saturate(0.85) hue-rotate(290deg)',
        transformPerspective: 1200,
        rotateX: 11,
        rotateY: -7,
        rotateZ: 3.5,
        scale: 0.93,
        y: 40,
        duration: 0.4,
        ease: 'power4.out',
      },
      0.06,
    );

    // 3. Dislodge individual UI components into fractured rubble
    fragments.forEach((frag, idx) => {
      const dirX = idx % 2 === 0 ? 1 : -1;
      const offsetX = dirX * (20 + (idx * 17) % 55);
      const offsetY = 15 + ((idx * 23) % 45);
      const rot = (idx % 2 === 0 ? 1 : -1) * (5 + (idx * 3) % 12);

      blastTimeline.to(
        frag,
        {
          x: offsetX,
          y: offsetY,
          rotateZ: rot,
          rotateX: (idx % 3) * 4,
          opacity: 0.82,
          filter: 'blur(0.5px)',
          duration: 0.5 + (idx % 3) * 0.1,
          ease: 'power3.out',
        },
        0.05 + idx * 0.02,
      );
    });

    // 4. Lingering post-blast smoke & scorched tremor
    for (let i = 0; i < 10; i++) {
      blastTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 6,
          y: 40 + (Math.random() - 0.5) * 4,
          duration: 0.12,
          ease: 'sine.inOut',
        },
        0.5 + i * 0.14,
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

    // Magical snap-back restoration with spring physics
    restoreTimeline.to(
      root,
      {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        filter: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
        duration: 0.95,
        ease: 'back.out(1.4)',
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
          opacity: 1,
          filter: 'none',
          duration: 0.9,
          ease: 'power3.out',
        },
        0.05,
      );
    });

    restoreTimeline.call(() => {
      // Clear all inline CSS props to guarantee 100% clean state
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
