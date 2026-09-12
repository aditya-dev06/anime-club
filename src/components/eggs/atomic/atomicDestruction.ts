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

  const startTremor = () => {
    if (reduced) return;
    const root = getSiteRoot();
    if (!root) return;

    tremorTimeline.clear();

    // 0.0s to 4.5s: Escalating camera vibration across the chant
    const earlySteps = 36;
    for (let i = 0; i < earlySteps; i++) {
      const progress = i / earlySteps;
      const amp = 1.5 + progress * 4.5;
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

    // 4.5s to 6.0s: Violent seismic earthquake ("...AM...")
    const intenseSteps = 24;
    for (let i = 0; i < intenseSteps; i++) {
      const progress = i / intenseSteps;
      const ampX = 6 + progress * 18;
      const ampY = 5 + progress * 14;
      tremorTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * ampX,
          y: (Math.random() - 0.5) * ampY,
          rotation: (Math.random() - 0.5) * 1.8,
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
        scale: 0.96,
        rotation: 0,
        filter: 'brightness(0.85) contrast(1.25) hue-rotate(260deg)',
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

    // 1. Instant 80ms violet radiation flash
    blastTimeline.to(
      root,
      {
        filter: 'invert(1) contrast(2.8) hue-rotate(285deg)',
        duration: 0.08,
      },
      0,
    );
    blastTimeline.to(
      root,
      {
        filter: 'contrast(1.15) brightness(0.92) hue-rotate(270deg)',
        duration: 0.2,
      },
      0.08,
    );

    // 2. Heavy bomb shockwave jolt: elements shudder under the blast in place (NO flying away!)
    blastTimeline.to(
      root,
      {
        transformPerspective: 900,
        rotateX: 6,
        rotateY: -4,
        scale: 0.96,
        y: 18,
        duration: 0.35,
        ease: 'power4.out',
      },
      0.05,
    );

    // Subtle shockwave shimmer on cards (glowing violet seams, stays firmly in place)
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.glass'));
    cards.forEach((card, idx) => {
      blastTimeline.to(
        card,
        {
          x: (idx % 2 === 0 ? 1 : -1) * (4 + (idx % 3) * 3),
          y: (idx % 2 === 0 ? -1 : 1) * (3 + (idx % 2) * 2),
          rotateZ: (idx % 2 === 0 ? 1 : -1) * 1.5,
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.45)',
          duration: 0.4,
          ease: 'power2.out',
        },
        0.06,
      );
    });

    // Lingering shockwave tremors in place
    for (let i = 0; i < 12; i++) {
      blastTimeline.to(
        root,
        {
          x: (Math.random() - 0.5) * 6,
          y: 18 + (Math.random() - 0.5) * 4,
          duration: 0.12,
          ease: 'sine.inOut',
        },
        0.45 + i * 0.12,
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

    const cards = Array.from(root.querySelectorAll<HTMLElement>('.glass'));

    // Smoothly return root back to normal
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
        duration: 0.8,
        ease: 'power3.inOut',
      },
      0,
    );

    // Cards smooth return
    cards.forEach((card) => {
      restoreTimeline.to(
        card,
        {
          x: 0,
          y: 0,
          rotateZ: 0,
          boxShadow: 'none',
          duration: 0.75,
          ease: 'power3.inOut',
        },
        0.05,
      );
    });

    // Guaranteed complete cleanup
    restoreTimeline.call(() => {
      gsap.set([root, ...cards], { clearProps: 'all' });
      root.style.transform = '';
      root.style.filter = '';
      cards.forEach((card) => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
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
      const cards = Array.from(root.querySelectorAll<HTMLElement>('.glass'));
      gsap.set([root, ...cards], { clearProps: 'all' });
      root.style.transform = '';
      root.style.filter = '';
      cards.forEach((card) => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    }
  };

  return {
    startTremor,
    triggerDetonation,
    triggerRestoration,
    cleanup,
  };
}
