import { useEffect, useRef } from 'react';

export type AtomicVfxPhase = 'idle' | 'rune' | 'crack' | 'detonate' | 'ruins' | 'restore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rot: number;
  vRot: number;
  type: 'spark' | 'shard' | 'ember' | 'smoke' | 'rubble';
  sides?: number;
}

interface CrackPoint {
  x: number;
  y: number;
  branches: CrackPoint[];
}

interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  segments: { x: number; y: number }[];
  life: number;
}

interface AtomicCanvasProps {
  phase: AtomicVfxPhase;
  reduced: boolean;
}

export default function AtomicCanvas({ phase, reduced }: AtomicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cracksRef = useRef<CrackPoint[]>([]);
  const shockwavesRef = useRef<{ r: number; maxR: number; opacity: number; width: number }[]>([]);
  const lightningsRef = useRef<LightningBolt[]>([]);
  const runeAngleRef = useRef(0);
  const beamOpacityRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Generate crack network branching from the center in CSS coordinates
  const generateCracks = (w: number, h: number): CrackPoint[] => {
    const cx = w / 2;
    const cy = h / 2;
    const numRoots = 12;
    const roots: CrackPoint[] = [];

    const createBranch = (
      x: number,
      y: number,
      angle: number,
      depth: number,
      maxDepth: number,
    ): CrackPoint => {
      const step = 35 + Math.random() * 55;
      const nx = x + Math.cos(angle) * step;
      const ny = y + Math.sin(angle) * step;
      const branches: CrackPoint[] = [];

      if (depth < maxDepth) {
        const branchCount = Math.random() > 0.3 ? 2 : 1;
        for (let b = 0; b < branchCount; b++) {
          const deltaAng = (Math.random() - 0.5) * 1.2;
          branches.push(createBranch(nx, ny, angle + deltaAng, depth + 1, maxDepth));
        }
      }
      return { x: nx, y: ny, branches };
    };

    for (let i = 0; i < numRoots; i++) {
      const baseAng = (i / numRoots) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const rootNode: CrackPoint = {
        x: cx,
        y: cy,
        branches: [createBranch(cx, cy, baseAng, 1, 7)],
      };
      roots.push(rootNode);
    }
    return roots;
  };

  // Generate erratic violet lightning bolts
  const spawnLightning = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const bolts: LightningBolt[] = [];
    const count = 7;

    for (let b = 0; b < count; b++) {
      const targetX = Math.random() * w;
      const targetY = Math.random() * h;
      const segments: { x: number; y: number }[] = [{ x: cx, y: cy }];
      const steps = 8;
      let curX = cx;
      let curY = cy;

      for (let s = 1; s <= steps; s++) {
        const progress = s / steps;
        const targetSegX = cx + (targetX - cx) * progress;
        const targetSegY = cy + (targetY - cy) * progress;
        curX = targetSegX + (Math.random() - 0.5) * 60;
        curY = targetSegY + (Math.random() - 0.5) * 60;
        segments.push({ x: curX, y: curY });
      }

      bolts.push({
        x1: cx,
        y1: cy,
        x2: targetX,
        y2: targetY,
        segments,
        life: 1.0,
      });
    }

    lightningsRef.current = bolts;
  };

  // Spawn massive bomb explosion particles in CSS coordinates
  const spawnBlastParticles = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const count = reduced ? 40 : 420;
    const particles: Particle[] = [];

    const colors = [
      '#a855f7', // electric purple
      '#c084fc', // bright violet
      '#e879f9', // neon fuchsia
      '#f43f5e', // rose
      '#38bdf8', // electric cyan
      '#fbbf24', // molten gold
      '#ffffff', // blazing white
      '#1e1b4b', // blackened rubble
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 34;
      const typeRand = Math.random();
      const pType: Particle['type'] =
        typeRand < 0.35
          ? 'spark'
          : typeRand < 0.65
            ? 'shard'
            : typeRand < 0.8
              ? 'rubble'
              : typeRand < 0.9
                ? 'ember'
                : 'smoke';

      particles.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size:
          pType === 'smoke'
            ? 35 + Math.random() * 60
            : pType === 'rubble'
              ? 8 + Math.random() * 16
              : 3.5 + Math.random() * 9,
        color: pType === 'rubble' ? '#0f0b1e' : colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay:
          pType === 'smoke'
            ? 0.005 + Math.random() * 0.006
            : 0.008 + Math.random() * 0.015,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.35,
        type: pType,
        sides: Math.floor(3 + Math.random() * 3),
      });
    }

    particlesRef.current = particles;

    // Colossal violet shockwaves
    shockwavesRef.current = [
      { r: 25, maxR: Math.hypot(w, h) * 0.95, opacity: 1, width: 24 },
      { r: 12, maxR: Math.hypot(w, h) * 0.85, opacity: 0.9, width: 16 },
      { r: 5, maxR: Math.hypot(w, h) * 0.7, opacity: 0.75, width: 10 },
    ];

    beamOpacityRef.current = 1.0;
    spawnLightning(w, h);
  };

  useEffect(() => {
    if (phase === 'crack') {
      cracksRef.current = generateCracks(window.innerWidth, window.innerHeight);
    } else if (phase === 'detonate') {
      spawnBlastParticles(window.innerWidth, window.innerHeight);
    } else if (phase === 'idle') {
      particlesRef.current = [];
      cracksRef.current = [];
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
        const radius = Math.min(w, h) * 0.36;
        const alpha = phase === 'crack' ? 1.0 : 0.8;

        ctx.save();
        ctx.translate(cx, cy);

        // Radiant violet aura
        const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.35);
        glowGrad.addColorStop(0, 'rgba(192, 38, 211, 0.28)');
        glowGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.12)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // Outer concentric ring
        ctx.strokeStyle = `rgba(232, 121, 249, ${alpha})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner nested ring
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Core containment ring
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.46, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.stroke();

        // Rotating Runic Spokes
        const spokes = 12;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(244, 114, 182, ${alpha * 0.9})`;
        for (let s = 0; s < spokes; s++) {
          const a = ang + (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius * 0.46), Math.sin(a) * (radius * 0.46));
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.stroke();
        }

        // Geometric Rune Octagrams
        ctx.save();
        ctx.rotate(-ang * 1.4);
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.9})`;
        ctx.lineWidth = 2.5;
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

        // Outer orbiting runes tick marks
        const ticks = 36;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 3;
        for (let t = 0; t < ticks; t++) {
          const ta = ang * 0.8 + (t / ticks) * Math.PI * 2;
          const r1 = radius + 6;
          const r2 = radius + (t % 3 === 0 ? 22 : 11);
          ctx.beginPath();
          ctx.moveTo(Math.cos(ta) * r1, Math.sin(ta) * r1);
          ctx.lineTo(Math.cos(ta) * r2, Math.sin(ta) * r2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 2. VIOLET DEATH RAY PILLAR (Phase: 'detonate')
      // ─────────────────────────────────────────────────────────────
      if (beamOpacityRef.current > 0.01) {
        ctx.save();
        const beamW = 180 * beamOpacityRef.current;
        const beamGrad = ctx.createLinearGradient(cx - beamW, 0, cx + beamW, 0);
        beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        beamGrad.addColorStop(0.3, `rgba(192, 38, 211, ${0.7 * beamOpacityRef.current})`);
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.95 * beamOpacityRef.current})`);
        beamGrad.addColorStop(0.7, `rgba(192, 38, 211, ${0.7 * beamOpacityRef.current})`);
        beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = beamGrad;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 40;
        ctx.fillRect(cx - beamW, 0, beamW * 2, h);

        beamOpacityRef.current = Math.max(0, beamOpacityRef.current - dt * 2.2);
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 3. ELECTRIC VIOLET LIGHTNING BOLTS (Phase: 'detonate', 'ruins')
      // ─────────────────────────────────────────────────────────────
      if (lightningsRef.current.length > 0) {
        ctx.save();
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 25;

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

          bolt.life = Math.max(0, bolt.life - dt * 2.5);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. TECTONIC FRACTURE CRACKS (Phase: 'crack', 'detonate', 'ruins')
      // ─────────────────────────────────────────────────────────────
      if (cracksRef.current.length > 0 && (phase === 'crack' || phase === 'detonate' || phase === 'ruins')) {
        ctx.save();
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = phase === 'detonate' ? 34 : 20;

        const drawBranch = (node: CrackPoint, depth: number) => {
          for (const b of node.branches) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(b.x, b.y);

            const crackAlpha = phase === 'ruins' ? 0.6 : phase === 'detonate' ? 1 : 0.9;
            ctx.strokeStyle =
              depth % 2 === 0
                ? `rgba(250, 232, 255, ${crackAlpha})`
                : `rgba(216, 180, 254, ${crackAlpha})`;
            ctx.lineWidth = Math.max(2, 7 - depth * 0.8);
            ctx.stroke();
            drawBranch(b, depth + 1);
          }
        };

        for (const root of cracksRef.current) {
          drawBranch(root, 1);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. HYPERSONIC VIOLET SHOCKWAVE EXPANSION (Phase: 'detonate')
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
          ctx.shadowBlur = 40;
          ctx.stroke();

          sw.r += dt * 1700;
          sw.opacity = Math.max(0, 1 - sw.r / sw.maxR);
          sw.width = Math.max(1.5, sw.width * 0.95);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 6. DEBRIS & EMBER PARTICLE PHYSICS
      // ─────────────────────────────────────────────────────────────
      if (particlesRef.current.length > 0) {
        ctx.save();
        const activeParticles: Particle[] = [];

        for (const p of particlesRef.current) {
          if (phase === 'restore') {
            // Reverse gravitational vortex: pulls debris back to center
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pullForce = 1350 * dt;
            p.vx += (dx / dist) * pullForce;
            p.vy += (dy / dist) * pullForce;
            p.vx *= 0.92;
            p.vy *= 0.92;
            p.alpha = Math.min(1, p.alpha + dt * 0.7);
          } else {
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.vy += dt * 50; // gravity
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

            if (p.type === 'spark') {
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 12;
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.type === 'shard' || p.type === 'rubble') {
              ctx.fillStyle = p.color;
              ctx.shadowColor = '#c084fc';
              ctx.shadowBlur = p.type === 'rubble' ? 4 : 14;
              ctx.beginPath();
              const sides = p.sides || 3;
              for (let s = 0; s < sides; s++) {
                const sa = (s / sides) * Math.PI * 2;
                const sx = Math.cos(sa) * p.size;
                const sy = Math.sin(sa) * p.size;
                if (s === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
              }
              ctx.closePath();
              ctx.fill();
            } else if (p.type === 'smoke') {
              const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
              grad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
              grad.addColorStop(0.6, 'rgba(88, 28, 135, 0.15)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Molten gold/violet ember
              ctx.fillStyle = p.color;
              ctx.shadowColor = '#fbbf24';
              ctx.shadowBlur = 16;
              ctx.beginPath();
              ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
              ctx.fill();
            }

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
