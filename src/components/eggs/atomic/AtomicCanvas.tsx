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
  type: 'spark' | 'shard' | 'ember' | 'smoke';
  sides?: number;
}

interface CrackPoint {
  x: number;
  y: number;
  branches: CrackPoint[];
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
  const runeAngleRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Generate crack network branching from the center in CSS coordinates
  const generateCracks = (w: number, h: number): CrackPoint[] => {
    const cx = w / 2;
    const cy = h / 2;
    const numRoots = 10;
    const roots: CrackPoint[] = [];

    const createBranch = (
      x: number,
      y: number,
      angle: number,
      depth: number,
      maxDepth: number,
    ): CrackPoint => {
      const step = 30 + Math.random() * 50;
      const nx = x + Math.cos(angle) * step;
      const ny = y + Math.sin(angle) * step;
      const branches: CrackPoint[] = [];

      if (depth < maxDepth) {
        const branchCount = Math.random() > 0.35 ? 2 : 1;
        for (let b = 0; b < branchCount; b++) {
          const deltaAng = (Math.random() - 0.5) * 1.1;
          branches.push(createBranch(nx, ny, angle + deltaAng, depth + 1, maxDepth));
        }
      }
      return { x: nx, y: ny, branches };
    };

    for (let i = 0; i < numRoots; i++) {
      const baseAng = (i / numRoots) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const rootNode: CrackPoint = {
        x: cx,
        y: cy,
        branches: [createBranch(cx, cy, baseAng, 1, 6)],
      };
      roots.push(rootNode);
    }
    return roots;
  };

  // Spawn explosion particles in CSS coordinates
  const spawnBlastParticles = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const count = reduced ? 30 : 320;
    const particles: Particle[] = [];

    const colors = [
      '#d946ef', // fuchsia-500
      '#c084fc', // purple-400
      '#a855f7', // purple-500
      '#38bdf8', // sky-400 (electric neon)
      '#fbbf24', // amber-400 (gold)
      '#ffffff', // white core
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 28;
      const typeRand = Math.random();
      const pType: Particle['type'] =
        typeRand < 0.4 ? 'spark' : typeRand < 0.75 ? 'shard' : typeRand < 0.9 ? 'ember' : 'smoke';

      particles.push({
        x: cx + (Math.random() - 0.5) * 50,
        y: cy + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: pType === 'smoke' ? 26 + Math.random() * 45 : 3 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: pType === 'smoke' ? 0.006 + Math.random() * 0.007 : 0.01 + Math.random() * 0.018,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        type: pType,
        sides: Math.floor(3 + Math.random() * 3),
      });
    }

    particlesRef.current = particles;

    shockwavesRef.current = [
      { r: 15, maxR: Math.hypot(w, h) * 0.85, opacity: 1, width: 16 },
      { r: 8, maxR: Math.hypot(w, h) * 0.75, opacity: 0.85, width: 10 },
      { r: 3, maxR: Math.hypot(w, h) * 0.65, opacity: 0.7, width: 6 },
    ];
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
        runeAngleRef.current += dt * (phase === 'crack' ? 1.6 : 0.6);
        const ang = runeAngleRef.current;
        const radius = Math.min(w, h) * 0.34;
        const alpha = phase === 'crack' ? 0.95 : 0.75;

        ctx.save();
        ctx.translate(cx, cy);

        // Ambient glow
        const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.3);
        glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
        glowGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.1)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Outer concentric ring
        ctx.strokeStyle = `rgba(216, 180, 254, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner nested ring
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Core containment ring
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.46, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Rotating Runic Spokes
        const spokes = 12;
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(244, 114, 182, ${alpha * 0.85})`;
        for (let s = 0; s < spokes; s++) {
          const a = ang + (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius * 0.46), Math.sin(a) * (radius * 0.46));
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.stroke();
        }

        // Geometric Rune Octagrams
        ctx.save();
        ctx.rotate(-ang * 1.3);
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.85})`;
        ctx.lineWidth = 2;
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 2.5;
        for (let t = 0; t < ticks; t++) {
          const ta = ang * 0.75 + (t / ticks) * Math.PI * 2;
          const r1 = radius + 5;
          const r2 = radius + (t % 3 === 0 ? 18 : 9);
          ctx.beginPath();
          ctx.moveTo(Math.cos(ta) * r1, Math.sin(ta) * r1);
          ctx.lineTo(Math.cos(ta) * r2, Math.sin(ta) * r2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 2. TECTONIC FRACTURE CRACKS (Phase: 'crack', 'detonate', 'ruins')
      // ─────────────────────────────────────────────────────────────
      if (cracksRef.current.length > 0 && (phase === 'crack' || phase === 'detonate' || phase === 'ruins')) {
        ctx.save();
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = phase === 'detonate' ? 28 : 16;

        const drawBranch = (node: CrackPoint, depth: number) => {
          for (const b of node.branches) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(b.x, b.y);

            const crackAlpha = phase === 'ruins' ? 0.5 : phase === 'detonate' ? 1 : 0.85;
            ctx.strokeStyle =
              depth % 2 === 0
                ? `rgba(240, 171, 252, ${crackAlpha})`
                : `rgba(192, 132, 252, ${crackAlpha})`;
            ctx.lineWidth = Math.max(1.5, 6 - depth * 0.75);
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
      // 3. HYPERSONIC SHOCKWAVE EXPANSION (Phase: 'detonate')
      // ─────────────────────────────────────────────────────────────
      if (shockwavesRef.current.length > 0) {
        ctx.save();
        for (const sw of shockwavesRef.current) {
          if (sw.opacity <= 0.01) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${sw.opacity})`;
          ctx.lineWidth = sw.width;
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 32;
          ctx.stroke();

          sw.r += dt * 1500;
          sw.opacity = Math.max(0, 1 - sw.r / sw.maxR);
          sw.width = Math.max(1, sw.width * 0.96);
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. DEBRIS & EMBER PARTICLE PHYSICS
      // ─────────────────────────────────────────────────────────────
      if (particlesRef.current.length > 0) {
        ctx.save();
        const activeParticles: Particle[] = [];

        for (const p of particlesRef.current) {
          if (phase === 'restore') {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pullForce = 1100 * dt;
            p.vx += (dx / dist) * pullForce;
            p.vy += (dy / dist) * pullForce;
            p.vx *= 0.93;
            p.vy *= 0.93;
            p.alpha = Math.min(1, p.alpha + dt * 0.6);
          } else {
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.vy += dt * 45;
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
              ctx.shadowBlur = 10;
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.type === 'shard') {
              ctx.fillStyle = p.color;
              ctx.shadowColor = '#c084fc';
              ctx.shadowBlur = 12;
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
              grad.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
              grad.addColorStop(0.6, 'rgba(88, 28, 135, 0.12)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = p.color;
              ctx.shadowColor = '#fbbf24';
              ctx.shadowBlur = 14;
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
