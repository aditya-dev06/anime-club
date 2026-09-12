import { useEffect, useRef } from 'react';

export type AtomicVfxPhase = 'idle' | 'rune' | 'crack' | 'detonate' | 'ruins' | 'restore';

interface CrystalShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tip: { x: number; y: number };
  base: { x: number; y: number };
  leftWing: { x: number; y: number };
  rightWing: { x: number; y: number };
  colorLeft: string;
  colorRight: string;
  alpha: number;
  decay: number;
  rot: number;
  vRot: number;
  size: number;
  flipSpeed: number;
  flipPhase: number;
}

interface RadialCrack {
  points: { x: number; y: number }[];
  splinters: { x1: number; y1: number; x2: number; y2: number }[];
}

interface RingCrack {
  points: { x: number; y: number }[];
}

interface LadderCrack {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dist: number;
}

interface GlassFractureNetwork {
  center: { x: number; y: number };
  rings: RingCrack[];
  radials: RadialCrack[];
  ladders: LadderCrack[];
}

interface LightningBolt {
  segments: { x: number; y: number }[];
  life: number;
}

interface SedovShockwave {
  r: number;
  speed: number;
  maxR: number;
  opacity: number;
  width: number;
  colorCore: string;
  colorGlow: string;
}

interface GodRay {
  angle: number;
  length: number;
  width: number;
  alpha: number;
}

interface AtomicCanvasProps {
  phase: AtomicVfxPhase;
  reduced: boolean;
}

export default function AtomicCanvas({ phase, reduced }: AtomicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fractureRef = useRef<GlassFractureNetwork | null>(null);
  const shardsRef = useRef<CrystalShard[]>([]);
  const shockwavesRef = useRef<SedovShockwave[]>([]);
  const lightningsRef = useRef<LightningBolt[]>([]);
  const godRaysRef = useRef<GodRay[]>([]);
  const runeAngleRef = useRef(0);
  const restoreSealAngleRef = useRef(0);
  const restoreSealAlphaRef = useRef(0);
  const beamOpacityRef = useRef(0);
  const flareOpacityRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const crackStartTimeRef = useRef(0);

  // Pre-rendered 32x32 anime star glint texture on offscreen canvas
  const glintCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const off = document.createElement('canvas');
    off.width = 32;
    off.height = 32;
    const ctx = off.getContext('2d');
    if (ctx) {
      const cx = 16;
      const cy = 16;
      const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
      rad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      rad.addColorStop(0.35, 'rgba(232, 121, 249, 0.85)');
      rad.addColorStop(0.7, 'rgba(192, 38, 211, 0.35)');
      rad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      // Sharp horizontal light needle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.moveTo(1, cy);
      ctx.quadraticCurveTo(cx, cy - 1.5, 31, cy);
      ctx.quadraticCurveTo(cx, cy + 1.5, 1, cy);
      ctx.fill();

      // Sharp vertical light needle
      ctx.beginPath();
      ctx.moveTo(cx, 1);
      ctx.quadraticCurveTo(cx - 1.5, cy, cx, 31);
      ctx.quadraticCurveTo(cx + 1.5, cy, cx, 1);
      ctx.fill();
    }
    glintCanvasRef.current = off;
  }, []);

  // Generate authentic acoustic Voronoi tempered glass fracture network
  const generateRealisticFracture = (w: number, h: number): GlassFractureNetwork => {
    const cx = w / 2;
    const cy = h / 2;
    const numRadials = 22;
    const ringRadii = [28, 65, 125, 210, 330, 480, 680, 920];
    const radials: RadialCrack[] = [];
    const rings: RingCrack[] = [];
    const ladders: LadderCrack[] = [];

    // Radial fissure rays
    for (let r = 0; r < numRadials; r++) {
      const baseAngle = (r / numRadials) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
      const points: { x: number; y: number }[] = [{ x: cx, y: cy }];
      const splinters: { x1: number; y1: number; x2: number; y2: number }[] = [];

      let curDist = 0;
      const maxDist = Math.hypot(w, h) * 0.82;
      let curAngle = baseAngle;

      while (curDist < maxDist) {
        curDist += 22 + Math.random() * 40;
        curAngle += (Math.random() - 0.5) * 0.24;
        const px = cx + Math.cos(curAngle) * curDist;
        const py = cy + Math.sin(curAngle) * curDist;
        points.push({ x: px, y: py });

        if (Math.random() > 0.38 && curDist > 35) {
          const splinterAng = curAngle + (Math.random() > 0.5 ? 1 : -1) * (0.75 + Math.random() * 0.4);
          const splinterLen = 14 + Math.random() * 28;
          splinters.push({
            x1: px,
            y1: py,
            x2: px + Math.cos(splinterAng) * splinterLen,
            y2: py + Math.sin(splinterAng) * splinterLen,
          });
        }
      }

      radials.push({ points, splinters });
    }

    // Concentric stress fracture rings & ladder rungs
    for (let i = 0; i < ringRadii.length; i++) {
      const radius = ringRadii[i];
      const ringPts: { x: number; y: number }[] = [];
      const segments = numRadials * 2;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const jitter = radius * (0.92 + Math.random() * 0.16);
        ringPts.push({
          x: cx + Math.cos(a) * jitter,
          y: cy + Math.sin(a) * jitter,
        });
      }
      rings.push({ points: ringPts });

      if (i > 0 && i < ringRadii.length - 1) {
        for (let r = 0; r < numRadials; r++) {
          if (Math.random() > 0.3) {
            const a1 = (r / numRadials) * Math.PI * 2;
            const a2 = ((r + 1) / numRadials) * Math.PI * 2;
            const midR = radius + (Math.random() - 0.5) * 15;
            ladders.push({
              x1: cx + Math.cos(a1) * midR,
              y1: cy + Math.sin(a1) * midR,
              x2: cx + Math.cos(a2) * midR,
              y2: cy + Math.sin(a2) * midR,
              dist: midR,
            });
          }
        }
      }
    }

    return { center: { x: cx, y: cy }, rings, radials, ladders };
  };

  // Explode faceted 3D crystal daggers with Sedov-Taylor hypersonic shockwaves & god rays
  const explodeGlassShards = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const count = reduced ? 35 : 160;
    const shards: CrystalShard[] = [];

    const facetColorPairs = [
      { left: 'rgba(245, 208, 254, 0.92)', right: 'rgba(168, 85, 247, 0.88)' },
      { left: 'rgba(232, 121, 249, 0.95)', right: 'rgba(126, 34, 206, 0.90)' },
      { left: 'rgba(255, 255, 255, 0.98)', right: 'rgba(192, 132, 252, 0.85)' },
      { left: 'rgba(224, 231, 255, 0.95)', right: 'rgba(147, 51, 234, 0.88)' },
      { left: 'rgba(253, 224, 71, 0.95)',  right: 'rgba(217, 119, 6, 0.90)' },
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 38;
      const daggerLen = 14 + Math.random() * 36;
      const daggerWidth = 5 + Math.random() * 14;
      const colorPair = facetColorPairs[Math.floor(Math.random() * facetColorPairs.length)];

      const tip = { x: 0, y: -daggerLen * 0.68 };
      const base = { x: 0, y: daggerLen * 0.32 };
      const leftWing = { x: -daggerWidth * 0.52, y: (Math.random() - 0.5) * 4 };
      const rightWing = { x: daggerWidth * 0.52, y: (Math.random() - 0.5) * 4 };

      shards.push({
        x: cx + (Math.random() - 0.5) * 50,
        y: cy + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        tip,
        base,
        leftWing,
        rightWing,
        colorLeft: colorPair.left,
        colorRight: colorPair.right,
        alpha: 1.0,
        decay: 0.003 + Math.random() * 0.005,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.38,
        size: daggerLen,
        flipSpeed: 2.5 + Math.random() * 5.5,
        flipPhase: Math.random() * Math.PI * 2,
      });
    }

    shardsRef.current = shards;

    const maxScreenRadius = Math.hypot(w, h) * 0.95;
    shockwavesRef.current = [
      {
        r: 15,
        speed: 6800,
        maxR: maxScreenRadius,
        opacity: 1.0,
        width: 32,
        colorCore: 'rgba(255, 255, 255, 1)',
        colorGlow: 'rgba(240, 171, 252, 0.95)',
      },
      {
        r: 8,
        speed: 5200,
        maxR: maxScreenRadius * 0.88,
        opacity: 0.95,
        width: 20,
        colorCore: 'rgba(245, 208, 254, 0.9)',
        colorGlow: 'rgba(192, 38, 211, 0.85)',
      },
      {
        r: 2,
        speed: 3800,
        maxR: maxScreenRadius * 0.75,
        opacity: 0.85,
        width: 14,
        colorCore: 'rgba(216, 180, 254, 0.85)',
        colorGlow: 'rgba(147, 51, 234, 0.75)',
      },
    ];

    const rays: GodRay[] = [];
    const numRays = 22;
    for (let r = 0; r < numRays; r++) {
      rays.push({
        angle: (r / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
        length: Math.hypot(w, h) * (0.6 + Math.random() * 0.4),
        width: ((Math.PI * 2) / numRays) * (0.35 + Math.random() * 0.45),
        alpha: 0.85 + Math.random() * 0.15,
      });
    }
    godRaysRef.current = rays;

    beamOpacityRef.current = 1.0;
    flareOpacityRef.current = 1.0;

    const bolts: LightningBolt[] = [];
    for (let b = 0; b < 8; b++) {
      const tx = Math.random() * w;
      const ty = Math.random() * h;
      const segs = [{ x: cx, y: cy }];
      let sx = cx;
      let sy = cy;
      for (let s = 1; s <= 7; s++) {
        const prog = s / 7;
        sx = cx + (tx - cx) * prog + (Math.random() - 0.5) * 55;
        sy = cy + (ty - cy) * prog + (Math.random() - 0.5) * 55;
        segs.push({ x: sx, y: sy });
      }
      bolts.push({ segments: segs, life: 1.0 });
    }
    lightningsRef.current = bolts;
  };

  useEffect(() => {
    if (phase === 'crack') {
      crackStartTimeRef.current = performance.now();
      fractureRef.current = generateRealisticFracture(window.innerWidth, window.innerHeight);
    } else if (phase === 'detonate') {
      explodeGlassShards(window.innerWidth, window.innerHeight);
    } else if (phase === 'idle') {
      fractureRef.current = null;
      shardsRef.current = [];
      shockwavesRef.current = [];
      lightningsRef.current = [];
      godRaysRef.current = [];
      beamOpacityRef.current = 0;
      flareOpacityRef.current = 0;
      restoreSealAlphaRef.current = 0;
    }
  }, [phase, reduced]);

  // Main Canvas Render Loop
  useEffect(() => {
    if (phase === 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const syncCanvasSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    const render = (now: number) => {
      if (!active) return;
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ─────────────────────────────────────────────────────────────
      // 1. ANCIENT RUNIC SEAL ARRAY (Phase: 'rune' and 'crack')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'rune' || phase === 'crack') {
        runeAngleRef.current += dt * (phase === 'crack' ? 1.6 : 0.65);
        const ang = runeAngleRef.current;
        const radius = Math.min(w, h) * 0.36;
        const alpha = phase === 'crack' ? 0.95 : 0.72;

        ctx.save();
        ctx.translate(cx, cy);

        // Radiant violet glow
        const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 1.35);
        glowGrad.addColorStop(0, 'rgba(216, 180, 254, 0.28)');
        glowGrad.addColorStop(0.5, 'rgba(192, 38, 211, 0.16)');
        glowGrad.addColorStop(0.85, 'rgba(147, 51, 234, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // Concentric Magic Rings (Multi-stroke glow, no shadowBlur)
        ctx.strokeStyle = `rgba(192, 38, 211, ${alpha * 0.35})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(240, 171, 252, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.46, 0, Math.PI * 2);
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Rotating Runic Spokes
        const spokes = 12;
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = `rgba(244, 114, 182, ${alpha * 0.85})`;
        for (let s = 0; s < spokes; s++) {
          const a = ang + (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius * 0.46), Math.sin(a) * (radius * 0.46));
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.stroke();
        }

        // Intersecting Counter-Rotating Octagrams
        ctx.save();
        ctx.rotate(-ang * 1.25);
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.85})`;
        ctx.lineWidth = 1.8;
        for (let star = 0; star < 2; star++) {
          ctx.beginPath();
          const offset = (star * Math.PI) / 4;
          for (let p = 0; p < 5; p++) {
            const pa = offset + (p * Math.PI * 2) / 4;
            const px = Math.cos(pa) * (radius * 0.8);
            const py = Math.sin(pa) * (radius * 0.8);
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 2. REALISTIC TEMPERED GLASS CRACK NETWORK (Phase: 'crack')
      // ─────────────────────────────────────────────────────────────
      if (fractureRef.current && phase === 'crack') {
        const net = fractureRef.current;
        const crackElapsed = Math.max(0, (now - crackStartTimeRef.current) / 1000);
        const crackProgress = Math.min(1, Math.max(0.05, crackElapsed / 2.75));
        const easedProgress = Math.pow(crackProgress, 0.82);
        const maxDist = easedProgress * Math.hypot(w, h) * 0.86;

        ctx.save();

        // Pass 1: Dark refractive drop shadow under-stroke
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.lineWidth = 2.6;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x + 1.5, rad.points[0].y + 1.5);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            if (Math.hypot(p.x - cx, p.y - cy) > maxDist) break;
            ctx.lineTo(p.x + 1.5, p.y + 1.5);
          }
          ctx.stroke();
          for (const spl of rad.splinters) {
            if (Math.hypot(spl.x1 - cx, spl.y1 - cy) <= maxDist) {
              ctx.beginPath();
              ctx.moveTo(spl.x1 + 1.5, spl.y1 + 1.5);
              ctx.lineTo(spl.x2 + 1.5, spl.y2 + 1.5);
              ctx.stroke();
            }
          }
        }
        for (const ring of net.rings) {
          if (ring.points.length > 0 && Math.hypot(ring.points[0].x - cx, ring.points[0].y - cy) <= maxDist) {
            ctx.beginPath();
            ctx.moveTo(ring.points[0].x + 1.5, ring.points[0].y + 1.5);
            for (let i = 1; i < ring.points.length; i++) {
              ctx.lineTo(ring.points[i].x + 1.5, ring.points[i].y + 1.5);
            }
            ctx.stroke();
          }
        }

        // Pass 2: Glowing Violet Mana Fissure (Outer soft halo)
        ctx.strokeStyle = 'rgba(192, 38, 211, 0.45)';
        ctx.lineWidth = 4.5;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x, rad.points[0].y);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            if (Math.hypot(p.x - cx, p.y - cy) > maxDist) break;
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        // Pass 3: Electric Violet Fissure Seam
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.95)';
        ctx.lineWidth = 2.0;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x, rad.points[0].y);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            if (Math.hypot(p.x - cx, p.y - cy) > maxDist) break;
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          for (const spl of rad.splinters) {
            if (Math.hypot(spl.x1 - cx, spl.y1 - cy) <= maxDist) {
              ctx.beginPath();
              ctx.moveTo(spl.x1, spl.y1);
              ctx.lineTo(spl.x2, spl.y2);
              ctx.stroke();
            }
          }
        }
        for (const ring of net.rings) {
          if (ring.points.length > 0 && Math.hypot(ring.points[0].x - cx, ring.points[0].y - cy) <= maxDist) {
            ctx.beginPath();
            ctx.moveTo(ring.points[0].x, ring.points[0].y);
            for (let i = 1; i < ring.points.length; i++) {
              ctx.lineTo(ring.points[i].x, ring.points[i].y);
            }
            ctx.stroke();
          }
        }
        // Ladder-rung cross-hatching
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)';
        for (const lad of net.ladders) {
          if (lad.dist <= maxDist) {
            ctx.beginPath();
            ctx.moveTo(lad.x1, lad.y1);
            ctx.lineTo(lad.x2, lad.y2);
            ctx.stroke();
          }
        }

        // Pass 4: Crisp 1px Specular Core Hairline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.0;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x, rad.points[0].y);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            if (Math.hypot(p.x - cx, p.y - cy) > maxDist) break;
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        // Central mana epicenter
        const coreRadius = 26 + crackProgress * 32;
        const impactGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
        impactGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        impactGrad.addColorStop(0.35, 'rgba(240, 171, 252, 0.85)');
        impactGrad.addColorStop(0.7, 'rgba(192, 38, 211, 0.45)');
        impactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = impactGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 3. VOLUMETRIC GOD RAYS (Phase: 'detonate')
      // ─────────────────────────────────────────────────────────────
      if (godRaysRef.current.length > 0 && phase === 'detonate') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const ray of godRaysRef.current) {
          if (ray.alpha <= 0.01) continue;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          const a1 = ray.angle - ray.width * 0.5;
          const a2 = ray.angle + ray.width * 0.5;
          ctx.lineTo(cx + Math.cos(a1) * ray.length, cy + Math.sin(a1) * ray.length);
          ctx.lineTo(cx + Math.cos(a2) * ray.length, cy + Math.sin(a2) * ray.length);
          ctx.closePath();

          const rayGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ray.length);
          rayGrad.addColorStop(0, `rgba(255, 255, 255, ${ray.alpha * 0.9})`);
          rayGrad.addColorStop(0.25, `rgba(232, 121, 249, ${ray.alpha * 0.6})`);
          rayGrad.addColorStop(0.7, `rgba(168, 85, 247, ${ray.alpha * 0.25})`);
          rayGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
          ctx.fillStyle = rayGrad;
          ctx.fill();

          ray.alpha = Math.max(0, ray.alpha - dt * 1.6);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. ANAMORPHIC HORIZONTAL LENS FLARE STREAK (Phase: 'detonate')
      // ─────────────────────────────────────────────────────────────
      if (flareOpacityRef.current > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const flareAlpha = flareOpacityRef.current;
        const flareHeight = 4 + flareAlpha * 14;

        // Blinding horizontal light blade
        const flareGrad = ctx.createLinearGradient(0, cy, w, cy);
        flareGrad.addColorStop(0, 'rgba(192, 38, 211, 0)');
        flareGrad.addColorStop(0.3, `rgba(232, 121, 249, ${flareAlpha * 0.55})`);
        flareGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flareAlpha})`);
        flareGrad.addColorStop(0.7, `rgba(232, 121, 249, ${flareAlpha * 0.55})`);
        flareGrad.addColorStop(1, 'rgba(192, 38, 211, 0)');

        ctx.fillStyle = flareGrad;
        ctx.fillRect(0, cy - flareHeight * 0.5, w, flareHeight);

        // Central vertical beam flare
        const vBeamW = 8 + flareAlpha * 26;
        const vGrad = ctx.createLinearGradient(cx - vBeamW, 0, cx + vBeamW, 0);
        vGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        vGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flareAlpha * 0.85})`);
        vGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(cx - vBeamW, 0, vBeamW * 2, h);

        flareOpacityRef.current = Math.max(0, flareOpacityRef.current - dt * 2.8);
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. VIOLET DEATH RAY PILLAR
      // ─────────────────────────────────────────────────────────────
      if (beamOpacityRef.current > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const beamW = 200 * beamOpacityRef.current;
        const beamGrad = ctx.createLinearGradient(cx - beamW, 0, cx + beamW, 0);
        beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        beamGrad.addColorStop(0.3, `rgba(192, 38, 211, ${0.75 * beamOpacityRef.current})`);
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.98 * beamOpacityRef.current})`);
        beamGrad.addColorStop(0.7, `rgba(192, 38, 211, ${0.75 * beamOpacityRef.current})`);
        beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = beamGrad;
        ctx.fillRect(cx - beamW, 0, beamW * 2, h);

        beamOpacityRef.current = Math.max(0, beamOpacityRef.current - dt * 2.2);
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 6. ELECTRIC VIOLET LIGHTNING BOLTS
      // ─────────────────────────────────────────────────────────────
      if (lightningsRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const bolt of lightningsRef.current) {
          if (bolt.life <= 0.01) continue;
          ctx.beginPath();
          ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
          for (let s = 1; s < bolt.segments.length; s++) {
            ctx.lineTo(bolt.segments[s].x, bolt.segments[s].y);
          }
          ctx.strokeStyle = `rgba(192, 38, 211, ${bolt.life * 0.5})`;
          ctx.lineWidth = 7 * bolt.life;
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.life * 0.95})`;
          ctx.lineWidth = 2.4 * bolt.life;
          ctx.stroke();

          bolt.life = Math.max(0, bolt.life - dt * 2.6);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 7. SEDOV-TAYLOR HYPERSONIC SHOCKWAVES
      // ─────────────────────────────────────────────────────────────
      if (shockwavesRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const sw of shockwavesRef.current) {
          if (sw.opacity <= 0.01) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = sw.colorGlow;
          ctx.lineWidth = sw.width * 2.2;
          ctx.globalAlpha = sw.opacity * 0.45;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = sw.colorCore;
          ctx.lineWidth = sw.width;
          ctx.globalAlpha = sw.opacity;
          ctx.stroke();

          sw.r += sw.speed * dt;
          sw.speed = Math.max(450, sw.speed * (1 - dt * 2.6));
          sw.opacity = Math.max(0, 1 - Math.pow(sw.r / sw.maxR, 1.3));
          sw.width = Math.max(1.5, sw.width * (1 - dt * 0.8));
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 8. THE DIVINE GOLDEN ALCHEMICAL SEAL (Phase: 'restore')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'restore') {
        restoreSealAlphaRef.current = Math.min(1, restoreSealAlphaRef.current + dt * 1.8);
        restoreSealAngleRef.current += dt * 0.95;
        const sealAng = restoreSealAngleRef.current;
        const sealAlpha = restoreSealAlphaRef.current;
        const sealRadius = Math.min(w, h) * 0.32;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalCompositeOperation = 'lighter';

        const goldAura = ctx.createRadialGradient(0, 0, sealRadius * 0.1, 0, 0, sealRadius * 1.25);
        goldAura.addColorStop(0, `rgba(254, 240, 138, ${sealAlpha * 0.32})`);
        goldAura.addColorStop(0.5, `rgba(251, 191, 36, ${sealAlpha * 0.18})`);
        goldAura.addColorStop(0.85, `rgba(217, 119, 6, ${sealAlpha * 0.08})`);
        goldAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = goldAura;
        ctx.beginPath();
        ctx.arc(0, 0, sealRadius * 1.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(251, 191, 36, ${sealAlpha * 0.95})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, sealRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, sealRadius * 0.78, 0, Math.PI * 2);
        ctx.lineWidth = 1.6;
        ctx.stroke();

        const spokes = 8;
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(254, 240, 138, ${sealAlpha * 0.85})`;
        for (let s = 0; s < spokes; s++) {
          const a = sealAng + (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (sealRadius * 0.35), Math.sin(a) * (sealRadius * 0.35));
          ctx.lineTo(Math.cos(a) * sealRadius, Math.sin(a) * sealRadius);
          ctx.stroke();
        }

        ctx.save();
        ctx.rotate(-sealAng * 1.3);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sealAlpha * 0.95})`;
        ctx.lineWidth = 1.8;
        for (let star = 0; star < 2; star++) {
          ctx.beginPath();
          const offset = (star * Math.PI) / 4;
          for (let p = 0; p < 5; p++) {
            const pa = offset + (p * Math.PI * 2) / 4;
            const px = Math.cos(pa) * (sealRadius * 0.78);
            const py = Math.sin(pa) * (sealRadius * 0.78);
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 9. FACETED 3D CRYSTAL DAGGER SHARDS & REVERSE VORTEX REWIND
      // ─────────────────────────────────────────────────────────────
      if (shardsRef.current.length > 0) {
        ctx.save();
        const shards = shardsRef.current;
        let writeIdx = 0;

        for (let i = 0; i < shards.length; i++) {
          const shard = shards[i];

          if (phase === 'restore') {
            const dx = cx - shard.x;
            const dy = cy - shard.y;
            const dist = Math.hypot(dx, dy) || 1;

            const pullForce = Math.min(3200, 950 + 55000 / (dist + 60)) * dt;
            const swirlAmp = (1600 / (dist + 70)) * dt;
            const tx = -dy / dist;
            const ty = dx / dist;

            shard.vx += (dx / dist) * pullForce + tx * swirlAmp;
            shard.vy += (dy / dist) * pullForce + ty * swirlAmp;
            shard.vx *= 0.92;
            shard.vy *= 0.92;

            shard.alpha = Math.min(1, shard.alpha + dt * 0.8);

            if (dist < 32) {
              shard.alpha -= dt * 4.2;
            }
          } else {
            shard.vx *= 0.982;
            shard.vy *= 0.982;
            shard.vy += dt * 38;
            shard.alpha = Math.max(0.58, shard.alpha - shard.decay * (dt * 60));
          }

          shard.x += shard.vx;
          shard.y += shard.vy;
          shard.rot += shard.vRot;
          shard.flipPhase += dt * shard.flipSpeed;

          if (shard.alpha > 0.01) {
            shards[writeIdx++] = shard;

            ctx.save();
            ctx.translate(shard.x, shard.y);
            ctx.rotate(shard.rot);

            const cosFlip = Math.cos(shard.flipPhase);
            const scaleX = Math.abs(cosFlip) < 0.12 ? (cosFlip < 0 ? -0.12 : 0.12) : cosFlip;
            ctx.scale(scaleX, 1);
            ctx.globalAlpha = Math.max(0, Math.min(1, shard.alpha));

            // Facet 1: Left Wing
            ctx.beginPath();
            ctx.moveTo(shard.tip.x, shard.tip.y);
            ctx.lineTo(shard.leftWing.x, shard.leftWing.y);
            ctx.lineTo(shard.base.x, shard.base.y);
            ctx.closePath();
            ctx.fillStyle = shard.colorLeft;
            ctx.fill();

            // Facet 2: Right Wing
            ctx.beginPath();
            ctx.moveTo(shard.tip.x, shard.tip.y);
            ctx.lineTo(shard.rightWing.x, shard.rightWing.y);
            ctx.lineTo(shard.base.x, shard.base.y);
            ctx.closePath();
            ctx.fillStyle = shard.colorRight;
            ctx.fill();

            // Central Specular Ridge Spine
            ctx.beginPath();
            ctx.moveTo(shard.tip.x, shard.tip.y);
            ctx.lineTo(shard.base.x, shard.base.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Crisp 1px Specular White Rim
            ctx.beginPath();
            ctx.moveTo(shard.tip.x, shard.tip.y);
            ctx.lineTo(shard.leftWing.x, shard.leftWing.y);
            ctx.lineTo(shard.base.x, shard.base.y);
            ctx.lineTo(shard.rightWing.x, shard.rightWing.y);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.lineWidth = 1.0;
            ctx.stroke();

            // Specular Anime Star Glint
            if (Math.abs(cosFlip) < 0.22 && glintCanvasRef.current) {
              ctx.globalCompositeOperation = 'lighter';
              ctx.drawImage(glintCanvasRef.current, -16, -16);
            }

            ctx.restore();
          }
        }

        shards.length = writeIdx;
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener('resize', syncCanvasSize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  if (phase === 'idle') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[56]"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
