import { useEffect, useRef } from 'react';

export type AtomicVfxPhase = 'idle' | 'rune' | 'crack' | 'detonate' | 'ruins' | 'restore';

interface GlassShardParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  points: { x: number; y: number }[];
  color: string;
  alpha: number;
  decay: number;
  rot: number;
  vRot: number;
  specular: number;
}

interface RadialCrack {
  points: { x: number; y: number }[];
  splinters: { x1: number; y1: number; x2: number; y2: number }[];
}

interface RingCrack {
  points: { x: number; y: number }[];
}

interface GlassFractureNetwork {
  center: { x: number; y: number };
  rings: RingCrack[];
  radials: RadialCrack[];
}

interface LightningBolt {
  segments: { x: number; y: number }[];
  life: number;
}

interface AtomicCanvasProps {
  phase: AtomicVfxPhase;
  reduced: boolean;
}

export default function AtomicCanvas({ phase, reduced }: AtomicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<GlassShardParticle[]>([]);
  const fractureRef = useRef<GlassFractureNetwork | null>(null);
  const shockwavesRef = useRef<{ r: number; maxR: number; opacity: number; width: number }[]>([]);
  const lightningsRef = useRef<LightningBolt[]>([]);
  const runeAngleRef = useRef(0);
  const beamOpacityRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Generate an authentic tempered glass fracture network
  const generateRealisticFracture = (w: number, h: number): GlassFractureNetwork => {
    const cx = w / 2;
    const cy = h / 2;
    const numRadials = 16;
    const ringRadii = [35, 80, 150, 240, 360, 520, 720];
    const radials: RadialCrack[] = [];
    const rings: RingCrack[] = [];

    // 1. Generate radial zigzag fissure rays from center to edge
    for (let r = 0; r < numRadials; r++) {
      const baseAngle = (r / numRadials) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const points: { x: number; y: number }[] = [{ x: cx, y: cy }];
      const splinters: { x1: number; y1: number; x2: number; y2: number }[] = [];

      let curDist = 0;
      const maxDist = Math.hypot(w, h) * 0.75;
      let curAngle = baseAngle;

      while (curDist < maxDist) {
        curDist += 25 + Math.random() * 45;
        curAngle += (Math.random() - 0.5) * 0.25;
        const px = cx + Math.cos(curAngle) * curDist;
        const py = cy + Math.sin(curAngle) * curDist;
        points.push({ x: px, y: py });

        // Micro splinters branching off at ~55-degree angles
        if (Math.random() > 0.45 && curDist > 50) {
          const splinterAng = curAngle + (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4);
          const splinterLen = 12 + Math.random() * 26;
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

    // 2. Generate concentric polygonal stress fracture rings
    for (const radius of ringRadii) {
      const ringPts: { x: number; y: number }[] = [];
      const segments = numRadials * 2;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const jitter = radius * (0.88 + Math.random() * 0.24);
        ringPts.push({
          x: cx + Math.cos(a) * jitter,
          y: cy + Math.sin(a) * jitter,
        });
      }
      rings.push({ points: ringPts });
    }

    return { center: { x: cx, y: cy }, rings, radials };
  };

  // Spawn realistic glass shard debris polygons that tumble in 3D
  const spawnGlassShards = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const count = reduced ? 35 : 360;
    const shards: GlassShardParticle[] = [];

    const tintColors = [
      'rgba(216, 180, 254, 0.75)', // violet glass
      'rgba(192, 132, 252, 0.8)',  // purple glass
      'rgba(240, 171, 252, 0.75)', // fuchsia glint
      'rgba(255, 255, 255, 0.95)', // pure specular crystal
      'rgba(251, 191, 36, 0.8)',   // molten gold spark
      'rgba(30, 27, 75, 0.85)',    // charred dark glass
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 7 + Math.random() * 32;
      const shardSize = 4 + Math.random() * 16;

      // Realistic irregular sharp triangular/quad shard geometry
      const points: { x: number; y: number }[] = [];
      const numPts = Math.floor(3 + Math.random() * 2);
      for (let p = 0; p < numPts; p++) {
        const pa = (p / numPts) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
        const pr = shardSize * (0.5 + Math.random() * 0.8);
        points.push({ x: Math.cos(pa) * pr, y: Math.sin(pa) * pr });
      }

      shards.push({
        x: cx + (Math.random() - 0.5) * 50,
        y: cy + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        points,
        color: tintColors[Math.floor(Math.random() * tintColors.length)],
        alpha: 1,
        decay: 0.009 + Math.random() * 0.016,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        specular: Math.random(),
      });
    }

    particlesRef.current = shards;

    // Shockwaves
    shockwavesRef.current = [
      { r: 20, maxR: Math.hypot(w, h) * 0.9, opacity: 1, width: 22 },
      { r: 10, maxR: Math.hypot(w, h) * 0.8, opacity: 0.85, width: 14 },
      { r: 4, maxR: Math.hypot(w, h) * 0.65, opacity: 0.7, width: 8 },
    ];

    beamOpacityRef.current = 1.0;

    // Violet lightning
    const bolts: LightningBolt[] = [];
    for (let b = 0; b < 6; b++) {
      const tx = Math.random() * w;
      const ty = Math.random() * h;
      const segs = [{ x: cx, y: cy }];
      let sx = cx;
      let sy = cy;
      for (let s = 1; s <= 7; s++) {
        const prog = s / 7;
        sx = cx + (tx - cx) * prog + (Math.random() - 0.5) * 50;
        sy = cy + (ty - cy) * prog + (Math.random() - 0.5) * 50;
        segs.push({ x: sx, y: sy });
      }
      bolts.push({ segments: segs, life: 1.0 });
    }
    lightningsRef.current = bolts;
  };

  useEffect(() => {
    if (phase === 'crack') {
      fractureRef.current = generateRealisticFracture(window.innerWidth, window.innerHeight);
    } else if (phase === 'detonate') {
      spawnGlassShards(window.innerWidth, window.innerHeight);
    } else if (phase === 'idle') {
      particlesRef.current = [];
      fractureRef.current = null;
      shockwavesRef.current = [];
      lightningsRef.current = [];
      beamOpacityRef.current = 0;
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
      const dt = (now - lastTimeRef.current) / 1000;
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
      // 1. RUNE SEAL ARRAY (Phase: 'rune' and 'crack')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'rune' || phase === 'crack') {
        runeAngleRef.current += dt * (phase === 'crack' ? 1.8 : 0.7);
        const ang = runeAngleRef.current;
        const radius = Math.min(w, h) * 0.35;
        const alpha = phase === 'crack' ? 0.95 : 0.75;

        ctx.save();
        ctx.translate(cx, cy);

        // Radiant violet glow
        const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.3);
        glowGrad.addColorStop(0, 'rgba(192, 38, 211, 0.22)');
        glowGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.1)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Rings
        ctx.strokeStyle = `rgba(232, 121, 249, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Spokes
        const spokes = 12;
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(244, 114, 182, ${alpha * 0.85})`;
        for (let s = 0; s < spokes; s++) {
          const a = ang + (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius * 0.45), Math.sin(a) * (radius * 0.45));
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.stroke();
        }

        // Octagrams
        ctx.save();
        ctx.rotate(-ang * 1.3);
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.85})`;
        ctx.lineWidth = 2;
        for (let star = 0; star < 2; star++) {
          ctx.beginPath();
          const offset = (star * Math.PI) / 4;
          for (let p = 0; p < 5; p++) {
            const pa = offset + (p * Math.PI * 2) / 4;
            const px = Math.cos(pa) * (radius * 0.78);
            const py = Math.sin(pa) * (radius * 0.78);
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 2. REALISTIC TEMPERED GLASS CRACK SHATTER (Phase: 'crack', 'detonate', 'ruins')
      // ─────────────────────────────────────────────────────────────
      if (fractureRef.current && (phase === 'crack' || phase === 'detonate' || phase === 'ruins')) {
        const net = fractureRef.current;
        const crackAlpha = phase === 'ruins' ? 0.5 : phase === 'detonate' ? 1.0 : 0.85;

        ctx.save();

        // 1. First pass: Dark refractive drop shadow (creates depth in the glass)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.7 * crackAlpha})`;
        ctx.lineWidth = 2.5;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x + 1.5, rad.points[0].y + 1.5);
          for (let i = 1; i < rad.points.length; i++) {
            ctx.lineTo(rad.points[i].x + 1.5, rad.points[i].y + 1.5);
          }
          ctx.stroke();
          for (const spl of rad.splinters) {
            ctx.beginPath();
            ctx.moveTo(spl.x1 + 1.5, spl.y1 + 1.5);
            ctx.lineTo(spl.x2 + 1.5, spl.y2 + 1.5);
            ctx.stroke();
          }
        }
        for (const ring of net.rings) {
          ctx.beginPath();
          ctx.moveTo(ring.points[0].x + 1.5, ring.points[0].y + 1.5);
          for (let i = 1; i < ring.points.length; i++) {
            ctx.lineTo(ring.points[i].x + 1.5, ring.points[i].y + 1.5);
          }
          ctx.stroke();
        }

        // 2. Second pass: Glowing violet magical energy seam
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = phase === 'detonate' ? 24 : 14;
        ctx.strokeStyle = `rgba(216, 180, 254, ${0.9 * crackAlpha})`;
        ctx.lineWidth = 2.0;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x, rad.points[0].y);
          for (let i = 1; i < rad.points.length; i++) {
            ctx.lineTo(rad.points[i].x, rad.points[i].y);
          }
          ctx.stroke();
          for (const spl of rad.splinters) {
            ctx.beginPath();
            ctx.moveTo(spl.x1, spl.y1);
            ctx.lineTo(spl.x2, spl.y2);
            ctx.stroke();
          }
        }
        for (const ring of net.rings) {
          ctx.beginPath();
          ctx.moveTo(ring.points[0].x, ring.points[0].y);
          for (let i = 1; i < ring.points.length; i++) {
            ctx.lineTo(ring.points[i].x, ring.points[i].y);
          }
          ctx.stroke();
        }

        // 3. Third pass: Crisp 1px razor-sharp white specular highlight (realistic glass reflection)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * crackAlpha})`;
        ctx.lineWidth = 1.0;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x - 0.5, rad.points[0].y - 0.5);
          for (let i = 1; i < rad.points.length; i++) {
            ctx.lineTo(rad.points[i].x - 0.5, rad.points[i].y - 0.5);
          }
          ctx.stroke();
        }

        // Central crushed impact point (white pulverized glass core)
        const impactGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38);
        impactGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * crackAlpha})`);
        impactGrad.addColorStop(0.4, `rgba(240, 171, 252, ${0.6 * crackAlpha})`);
        impactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = impactGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 3. VIOLET DEATH RAY PILLAR (Phase: 'detonate')
      // ─────────────────────────────────────────────────────────────
      if (beamOpacityRef.current > 0.01) {
        ctx.save();
        const beamW = 190 * beamOpacityRef.current;
        const beamGrad = ctx.createLinearGradient(cx - beamW, 0, cx + beamW, 0);
        beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        beamGrad.addColorStop(0.3, `rgba(192, 38, 211, ${0.75 * beamOpacityRef.current})`);
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.98 * beamOpacityRef.current})`);
        beamGrad.addColorStop(0.7, `rgba(192, 38, 211, ${0.75 * beamOpacityRef.current})`);
        beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = beamGrad;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 45;
        ctx.fillRect(cx - beamW, 0, beamW * 2, h);

        beamOpacityRef.current = Math.max(0, beamOpacityRef.current - dt * 2.4);
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. ELECTRIC VIOLET LIGHTNING BOLTS
      // ─────────────────────────────────────────────────────────────
      if (lightningsRef.current.length > 0) {
        ctx.save();
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 24;

        for (const bolt of lightningsRef.current) {
          if (bolt.life <= 0.01) continue;
          ctx.beginPath();
          ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
          for (let s = 1; s < bolt.segments.length; s++) {
            ctx.lineTo(bolt.segments[s].x, bolt.segments[s].y);
          }
          ctx.strokeStyle = `rgba(245, 208, 254, ${bolt.life})`;
          ctx.lineWidth = 3.5 * bolt.life;
          ctx.stroke();

          bolt.life = Math.max(0, bolt.life - dt * 2.8);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. HYPERSONIC VIOLET SHOCKWAVE EXPANSION
      // ─────────────────────────────────────────────────────────────
      if (shockwavesRef.current.length > 0) {
        ctx.save();
        for (const sw of shockwavesRef.current) {
          if (sw.opacity <= 0.01) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(216, 180, 254, ${sw.opacity})`;
          ctx.lineWidth = sw.width;
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 36;
          ctx.stroke();

          sw.r += dt * 1700;
          sw.opacity = Math.max(0, 1 - sw.r / sw.maxR);
          sw.width = Math.max(1.5, sw.width * 0.95);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 6. REALISTIC 3D GLASS SHARDS & DEBRIS PARTICLES
      // ─────────────────────────────────────────────────────────────
      if (particlesRef.current.length > 0) {
        ctx.save();
        const activeParticles: GlassShardParticle[] = [];

        for (const p of particlesRef.current) {
          if (phase === 'restore') {
            // Reverse gravitational vortex
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pullForce = 1400 * dt;
            p.vx += (dx / dist) * pullForce;
            p.vy += (dy / dist) * pullForce;
            p.vx *= 0.91;
            p.vy *= 0.91;
            p.alpha = Math.min(1, p.alpha + dt * 0.8);
          } else {
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.vy += dt * 45; // gravity
            p.alpha -= p.decay * (dt * 60);
          }

          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vRot;

          if (p.alpha > 0.01) {
            activeParticles.push(p);

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

            // Draw sharp glass polygon
            ctx.beginPath();
            ctx.moveTo(p.points[0].x, p.points[0].y);
            for (let i = 1; i < p.points.length; i++) {
              ctx.lineTo(p.points[i].x, p.points[i].y);
            }
            ctx.closePath();

            ctx.fillStyle = p.color;
            ctx.fill();

            // Crisp specular bevel reflection along shard edge
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1;
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 8;
            ctx.stroke();

            ctx.restore();
          }
        }

        particlesRef.current = activeParticles;
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
