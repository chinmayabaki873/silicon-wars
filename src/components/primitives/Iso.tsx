import React from 'react';

/**
 * A tiny isometric projection helper.
 * World space: x right, y depth, z up. Screen: 2:1 isometric.
 */
export const ISO = {
  project(x: number, y: number, z: number) {
    return {
      px: (x - y) * 0.866,
      py: (x + y) * 0.5 - z,
    };
  },
};

export function isoPath(points: [number, number, number][], close = true) {
  const d = points
    .map((p, i) => {
      const { px, py } = ISO.project(p[0], p[1], p[2]);
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
    })
    .join(' ');
  return close ? `${d} Z` : d;
}

/** Flat slab (floor, counter top, tile) drawn as an isometric parallelogram. */
export function IsoSlab({
  x,
  y,
  z = 0,
  w,
  d,
  fill,
  stroke,
  strokeWidth = 0.6,
  opacity = 1,
  className,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <path
      d={isoPath([
        [x, y, z],
        [x + w, y, z],
        [x + w, y + d, z],
        [x, y + d, z],
      ])}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      className={className}
    />
  );
}

/** Extruded box: draws two shaded side faces plus a lit top face. */
export function IsoBox({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  top,
  left,
  right,
  stroke,
  strokeWidth = 0.5,
  opacity = 1,
  className,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <g opacity={opacity} className={className}>
      {/* left face (facing -y viewer-left) */}
      <path
        d={isoPath([
          [x, y + d, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
        fill={left}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* right face (facing +x viewer-right) */}
      <path
        d={isoPath([
          [x + w, y, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x + w, y, z + h],
        ])}
        fill={right}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* top */}
      <path
        d={isoPath([
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
        fill={top}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

/** A cylinder-ish stack, used for pots, proofing crocks, and GPU stacks. */
export function IsoCylinder({
  x,
  y,
  z = 0,
  r,
  h,
  top,
  side,
  stroke,
  opacity = 1,
}: {
  x: number;
  y: number;
  z?: number;
  r: number;
  h: number;
  top: string;
  side: string;
  stroke?: string;
  opacity?: number;
}) {
  const c = ISO.project(x, y, z);
  const t = ISO.project(x, y, z + h);
  return (
    <g opacity={opacity}>
      <path
        d={`M${c.px - r},${c.py} L${t.px - r},${t.py} A${r},${r * 0.55} 0 0 0 ${t.px + r},${t.py} L${c.px + r},${c.py} A${r},${r * 0.55} 0 0 1 ${c.px - r},${c.py} Z`}
        fill={side}
        stroke={stroke}
        strokeWidth={0.5}
      />
      <ellipse cx={t.px} cy={t.py} rx={r} ry={r * 0.55} fill={top} stroke={stroke} strokeWidth={0.5} />
    </g>
  );
}
