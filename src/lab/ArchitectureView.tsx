import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, ArchitectureTopology, SimulationStep } from '../types/simulation';
import { RIG_CPU, RIG_GPU, RIG_MEMORY } from '../data/rig';

/**
 * The site-wide CPU / GPU visual language.
 * ---------------------------------------------------------------
 * CPU = BURGUNDY + solid hairline frame + square corner ticks.
 * GPU = OLIVE   + dashed frame + dense hatch pattern.
 * This pairing is reused in the kitchen view, the pills and the atlas,
 * so a glance is always enough to tell which silicon you are looking at.
 */
export const DIE_COLOR = {
  cpu: '#641E25',
  cpuHot: '#8C2A33',
  gpu: '#85865A',
  gpuHot: '#A3A472',
  shared: '#8B8983',
} as const;

type Node = {
  id: CanonicalComponentId;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  die: 'cpu' | 'gpu' | 'shared';
  /** Compact nodes hide their sub-label when the diagram is small. */
  tiny?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Layout — faithful to the actual reference rig                       */
/* ------------------------------------------------------------------ */

const CPU_X = 8;
const CPU_W = 150;
const GPU_X = 268;
const GPU_W = 150;

/** 4×4 core matrix stand-in for the 16 Zen 4 cores (CCD 0 + CCD 1). */
const CORE_CELLS = [
  [14, 74],
  [50, 74],
  [86, 74],
  [122, 74],
];

const NODES: Node[] = [
  // ---------------- CPU : Ryzen 9 8940HX ----------------
  { id: 'scheduler', x: 14, y: 30, w: CPU_W - 12, h: 18, label: 'FRONT-END', sub: 'op cache · branch pred', die: 'cpu' },
  { id: 'pipeline', x: 14, y: 52, w: CPU_W - 12, h: 16, label: '8-WIDE DISPATCH · OOO', sub: 'ROB 320', die: 'cpu' },
  ...CORE_CELLS.map(
    ([x, y], i): Node => ({
      id: `core-${i % 4}` as CanonicalComponentId,
      x,
      y,
      w: 32,
      h: 22,
      label: `C${i * 4}–${i * 4 + 3}`,
      sub: 'SMT ×2',
      die: 'cpu',
      tiny: true,
    }),
  ),
  { id: 'alu', x: 14, y: 100, w: 68, h: 16, label: 'AVX-512 · FMA', sub: '16 fp32 lanes', die: 'cpu' },
  { id: 'registers', x: 86, y: 100, w: 66, h: 16, label: 'REGISTER FILE', sub: '168 entries', die: 'cpu' },
  { id: 'l1-cache', x: 14, y: 120, w: 68, h: 16, label: `L1d ${RIG_CPU.l1dKb} KB`, sub: '4 cyc / core', die: 'cpu' },
  { id: 'l2-cache', x: 86, y: 120, w: 66, h: 16, label: `L2 ${RIG_CPU.l2Mb} MB`, sub: '14 cyc', die: 'cpu' },
  { id: 'l3-cache', x: 14, y: 140, w: 138, h: 16, label: `L3 ${RIG_CPU.l3Mb} MB SHARED`, sub: '46 cyc · CCD-wide', die: 'cpu' },
  // ---------------- GPU : RTX 5060 Laptop 8 GB ----------------
  { id: 'warp-scheduler', x: 274, y: 30, w: GPU_W - 12, h: 18, label: 'GIGATHREAD ENGINE', sub: 'block distributor', die: 'gpu' },
  { id: 'sm-0', x: 274, y: 52, w: 66, h: 34, label: 'SM 0–12', sub: '16 warps · 512 lanes', die: 'gpu' },
  { id: 'sm-1', x: 348, y: 52, w: 66, h: 34, label: 'SM 13–25', sub: '16 warps · 512 lanes', die: 'gpu' },
  { id: 'gpu-workers', x: 274, y: 90, w: GPU_W - 12, h: 16, label: `${RIG_GPU.cudaCores.toLocaleString('en-US')} CUDA CORES`, sub: '128 / SM · 4 partitions', die: 'gpu' },
  { id: 'shared-mem', x: 274, y: 110, w: GPU_W - 12, h: 16, label: `SHARED · ${RIG_GPU.sharedMemKb} KB / SM`, sub: `${RIG_GPU.sharedBanks} banks · 22 cyc`, die: 'gpu' },
  { id: 'tensor-cores', x: 274, y: 130, w: GPU_W - 12, h: 14, label: `${RIG_GPU.tensorCores} TENSOR · ${RIG_GPU.rtCores} RT`, sub: 'fp4 / fp8 / bf16', die: 'gpu' },
  { id: 'vram', x: 274, y: 148, w: GPU_W - 12, h: 16, label: `VRAM ${RIG_GPU.vramGb} GB ${RIG_GPU.vramType}`, sub: `${RIG_GPU.vramGbs} GB/s · ${RIG_GPU.busBits}-bit`, die: 'gpu' },
  // ---------------- System ----------------
  { id: 'ram', x: 130, y: 178, w: 118, h: 20, label: `${RIG_CPU.memType} · DUAL CH`, sub: `${RIG_CPU.memGbs} GB/s · ${RIG_MEMORY.dramLatencyCycles} cyc`, die: 'shared' },
  { id: 'pcie-bus', x: 258, y: 178, w: 128, h: 20, label: `PCIe ${RIG_GPU.pcieGen}.0 ×${RIG_GPU.pcieLanes}`, sub: `${RIG_GPU.pcieGbs} GB/s theoretical`, die: 'shared' },
];

/** Extra ids that are not canonical components (rendered for diagram fidelity only). */
const DECOR_IDS = new Set<string>();

const EDGES: [CanonicalComponentId, CanonicalComponentId][] = [
  ['scheduler', 'pipeline'],
  ['pipeline', 'core-0'],
  ['core-0', 'alu'],
  ['alu', 'registers'],
  ['registers', 'l1-cache'],
  ['l1-cache', 'l2-cache'],
  ['l2-cache', 'ram'],
  ['ram', 'pcie-bus'],
  ['pcie-bus', 'vram'],
  ['warp-scheduler', 'sm-0'],
  ['warp-scheduler', 'sm-1'],
  ['sm-0', 'gpu-workers'],
  ['gpu-workers', 'shared-mem'],
  ['shared-mem', 'vram'],
];

const node = (id: CanonicalComponentId) => NODES.find((n) => n.id === id);

export default function ArchitectureView({
  step,
  topology,
  selected,
  onSelect,
}: {
  step: SimulationStep;
  topology: ArchitectureTopology;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
}) {
  const active = new Set(step.activeComponents);
  const showCpu = topology !== 'gpu-only';
  const showGpu = topology !== 'cpu-only';
  const single = !(showCpu && showGpu);

  const visibleEdges = EDGES.filter(([a, b]) => {
    const A = node(a);
    const B = node(b);
    if (!A || !B) return false;
    if (!showCpu && (A.die === 'cpu' || B.die === 'cpu')) return false;
    if (!showGpu && (A.die === 'gpu' || B.die === 'gpu')) return false;
    if (single && (A.die === 'shared' || B.die === 'shared')) {
      const sys = A.die === 'shared' ? A.id : B.id;
      if (showCpu && sys !== 'ram') return false;
      if (!showCpu && sys !== 'pcie-bus') return false;
    }
    return true;
  });

  const viewBox = !showCpu ? '266 6 158 206' : !showGpu ? '0 6 158 206' : '0 0 424 214';

  /**
   * In a single-die view we only draw the system block that die actually owns,
   * re-anchored beneath it, so nothing bleeds in from the other half of the SoC.
   */
  const placed = NODES.filter((n) => {
    if (n.die === 'cpu') return showCpu;
    if (n.die === 'gpu') return showGpu;
    if (!single) return true;
    return showCpu ? n.id === 'ram' : n.id === 'pcie-bus';
  }).map((n) => {
    if (n.die !== 'shared' || !single) return n;
    return showCpu ? { ...n, x: 14, w: 138 } : { ...n, x: 274, w: 138 };
  });

  return (
    <div className="bg-[#191815]">
      <div className="flex items-center justify-between border-b border-[#332B25] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-[#B69A63]" />
          <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#EDE8DE]">ARCHITECTURE DIAGRAM</span>
        </div>
        <span className="font-mono-tech text-[9px] tracking-[0.16em] text-[#8B8983]">
          {single ? (showCpu ? 'CPU ONLY' : 'GPU ONLY') : 'HETEROGENEOUS'}
        </span>
      </div>

      <div className="p-3">
        <svg
          viewBox={viewBox}
          className={single ? 'mx-auto h-auto w-full max-w-[420px]' : 'h-auto w-full'}
        >
          <defs>
            {/* CPU: tight diagonal hairline */}
            <pattern id="hatch-cpu" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke={DIE_COLOR.cpu} strokeWidth="0.9" opacity="0.55" />
            </pattern>
            {/* GPU: dense dot grid — many small identical units */}
            <pattern id="hatch-gpu" width="3" height="3" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.45" fill={DIE_COLOR.gpu} opacity="0.75" />
            </pattern>
          </defs>

          {/* ---------------- die outlines ---------------- */}
          {showCpu && (
            <g>
              <rect x={CPU_X} y={22} width={CPU_W} height={142} fill="none" stroke="#3A312B" strokeWidth="0.8" />
              <line x1={CPU_X} y1={22} x2={CPU_X + 14} y2={22} stroke={DIE_COLOR.cpu} strokeWidth="2" />
              <text x={CPU_X} y={17} fontSize={5.4} fill="#8B7355" fontFamily="JetBrains Mono, monospace" letterSpacing={0.9}>
                CPU · {RIG_CPU.arch.toUpperCase()} · {RIG_CPU.cores}C/{RIG_CPU.threads}T
              </text>
            </g>
          )}
          {showGpu && (
            <g>
              <rect
                x={GPU_X}
                y={22}
                width={GPU_W}
                height={142}
                fill="none"
                stroke="#4A4A32"
                strokeWidth="0.8"
                strokeDasharray="3 2"
              />
              <line x1={GPU_X + GPU_W - 14} y1={22} x2={GPU_X + GPU_W} y2={22} stroke={DIE_COLOR.gpu} strokeWidth="2" />
              <text
                x={GPU_X + GPU_W}
                y={17}
                fontSize={5.4}
                textAnchor="end"
                fill="#8A8A62"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing={0.9}
              >
                GPU · {RIG_GPU.arch.toUpperCase()} · {RIG_GPU.smCount} SM
              </text>
            </g>
          )}

          {/* ---------------- edges ---------------- */}
          {visibleEdges.map(([a, b], i) => {
            const A = node(a)!;
            const B = node(b)!;
            const ax = A.x + A.w / 2;
            const ay = A.y + A.h;
            const bx = B.x + B.w / 2;
            const by = B.y;
            const live = active.has(a) && active.has(b);
            const touch = active.has(a) || active.has(b);
            const midY = (ay + by) / 2;
            const d = `M${ax},${ay} L${ax},${midY} L${bx},${midY} L${bx},${by}`;
            const stroke = live ? DIE_COLOR.cpuHot : touch ? '#4A3F36' : '#2A231E';
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={stroke} strokeWidth={live ? 1.2 : 0.7} />
                {live && (
                  <circle r={1.4} fill="#EDE8DE">
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* ---------------- nodes ---------------- */}
          {placed.map((n) => {
            const on = active.has(n.id) || DECOR_IDS.has(n.id);
            const sel = !DECOR_IDS.has(n.id) && selected === n.id;
            const tone = n.die === 'gpu' ? DIE_COLOR.gpu : n.die === 'cpu' ? DIE_COLOR.cpu : DIE_COLOR.shared;
            const interactive = !DECOR_IDS.has(n.id);
            return (
              <g
                key={n.id}
                onClick={interactive ? () => onSelect(n.id) : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
              >
                {on && (
                  <motion.rect
                    x={n.x - 1.4}
                    y={n.y - 1.4}
                    width={Number.isFinite(n.w) ? n.w + 2.8 : 0}
                    height={Number.isFinite(n.h) ? n.h + 2.8 : 0}
                    fill="none"
                    stroke="#B69A63"
                    strokeWidth={0.7}
                    animate={{ opacity: [0.12, 0.7, 0.12] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  fill={on ? tone : '#1D1915'}
                  fillOpacity={on ? 0.9 : 1}
                  stroke={sel ? '#B69A63' : on ? '#6B5C4C' : '#2C2420'}
                  strokeWidth={sel ? 1.3 : 0.7}
                  strokeDasharray={n.die === 'gpu' ? '2.4 1.6' : undefined}
                />
                {/* texture makes the die type legible even when inactive */}
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  fill={n.die === 'gpu' ? 'url(#hatch-gpu)' : 'url(#hatch-cpu)'}
                  opacity={on ? 0.3 : 0.5}
                />
                <text
                  x={n.x + n.w / 2}
                  y={n.y + n.h / 2 + (n.sub && !n.tiny ? -0.8 : 1.4)}
                  fontSize={n.tiny ? 5.4 : 4.6}
                  textAnchor="middle"
                  fill={sel ? '#F8F6F0' : on ? '#F8F6F0' : '#7A7469'}
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing={0.2}
                >
                  {n.label}
                </text>
                {n.sub && !n.tiny && (
                  <text
                    x={n.x + n.w / 2}
                    y={n.y + n.h / 2 + 4.2}
                    fontSize={3.5}
                    textAnchor="middle"
                    fill={on ? '#E4DCC9' : '#6E6960'}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}

          {/* footer caption */}
          <text
            x={showCpu ? 8 : 272}
            y={single ? 202 : 210}
            fontSize={4.6}
            fill="#6E6A63"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing={0.7}
          >
            {step.activeComponents
              .slice(0, 3)
              .map((c) => c.toUpperCase().replace(/-/g, '_'))
              .join(' · ')}
          </text>
        </svg>

        {/* legend — the CPU/GPU colour key, always visible */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#2C2420] pt-2">
          <Legend swatch={DIE_COLOR.cpu} label="CPU · Ryzen 9 8940HX" solid />
          <Legend swatch={DIE_COLOR.gpu} label={`GPU · RTX 5060 ${RIG_GPU.vramGb} GB`} />
          <Legend swatch={DIE_COLOR.shared} label="SYSTEM" solid />
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label, solid = false }: { swatch: string; label: string; solid?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2.5"
        style={{
          backgroundColor: solid ? swatch : 'transparent',
          border: `1px ${solid ? 'solid' : 'dashed'} ${swatch}`,
          backgroundImage: solid
            ? undefined
            : 'radial-gradient(circle, rgba(255,255,255,0.55) 0.5px, transparent 0.6px)',
          backgroundSize: '2px 2px',
        }}
      />
      <span className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">{label}</span>
    </span>
  );
}
