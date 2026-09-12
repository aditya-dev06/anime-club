import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  swayA: number;
  swayS: number;
  phase: number;
  alpha: number;
  color: string;
  tw: number;
  // petal-only fields (0 for sparks)
  rot: number;
  rotV: number;
  rx: number;
  ry: number;
}

const COLORS = ['#e8b64c', '#e8b64c', '#e8b64c', '#f6d98b', '#c73a3a', '#8b5cf6'];

// Sakura pinks — precomputed to avoid spawn-time string churn (hsl 330-350, 70-85%, 75-85%)
const PETAL_COLORS = [
  'hsl(332, 78%, 82%)',
  'hsl(336, 80%, 79%)',
  'hsl(340, 74%, 77%)',
  'hsl(344, 82%, 75%)',
  'hsl(348, 72%, 84%)',
  'hsl(350, 76%, 80%)',
];

export default function Particles({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = true;
    let sparks: Particle[] = [];
    let petals: Particle[] = [];

    const spawnSpark = (): Particle => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.6 + Math.random() * 1.8,
      vy: -(4 + Math.random() * 10),
      swayA: 8 + Math.random() * 26,
      swayS: 0.08 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.06 + Math.random() * 0.24,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      tw: 0.4 + Math.random() * 1.6,
      rot: 0,
      rotV: 0,
      rx: 0,
      ry: 0,
    });

    const spawnPetal = (): Particle => {
      const base = 2.4 + Math.random() * 2.8;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: base,
        vy: 10 + Math.random() * 16, // drifts DOWN, opposite the sparkles
        swayA: 16 + Math.random() * 38, // stronger sway than sparks
        swayS: 0.12 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.1 + Math.random() * 0.26,
        color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
        tw: 0.3 + Math.random() * 1.2,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 2.4,
        rx: base * 0.62,
        ry: base,
      };
    };

    const resize = () => {
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(64, Math.round((W * H) / 26000));
      const petalCount = Math.min(18, Math.round((W * H) / 45000));
      sparks = Array.from({ length: count }, spawnSpark);
      petals = Array.from({ length: petalCount }, spawnPetal);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const scroll = window.scrollY;
      const parUp = scroll * 0.05; // sparkles rise faster as you scroll down
      const parDown = scroll * 0.04; // petals drift along with the scroll
      const wrapH = H + 16;
      for (const p of sparks) {
        const x = p.x + Math.sin(t * p.swayS + p.phase) * p.swayA;
        const yy = ((p.y - parUp) % wrapH + wrapH) % wrapH;
        const y = yy < -8 ? yy + wrapH : yy - 8;
        ctx.globalAlpha = p.alpha * (0.65 + 0.35 * Math.sin(t * p.tw + p.phase));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of petals) {
        const x = p.x + Math.sin(t * p.swayS + p.phase) * p.swayA;
        const yy = ((p.y + parDown) % wrapH + wrapH) % wrapH;
        const y = yy < -12 ? yy + wrapH : yy - 12;
        ctx.globalAlpha = p.alpha * (0.65 + 0.35 * Math.sin(t * p.tw + p.phase));
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      for (const p of sparks) {
        p.y += p.vy * dt;
        if (p.y < -12) {
          p.y = H + 12;
          p.x = Math.random() * W;
        }
      }
      for (const p of petals) {
        p.y += p.vy * dt;
        p.rot += p.rotV * dt;
        if (p.y > H + 12) {
          p.y = -12;
          p.x = Math.random() * W;
        }
      }
      draw(t);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduced) {
      draw(1.2);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduced]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />;
}
