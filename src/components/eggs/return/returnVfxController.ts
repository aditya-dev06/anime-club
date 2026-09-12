import gsap from 'gsap';

export interface ReturnVfxController {
  startDeathPhase: () => void;
  triggerHeartbeat: (intensity?: number) => void;
  startRewindScroll: (durationSeconds?: number) => void;
  triggerAwakening: (onComplete?: () => void) => void;
  cleanup: () => void;
}

export function createReturnVfxController(reduced = false): ReturnVfxController {
  const getSiteRoot = (): HTMLElement | null => {
    return document.getElementById('site-root') || document.body;
  };

  const startDeathPhase = () => {
    if (reduced) return;
    const root = getSiteRoot();
    if (!root) return;

    const tl = gsap.timeline();

    // 1. Violent 80ms negative invert flash
    tl.to(root, {
      filter: 'invert(1) contrast(3) hue-rotate(180deg)',
      duration: 0.08,
      ease: 'power4.in',
    });

    // 2. Re:Zero supernatural shadow realm: crisp contrast, rich saturation, 100% visible website!
    tl.to(root, {
      filter: 'contrast(125%) saturate(1.4) brightness(1.04)',
      duration: 0.25,
      ease: 'power2.out',
    });

    // 3. 3-DOF violent impact tremor on death
    const shakeTl = gsap.timeline();
    shakeTl
      .to(root, { x: -6, y: 4, rotation: -0.7, duration: 0.04, ease: 'power4.out' })
      .to(root, { x: 7, y: -5, rotation: 0.6, duration: 0.05 })
      .to(root, { x: -4, y: 3, rotation: -0.4, duration: 0.06 })
      .to(root, { x: 3, y: -2, rotation: 0.2, duration: 0.07 })
      .to(root, { x: 0, y: 0, rotation: 0, duration: 0.1, ease: 'power2.out' });
  };

  const triggerHeartbeat = (intensity = 1.0) => {
    if (reduced) return;
    const root = getSiteRoot();
    if (!root) return;

    gsap.fromTo(
      root,
      {
        scale: 1 + 0.025 * intensity,
        y: -3 * intensity,
        rotation: (Math.random() - 0.5) * 0.5 * intensity,
        filter: 'contrast(150%) saturate(1.8) brightness(1.15)',
      },
      {
        scale: 1,
        y: 0,
        rotation: 0,
        filter: 'contrast(125%) saturate(1.4) brightness(1.04)',
        duration: 0.36,
        ease: 'power2.out',
      },
    );
  };

  const startRewindScroll = (durationSeconds = 1.6) => {
    const currentY = window.scrollY;
    if (currentY <= 10) return;

    if (reduced) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const scrollObj = { y: currentY };
    gsap.to(scrollObj, {
      y: 0,
      duration: durationSeconds,
      ease: 'power3.inOut',
      onUpdate: () => {
        window.scrollTo(0, scrollObj.y);
      },
    });
  };

  const triggerAwakening = (onComplete?: () => void) => {
    const root = getSiteRoot();
    if (!root) {
      onComplete?.();
      return;
    }

    if (reduced) {
      root.style.filter = '';
      root.style.transform = '';
      onComplete?.();
      return;
    }

    // Restore vibrant color with a warm golden morning sunlight bloom
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(root, { clearProps: 'all' });
        root.style.filter = '';
        root.style.transform = '';
        onComplete?.();
      },
    });

    tl.to(root, {
      filter: 'brightness(1.5) saturate(1.4) contrast(1.1)',
      duration: 0.35,
      ease: 'power2.out',
    }).to(root, {
      filter: 'none',
      duration: 0.65,
      ease: 'power2.inOut',
    });
  };

  const cleanup = () => {
    const root = getSiteRoot();
    if (root) {
      gsap.killTweensOf(root);
      gsap.set(root, { clearProps: 'all' });
      root.style.filter = '';
      root.style.transform = '';
      root.style.opacity = '1';
    }
  };

  return {
    startDeathPhase,
    triggerHeartbeat,
    startRewindScroll,
    triggerAwakening,
    cleanup,
  };
}
