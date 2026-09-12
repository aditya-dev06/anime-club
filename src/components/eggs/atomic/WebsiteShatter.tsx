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
    blast: { x: -640, y: -460, z: 320, rotX: 50, rotY: -60, rotZ: -35 },
  },
  {
    id: 1,
    polygon: 'polygon(25% 0%, 50% 0%, 50% 25%, 35% 30%)',
    svgPoints: '25,0 50,0 50,25 35,30',
    centroid: [38, 12],
    blast: { x: -240, y: -580, z: 420, rotX: 65, rotY: -30, rotZ: -20 },
  },
  {
    id: 2,
    polygon: 'polygon(35% 30%, 50% 25%, 50% 50%)',
    svgPoints: '35,30 50,25 50,50',
    centroid: [45, 35],
    blast: { x: -260, y: -340, z: 620, rotX: 55, rotY: -45, rotZ: -30 },
  },
  {
    id: 3,
    polygon: 'polygon(0% 33%, 35% 30%, 30% 50%, 0% 50%)',
    svgPoints: '0,33 35,30 30,50 0,50',
    centroid: [18, 40],
    blast: { x: -660, y: -140, z: 360, rotX: 25, rotY: -70, rotZ: -25 },
  },

  // Top-Right Sector
  {
    id: 4,
    polygon: 'polygon(50% 0%, 75% 0%, 65% 30%, 50% 25%)',
    svgPoints: '50,0 75,0 65,30 50,25',
    centroid: [62, 12],
    blast: { x: 240, y: -580, z: 410, rotX: 65, rotY: 30, rotZ: 20 },
  },
  {
    id: 5,
    polygon: 'polygon(75% 0%, 100% 0%, 100% 33%, 65% 30%)',
    svgPoints: '75,0 100,0 100,33 65,30',
    centroid: [85, 15],
    blast: { x: 650, y: -460, z: 340, rotX: 50, rotY: 60, rotZ: 35 },
  },
  {
    id: 6,
    polygon: 'polygon(50% 25%, 65% 30%, 50% 50%)',
    svgPoints: '50,25 65,30 50,50',
    centroid: [55, 35],
    blast: { x: 260, y: -340, z: 640, rotX: 55, rotY: 45, rotZ: 30 },
  },
  {
    id: 7,
    polygon: 'polygon(65% 30%, 100% 33%, 100% 50%, 70% 50%)',
    svgPoints: '65,30 100,33 100,50 70,50',
    centroid: [82, 40],
    blast: { x: 670, y: -140, z: 380, rotX: 25, rotY: 70, rotZ: 25 },
  },

  // Bottom-Left Sector
  {
    id: 8,
    polygon: 'polygon(0% 50%, 30% 50%, 35% 70%, 0% 66%)',
    svgPoints: '0,50 30,50 35,70 0,66',
    centroid: [18, 60],
    blast: { x: -650, y: 240, z: 360, rotX: -25, rotY: -65, rotZ: 25 },
  },
  {
    id: 9,
    polygon: 'polygon(30% 50%, 50% 50%, 35% 70%)',
    svgPoints: '30,50 50,50 35,70',
    centroid: [38, 55],
    blast: { x: -260, y: 320, z: 620, rotX: -55, rotY: -45, rotZ: 30 },
  },
  {
    id: 10,
    polygon: 'polygon(0% 66%, 35% 70%, 25% 100%, 0% 100%)',
    svgPoints: '0,66 35,70 25,100 0,100',
    centroid: [15, 85],
    blast: { x: -620, y: 530, z: 340, rotX: -50, rotY: -55, rotZ: 40 },
  },
  {
    id: 11,
    polygon: 'polygon(35% 70%, 50% 50%, 50% 75%)',
    svgPoints: '35,70 50,50 50,75',
    centroid: [45, 65],
    blast: { x: -140, y: 420, z: 650, rotX: -60, rotY: -25, rotZ: 20 },
  },
  {
    id: 12,
    polygon: 'polygon(35% 70%, 50% 75%, 50% 100%, 25% 100%)',
    svgPoints: '35,70 50,75 50,100 25,100',
    centroid: [40, 88],
    blast: { x: -250, y: 610, z: 420, rotX: -70, rotY: -30, rotZ: 25 },
  },

  // Bottom-Right Sector
  {
    id: 13,
    polygon: 'polygon(70% 50%, 100% 50%, 100% 66%, 65% 70%)',
    svgPoints: '70,50 100,50 100,66 65,70',
    centroid: [82, 60],
    blast: { x: 670, y: 240, z: 370, rotX: -25, rotY: 65, rotZ: -25 },
  },
  {
    id: 14,
    polygon: 'polygon(50% 50%, 70% 50%, 65% 70%)',
    svgPoints: '50,50 70,50 65,70',
    centroid: [62, 55],
    blast: { x: 260, y: 320, z: 640, rotX: -55, rotY: 45, rotZ: -30 },
  },
  {
    id: 15,
    polygon: 'polygon(50% 50%, 65% 70%, 50% 75%)',
    svgPoints: '50,50 65,70 50,75',
    centroid: [55, 65],
    blast: { x: 140, y: 420, z: 660, rotX: -60, rotY: 25, rotZ: -20 },
  },
  {
    id: 16,
    polygon: 'polygon(65% 70%, 100% 66%, 100% 100%, 75% 100%)',
    svgPoints: '65,70 100,66 100,100 75,100',
    centroid: [85, 85],
    blast: { x: 630, y: 530, z: 350, rotX: -50, rotY: 55, rotZ: -40 },
  },
  {
    id: 17,
    polygon: 'polygon(50% 75%, 65% 70%, 75% 100%, 50% 100%)',
    svgPoints: '50,75 65,70 75,100 50,100',
    centroid: [60, 88],
    blast: { x: 250, y: 610, z: 420, rotX: -70, rotY: 30, rotZ: -25 },
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

    // Convert all canvases in the clone to <img> elements with exact raster data (e.g. Straw Hat)
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
            filter: 'drop-shadow(0 0 0px transparent)',
          },
          {
            x: def.blast.x,
            y: def.blast.y,
            z: def.blast.z,
            rotateX: def.blast.rotX,
            rotateY: def.blast.rotY,
            rotateZ: def.blast.rotZ,
            scale: 0.92,
            filter: 'drop-shadow(0 0 20px rgba(192, 38, 211, 0.85))',
            duration: 0.85,
            ease: 'power3.out',
          },
        );
      });
    } else if (phase === 'ruins') {
      // Floating in 3D void with zero-g cosmic drift
      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        gsap.to(shard, {
          x: def.blast.x + (Math.random() - 0.5) * 25,
          y: def.blast.y + (Math.random() - 0.5) * 25,
          rotateZ: def.blast.rotZ + (Math.random() - 0.5) * 6,
          duration: 1.2,
          ease: 'sine.inOut',
        });
      });
    } else if (phase === 'restore') {
      // MAGICAL SINGULARITY REWIND: Pieces of the actual website fly back and snap into place!
      animTimeline = gsap.timeline({
        onComplete: () => {
          // Restore original root and unmount shard overlay
          const root = document.getElementById('site-root');
          if (root) root.style.opacity = '1';
          onRestored();
        },
      });

      shards.forEach((shard, idx) => {
        animTimeline!.to(
          shard,
          {
            x: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
            filter: 'drop-shadow(0 0 28px rgba(251, 191, 36, 0.95))',
            duration: 0.95,
            ease: 'back.out(1.4)',
          },
          (idx % 4) * 0.02,
        );
      });

      // Golden-violet seam seal flash
      animTimeline.to(
        shards,
        {
          filter: 'drop-shadow(0 0 0px transparent)',
          duration: 0.25,
        },
        '+=0.04',
      );
    }

    return () => {
      animTimeline?.kill();
      gsap.killTweensOf(shards);
    };
  }, [phase, active, snapshotHtml, onRestored]);

  if (!active || !snapshotHtml) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58] overflow-hidden"
      style={{
        perspective: 1100,
        transformStyle: 'preserve-3d',
      }}
    >
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
            willChange: 'transform, filter',
          }}
        >
          {/* Cloned view of the website positioned to match the exact scroll & width */}
          <div
            className="relative min-h-screen bg-ink-950 text-cream"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${capturedWidth || window.innerWidth}px`,
              transform: `translateY(-${capturedScrollY}px)`,
              pointerEvents: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: snapshotHtml }}
          />

          {/* SVG Glass Bevel Edge that glows violet and catches light as it tumbles */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Neon violet glass seam glow */}
            <polygon
              points={shard.svgPoints}
              fill="none"
              stroke="rgba(216, 180, 254, 0.85)"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            {/* Crisp specular white light edge reflection */}
            <polygon
              points={shard.svgPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="0.3"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
