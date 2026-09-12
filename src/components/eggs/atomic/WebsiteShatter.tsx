import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface ShardDef {
  id: number;
  polygon: string;
  svgPoints: string;
  centroid: [number, number]; // [x, y] in 0..100%
  blast: {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  };
}

// 18 Contiguous shards that tessellate the 100% x 100% viewport radiating from the epicenter (50%, 50%)
const SHARDS: ShardDef[] = [
  // Top-Left Sector
  {
    id: 0,
    polygon: 'polygon(0% 0%, 25% 0%, 35% 30%, 0% 33%)',
    svgPoints: '0,0 25,0 35,30 0,33',
    centroid: [15, 15],
    blast: { x: -640, y: -460, z: -250, rotX: 45, rotY: -55, rotZ: -35 },
  },
  {
    id: 1,
    polygon: 'polygon(25% 0%, 50% 0%, 50% 25%, 35% 30%)',
    svgPoints: '25,0 50,0 50,25 35,30',
    centroid: [38, 12],
    blast: { x: -240, y: -580, z: 280, rotX: 60, rotY: -25, rotZ: -20 },
  },
  {
    id: 2,
    polygon: 'polygon(35% 30%, 50% 25%, 50% 50%, 30% 50%)',
    svgPoints: '35,30 50,25 50,50 30,50',
    centroid: [41, 39],
    blast: { x: -260, y: -340, z: 460, rotX: 50, rotY: -40, rotZ: -28 },
  },
  {
    id: 3,
    polygon: 'polygon(0% 33%, 35% 30%, 30% 50%, 0% 50%)',
    svgPoints: '0,33 35,30 30,50 0,50',
    centroid: [18, 40],
    blast: { x: -660, y: -140, z: -320, rotX: 20, rotY: -65, rotZ: -22 },
  },

  // Top-Right Sector
  {
    id: 4,
    polygon: 'polygon(50% 0%, 75% 0%, 65% 30%, 50% 25%)',
    svgPoints: '50,0 75,0 65,30 50,25',
    centroid: [62, 12],
    blast: { x: 240, y: -580, z: 290, rotX: 60, rotY: 25, rotZ: 20 },
  },
  {
    id: 5,
    polygon: 'polygon(75% 0%, 100% 0%, 100% 33%, 65% 30%)',
    svgPoints: '75,0 100,0 100,33 65,30',
    centroid: [85, 15],
    blast: { x: 650, y: -460, z: -220, rotX: 45, rotY: 55, rotZ: 35 },
  },
  {
    id: 6,
    polygon: 'polygon(50% 25%, 65% 30%, 70% 50%, 50% 50%)',
    svgPoints: '50,25 65,30 70,50 50,50',
    centroid: [59, 39],
    blast: { x: 260, y: -340, z: 480, rotX: 50, rotY: 40, rotZ: 28 },
  },
  {
    id: 7,
    polygon: 'polygon(65% 30%, 100% 33%, 100% 50%, 70% 50%)',
    svgPoints: '65,30 100,33 100,50 70,50',
    centroid: [82, 40],
    blast: { x: 670, y: -140, z: -340, rotX: 20, rotY: 65, rotZ: 22 },
  },

  // Bottom-Left Sector
  {
    id: 8,
    polygon: 'polygon(0% 50%, 30% 50%, 35% 70%, 0% 66%)',
    svgPoints: '0,50 30,50 35,70 0,66',
    centroid: [18, 60],
    blast: { x: -650, y: 240, z: -260, rotX: -20, rotY: -60, rotZ: 22 },
  },
  {
    id: 9,
    polygon: 'polygon(30% 50%, 50% 50%, 35% 70%)',
    svgPoints: '30,50 50,50 35,70',
    centroid: [38, 55],
    blast: { x: -260, y: 320, z: 450, rotX: -50, rotY: -40, rotZ: 28 },
  },
  {
    id: 10,
    polygon: 'polygon(0% 66%, 35% 70%, 25% 100%, 0% 100%)',
    svgPoints: '0,66 35,70 25,100 0,100',
    centroid: [15, 85],
    blast: { x: -620, y: 530, z: -380, rotX: -45, rotY: -50, rotZ: 35 },
  },
  {
    id: 11,
    polygon: 'polygon(35% 70%, 50% 50%, 50% 75%)',
    svgPoints: '35,70 50,50 50,75',
    centroid: [45, 65],
    blast: { x: -140, y: 420, z: 460, rotX: -55, rotY: -20, rotZ: 18 },
  },
  {
    id: 12,
    polygon: 'polygon(35% 70%, 50% 75%, 50% 100%, 25% 100%)',
    svgPoints: '35,70 50,75 50,100 25,100',
    centroid: [40, 88],
    blast: { x: -250, y: 610, z: -150, rotX: -60, rotY: -25, rotZ: 22 },
  },

  // Bottom-Right Sector
  {
    id: 13,
    polygon: 'polygon(70% 50%, 100% 50%, 100% 66%, 65% 70%)',
    svgPoints: '70,50 100,50 100,66 65,70',
    centroid: [82, 60],
    blast: { x: 670, y: 240, z: -270, rotX: -20, rotY: 60, rotZ: -22 },
  },
  {
    id: 14,
    polygon: 'polygon(50% 50%, 70% 50%, 65% 70%)',
    svgPoints: '50,50 70,50 65,70',
    centroid: [62, 55],
    blast: { x: 260, y: 320, z: 470, rotX: -50, rotY: 40, rotZ: -28 },
  },
  {
    id: 15,
    polygon: 'polygon(50% 50%, 65% 70%, 50% 75%)',
    svgPoints: '50,50 65,70 50,75',
    centroid: [55, 65],
    blast: { x: 140, y: 420, z: 480, rotX: -55, rotY: 20, rotZ: -18 },
  },
  {
    id: 16,
    polygon: 'polygon(65% 70%, 100% 66%, 100% 100%, 75% 100%)',
    svgPoints: '65,70 100,66 100,100 75,100',
    centroid: [85, 85],
    blast: { x: 630, y: 530, z: -350, rotX: -45, rotY: 50, rotZ: -35 },
  },
  {
    id: 17,
    polygon: 'polygon(50% 75%, 65% 70%, 75% 100%, 50% 100%)',
    svgPoints: '50,75 65,70 75,100 50,100',
    centroid: [60, 88],
    blast: { x: 250, y: 610, z: -180, rotX: -60, rotY: 25, rotZ: -22 },
  },
];

interface WebsiteShatterProps {
  active: boolean;
  phase: 'idle' | 'detonate' | 'ruins' | 'restore';
  onRestored: () => void;
}

export default function WebsiteShatter({ active, phase, onRestored }: WebsiteShatterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shardNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const onRestoredRef = useRef(onRestored);
  onRestoredRef.current = onRestored;

  const [snapshotHtml, setSnapshotHtml] = useState<string | null>(null);
  const [capturedScrollY, setCapturedScrollY] = useState(0);
  const [capturedWidth, setCapturedWidth] = useState(0);

  // Safety unmount guarantee: website root must NEVER stay hidden if component unmounts
  useEffect(() => {
    return () => {
      const root = document.getElementById('site-root');
      if (root) root.style.opacity = '1';
    };
  }, []);

  // When detonation is triggered, snapshot the live website including canvas elements
  useEffect(() => {
    if (!active) {
      setSnapshotHtml(null);
      const root = document.getElementById('site-root');
      if (root) root.style.opacity = '1';
      return;
    }

    const root = document.getElementById('site-root');
    if (!root) return;

    const scrollY = window.scrollY;
    setCapturedScrollY(scrollY);
    setCapturedWidth(root.offsetWidth || window.innerWidth);

    // Deep clone root DOM
    const clone = root.cloneNode(true) as HTMLElement;

    // Strip duplicate IDs to prevent DOM collision
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

    // Convert canvases in the clone to <img> elements with exact raster data (e.g. Straw Hat)
    const srcCanvases = root.querySelectorAll('canvas');
    const destCanvases = clone.querySelectorAll('canvas');
    srcCanvases.forEach((src, idx) => {
      const dest = destCanvases[idx];
      if (dest) {
        try {
          const img = document.createElement('img');
          img.src = src.toDataURL('image/png');
          img.className = dest.className;
          img.style.cssText = dest.style.cssText;
          img.width = src.width;
          img.height = src.height;
          dest.parentNode?.replaceChild(img, dest);
        } catch {
          // fallback if tainted
        }
      }
    });

    setSnapshotHtml(clone.innerHTML);

    // Hide original root while shattered website pieces are flying in 3D
    root.style.opacity = '0';
  }, [active]);

  // Manage GSAP 3D explosion, space drift, and magical rewind snapping back into place
  useEffect(() => {
    if (!active || !snapshotHtml) return;

    const shards = shardNodesRef.current.filter((n): n is HTMLDivElement => n !== null);
    if (shards.length === 0) return;

    let animTimeline: gsap.core.Timeline | null = null;
    const scaleX = Math.max(0.35, Math.min(1.8, window.innerWidth / 1920));
    const scaleY = Math.max(0.35, Math.min(1.8, window.innerHeight / 1080));

    if (phase === 'detonate') {
      // BLAST APART IN 3D! Shards of the actual website fly away across the screen!
      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        gsap.fromTo(
          shard,
          {
            x: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
          },
          {
            x: def.blast.x * scaleX,
            y: def.blast.y * scaleY,
            z: def.blast.z,
            rotateX: def.blast.rotX,
            rotateY: def.blast.rotY,
            rotateZ: def.blast.rotZ,
            scale: 0.92,
            duration: 0.85,
            ease: 'power3.out',
            force3D: true,
          },
        );
      });
    } else if (phase === 'ruins') {
      // Floating in 3D void with zero-g cosmic drift
      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        gsap.to(shard, {
          x: def.blast.x * scaleX + (Math.random() - 0.5) * 20,
          y: def.blast.y * scaleY + (Math.random() - 0.5) * 20,
          rotateZ: def.blast.rotZ + (Math.random() - 0.5) * 4,
          duration: 1.2,
          ease: 'sine.inOut',
          force3D: true,
        });
      });
    } else if (phase === 'restore') {
      // ─────────────────────────────────────────────────────────────
      // SMOOTH C1 REVERSE VORTEX REWIND & KINTSUGI SEAM FUSION
      // ─────────────────────────────────────────────────────────────
      animTimeline = gsap.timeline({
        onComplete: () => {
          const root = document.getElementById('site-root');
          if (root) root.style.opacity = '1';
          onRestoredRef.current();
        },
      });

      const maxDist = Math.hypot(50, 50);

      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        const distFromCenter = Math.hypot(def.centroid[0] - 50, def.centroid[1] - 50);
        // Non-linear golden-ratio stagger
        const staggerDelay = Math.pow(distFromCenter / maxDist, 1.25) * 0.28;

        const curX = (gsap.getProperty(shard, 'x') as number) || def.blast.x * scaleX;
        const curY = (gsap.getProperty(shard, 'y') as number) || def.blast.y * scaleY;
        const curZ = (gsap.getProperty(shard, 'z') as number) || def.blast.z;
        const curRotX = (gsap.getProperty(shard, 'rotateX') as number) || def.blast.rotX;
        const curRotY = (gsap.getProperty(shard, 'rotateY') as number) || def.blast.rotY;
        const curRotZ = (gsap.getProperty(shard, 'rotateZ') as number) || def.blast.rotZ;

        // Calculate Smooth Tangential Vortex Waypoint (Rb * 0.15 prevents velocity spike)
        const Rb = Math.hypot(curX, curY) || 1;
        const tx = -curY / Rb;
        const ty = curX / Rb;
        const swirlAmp = Rb * 0.15;

        const midX = curX * 0.48 + tx * swirlAmp;
        const midY = curY * 0.48 + ty * swirlAmp;
        const midZ = curZ * 0.35;
        const midRotZ = curRotZ * 0.35 + 16; // Uniform clockwise cosmic swirl

        const svgGlow = shard.querySelector('.shard-seam-glow');
        const svgSpecular = shard.querySelector('.shard-seam-specular');
        const glassSheen = shard.querySelector('.shard-glass-sheen');

        const shardTl = gsap.timeline();

        // Stage 1: Vortex Inception & Helical Swirl (0.0s -> 0.90s)
        shardTl.to(shard, {
          x: midX,
          y: midY,
          z: midZ,
          rotateX: curRotX * 0.35,
          rotateY: curRotY * 0.35,
          rotateZ: midRotZ,
          scale: 0.96,
          duration: 0.90,
          ease: 'sine.inOut',
          force3D: true,
        });

        // Stage 2: Smooth Magnetic Deceleration into exact landing (0.90s -> 2.10s)
        shardTl.to(shard, {
          x: 0,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1.0,
          duration: 1.20,
          ease: 'power3.out',
          force3D: true,
        });

        // Synchronized SVG Seam Weld Flare starting EXACTLY on contact (2.08s)
        if (svgGlow && svgSpecular) {
          // White weld flash
          shardTl.to(
            [svgGlow, svgSpecular],
            {
              stroke: '#ffffff',
              strokeWidth: 2.2,
              duration: 0.10,
              ease: 'power4.in',
            },
            2.08,
          );
          // Molten gold fusion
          shardTl.to(
            svgGlow,
            {
              stroke: 'rgba(251, 191, 36, 0.95)',
              strokeWidth: 1.4,
              duration: 0.20,
              ease: 'power2.out',
            },
            2.18,
          );
          shardTl.to(
            svgSpecular,
            {
              stroke: 'rgba(254, 240, 138, 0.9)',
              strokeWidth: 0.8,
              duration: 0.20,
              ease: 'power2.out',
            },
            2.18,
          );
          // Graceful dissolve of seams and sheen into restored site
          shardTl.to(
            [svgGlow, svgSpecular],
            {
              opacity: 0,
              duration: 0.35,
              ease: 'power1.out',
            },
            2.38,
          );
        }

        if (glassSheen) {
          shardTl.to(
            glassSheen,
            {
              opacity: 0,
              duration: 0.35,
              ease: 'power1.out',
            },
            2.38,
          );
        }

        animTimeline!.add(shardTl, staggerDelay);
      });
    }

    return () => {
      animTimeline?.kill();
      gsap.killTweensOf(shards);
    };
  }, [phase, active, snapshotHtml]);

  if (!active || !snapshotHtml) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58]"
      style={{
        perspective: 1100,
        transformStyle: 'preserve-3d',
        isolation: 'isolate',
      }}
    >
      {/* Strip expensive backdrop-filters and shadows from cloned DOM for buttery 60fps */}
      <style>{`
        .shatter-clone, .shatter-clone * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
          animation: none !important;
          transition: none !important;
        }
      `}</style>

      {SHARDS.map((shard, idx) => (
        <div
          key={shard.id}
          ref={(el) => {
            shardNodesRef.current[idx] = el;
          }}
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: shard.polygon,
            transformStyle: 'preserve-3d',
            transformOrigin: `${shard.centroid[0]}% ${shard.centroid[1]}% 0px`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Cloned view of the website positioned to match the exact scroll & width */}
          <div
            className="shatter-clone relative min-h-screen bg-ink-950 text-cream"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${capturedWidth || window.innerWidth}px`,
              transform: `translateY(-${capturedScrollY}px)`,
              pointerEvents: 'none',
              contain: 'strict',
            }}
            dangerouslySetInnerHTML={{ __html: snapshotHtml }}
          />

          {/* Realistic tinted glass refraction sheen */}
          <div
            className="shard-glass-sheen absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(192, 132, 252, 0.12) 50%, rgba(147, 51, 234, 0.18) 100%)',
            }}
          />

          {/* SVG Glass Bevel Edge that glows violet and catches specular light */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Neon violet glass seam glow */}
            <polygon
              className="shard-seam-glow"
              points={shard.svgPoints}
              fill="none"
              stroke="rgba(216, 180, 254, 0.85)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
            {/* Crisp specular white light edge reflection */}
            <polygon
              className="shard-seam-specular"
              points={shard.svgPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="0.75"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
