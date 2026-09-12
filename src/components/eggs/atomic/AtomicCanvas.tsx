import { useEffect, useRef } from 'react';

export type AtomicVfxPhase = 'idle' | 'rune' | 'crack' | 'detonate' | 'ruins' | 'restore';

interface FlyingGlassShard {
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
  const fractureRef = useRef<GlassFractureNetwork | null>(null);
  const shardsRef = useRef<FlyingGlassShard[]>([]);
  const shockwavesRef = useRef<{ r: number; maxR: number; opacity: number; width: number }[]>([]);
  const lightningsRef = useRef<LightningBolt[]>([]);
  const runeAngleRef = useRef(0);
  const beamOpacityRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const crackStartTimeRef = useRef(0);

  // Generate authentic tempered glass fracture network for the crack phase
  const generateRealisticFracture = (w: number, h: number): GlassFractureNetwork => {
    const cx = w / 2;
    const cy = h / 2;
    const numRadials = 18;
    const ringRadii = [35, 85, 160, 260, 390, 560, 760];
    const radials: RadialCrack[] = [];
    const rings: RingCrack[] = [];

    // Radial fissure rays
    for (let r = 0; r < numRadials; r++) {
      const baseAngle = (r / numRadials) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
      const points: { x: number; y: number }[] = [{ x: cx, y: cy }];
      const splinters: { x1: number; y1: number; x2: number; y2: number }[] = [];

      let curDist = 0;
      const maxDist = Math.hypot(w, h) * 0.8;
      let curAngle = baseAngle;

      while (curDist < maxDist) {
        curDist += 26 + Math.random() * 45;
        curAngle += (Math.random() - 0.5) * 0.22;
        const px = cx + Math.cos(curAngle) * curDist;
        const py = cy + Math.sin(curAngle) * curDist;
        points.push({ x: px, y: py });

        if (Math.random() > 0.4 && curDist > 40) {
          const splinterAng = curAngle + (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.35);
          const splinterLen = 14 + Math.random() * 26;
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

    // Concentric stress fracture rings
    for (const radius of ringRadii) {
      const ringPts: { x: number; y: number }[] = [];
      const segments = numRadials * 2;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const jitter = radius * (0.9 + Math.random() * 0.2);
        ringPts.push({
          x: cx + Math.cos(a) * jitter,
          y: cy + Math.sin(a) * jitter,
        });
      }
      rings.push({ points: ringPts });
    }

    return { center: { x: cx, y: cy }, rings, radials };
  };

  // Explode the shattered glass into 400+ flying pieces that blast away in 3D!
  const explodeGlassShards = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const count = reduced ? 30 : 140;
    const shards: FlyingGlassShard[] = [];

    const glassTints = [
      'rgba(240, 171, 252, 0.85)', // neon violet glass
      'rgba(216, 180, 254, 0.8)',  // light lavender
      'rgba(192, 132, 252, 0.85)', // rich purple
      'rgba(255, 255, 255, 0.95)', // crystal white specular
      'rgba(56, 189, 248, 0.8)',   // electric cyan tint
      'rgba(251, 191, 36, 0.9)',   // molten gold spark
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // High explosive velocity outward!
      const speed = 9 + Math.random() * 36;
      const shardSize = 6 + Math.random() * 22;

      // Realistic sharp triangular and trapezoid glass shard geometry
      const points: { x: number; y: number }[] = [];
      const numPts = Math.floor(3 + Math.random() * 2);
      for (let p = 0; p < numPts; p++) {
        const pa = (p / numPts) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const pr = shardSize * (0.5 + Math.random() * 0.8);
        points.push({ x: Math.cos(pa) * pr, y: Math.sin(pa) * pr });
      }

      shards.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        points,
        color: glassTints[Math.floor(Math.random() * glassTints.length)],
        alpha: 1.0,
        decay: 0.005 + Math.random() * 0.009, // stays visible longer
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.45,
        size: shardSize,
        flipSpeed: 2 + Math.random() * 6,
        flipPhase: Math.random() * Math.PI * 2,
      });
    }

    shardsRef.current = shards;

    // Searing violet shockwaves
    shockwavesRef.current = [
      { r: 25, maxR: Math.hypot(w, h) * 0.95, opacity: 1, width: 26 },
      { r: 12, maxR: Math.hypot(w, h) * 0.85, opacity: 0.9, width: 16 },
      { r: 5, maxR: Math.hypot(w, h) * 0.7, opacity: 0.75, width: 10 },
    ];

    beamOpacityRef.current = 1.0;

    // Electric violet lightning
    const bolts: LightningBolt[] = [];
    for (let b = 0; b < 7; b++) {
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
      crackStartTimeRef.current = performance.now();
      fractureRef.current = generateRealisticFracture(window.innerWidth, window.innerHeight);
    } else if (phase === 'detonate') {
      explodeGlassShards(window.innerWidth, window.innerHeight);
    } else if (phase === 'idle') {
      fractureRef.current = null;
      shardsRef.current = [];
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

        // Concentric Rings
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
      // 2. TEMPERED GLASS CRACK NETWORK (Visible during 'crack' phase before explosion)
      // ─────────────────────────────────────────────────────────────
      if (fractureRef.current && phase === 'crack') {
        const net = fractureRef.current;
        const crackElapsed = Math.max(0, (now - crackStartTimeRef.current) / 1000);
        // Progressive spiderweb growth over 2.6s (creeps outward organically from center)
        const crackProgress = Math.min(1, Math.max(0.05, crackElapsed / 2.6));
        const easedProgress = Math.pow(crackProgress, 0.85);
        const maxDist = easedProgress * Math.hypot(w, h) * 0.85;

        ctx.save();

        // 1. Dark refractive drop shadow
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 2.5;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x + 1.5, rad.points[0].y + 1.5);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            const d = Math.hypot(p.x - cx, p.y - cy);
            if (d > maxDist) break;
            ctx.lineTo(p.x + 1.5, p.y + 1.5);
          }
          ctx.stroke();
          for (const spl of rad.splinters) {
            const d = Math.hypot(spl.x1 - cx, spl.y1 - cy);
            if (d <= maxDist) {
              ctx.beginPath();
              ctx.moveTo(spl.x1 + 1.5, spl.y1 + 1.5);
              ctx.lineTo(spl.x2 + 1.5, spl.y2 + 1.5);
              ctx.stroke();
            }
          }
        }
        for (const ring of net.rings) {
          if (ring.points.length > 0) {
            const ringDist = Math.hypot(ring.points[0].x - cx, ring.points[0].y - cy);
            if (ringDist <= maxDist) {
              ctx.beginPath();
              ctx.moveTo(ring.points[0].x + 1.5, ring.points[0].y + 1.5);
              for (let i = 1; i < ring.points.length; i++) {
                ctx.lineTo(ring.points[i].x + 1.5, ring.points[i].y + 1.5);
              }
              ctx.stroke();
            }
          }
        }

        // 2. Glowing violet energy seam
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.9)';
        ctx.lineWidth = 2.0;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x, rad.points[0].y);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            const d = Math.hypot(p.x - cx, p.y - cy);
            if (d > maxDist) break;
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          for (const spl of rad.splinters) {
            const d = Math.hypot(spl.x1 - cx, spl.y1 - cy);
            if (d <= maxDist) {
              ctx.beginPath();
              ctx.moveTo(spl.x1, spl.y1);
              ctx.lineTo(spl.x2, spl.y2);
              ctx.stroke();
            }
          }
        }
        for (const ring of net.rings) {
          if (ring.points.length > 0) {
            const ringDist = Math.hypot(ring.points[0].x - cx, ring.points[0].y - cy);
            if (ringDist <= maxDist) {
              ctx.beginPath();
              ctx.moveTo(ring.points[0].x, ring.points[0].y);
              for (let i = 1; i < ring.points.length; i++) {
                ctx.lineTo(ring.points[i].x, ring.points[i].y);
              }
              ctx.stroke();
            }
          }
        }

        // 3. Crisp 1px white specular reflection
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.0;
        for (const rad of net.radials) {
          ctx.beginPath();
          ctx.moveTo(rad.points[0].x - 0.5, rad.points[0].y - 0.5);
          for (let i = 1; i < rad.points.length; i++) {
            const p = rad.points[i];
            const d = Math.hypot(p.x - cx, p.y - cy);
            if (d > maxDist) break;
            ctx.lineTo(p.x - 0.5, p.y - 0.5);
          }
          ctx.stroke();
        }

        // Central impact core that intensifies with crack progress
        const coreRadius = 24 + crackProgress * 22;
        const impactGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
        impactGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        impactGrad.addColorStop(0.4, 'rgba(240, 171, 252, 0.7)');
        impactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = impactGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
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
      // 6. SHATTERED GLASS FLYING AWAY & REWINDING BACK!
      // ─────────────────────────────────────────────────────────────
      if (shardsRef.current.length > 0) {
        ctx.save();
        const activeShards: FlyingGlassShard[] = [];

        for (const shard of shardsRef.current) {
          if (phase === 'restore') {
            // Magical Singularity: All flying glass pieces accelerate and fly BACK to center!
            const dx = cx - shard.x;
            const dy = cy - shard.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pullForce = 1500 * dt;
            shard.vx += (dx / dist) * pullForce;
            shard.vy += (dy / dist) * pullForce;
            shard.vx *= 0.91;
            shard.vy *= 0.91;
            shard.alpha = Math.min(1, shard.alpha + dt * 0.7);

            // Shards dissolve as they snap into the center
            if (dist < 35) {
              shard.alpha -= dt * 4;
            }
          } else {
            // Normal blast physics: shards fly outward across the screen
            shard.vx *= 0.985;
            shard.vy *= 0.985;
            shard.vy += dt * 45; // subtle gravity
            shard.alpha -= shard.decay * (dt * 60);
          }

          shard.x += shard.vx;
          shard.y += shard.vy;
          shard.rot += shard.vRot;
          shard.flipPhase += dt * shard.flipSpeed;

          if (shard.alpha > 0.01) {
            activeShards.push(shard);

            ctx.save();
            ctx.translate(shard.x, shard.y);
            ctx.rotate(shard.rot);

            // 3D tumble flip scale (realistic glass shard spinning in air)
            const scaleX = Math.cos(shard.flipPhase);
            ctx.scale(Math.abs(scaleX) < 0.1 ? 0.1 : scaleX, 1);

            ctx.globalAlpha = Math.max(0, Math.min(1, shard.alpha));

            // Glass polygon
            ctx.beginPath();
            ctx.moveTo(shard.points[0].x, shard.points[0].y);
            for (let i = 1; i < shard.points.length; i++) {
              ctx.lineTo(shard.points[i].x, shard.points[i].y);
            }
            ctx.closePath();

            ctx.fillStyle = shard.color;
            ctx.fill();

            // Crisp specular bevel along shard edge (catches light as it flips!)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.0;
            ctx.stroke();

            ctx.restore();
          }
        }

        shardsRef.current = activeShards;
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
