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
  const phaseStartTimeRef = useRef(performance.now());

  // Generate crack network branching from the center
  const generateCracks = (w: number, h: number): CrackPoint[] => {
    const cx = w / 2;
    const cy = h / 2;
    const numRoots = 8;
    const roots: CrackPoint[] = [];

    const createBranch = (
      x: number,
      y: number,
      angle: number,
      depth: number,
      maxDepth: number,
    ): CrackPoint => {
      const step = 25 + Math.random() * 45;
      const nx = x + Math.cos(angle) * step;
      const ny = y + Math.sin(angle) * step;
      const branches: CrackPoint[] = [];

      if (depth < maxDepth) {
        const branchCount = Math.random() > 0.4 ? 2 : 1;
        for (let b = 0; b < branchCount; b++) {
          const deltaAng = (Math.random() - 0.5) * 0.95;
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
        branches: [createBranch(cx, cy, baseAng, 1, 6)],
      };
      roots.push(rootNode);
    }
    return roots;
  };

  // Spawn explosion particles
  const spawnBlastParticles = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const count = reduced ? 30 : 280;
    const particles: Particle[] = [];

    const colors = [
      '#a855f7', // purple-500
      '#c084fc', // purple-400
      '#e879f9', // fuchsia-400
      '#f43f5e', // rose-500
      '#fbbf24', // amber-400 (gold)
      '#ffffff', // white core
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 24;
      const typeRand = Math.random();
      const pType: Particle['type'] =
        typeRand < 0.4 ? 'spark' : typeRand < 0.7 ? 'shard' : typeRand < 0.85 ? 'ember' : 'smoke';

      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: pType === 'smoke' ? 24 + Math.random() * 40 : 2.5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: pType === 'smoke' ? 0.008 + Math.random() * 0.008 : 0.012 + Math.random() * 0.02,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        type: pType,
        sides: Math.floor(3 + Math.random() * 3),
      });
    }

    particlesRef.current = particles;

    shockwavesRef.current = [
      { r: 10, maxR: Math.hypot(w, h) * 0.8, opacity: 1, width: 14 },
      { r: 5, maxR: Math.hypot(w, h) * 0.7, opacity: 0.8, width: 8 },
      { r: 2, maxR: Math.hypot(w, h) * 0.6, opacity: 0.6, width: 5 },
    ];
  };

  useEffect(() => {
    phaseStartTimeRef.current = performance.now();

    if (phase === 'crack') {
      const canvas = canvasRef.current;
      if (canvas) {
        cracksRef.current = generateCracks(canvas.width, canvas.height);
      }
    } else if (phase === 'detonate') {
      const canvas = canvasRef.current;
      if (canvas) {
        spawnBlastParticles(canvas.width, canvas.height);
      }
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

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      if (!active) return;
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. RUNE SEAL ARRAY
      if (phase === 'rune' || phase === 'crack') {
        runeAngleRef.current += dt * (phase === 'crack' ? 1.4 : 0.5);
        const ang = runeAngleRef.current;
        const radius = Math.min(w, h) * 0.32;
        const alpha = phase === 'crack' ? 0.9 : 0.65;

        ctx.save();
        ctx.translate(cx, cy);

        const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.3);
        glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
        glowGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.stroke();

        const spokes = 12;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(236, 72, 153, ${alpha * 0.8})`;
        for (let s = 0; s < spokes; s++) {
          const a = ang + (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius * 0.45), Math.sin(a) * (radius * 0.45));
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.stroke();
        }

        ctx.save();
        ctx.rotate(-ang * 1.2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.75})`;
        ctx.lineWidth = 1.5;
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

        const ticks = 36;
        ctx.strokeStyle = `rgba(216, 180, 254, ${alpha * 0.9})`;
        ctx.lineWidth = 2;
        for (let t = 0; t < ticks; t++) {
          const ta = ang * 0.7 + (t / ticks) * Math.PI * 2;
          const r1 = radius + 4;
          const r2 = radius + (t % 3 === 0 ? 16 : 8);
          ctx.beginPath();
          ctx.moveTo(Math.cos(ta) * r1, Math.sin(ta) * r1);
          ctx.lineTo(Math.cos(ta) * r2, Math.sin(ta) * r2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 2. TECTONIC FRACTURE CRACKS
      if (cracksRef.current.length > 0 && (phase === 'crack' || phase === 'detonate' || phase === 'ruins')) {
        ctx.save();
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = phase === 'detonate' ? 24 : 14;

        const drawBranch = (node: CrackPoint, depth: number) => {
          for (const b of node.branches) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(b.x, b.y);

            const crackAlpha = phase === 'ruins' ? 0.45 : phase === 'detonate' ? 0.95 : 0.8;
            ctx.strokeStyle =
              depth % 2 === 0
                ? `rgba(236, 72, 153, ${crackAlpha})`
                : `rgba(168, 85, 247, ${crackAlpha})`;
            ctx.lineWidth = Math.max(1, 5 - depth * 0.7);
            ctx.stroke();
            drawBranch(b, depth + 1);
          }
        };

        for (const root of cracksRef.current) {
          drawBranch(root, 1);
        }
        ctx.restore();
      }

      // 3. HYPERSONIC SHOCKWAVE EXPANSION
      if (shockwavesRef.current.length > 0) {
        ctx.save();
        for (const sw of shockwavesRef.current) {
          if (sw.opacity <= 0.01) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 244, 214, ${sw.opacity})`;
          ctx.lineWidth = sw.width;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 28;
          ctx.stroke();

          sw.r += dt * 1400;
          sw.opacity = Math.max(0, 1 - sw.r / sw.maxR);
          sw.width = Math.max(1, sw.width * 0.97);
        }
        ctx.restore();
      }

      // 4. DEBRIS & EMBER PARTICLE PHYSICS
      if (particlesRef.current.length > 0) {
        ctx.save();
        const activeParticles: Particle[] = [];

        for (const p of particlesRef.current) {
          if (phase === 'restore') {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pullForce = 950 * dt;
            p.vx += (dx / dist) * pullForce;
            p.vy += (dy / dist) * pullForce;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.alpha = Math.min(1, p.alpha + dt * 0.5);
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
              ctx.shadowBlur = 8;
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.type === 'shard') {
              ctx.fillStyle = p.color;
              ctx.shadowColor = '#c084fc';
              ctx.shadowBlur = 10;
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
              grad.addColorStop(0, 'rgba(88, 28, 135, 0.25)');
              grad.addColorStop(0.5, 'rgba(59, 7, 100, 0.12)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = p.color;
              ctx.shadowColor = '#fbbf24';
              ctx.shadowBlur = 12;
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

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
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
