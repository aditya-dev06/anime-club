import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHatRenderer } from './hat/HatRenderer';
import FeaturedCard from './FeaturedCard';
import { fireEgg } from '../lib/eggBus';
import type { EventItem } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  reduced: boolean;
  events: EventItem[];
  onBook: (e: EventItem) => void;
}

/* Deterministic manga focus-line wedges converging on the composition. */
function FocusLines() {
  const CX = 500;
  const CY = 420;
  const wedges = Array.from({ length: 64 }, (_, i) => {
    const ang = (i / 64) * Math.PI * 2;
    const r0 = 300;
    const r1 = 720 + ((i * 7919) % 260);
    const w1 = 5 + ((i * 104729) % 17);
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    return {
      p: `${CX + dx * r0 - dy * 1.5},${CY + dy * r0 + dx * 1.5} ${CX + dx * r0 + dy * 1.5},${CY + dy * r0 - dx * 1.5} ${CX + dx * r1 + dy * w1},${CY + dy * r1 - dx * w1} ${CX + dx * r1 - dy * w1},${CY + dy * r1 + dx * w1}`,
    };
  });
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <g fill="#e8dfc8">{wedges.map((w, i) => <polygon key={i} points={w.p} />)}</g>
    </svg>
  );
}

/* Ink splatter burst for the impact frame. */
function InkSplatter() {
  const drops = [
    [38, 42, 7], [160, 40, 9], [178, 96, 5], [150, 158, 8], [92, 170, 6],
    [36, 140, 9], [22, 88, 5], [104, 24, 6], [70, 178, 4], [186, 132, 4],
  ];
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <path
        d="M100 58 L118 74 L140 68 L132 90 L150 106 L126 112 L120 136 L102 122 L82 138 L78 114 L54 112 L70 94 L58 74 L84 78 Z"
        fill="#0b0b13"
      />
      {drops.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.72} fill="#0b0b13" transform={`rotate(${(i * 47) % 180} ${x} ${y})`} />
      ))}
      <g stroke="#0b0b13" strokeWidth="2" opacity="0.8">
        <line x1="100" y1="100" x2="14" y2="34" />
        <line x1="100" y1="100" x2="188" y2="52" />
        <line x1="100" y1="100" x2="176" y2="182" />
        <line x1="100" y1="100" x2="26" y2="164" />
      </g>
    </svg>
  );
}

export default function Hero({ reduced, events, onBook }: HeroProps) {
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const compWrapRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLCanvasElement>(null);
  const nearRef = useRef<HTMLCanvasElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);
  const titleInnerRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const warmRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const shaftRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const splatterRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<HTMLDivElement>(null);
  const motesRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<HTMLSpanElement[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const endCueRef = useRef<HTMLDivElement>(null);

  const featured = events.find((e) => e.featured) ?? events[0];

  useEffect(() => {
    const titleBlock = titleBlockRef.current!;
    const renderer = createHatRenderer(farRef.current!, nearRef.current!);

    /* Mutable state driven by the scrubbed timeline. split=2 puts the whole
       hat BEHIND the DOM title, so the title Mac-minimizes in full view;
       split only drops at the seal so the brim sweeps over the tiny word. */
    const hat = { angle: -0.12, scaleF: 1, dip: 0, glow: 0, split: 2, squashX: 1, squashY: 1, warm: 0, print: 0, printOffset: 0, printPulse: 0 };
    const p = { v: 0 };
    let W = 0;
    let H = 0;
    let S0 = 0;

    const layout = () => {
      W = stageRef.current!.clientWidth;
      H = stageRef.current!.clientHeight;
      renderer.resize(W, H);
      S0 = Math.min(W, H) * 0.36;
      /* Title top tucked flush under the brim's near edge (slight overlap)
         so the hat visibly rests ON the words — "the hat is wearing it". */
      const cy = H * 0.42;
      titleBlock.style.top = `${cy - S0 * 0.16}px`;
    };
    layout();

    const renderFrame = (time: number, ghosts: number[], wobExtra: number) => {
      const floatFade = Math.max(0, 1 - p.v * 5);
      const bob = Math.sin(time * 1.35) * 7 * floatFade;
      renderer.render({
        angle: hat.angle,
        scale: S0 * hat.scaleF,
        cx: W / 2,
        cy: H * 0.42 + hat.dip,
        bob,
        wobble: Math.sin(time * 0.85) * 0.009 * floatFade + wobExtra,
        glow: hat.glow,
        split: hat.split,
        squashX: hat.squashX,
        squashY: hat.squashY,
        warm: hat.warm,
        ghosts,
        print: hat.print,
        printOffset: hat.printOffset + p.v * 0.35,
        printPulse: hat.printPulse,
        time,
      });
      titleBlock.style.transform = `translateY(${(Math.sin(time * 1.35 - 0.45) * 3.5 * floatFade).toFixed(2)}px)`;
    };

    /* ---------- Reduced motion: single static render ---------- */
    if (reduced) {
      hat.angle = -0.42;
      hat.warm = 0.35;
      renderFrame(0, [], 0);
      const ro = new ResizeObserver(() => {
        layout();
        renderFrame(0, [], 0);
      });
      ro.observe(stageRef.current!);
      return () => ro.disconnect();
    }

    /* ---------- Ticker: idle float, velocity ghosts, follow-through lean.
       Rendering is gated on hero visibility via the ScrollTrigger toggle. ---------- */
    let heroLive = true;
    let prevAngle = hat.angle;
    let lastT = 0;
    let vS = 0;
    const tick = (time: number) => {
      if (!heroLive) return;
      const dt = Math.max(1 / 240, time - lastT);
      lastT = time;
      const instV = (hat.angle - prevAngle) / dt;
      prevAngle = hat.angle;
      vS += (instV - vS) * 0.28;
      const ghosts =
        Math.abs(vS) > 0.5 ? [hat.angle - vS * 0.045, hat.angle - vS * 0.09] : [];
      renderFrame(time, ghosts, gsap.utils.clamp(-0.07, 0.07, vS * 0.05));
    };
    gsap.ticker.add(tick);

    /* Hat-base interactions: mouse pans the printed page, tapping it fires
       an impact burst across the manga panels. */
    const stageEl = stageRef.current!;
    let hatPageFired = false;
    const onPointerMove = (e: PointerEvent) => {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      hat.printOffset = (e.clientX / Math.max(1, stageEl.clientWidth) - 0.5) * 0.14;
    };
    const onStageClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button, a, input, textarea, select')) return;
      if (p.v > 0.2 && p.v < 0.85 && hat.print > 0.4) {
        hat.printPulse = lastT;
        if (!hatPageFired) {
          hatPageFired = true;
          fireEgg({
            id: 'hat-page',
            title: 'THE HAT REMEMBERS',
            subtitle: 'There is a story printed inside every hat. Tap again for impact lines.',
            accent: 'straw',
          });
        }
      }
    };
    stageEl.addEventListener('click', onStageClick);
    stageEl.addEventListener('pointermove', onPointerMove);

    /* ---------- The scroll story: sakuga slam + impact frame + light ---------- */
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=300%',
          scrub: 1.5,
          pin: stageRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            p.v = self.progress;
          },
          onToggle: (self) => {
            heroLive = self.isActive;
          },
        },
      });

      /* == Phase A (0–16): ANTICIPATION — the hat inhales before the throw == */
      tl.to(subRef.current, { opacity: 0, y: -26, duration: 9, ease: 'power1.out' }, 0)
        .to(cueRef.current, { opacity: 0, duration: 8, ease: 'power1.out' }, 0)
        .to(hat, { angle: 0.16, duration: 14, ease: 'power1.inOut' }, 0)
        .to(hat, { scaleF: 1.045, duration: 12, ease: 'power1.out' }, 0)
        .to(hat, { dip: () => -H * 0.012, duration: 12, ease: 'power1.out' }, 2)
        .to(hat, { warm: 0.3, duration: 14 }, 2)
        /* Focus light: brightens and leans with the inhale */
        .fromTo(shaftRef.current, { opacity: 0.13, rotate: 0 }, { opacity: 0.22, rotate: -2.5, duration: 14, ease: 'power1.out' }, 0)
        .fromTo(haloRef.current, { opacity: 0.6, scale: 1 }, { opacity: 1, scale: 1.12, duration: 14, ease: 'power1.out' }, 2)
        /* Wormhole onset: letters start warping with the very first scroll —
           stretching and thinning (center letters lead) all through the turn */
        .to(
          letterRefs.current,
          {
            scaleY: 2,
            scaleX: 0.4,
            filter: 'blur(2.5px)',
            duration: 56,
            ease: 'none',
            stagger: { each: 0.18, from: 'center' },
          },
          2,
        )
        .fromTo(sweepRef.current, { x: '-130vw' }, { x: '130vw', duration: 12, ease: 'power1.inOut' }, 8);

      /* == Phase B (16–58): THE TURN — the hat rotates behind the title while
            the words Mac-minimize toward the crown, always bright and in front == */
      tl.to(hat, { angle: -0.55, duration: 24, ease: 'power1.inOut' }, 16)
        .to(hat, { angle: -2.2, duration: 18, ease: 'power1.in' }, 40)
        .to(hat, { scaleF: 0.94, duration: 32, ease: 'power1.inOut' }, 20)
        .to(hat, { squashX: 0.96, squashY: 1.06, duration: 18, ease: 'power1.inOut' }, 20)
        .to(hat, { squashX: 1, squashY: 1, duration: 16, ease: 'power1.inOut' }, 40)
        .to(hat, { dip: () => H * 0.05, duration: 26, ease: 'sine.inOut' }, 24)
        .to(hat, { warm: 0.7, duration: 36 }, 22)
        /* Focus light narrows onto the title as the turn deepens */
        .to(shaftRef.current, { rotate: 3, opacity: 0.3, scaleX: 0.85, duration: 42, ease: 'power1.inOut' }, 16)
        .to(haloRef.current, { scale: 1.22, duration: 36, ease: 'power1.inOut' }, 22)
        /* The manga page printed inside the crown fades in as the opening turns */
        .to(hat, { print: 1, duration: 18, ease: 'power1.out' }, 30)
        .fromTo(sweepRef.current, { x: '-130vw' }, { x: '130vw', duration: 11, ease: 'power1.inOut' }, 44)
        .fromTo(focusRef.current, { opacity: 0, scale: 0.86 }, { opacity: 0.1, scale: 1, duration: 34, ease: 'power1.inOut' }, 20)
        /* Beat 1: the window settles onto the hat and starts compressing — width leads, like the genie */
        .to(
          titleInnerRef.current,
          { y: () => H * 0.02, scaleX: 0.85, scaleY: 0.95, rotateX: 3, z: -20, duration: 30, ease: 'power1.inOut' },
          8,
        )
        .to(titleInnerRef.current, { letterSpacing: '0.015em', duration: 26, ease: 'power1.inOut' }, 20)
        /* Beat 2: shrink onto the hat's face, centering on the crown — text stays fully lit */
        .to(
          titleInnerRef.current,
          { y: () => H * 0.14, scaleX: 0.4, scaleY: 0.55, rotateX: 2, z: -40, duration: 20, ease: 'power1.inOut' },
          38,
        );

      /* == Phase C (58–76): THE SEAL — the tiny title drops into the crown as
            the brim finally sweeps in front of it; flash frames sell contact == */
      tl.to(hat, { angle: -3.24, duration: 6, ease: 'power3.in' }, 58)
        .to(hat, { angle: -3.1416, duration: 7, ease: 'back.out(1.8)' }, 64)
        .to(hat, { squashX: 1.07, squashY: 0.9, duration: 4, ease: 'power3.in' }, 58)
        .to(hat, { squashX: 1, squashY: 1, duration: 9, ease: 'back.out(2.2)' }, 62)
        .to(hat, { dip: () => H * 0.035, duration: 4, ease: 'power2.in' }, 58)
        .to(hat, { dip: () => -H * 0.02, duration: 10, ease: 'sine.inOut' }, 62)
        .to(hat, { split: -0.62, duration: 8, ease: 'power2.in' }, 58)
        .to(hat, { glow: 1, duration: 6, ease: 'power2.in' }, 60)
        .to(hat, { glow: 0.35, duration: 8, ease: 'power1.out' }, 68)
        .to(hat, { warm: 0.9, duration: 12 }, 58)
        /* Focus light flares with the seal… */
        .to(shaftRef.current, { rotate: 0, opacity: 0.5, duration: 6, ease: 'power2.in' }, 58)
        .to(haloRef.current, { scale: 1.32, opacity: 1, duration: 6, ease: 'power2.in' }, 58)
        /* The minimized "window" lands on the crown… */
        .to(
          titleInnerRef.current,
          { y: () => H * 0.18, scaleX: 0.3, scaleY: 0.42, rotateX: 0, z: -60, duration: 6, ease: 'power2.in' },
          58,
        )
        /* …and the wormhole takes it: letters thin into vertical light-streaks,
           stretching up into the crown, collapsing center-out */
        .to(
          letterRefs.current,
          {
            scaleY: 3.4,
            scaleX: 0.04,
            opacity: 0,
            filter: 'blur(7px)',
            y: () => -H * 0.03,
            transformOrigin: '50% 100%',
            duration: 6,
            ease: 'power3.in',
            stagger: { each: 0.35, from: 'center' },
          },
          58,
        )
        .to(titleInnerRef.current, { filter: 'brightness(1.6) blur(1px)', duration: 5, ease: 'power1.in' }, 60)
        .to(titleBlock, { opacity: 0, duration: 4, ease: 'power1.in' }, 68)
        /* Focus lines snap at impact, then flip outward */
        .to(focusRef.current, { opacity: 0.45, scale: 1.06, duration: 3, ease: 'power3.in' }, 60)
        .to(focusRef.current, { opacity: 0, scale: 1.25, duration: 10, ease: 'power2.out' }, 72)
        /* Manga impact frame: double flash + frame shake + ink splatter */
        .to(flashRef.current, { opacity: 0.95, duration: 1.2, ease: 'power4.in' }, 61)
        .to(flashRef.current, { opacity: 0, duration: 1.2, ease: 'power1.out' }, 62.2)
        .to(flashRef.current, { opacity: 0.8, duration: 1, ease: 'power4.in' }, 63.2)
        .to(flashRef.current, { opacity: 0, duration: 2.4, ease: 'power2.out' }, 64.2)
        .to(
          compWrapRef.current,
          { keyframes: [{ x: -7, y: 4 }, { x: 6, y: -5 }, { x: -4, y: 3 }, { x: 2, y: -2 }, { x: 0, y: 0 }], duration: 7, ease: 'power1.out' },
          61,
        )
        .fromTo(
          splatterRef.current,
          { opacity: 0, scale: 0.4, rotate: -8 },
          { opacity: 0.85, scale: 1.08, rotate: 4, duration: 3, ease: 'power3.out' },
          61,
        )
        .to(splatterRef.current, { opacity: 0, scale: 1.3, rotate: 10, duration: 6, ease: 'power1.in' }, 64)
        /* Shinkai bloom: the whiteout "kira" frame at the seal */
        .fromTo(bloomRef.current, { opacity: 0 }, { opacity: 0.9, duration: 5, ease: 'power2.in' }, 60)
        .to(bloomRef.current, { opacity: 0.12, duration: 9, ease: 'power2.out' }, 65)
        .to(bloomRef.current, { opacity: 0, duration: 6 }, 82)
        .fromTo(flareRef.current, { opacity: 0, scaleX: 0.1 }, { opacity: 0.75, scaleX: 1, duration: 4, ease: 'power2.out' }, 60)
        .to(flareRef.current, { opacity: 0, duration: 5, ease: 'power1.in' }, 66);

      /* == Rain of light during the swallow == */
      const streaks = rainRef.current ? Array.from(rainRef.current.children) : [];
      streaks.forEach((el, i) => {
        tl.fromTo(
          el,
          { y: -90, opacity: 0 },
          { y: () => H * 0.55, opacity: 0.7, duration: 13, ease: 'none' },
          56 + i * 1.4,
        ).to(el, { opacity: 0, duration: 4 }, 69 + i * 1.4);
      });

      /* == Phase D (76–88): MAC MINIMIZE — squash the world into the seed == */
      tl.to(
        compWrapRef.current,
        { scaleX: 0.3, scaleY: 0.24, y: () => H * 0.1, duration: 8, ease: 'power2.in', transformOrigin: '50% 55%' },
        76,
      )
        /* …then the light spends itself as the seed forms */
        .to(shaftRef.current, { opacity: 0.08, duration: 10, ease: 'power1.out' }, 76)
        .to(haloRef.current, { scale: 0.9, opacity: 0.4, duration: 12, ease: 'power1.out' }, 76)
        .to(hat, { print: 0, duration: 5 }, 70)
        .to(compWrapRef.current, { scaleY: 0.315, duration: 4, ease: 'power1.out' }, 82)
        .to(compWrapRef.current, { opacity: 0, duration: 4, ease: 'power1.in' }, 84)
        .fromTo(seedRef.current, { opacity: 0, scale: 0.25 }, { opacity: 1, scale: 0.6, duration: 6, ease: 'back.out(2.4)' }, 80)
        .to(hat, { warm: 1, duration: 10 }, 70);

      /* == Phase E (88–100): EMERGENCE — the event develops out of the light == */
      tl.fromTo(
        cardRef.current,
        {
          opacity: 0,
          scale: 0.1,
          y: () => H * 0.05,
          rotateX: 38,
          rotateZ: -4,
          filter: 'blur(14px) brightness(1.6)',
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          rotateZ: 0,
          filter: 'blur(0px) brightness(1)',
          duration: 10,
          ease: 'power3.out',
        },
        88,
      )
        .to(seedRef.current, { opacity: 0, scale: 1.8, duration: 8, ease: 'power2.out' }, 90);

      const motes = motesRef.current ? Array.from(motesRef.current.children) : [];
      motes.forEach((el, i) => {
        const ang = (-90 + (i - 2) * 28) * (Math.PI / 180);
        tl.fromTo(
          el,
          { opacity: 0, x: 0, y: 0, scale: 1 },
          {
            opacity: 1,
            x: Math.cos(ang) * (26 + i * 8),
            y: Math.sin(ang) * (36 + i * 7),
            scale: 0.15,
            duration: 8,
            ease: 'power2.out',
          },
          88 + i * 0.4,
        );
      });

      tl.fromTo(
        endCueRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 4, ease: 'power1.out' },
        96,
      );
    }, stageRef);

    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(stageRef.current!);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      stageEl.removeEventListener('click', onStageClick);
      stageEl.removeEventListener('pointermove', onPointerMove);
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section ref={wrapRef} id="hero" className="relative z-10" style={{ height: reduced ? undefined : '400vh' }}>
      <div ref={stageRef} className="stage-h relative w-full overflow-hidden">
        <div className="hero-bg absolute inset-0" aria-hidden="true" />

        {/* Warm sky crossfade (magic hour) */}
        <div
          ref={warmRef}
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(122,107,176,0.28) 0%, rgba(232,148,106,0.24) 55%, rgba(255,217,160,0.3) 100%)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />

        {/* Cinematic atmosphere: light shaft, halo behind the composition, vignette */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Focus light — swings and narrows with scroll, flares at the seal */}
          <div className="absolute left-1/2 top-0 h-[72vh] w-[120vw] -translate-x-1/2">
            <div
              ref={shaftRef}
              className="h-full w-full opacity-[0.13] will-change-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(255,236,190,0.8), transparent 82%)',
                clipPath: 'polygon(46.5% 0, 53.5% 0, 94% 100%, 6% 100%)',
                filter: 'blur(10px)',
                transformOrigin: '50% 0%',
              }}
            />
          </div>
          {/* Halo pulsing behind the composition */}
          <div className="absolute left-1/2 top-[40%] h-[88vmin] w-[88vmin] -translate-x-1/2 -translate-y-1/2">
            <div
              ref={haloRef}
              className="h-full w-full rounded-full opacity-60 will-change-transform"
              style={{
                background:
                  'radial-gradient(circle, rgba(232,182,76,0.17) 0%, rgba(232,182,76,0.055) 40%, transparent 66%)',
              }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(120% 92% at 50% 40%, transparent 52%, rgba(4,3,8,0.6) 100%)',
            }}
          />
        </div>

        {/* Diagonal light sweep */}
        <div
          ref={sweepRef}
          className="pointer-events-none absolute left-1/2 top-[-6vh] h-[26vh] w-[160vw] -translate-x-1/2 opacity-0 will-change-transform"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,244,214,0.55) 48%, rgba(255,214,140,0.32) 52%, transparent)',
            filter: 'blur(8px)',
            transform: 'skewX(-18deg)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />

        {/* The whole hat + title composition — minimized as one object */}
        <div ref={compWrapRef} className="absolute inset-0 will-change-transform" style={{ perspective: '1200px' }}>
          {/* Far half of the hat — behind the title */}
          <canvas ref={farRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

          {/* Title: physically sandwiched between the two hat layers */}
          <div
            ref={titleBlockRef}
            className="absolute left-0 right-0 text-center will-change-transform"
          >
            <div ref={titleInnerRef} className="relative inline-block will-change-transform" style={{ transformOrigin: '50% 0%' }}>
              <h1 className="title-warp relative select-none font-display text-[clamp(4.5rem,15vw,11rem)]" aria-label="OTAKU CLUB">
                {"OTAKU CLUB".split("").map((ch, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="tw-l"
                    ref={(el) => {
                      if (el) letterRefs.current[i] = el;
                    }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))}
              </h1>
              <div
                ref={subRef}
                className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.55em] text-straw-300/70 sm:mt-4 sm:text-xs"
              >
                VIT&nbsp;Bhopal
              </div>
            </div>
          </div>

          {/* Near half of the hat — in front of the title */}
          <canvas ref={nearRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        </div>

        {/* Manga focus lines — converge on the composition, snap at impact */}
        <div ref={focusRef} className="pointer-events-none absolute inset-0 opacity-0 will-change-transform" aria-hidden="true">
          <FocusLines />
        </div>

        {/* Ink splatter (impact frame) */}
        <div ref={splatterRef} className="pointer-events-none absolute left-1/2 top-[42%] h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform" aria-hidden="true">
          <InkSplatter />
        </div>

        {/* Bloom whiteout + anamorphic flare */}
        <div
          ref={bloomRef}
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(255,250,236,0.98) 0%, rgba(255,214,150,0.5) 30%, transparent 60%)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />
        <div
          ref={flareRef}
          className="pointer-events-none absolute left-1/2 top-[42%] h-[3px] w-[130vw] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(180,205,255,0.55) 35%, rgba(255,244,214,0.9) 50%, rgba(180,205,255,0.55) 65%, transparent)',
            filter: 'blur(1px)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />

        {/* Rain of light during the swallow */}
        <div ref={rainRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 h-3 w-[2px] rounded-full opacity-0"
              style={{
                left: `${9 + i * 7.4}%`,
                background: 'linear-gradient(180deg, rgba(255,224,152,0.9), transparent)',
              }}
            />
          ))}
        </div>

        {/* Impact flash frames */}
        <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-[#fff8ea] opacity-0" aria-hidden="true" />

        {/* Scroll cue */}
        <div ref={cueRef} className="absolute bottom-[5vh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <div className="mx-auto flex h-10 w-6 items-start justify-center rounded-full border border-straw-300/40 p-1.5">
            <span className="cue-dot block h-2 w-1 rounded-full bg-straw-300" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-straw-200/60">Scroll to begin</p>
        </div>

        {/* The seed the composition minimizes into */}
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2">
          <div
            ref={seedRef}
            className="h-44 w-44 rounded-full opacity-0 will-change-transform"
            style={{
              background:
                'radial-gradient(circle, rgba(255,224,152,0.95) 0%, rgba(240,180,80,0.45) 28%, rgba(240,180,80,0.12) 55%, transparent 72%)',
              filter: 'blur(2px)',
            }}
            aria-hidden="true"
          >
            <div ref={motesRef} className="absolute inset-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-straw-200 opacity-0"
                  style={{ boxShadow: '0 0 8px 2px rgba(255,214,140,.8)' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* The first event emerges here and hands off to the events section */}
        <div className="absolute left-1/2 top-1/2 w-[min(92vw,1040px)] -translate-x-1/2 -translate-y-1/2">
          <div ref={cardRef} className="opacity-0 will-change-transform">
            <FeaturedCard event={featured} onBook={onBook} />
          </div>
        </div>

        <div ref={endCueRef} className={`absolute bottom-[4vh] left-1/2 -translate-x-1/2 text-center ${reduced ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-straw-200/60">All events below</p>
        </div>
      </div>
    </section>
  );
}
