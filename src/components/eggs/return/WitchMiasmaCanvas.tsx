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

interface ShadowHandDef {
  startX: (w: number) => number;
  startY: (h: number) => number;
  targetX: (w: number) => number;
  targetY: (h: number) => number;
  palmAngle: number;
  reachMultiplier: number;
  speed: number;
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

  useEffect(() => {
    phaseStartTimeRef.current = performance.now();
  }, [phase]);

  // Floating miasma particles
  useEffect(() => {
    if (reduced || phase === 'idle') {
      particlesRef.current = [];
      return;
    }

    const count = 45;
    const colors = [
      'rgba(192, 38, 211, 0.75)',
      'rgba(168, 85, 247, 0.65)',
      'rgba(216, 180, 254, 0.8)',
      'rgba(244, 114, 182, 0.6)',
    ];

    const particles: MiasmaParticle[] = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 40,
        vy: -25 - Math.random() * 55,
        size: 3 + Math.random() * 7,
        alpha: 0.25 + Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 1.8 + Math.random() * 3,
      });
    }

    particlesRef.current = particles;
  }, [phase, reduced]);

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

    // 6 Massive Demonic Unseen Hands crawling deep onto the screen over website cards
    const hands: ShadowHandDef[] = [
      // Top-Left hand reaching down toward hero/cards
      {
        startX: () => -40,
        startY: (h) => h * 0.15,
        targetX: (w) => w * 0.38,
        targetY: (h) => h * 0.38,
        palmAngle: Math.PI / 4,
        reachMultiplier: 1.0,
        speed: 1.2,
      },
      // Mid-Left hand crawling across center
      {
        startX: () => -40,
        startY: (h) => h * 0.58,
        targetX: (w) => w * 0.42,
        targetY: (h) => h * 0.52,
        palmAngle: 0.1,
        reachMultiplier: 1.05,
        speed: 1.4,
      },
      // Bottom-Left hand reaching up
      {
        startX: (w) => w * 0.15,
        startY: (h) => h + 40,
        targetX: (w) => w * 0.35,
        targetY: (h) => h * 0.65,
        palmAngle: -Math.PI / 3,
        reachMultiplier: 0.95,
        speed: 1.3,
      },
      // Top-Right hand reaching down-left
      {
        startX: (w) => w + 40,
        startY: (h) => h * 0.18,
        targetX: (w) => w * 0.62,
        targetY: (h) => h * 0.38,
        palmAngle: (3 * Math.PI) / 4,
        reachMultiplier: 1.0,
        speed: 1.15,
      },
      // Mid-Right hand crawling across center
      {
        startX: (w) => w + 40,
        startY: (h) => h * 0.55,
        targetX: (w) => w * 0.58,
        targetY: (h) => h * 0.52,
        palmAngle: Math.PI - 0.1,
        reachMultiplier: 1.05,
        speed: 1.35,
      },
      // Bottom-Right hand reaching up
      {
        startX: (w) => w * 0.85,
        startY: (h) => h + 40,
        targetX: (w) => w * 0.65,
        targetY: (h) => h * 0.65,
        palmAngle: (-2 * Math.PI) / 3,
        reachMultiplier: 0.95,
        speed: 1.25,
      },
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
        const progress = Math.min(1, timeInPhase / 1.05);

        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        const startX = 0;
        const endX = w * progress;

        for (let x = startX; x <= endX; x += 3) {
          let dy = 0;
          const distToCenter = Math.abs(x - cx);

          if (distToCenter < 140) {
            const pulseT = (x - (cx - 140)) / 280;
            if (timeInPhase < 0.6) {
              dy = Math.sin(pulseT * Math.PI * 4) * 55 * Math.exp(-pulseT * 1.8);
            } else {
              dy = (Math.random() - 0.5) * 5;
            }
          }
          if (x === startX) ctx.moveTo(x, lineY + dy);
          else ctx.lineTo(x, lineY + dy);
        }
        ctx.stroke();

        // Pulsing crimson cardiac core
        const pulseR = 38 + Math.sin(timeInPhase * 14) * 14;
        const heartGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        heartGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
        heartGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.45)');
        heartGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = heartGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 2. SATELLA'S GIANT UNSEEN HANDS (Demonic Shadow Arms & Claws)
      //    (Active during 'miasma' and 'rewind')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'miasma' || phase === 'rewind') {
        const growth =
          phase === 'rewind'
            ? Math.max(0, 1 - timeInPhase / 1.5) // retracts into vortex
            : Math.min(1, timeInPhase / 1.6); // aggressively crawls onto screen

        ctx.save();

        hands.forEach((hand, hIdx) => {
          const sx = hand.startX(w);
          const sy = hand.startY(h);
          const tx = hand.targetX(w);
          const ty = hand.targetY(h);

          // Arm path interpolation
          const currentX = sx + (tx - sx) * growth;
          const currentY = sy + (ty - sy) * growth;

          // Undulating breathing wave
          const wave = Math.sin(totalTime * hand.speed * 2.5 + hIdx * 1.4) * 26 * growth;
          const midX = (sx + currentX) / 2 + Math.cos(hand.palmAngle + Math.PI / 2) * wave;
          const midY = (sy + currentY) / 2 + Math.sin(hand.palmAngle + Math.PI / 2) * wave;

          // 1. Draw glowing violet shadow arm aura
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(midX, midY, currentX, currentY);

          ctx.strokeStyle = 'rgba(216, 180, 254, 0.85)';
          ctx.lineWidth = 32 * growth;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 28;
          ctx.stroke();

          // 2. Deep purple-black shadow core
          ctx.strokeStyle = 'rgba(25, 5, 45, 0.95)';
          ctx.lineWidth = 22 * growth;
          ctx.shadowBlur = 0;
          ctx.stroke();

          // 3. Violet spine streak
          ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
          ctx.lineWidth = 4 * growth;
          ctx.stroke();

          // 4. Palm & 5 Demonic Claws / Fingers
          const palmAngle = Math.atan2(currentY - midY, currentX - midX);
          const palmRadius = 22 * growth;

          // Palm shadow mass
          ctx.fillStyle = 'rgba(25, 5, 45, 0.95)';
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(currentX, currentY, palmRadius, 0, Math.PI * 2);
          ctx.fill();

          // 5 Articulated curved shadow claws
          const numFingers = 5;
          for (let f = 0; f < numFingers; f++) {
            const spread = (f - 2) * 0.32; // fan out from center finger
            // Living claw flexing motion
            const flexWave = Math.sin(totalTime * 4 + f * 1.2 + hIdx) * 0.22;
            const fAngle = palmAngle + spread + flexWave;

            // Finger joints: Knuckle 1 -> Knuckle 2 -> Claw tip
            const joint1Len = (28 + (f === 2 ? 8 : 0)) * growth;
            const joint2Len = (22 + (f === 2 ? 6 : 0)) * growth;

            const j1x = currentX + Math.cos(fAngle) * joint1Len;
            const j1y = currentY + Math.sin(fAngle) * joint1Len;

            // Inward curl toward target
            const curlAngle = fAngle + (f < 2 ? 0.35 : -0.35) * 0.45;
            const tipX = j1x + Math.cos(curlAngle) * joint2Len;
            const tipY = j1y + Math.sin(curlAngle) * joint2Len;

            // Draw glowing finger aura
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(j1x, j1y);
            ctx.lineTo(tipX, tipY);
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.9)';
            ctx.lineWidth = 7 * growth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = '#d946ef';
            ctx.shadowBlur = 16;
            ctx.stroke();

            // Dark finger bone core
            ctx.strokeStyle = 'rgba(25, 5, 45, 0.98)';
            ctx.lineWidth = 4 * growth;
            ctx.shadowBlur = 0;
            ctx.stroke();

            // Sharp pointed claw tip
            ctx.fillStyle = '#f5d0fe';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 2.5 * growth, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 3. THE WITCH'S EYE (Organic Opening, Anime Eyelash, & Realistic Blinking)
      //    (Active during 'miasma' phase)
      // ─────────────────────────────────────────────────────────────
      if (phase === 'miasma') {
        let eyeOpenness = 0;
        let eyeAlpha = 0;

        if (timeInPhase < 0.25) {
          eyeOpenness = 0;
          eyeAlpha = timeInPhase / 0.25;
        } else if (timeInPhase < 1.1) {
          // Smooth organic opening to wide gaze
          const t = (timeInPhase - 0.25) / 0.85;
          eyeOpenness = Math.sin(t * (Math.PI / 2)) * 0.88;
          eyeAlpha = 1;
        } else if (timeInPhase < 1.45) {
          // FIRST BLINK: Rapid biological blink shut (takes 70ms) and open (180ms)
          const blinkT = (timeInPhase - 1.1) / 0.35;
          if (blinkT < 0.28) {
            eyeOpenness = 0.88 * (1 - blinkT / 0.28); // rapid snap shut
          } else {
            eyeOpenness = 0.95 * ((blinkT - 0.28) / 0.72); // smooth open
          }
          eyeAlpha = 1;
        } else if (timeInPhase < 2.5) {
          // Wide piercing gaze with living eyelid micro-motion
          eyeOpenness = 0.92 + Math.sin(totalTime * 3.5) * 0.03;
          eyeAlpha = 1;
        } else if (timeInPhase < 2.85) {
          // SECOND BLINK: Quick rhythmic flutter blink
          const blinkT = (timeInPhase - 2.5) / 0.35;
          if (blinkT < 0.25) {
            eyeOpenness = 0.92 * (1 - blinkT / 0.25);
          } else {
            eyeOpenness = 0.96 * ((blinkT - 0.25) / 0.75);
          }
          eyeAlpha = 1;
        } else {
          // Dilating gaze before singularity
          eyeOpenness = 0.96;
          eyeAlpha = Math.max(0, 1 - (timeInPhase - 2.85) / 0.45);
        }

        if (eyeAlpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = eyeAlpha;

          const eyeW = Math.min(w * 0.26, 160);
          const eyeH = eyeW * 0.62;
          const eyeY = cy - 25;

          // 1. Radiant Violet Eye Aura behind eye
          const eyeAura = ctx.createRadialGradient(cx, eyeY, 15, cx, eyeY, eyeW * 1.6);
          eyeAura.addColorStop(0, 'rgba(216, 180, 254, 0.45)');
          eyeAura.addColorStop(0.4, 'rgba(168, 85, 247, 0.25)');
          eyeAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = eyeAura;
          ctx.beginPath();
          ctx.arc(cx, eyeY, eyeW * 1.6, 0, Math.PI * 2);
          ctx.fill();

          // 2. Clip inside Organic Eyelid Almond Contour
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx - eyeW, eyeY);
          // Upper eyelid anatomical arch
          ctx.quadraticCurveTo(cx, eyeY - eyeH * eyeOpenness, cx + eyeW, eyeY);
          // Lower eyelid gentle curve
          ctx.quadraticCurveTo(cx, eyeY + eyeH * eyeOpenness * 0.75, cx - eyeW, eyeY);
          ctx.closePath();
          ctx.clip();

          // Sclera (Deep cosmic midnight purple)
          ctx.fillStyle = '#0f051d';
          ctx.fillRect(cx - eyeW * 1.3, eyeY - eyeH * 1.3, eyeW * 2.6, eyeH * 2.6);

          // Crimson micro-capillaries in corner
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - eyeW * 0.92, eyeY);
          ctx.lineTo(cx - eyeW * 0.6, eyeY - 4);
          ctx.moveTo(cx + eyeW * 0.92, eyeY);
          ctx.lineTo(cx + eyeW * 0.6, eyeY + 3);
          ctx.stroke();

          // Iris (Glowing amethyst crystalline gemstone)
          const irisR = eyeH * 0.78;
          const irisGrad = ctx.createRadialGradient(cx, eyeY, 0, cx, eyeY, irisR);
          irisGrad.addColorStop(0, '#fdf4ff'); // glowing white-violet center
          irisGrad.addColorStop(0.25, '#e879f9'); // vibrant fuchsia
          irisGrad.addColorStop(0.65, '#9333ea'); // deep royal violet
          irisGrad.addColorStop(1, '#3b0764'); // dark rim

          ctx.fillStyle = irisGrad;
          ctx.beginPath();
          ctx.arc(cx, eyeY, irisR, 0, Math.PI * 2);
          ctx.fill();

          // Radiating mystic iris glyph lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 1.2;
          for (let ray = 0; ray < 14; ray++) {
            const ra = (ray / 14) * Math.PI * 2 + totalTime * 0.5;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ra) * (irisR * 0.3), eyeY + Math.sin(ra) * (irisR * 0.3));
            ctx.lineTo(cx + Math.cos(ra) * (irisR * 0.88), eyeY + Math.sin(ra) * (irisR * 0.88));
            ctx.stroke();
          }

          // Pupil (Void black with glowing star center)
          const pupilR = irisR * (0.34 + Math.sin(totalTime * 3) * 0.04);
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(cx, eyeY, pupilR, 0, Math.PI * 2);
          ctx.fill();

          // Dual Glistening Specular Reflections
          ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
          ctx.beginPath();
          ctx.ellipse(cx - irisR * 0.34, eyeY - irisR * 0.32, irisR * 0.22, irisR * 0.15, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx + irisR * 0.32, eyeY + irisR * 0.24, irisR * 0.09, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore(); // end clip

          // 3. Thick Anime Upper Eyeliner & Mascara Lashes
          ctx.strokeStyle = '#1e0533';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(cx - eyeW * 1.04, eyeY);
          ctx.quadraticCurveTo(cx, eyeY - eyeH * eyeOpenness - 2, cx + eyeW * 1.04, eyeY);
          ctx.stroke();

          // Glowing lavender lash rim highlight
          ctx.strokeStyle = 'rgba(232, 121, 249, 0.95)';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.moveTo(cx - eyeW * 1.02, eyeY);
          ctx.quadraticCurveTo(cx, eyeY - eyeH * eyeOpenness, cx + eyeW * 1.02, eyeY);
          ctx.stroke();

          // Lower eyelid soft definition
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - eyeW * 0.95, eyeY);
          ctx.quadraticCurveTo(cx, eyeY + eyeH * eyeOpenness * 0.75, cx + eyeW * 0.95, eyeY);
          ctx.stroke();

          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4. REVERSE TEMPORAL CLOCK (Phase: 'rewind')
      // ─────────────────────────────────────────────────────────────
      if (phase === 'rewind') {
        const clockR = Math.min(w, h) * 0.34;
        const clockRot = -timeInPhase * 8.5; // fast counter-clockwise spin

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(clockRot);

        ctx.strokeStyle = 'rgba(216, 180, 254, 0.85)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, 0, clockR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, clockR * 0.82, 0, Math.PI * 2);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const romanNums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        ctx.font = `700 ${Math.max(14, Math.floor(clockR * 0.1))}px serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const rx = Math.cos(a) * (clockR * 0.91);
          const ry = Math.sin(a) * (clockR * 0.91);
          ctx.fillText(romanNums[i], rx, ry);
        }

        // Fast counter-clockwise clock hands
        ctx.rotate(-clockRot * 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -clockR * 0.65);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.rotate(clockRot * 5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -clockR * 0.8);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f0abfc';
        ctx.stroke();

        ctx.restore();

        // Singularity spirals
        ctx.save();
        ctx.translate(cx, cy);
        for (let sp = 0; sp < 6; sp++) {
          ctx.beginPath();
          const baseSpA = (sp / 6) * Math.PI * 2 + timeInPhase * 14;
          for (let r = 25; r < clockR * 1.8; r += 16) {
            const a = baseSpA + r * 0.045;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (r === 25) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(216, 180, 254, ${0.45 * (1 - sp / 6)})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. FLOATING MIASMA PARTICLES
      // ─────────────────────────────────────────────────────────────
      if (particlesRef.current.length > 0) {
        ctx.save();
        for (const p of particlesRef.current) {
          if (phase === 'rewind') {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            p.vx += (dx / dist) * 1400 * dt;
            p.vy += (dy / dist) * 1400 * dt;
            p.vx *= 0.91;
            p.vy *= 0.91;
          } else {
            p.wobble += p.wobbleSpeed * dt;
            p.x += (p.vx + Math.sin(p.wobble) * 22) * dt;
            p.y += p.vy * dt;
          }

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
