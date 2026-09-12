import { useEffect, useRef } from 'react';

export type ReturnPhase = 'idle' | 'death' | 'miasma' | 'rewind' | 'reawaken';

interface MiasmaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

interface ShadowTendril {
  startX: (w: number) => number;
  startY: (h: number) => number;
  reachDist: number; // 0..1
  angleOffset: number;
  curl: number;
  speed: number;
  numFingers: number;
}

interface WitchMiasmaCanvasProps {
  phase: ReturnPhase;
  reduced: boolean;
}

export default function WitchMiasmaCanvas({ phase, reduced }: WitchMiasmaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(performance.now());
  const particlesRef = useRef<MiasmaParticle[]>([]);

  // Track when phase changes for internal timeline animations
  useEffect(() => {
    phaseStartTimeRef.current = performance.now();
  }, [phase]);

  // Initialize floating miasma particles
  useEffect(() => {
    if (reduced || phase === 'idle') {
      particlesRef.current = [];
      return;
    }

    const count = 55;
    const colors = [
      'rgba(168, 85, 247, 0.75)', // vibrant purple
      'rgba(147, 51, 234, 0.65)', // deep violet
      'rgba(216, 180, 254, 0.85)', // light lilac
      'rgba(88, 28, 135, 0.8)',   // dark obsidian purple
      'rgba(244, 114, 182, 0.6)',  // crimson witch blush
    ];

    const particles: MiasmaParticle[] = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 45,
        vy: -20 - Math.random() * 60, // drifting upward
        size: 2.5 + Math.random() * 7.5,
        alpha: 0.2 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 1.5 + Math.random() * 3.5,
      });
    }

    particlesRef.current = particles;
  }, [phase, reduced]);

  // Main Canvas Render Loop
  useEffect(() => {
    if (phase === 'idle' || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const syncSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    syncSize();
    window.addEventListener('resize', syncSize);

    // 8 Unseen Hands (Shadow Tendrils) configurations creeping from screen perimeter
    const tendrils: ShadowTendril[] = [
      // Left side
      { startX: () => 0, startY: (h) => h * 0.25, reachDist: 0.42, angleOffset: 0, curl: 0.8, speed: 1.2, numFingers: 4 },
      { startX: () => 0, startY: (h) => h * 0.65, reachDist: 0.45, angleOffset: 0.2, curl: -0.9, speed: 1.4, numFingers: 5 },
      // Right side
      { startX: (w) => w, startY: (h) => h * 0.3, reachDist: 0.44, angleOffset: Math.PI, curl: -0.7, speed: 1.1, numFingers: 4 },
      { startX: (w) => w, startY: (h) => h * 0.7, reachDist: 0.46, angleOffset: Math.PI, curl: 0.85, speed: 1.3, numFingers: 5 },
      // Bottom
      { startX: (w) => w * 0.3, startY: (h) => h, reachDist: 0.45, angleOffset: -Math.PI / 2, curl: 0.6, speed: 1.5, numFingers: 4 },
      { startX: (w) => w * 0.7, startY: (h) => h, reachDist: 0.48, angleOffset: -Math.PI / 2, curl: -0.65, speed: 1.2, numFingers: 4 },
      // Top corners
      { startX: () => 0, startY: () => 0, reachDist: 0.38, angleOffset: Math.PI / 4, curl: 0.75, speed: 1.0, numFingers: 4 },
      { startX: (w) => w, startY: () => 0, reachDist: 0.40, angleOffset: (3 * Math.PI) / 4, curl: -0.75, speed: 1.05, numFingers: 4 },
    ];

    let lastTime = performance.now();

    const render = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const timeInPhase = (now - phaseStartTimeRef.current) / 1000;
      const totalTime = now / 1000;

      // ─────────────────────────────────────────────────────────────
      // 1. CARDIAC ARREST FLATLINE (Phase: 'death')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'death') {
        const lineY = cy;
        const progress = Math.min(1, timeInPhase / 1.1);

        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;

        ctx.beginPath();
        const startX = 0;
        const endX = w * progress;

        for (let x = startX; x <= endX; x += 3) {
          let dy = 0;
          const distToCenter = Math.abs(x - cx);

          if (distToCenter < 120) {
            // EKG heartbeat spike that collapses into flatline
            const pulseT = (x - (cx - 120)) / 240;
            if (timeInPhase < 0.6) {
              dy = Math.sin(pulseT * Math.PI * 4) * 45 * Math.exp(-pulseT * 2);
            } else {
              dy = (Math.random() - 0.5) * 4; // trembling death flatline
            }
          }
          if (x === startX) ctx.moveTo(x, lineY + dy);
          else ctx.lineTo(x, lineY + dy);
        }
        ctx.stroke();

        // Blood-red cardiac pulse circle in the chest center
        const pulseR = 30 + Math.sin(timeInPhase * 12) * 12;
        const heartGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        heartGrad.addColorStop(0, 'rgba(220, 38, 38, 0.8)');
        heartGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.4)');
        heartGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = heartGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 2. SATELLA'S UNSEEN HANDS (Shadow Tendrils with Grasping Claws)
      //    (Active during 'miasma' and 'rewind')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'miasma' || phase === 'rewind') {
        const growth =
          phase === 'rewind'
            ? Math.max(0, 1 - timeInPhase / 1.4) // Hands retract into the vortex during rewind
            : Math.min(1, timeInPhase / 1.8); // Hands slowly creep in during miasma

        ctx.save();

        tendrils.forEach((t, idx) => {
          const sx = t.startX(w);
          const sy = t.startY(h);
          const targetDist = Math.hypot(cx - sx, cy - sy) * t.reachDist * growth;
          const baseAngle = Math.atan2(cy - sy, cx - sx);

          // Living undulating wave motion
          const wave = Math.sin(totalTime * t.speed * 2 + idx * 1.3) * 0.28;
          const currentAngle = baseAngle + t.angleOffset * 0.15 + wave * t.curl;

          const segments = 4;
          const points: { x: number; y: number }[] = [{ x: sx, y: sy }];

          for (let s = 1; s <= segments; s++) {
            const frac = s / segments;
            const segDist = targetDist * frac;
            const segWave = Math.sin(totalTime * 3 + frac * 4 + idx) * 22 * frac;
            const px = sx + Math.cos(currentAngle) * segDist - Math.sin(currentAngle) * segWave;
            const py = sy + Math.sin(currentAngle) * segDist + Math.cos(currentAngle) * segWave;
            points.push({ x: px, y: py });
          }

          const tip = points[points.length - 1];

          // 1. Draw glowing violet shadow aura
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length - 1; i++) {
            const mx = (points[i].x + points[i + 1].x) / 2;
            const my = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
          }
          ctx.lineTo(tip.x, tip.y);

          ctx.strokeStyle = 'rgba(192, 38, 211, 0.65)';
          ctx.lineWidth = 14 + (1 - growth) * 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 24;
          ctx.stroke();

          // 2. Pitch-black solid shadow core
          ctx.strokeStyle = 'rgba(8, 2, 14, 0.95)';
          ctx.lineWidth = 9;
          ctx.shadowBlur = 0;
          ctx.stroke();

          // 3. Grasping shadow claws / fingers at the tip
          const tipAngle = Math.atan2(
            tip.y - points[points.length - 2].y,
            tip.x - points[points.length - 2].x,
          );

          for (let f = 0; f < t.numFingers; f++) {
            const fingerSpread = (f - (t.numFingers - 1) / 2) * 0.38;
            const fingerCurl = Math.sin(totalTime * 4 + f * 1.5) * 0.25;
            const fAngle = tipAngle + fingerSpread + fingerCurl;
            const fLen = (18 + (f % 2) * 8) * growth;

            const fx1 = tip.x + Math.cos(fAngle) * (fLen * 0.55);
            const fy1 = tip.y + Math.sin(fAngle) * (fLen * 0.55);
            const fx2 = fx1 + Math.cos(fAngle + 0.35) * (fLen * 0.55);
            const fy2 = fy1 + Math.sin(fAngle + 0.35) * (fLen * 0.55);

            ctx.beginPath();
            ctx.moveTo(tip.x, tip.y);
            ctx.quadraticCurveTo(fx1, fy1, fx2, fy2);
            ctx.strokeStyle = 'rgba(192, 38, 211, 0.8)';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#d946ef';
            ctx.shadowBlur = 10;
            ctx.stroke();

            ctx.strokeStyle = 'rgba(10, 3, 18, 0.95)';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        });

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 3. THE WITCH'S EYE (Opening, Gazing, and Blinking in the Void!)
      //    (Active during 'miasma' phase)
      // ─────────────────────────────────────────────────────────────
      if (phase === 'miasma') {
        // Calculate eyelid openness (0.0 = closed, 1.0 = wide open) with realistic blinking!
        let eyeOpenness = 0;
        let eyeAlpha = 0;

        if (timeInPhase < 0.35) {
          // Eye closed in darkness
          eyeOpenness = 0;
          eyeAlpha = timeInPhase / 0.35;
        } else if (timeInPhase < 1.3) {
          // Slowly opens eyelids gazing out
          const openT = (timeInPhase - 0.35) / 0.95;
          eyeOpenness = Math.sin(openT * (Math.PI / 2)) * 0.85;
          eyeAlpha = 1;
        } else if (timeInPhase < 1.7) {
          // FIRST BLINK: smoothly shuts and re-opens!
          const blinkT = (timeInPhase - 1.3) / 0.4;
          if (blinkT < 0.45) {
            // Eyelid closes shut
            eyeOpenness = 0.85 * (1 - blinkT / 0.45);
          } else {
            // Re-opens wide
            eyeOpenness = 0.95 * ((blinkT - 0.45) / 0.55);
          }
          eyeAlpha = 1;
        } else if (timeInPhase < 2.5) {
          // Wide open piercing gaze with subtle breathing lid twitch
          eyeOpenness = 0.92 + Math.sin(totalTime * 3) * 0.04;
          eyeAlpha = 1;
        } else if (timeInPhase < 2.9) {
          // SECOND BLINK (quick subtle flutter)
          const blinkT = (timeInPhase - 2.5) / 0.4;
          if (blinkT < 0.4) {
            eyeOpenness = 0.92 * (1 - (blinkT / 0.4) * 0.85); // quick partial close
          } else {
            eyeOpenness = 0.15 + 0.82 * ((blinkT - 0.4) / 0.6);
          }
          eyeAlpha = 1;
        } else {
          // Open, slowly dilating until time rewind sucks it into the singularity
          eyeOpenness = 0.95;
          eyeAlpha = Math.max(0, 1 - (timeInPhase - 2.9) / 0.45);
        }

        if (eyeAlpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = eyeAlpha;

          const eyeW = Math.min(w * 0.22, 130);
          const eyeH = eyeW * 0.58;
          const eyeY = cy - 20;

          // 1. Ethereal Violet Eye Aura
          const eyeGlow = ctx.createRadialGradient(cx, eyeY, 10, cx, eyeY, eyeW * 1.5);
          eyeGlow.addColorStop(0, 'rgba(192, 38, 211, 0.45)');
          eyeGlow.addColorStop(0.5, 'rgba(147, 51, 234, 0.2)');
          eyeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = eyeGlow;
          ctx.beginPath();
          ctx.arc(cx, eyeY, eyeW * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // 2. Clip inside the opening Eyelid Contour
          ctx.save();
          ctx.beginPath();
          // Upper eyelid curve
          ctx.moveTo(cx - eyeW, eyeY);
          ctx.quadraticCurveTo(cx, eyeY - eyeH * eyeOpenness, cx + eyeW, eyeY);
          // Lower eyelid curve
          ctx.quadraticCurveTo(cx, eyeY + eyeH * eyeOpenness * 0.85, cx - eyeW, eyeY);
          ctx.closePath();
          ctx.clip();

          // Sclera (Dark cosmic midnight purple)
          ctx.fillStyle = '#0f051d';
          ctx.fillRect(cx - eyeW * 1.2, eyeY - eyeH * 1.2, eyeW * 2.4, eyeH * 2.4);

          // Subtle crimson stress veins in sclera corners
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - eyeW * 0.9, eyeY);
          ctx.lineTo(cx - eyeW * 0.55, eyeY - 4);
          ctx.moveTo(cx + eyeW * 0.9, eyeY);
          ctx.lineTo(cx + eyeW * 0.55, eyeY + 3);
          ctx.stroke();

          // Iris (Amethyst & royal purple gemstone gradient)
          const irisR = eyeH * 0.72;
          const irisGrad = ctx.createRadialGradient(cx, eyeY, 0, cx, eyeY, irisR);
          irisGrad.addColorStop(0, '#f0abfc'); // glowing center
          irisGrad.addColorStop(0.3, '#c084fc'); // lavender
          irisGrad.addColorStop(0.7, '#9333ea'); // deep violet
          irisGrad.addColorStop(1, '#3b0764'); // dark rim

          ctx.fillStyle = irisGrad;
          ctx.beginPath();
          ctx.arc(cx, eyeY, irisR, 0, Math.PI * 2);
          ctx.fill();

          // Iris magical glyph rays
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1;
          for (let ray = 0; ray < 12; ray++) {
            const ra = (ray / 12) * Math.PI * 2 + totalTime * 0.6;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ra) * (irisR * 0.35), eyeY + Math.sin(ra) * (irisR * 0.35));
            ctx.lineTo(cx + Math.cos(ra) * (irisR * 0.9), eyeY + Math.sin(ra) * (irisR * 0.9));
            ctx.stroke();
          }

          // Pupil (Void black with glowing center)
          const pupilR = irisR * (0.32 + Math.sin(totalTime * 2.5) * 0.04);
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(cx, eyeY, pupilR, 0, Math.PI * 2);
          ctx.fill();

          // Specular Glass Highlights (reflection catching the light)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.ellipse(cx - irisR * 0.32, eyeY - irisR * 0.32, irisR * 0.22, irisR * 0.14, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx + irisR * 0.28, eyeY + irisR * 0.25, irisR * 0.08, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore(); // end clip

          // 3. Eyelid Eerie Shadow Contours & Glowing Mascara Rim
          ctx.strokeStyle = 'rgba(216, 180, 254, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(cx - eyeW, eyeY);
          ctx.quadraticCurveTo(cx, eyeY - eyeH * eyeOpenness, cx + eyeW, eyeY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx - eyeW, eyeY);
          ctx.quadraticCurveTo(cx, eyeY + eyeH * eyeOpenness * 0.85, cx + eyeW, eyeY);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4. REVERSE TEMPORAL CLOCK & SINGULARITY (Phase: 'rewind')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'rewind') {
        const clockR = Math.min(w, h) * 0.32;
        const clockRot = -timeInPhase * 7.5; // rapid counter-clockwise spin

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(clockRot);

        // Cosmic clock rim
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, clockR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, clockR * 0.82, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 12 Roman numeral hour tick marks
        const romanNums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        ctx.font = `600 ${Math.max(12, Math.floor(clockR * 0.09))}px serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const tx = Math.cos(a) * (clockR * 0.9);
          const ty = Math.sin(a) * (clockR * 0.9);
          ctx.fillText(romanNums[i], tx, ty);
        }

        // Whirring reverse clock hands
        ctx.rotate(-clockRot * 2.8);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -clockR * 0.65);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.rotate(clockRot * 5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -clockR * 0.78);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f0abfc';
        ctx.stroke();

        ctx.restore();

        // Gravitational vortex lines spiraling inward into the center
        ctx.save();
        ctx.translate(cx, cy);
        const spirals = 6;
        for (let sp = 0; sp < spirals; sp++) {
          ctx.beginPath();
          const baseSpA = (sp / spirals) * Math.PI * 2 + timeInPhase * 12;
          for (let r = 20; r < clockR * 1.6; r += 15) {
            const a = baseSpA + r * 0.04;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (r === 20) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(192, 38, 211, ${0.4 * (1 - sp / spirals)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. MIASMA SMOKE PARTICLES
      // ─────────────────────────────────────────────────────────────
      if (particlesRef.current.length > 0) {
        ctx.save();
        for (const p of particlesRef.current) {
          if (phase === 'rewind') {
            // Particles get pulled inward into the center black hole
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            p.vx += (dx / dist) * 1200 * dt;
            p.vy += (dy / dist) * 1200 * dt;
            p.vx *= 0.92;
            p.vy *= 0.92;
          } else {
            p.wobble += p.wobbleSpeed * dt;
            p.x += (p.vx + Math.sin(p.wobble) * 20) * dt;
            p.y += p.vy * dt;
          }

          // Wrap or reset
          if (p.y < -30) p.y = h + 20;
          if (p.x < -30) p.x = w + 20;
          if (p.x > w + 30) p.x = -20;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener('resize', syncSize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, reduced]);

  if (phase === 'idle' || reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[56]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
