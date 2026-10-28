import { useEffect, useRef, useState } from 'react';
import { ANCHORED_REPORTS, REGISTRY_CONTRACT } from '../../utils/siteConstants';

/**
 * OrbitHero: the landing hero's live thing, from the subject itself.
 *
 * The anchored registry is the core. Its three anchored reports orbit it
 * as real links: dragging rotates the orbit, clicking a node opens that
 * anchor's /verify proof. Nothing here is decoration: every node is one
 * entry of ANCHORED_REPORTS, the single source /judges renders too.
 *
 * Motion rules, kept deliberately small: one slow orbit, a pulse that
 * travels the ring, a few degrees of mouse tilt. All of it moves with
 * transform and opacity only. With reduced motion the orbit is a still
 * frame and the links still work. Drag is an enhancement: keyboard users
 * reach the same links by tabbing, and the links are plain anchors, so
 * they do not depend on event handlers to navigate.
 */

const RING_RX = 46; // percent of stage width
const RING_RY = RING_RX * 0.42; // the ellipse squash that reads as depth
const ORBIT_SPEED = 0.05; // radians per second, slow on purpose
const MAX_TILT = 4; // degrees, a few, never the main event

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function OrbitHero() {
  const [reduced] = useState(prefersReducedMotion);
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null);
  const angleRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (reduced) return undefined;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!draggingRef.current) {
        angleRef.current += dt * ORBIT_SPEED;
        setAngle(angleRef.current);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    draggingRef.current = true;
    setDragging(true);
    dragRef.current = { startX: event.clientX, startAngle: angleRef.current };
    stageRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) {
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({
        rx: Math.max(-MAX_TILT, Math.min(MAX_TILT, -relY * 2 * MAX_TILT)),
        ry: Math.max(-MAX_TILT, Math.min(MAX_TILT, relX * 2 * MAX_TILT)),
      });
    }
    if (dragRef.current) {
      const next = dragRef.current.startAngle + (event.clientX - dragRef.current.startX) * 0.005;
      angleRef.current = next;
      setAngle(next);
    }
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDragging(false);
    dragRef.current = null;
  };

  const nodeAngle = (index: number) => {
    if (reduced) return [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6][index] ?? 0;
    return angle + index * ((2 * Math.PI) / ANCHORED_REPORTS.length);
  };

  const pointOnRing = (a: number) => {
    const x = 50 + RING_RX * Math.cos(a);
    const y = 50 + RING_RY * Math.sin(a);
    const depth = (Math.sin(a) + 1) / 2; // 0 at the back, 1 at the front
    return { x, y, depth };
  };

  const pulse = reduced ? null : pointOnRing(angle + 2.1);

  return (
    <div
      ref={stageRef}
      role="group"
      aria-label="Three anchored reports orbiting the registry"
      data-testid="orbit-stage"
      className="relative mx-auto aspect-square w-full max-w-[560px] select-none"
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
      >
        <ellipse cx="50" cy="50" rx={RING_RX} ry={RING_RY} fill="none" stroke="var(--color-line)" strokeWidth="0.5" />
      </svg>

      {pulse && (
        <span
          aria-hidden="true"
          className="absolute h-2 w-2 rounded-full bg-[#7DB4FF]"
          style={{
            left: `${pulse.x}%`,
            top: `${pulse.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: 0.55 + 0.45 * pulse.depth,
          }}
        />
      )}

      <div className="absolute left-1/2 top-1/2 w-[190px] -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-base font-medium text-white">Registry</p>
        <p className="mt-1 font-data text-xs text-slate-400">{truncateAddress(REGISTRY_CONTRACT)}</p>
        <p className="mt-1 text-xs text-slate-500">{ANCHORED_REPORTS.length} anchors</p>
      </div>

      {ANCHORED_REPORTS.map((anchor, index) => {
        const p = pointOnRing(nodeAngle(index));
        return (
          <a
            key={anchor.hash}
            href={`/verify?hash=${anchor.hash}&contract=${REGISTRY_CONTRACT}&tx=${anchor.tx}`}
            aria-label={`Verify ${anchor.label} anchor, block ${anchor.block}`}
            className="absolute w-[120px] text-center focus-visible:outline-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%) scale(${0.85 + 0.3 * p.depth})`,
              opacity: 0.55 + 0.45 * p.depth,
              zIndex: p.depth > 0.5 ? 2 : 1,
            }}
          >
            <span className="mx-auto block h-11 w-11 rounded-full border border-line bg-panel-raised" aria-hidden="true">
              <span className="mx-auto mt-[15px] block h-2.5 w-2.5 rounded-full bg-[#7DB4FF]" aria-hidden="true" />
            </span>
            <span className="mt-2 block text-sm text-white">{anchor.label}</span>
            <span className="mt-0.5 block font-data text-xs text-slate-400">Block {anchor.block}</span>
          </a>
        );
      })}
    </div>
  );
}
