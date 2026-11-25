import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CanonicalComponentId } from '../types/simulation';
import { COMPONENT_LOOKUP } from '../data/metaphors';
import { SectionHeading, Pill } from '../components/ui/Section';

const SAND = '#EDE8DE';
const STONE = '#D9D2C6';

type Block = {
  id: CanonicalComponentId;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  die: 'cpu' | 'gpu' | 'shared';
};

const BLOCKS: Block[] = [
  { id: 'scheduler', x: 18, y: 16, w: 108, h: 26, label: 'FETCH / DECODE', sub: 'branch predictor', die: 'cpu' },
  { id: 'pipeline', x: 18, y: 46, w: 108, h: 22, label: '8-WIDE OOO DISPATCH', sub: 'ROB 320', die: 'cpu' },
  { id: 'core-0', x: 18, y: 72, w: 34, h: 44, label: 'C0–3', sub: 'Zen 4', die: 'cpu' },
  { id: 'core-1', x: 55, y: 72, w: 34, h: 44, label: 'C4–7', sub: 'CCD 0', die: 'cpu' },
  { id: 'core-2', x: 92, y: 72, w: 34, h: 44, label: 'C8–15', sub: 'CCD 1', die: 'cpu' },
  { id: 'alu', x: 18, y: 120, w: 50, h: 22, label: 'AVX-512 FMA', sub: '16 lanes', die: 'cpu' },
  { id: 'registers', x: 76, y: 120, w: 50, h: 22, label: 'REGISTER FILE', sub: '168 · 192 vec', die: 'cpu' },
  { id: 'l1-cache', x: 18, y: 146, w: 50, h: 20, label: 'L1d 32 KB', sub: '4 cyc / core', die: 'cpu' },
  { id: 'l2-cache', x: 76, y: 146, w: 50, h: 20, label: 'L2 16 MB + L3', sub: '14 / 46 cyc', die: 'cpu' },

  { id: 'warp-scheduler', x: 282, y: 16, w: 128, h: 24, label: 'GIGATHREAD ENGINE', sub: 'block distributor', die: 'gpu' },
  { id: 'sm-0', x: 282, y: 46, w: 60, h: 62, label: 'SM 0–12', sub: '16 warps · 512 lanes', die: 'gpu' },
  { id: 'sm-1', x: 350, y: 46, w: 60, h: 62, label: 'SM 13–25', sub: '16 warps · 512 lanes', die: 'gpu' },
  { id: 'gpu-workers', x: 282, y: 114, w: 128, h: 22, label: '3,328 CUDA CORES', sub: '128 / SM', die: 'gpu' },
  { id: 'shared-mem', x: 282, y: 142, w: 128, h: 24, label: 'SHARED 228 KB / SM', sub: '32 banks · 22 cyc', die: 'gpu' },

  { id: 'ram', x: 130, y: 208, w: 120, h: 30, label: 'DDR5-5200 · 2CH', sub: '83 GB/s · 90 cyc', die: 'shared' },
  { id: 'pcie-bus', x: 258, y: 208, w: 100, h: 30, label: 'PCIe 5.0 ×8', sub: '32 GB/s · 1.6 µs', die: 'shared' },
  { id: 'vram', x: 366, y: 208, w: 44, h: 30, label: 'GDDR7 8GB', sub: '384 GB/s', die: 'shared' },
];

const LINKS: [CanonicalComponentId, CanonicalComponentId, string][] = [
  ['scheduler', 'pipeline', ''],
  ['pipeline', 'core-0', ''],
  ['core-0', 'alu', ''],
  ['alu', 'registers', ''],
  ['l1-cache', 'l2-cache', ''],
  ['l2-cache', 'ram', 'memory controller'],
  ['ram', 'pcie-bus', ''],
  ['pcie-bus', 'vram', 'DMA'],
  ['vram', 'sm-0', ''],
  ['warp-scheduler', 'sm-0', ''],
  ['sm-1', 'gpu-workers', ''],
  ['gpu-workers', 'shared-mem', ''],
];

const byId = (id: CanonicalComponentId) => BLOCKS.find((b) => b.id === id)!;

export default function Architecture() {
  const [sel, setSel] = useState<CanonicalComponentId>('l1-cache');
  const info = COMPONENT_LOOKUP[sel];

  return (
    <section id="architecture" className="relative bg-[#191815] text-[#F8F6F0]">
      <div className="absolute inset-0 bg-drafting-charcoal opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
        <SectionHeading
          index="04"
          kicker="ARCHITECTURE ATLAS"
          tone="light"
          align="split"
          title={
            <>
              The same system, drawn as engineers draw it<span className="text-[#B65335]">.</span>
            </>
          }
          lead={
            <>
              One SoC, two processing philosophies. Select any block to see its role in both languages — and how
              far away it sits from the registers that need it.
            </>
          }
        />

        <div className="mt-12 grid grid-cols-1 xl:grid-cols-12 gap-x-10 gap-y-8">
          {/* diagram */}
          <div className="xl:col-span-8">
            <div className="border border-[#3A312B] bg-[#15130F] p-3 sm:p-5">
              <svg viewBox="0 0 440 254" className="w-full h-auto select-none">
                {/* die boundaries */}
                <rect x={10} y={8} width={124} height={166} fill="none" stroke="#3A312B" strokeDasharray="3 3" />
                <text x={12} y={203} fontSize={6} fill="#8B8983" fontFamily="JetBrains Mono, monospace" letterSpacing={1.4}>
                  CPU DIE · LATENCY OPTIMISED
                </text>
                <rect x={274} y={8} width={136} height={166} fill="none" stroke="#3A312B" strokeDasharray="3 3" />
                <text x={410} y={203} fontSize={6} fill="#8B8983" textAnchor="end" fontFamily="JetBrains Mono, monospace" letterSpacing={1.4}>
                  GPU DIE · THROUGHPUT OPTIMISED
                </text>

                {/* links */}
                {LINKS.map(([a, b, label], i) => {
                  const A = byId(a);
                  const B = byId(b);
                  const ax = A.x + A.w / 2;
                  const ay = A.y + A.h / 2;
                  const bx = B.x + B.w / 2;
                  const by = B.y + B.h / 2;
                  const active = sel === a || sel === b;
                  // orthogonal routing
                  let d = '';
                  if (Math.abs(ax - bx) < 4 || Math.abs(ay - by) < 4) {
                    d = `M${ax},${ay} L${bx},${by}`;
                  } else {
                    const midY = (ay + by) / 2;
                    d = `M${ax},${ay} L${ax},${midY} L${bx},${midY} L${bx},${by}`;
                  }
                  return (
                    <g key={`${a}-${b}-${i}`}>
                      <path
                        d={d}
                        fill="none"
                        stroke={active ? '#B65335' : '#332B25'}
                        strokeWidth={active ? 1.1 : 0.7}
                        strokeDasharray={label === 'DMA' ? '2 2' : undefined}
                      />
                      {active && (
                        <circle r={1.6} fill="#B69A63">
                          <animateMotion dur="2.4s" repeatCount="indefinite" path={d} />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* blocks */}
                {BLOCKS.map((b) => {
                  const on = sel === b.id;
                  const cpu = b.die === 'cpu';
                  return (
                    <g
                      key={b.id}
                      onClick={() => setSel(b.id)}
                      onMouseEnter={() => setSel(b.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.w}
                        height={b.h}
                        fill={on ? (cpu ? '#641E25' : '#4A3F36') : cpu ? '#221C18' : '#1D1915'}
                        stroke={on ? '#B69A63' : '#3A312B'}
                        strokeWidth={on ? 1.1 : 0.7}
                      />
                      <text
                        x={b.x + b.w / 2}
                        y={b.y + b.h / 2 - 1}
                        fontSize={5.3}
                        textAnchor="middle"
                        fill={on ? '#F8F6F0' : '#B69A63'}
                        fontFamily="JetBrains Mono, monospace"
                        letterSpacing={0.4}
                      >
                        {b.label}
                      </text>
                      <text
                        x={b.x + b.w / 2}
                        y={b.y + b.h / 2 + 6}
                        fontSize={4.2}
                        textAnchor="middle"
                        fill="#8B8983"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {b.sub}
                      </text>
                    </g>
                  );
                })}

                {/* latency legend */}
                <g transform="translate(130,182)">
                  {[
                    ['REG', '#B69A63'],
                    ['L1', '#B65335'],
                    ['L2', '#85865A'],
                    ['DRAM', '#641E25'],
                    ['VRAM', '#8B8983'],
                  ].map(([l, c], i) => (
                    <g key={l} transform={`translate(${i * 30},0)`}>
                      <rect width={6} height={6} y={-5} fill={c} />
                      <text x={8} y={0} fontSize={4.6} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
                        {l}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>

            <p className="mt-3 font-mono-tech text-[9.5px] tracking-[0.14em] text-[#6E6A63]">
              SIMPLIFIED BLOCK DIAGRAM · LATENCY VALUES ARE TYPICAL ORDER-OF-MAGNITUDE FIGURES, NOT A SPECIFIC SKU
            </p>
          </div>

          {/* detail panel */}
          <div className="xl:col-span-4">
            <div className="relative h-full border border-[#3A312B] bg-[#211C18] p-6 lg:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={sel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-[9px] tracking-[0.2em] text-[#B69A63]">{info.roleTag}</span>
                    <span className="font-mono-tech text-[9px] tracking-[0.2em] text-[#6E6A63]">
                      {sel.toUpperCase().replace(/-/g, '_')}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-[25px] leading-[1.18] text-[#F8F6F0]">{info.hardwareName}</h3>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="h-px flex-1 bg-[#3A312B]" />
                    <span className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">KITCHEN COUNTERPART</span>
                  </div>
                  <p className="mt-2.5 font-display text-[16.5px] italic leading-[1.3] text-[#B69A63]">{info.kitchenName}</p>

                  <p className="mt-5 font-sans-ui text-[12.5px] leading-[1.7] text-[#D9D2C6]/80">{info.beginnerDesc}</p>

                  <div className="mt-5 border-t border-[#3A312B] pt-4">
                    <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">ENGINEERING NOTE</div>
                    <p className="mt-2 font-mono-tech text-[10.5px] leading-[1.7] text-[#9A958C]">{info.engineeringDesc}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex flex-wrap gap-1.5">
                <Pill tone="brass">HOVER TO EXPLORE</Pill>
                <Pill tone="outline">16 BLOCKS</Pill>
              </div>
            </div>
          </div>
        </div>

        {/* latency scale — the argument for caches, as a measuring stick */}
        <div className="mt-14 border-t border-[#3A312B] pt-8">
          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-3">
            <h3 className="font-display text-[26px] leading-tight text-[#F8F6F0]">
              The distance from a chef&rsquo;s hand to the basement pantry
            </h3>
            <span className="font-mono-tech text-[9.5px] tracking-[0.18em] text-[#8B8983]">
              LOG SCALE · CYCLES AT 5.3 GHz BOOST
            </span>
          </div>

          <div className="mt-7 space-y-3">
            {[
              { name: 'Register file', cycles: 1, kitchen: 'already in hand', tone: '#B69A63', w: 2 },
              { name: 'L1 data cache', cycles: 4, kitchen: 'spice rack above the pass', tone: '#B65335', w: 8 },
              { name: 'L2 cache (1 MB/core)', cycles: 14, kitchen: 'reach-in prep fridge', tone: '#85865A', w: 20 },
              { name: 'L3 shared (64 MB)', cycles: 46, kitchen: 'back-of-house cold room', tone: '#8B8983', w: 38 },
              { name: 'DDR5-5200', cycles: 90, kitchen: 'basement walk-in pantry', tone: '#641E25', w: 88 },
              { name: 'PCIe 5.0 ×8 round trip', cycles: 8500, kitchen: 'delivery van across town', tone: '#4A161C', w: 100 },
            ].map((row, i) => (
              <motion.div
                key={row.name}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.7, delay: i * 0.06 }}
                className="grid grid-cols-12 items-center gap-3"
              >
                <div className="col-span-4 sm:col-span-3 font-sans-ui text-[12.5px] text-[#EDE8DE]">{row.name}</div>
                <div className="col-span-5 sm:col-span-6 h-[9px] bg-[#29221D] relative overflow-hidden">
                  <div className="h-full" style={{ width: `${row.w}%`, backgroundColor: row.tone }} />
                </div>
                <div className="col-span-3 sm:col-span-1 font-mono-tech text-[10px] text-[#B69A63] text-right">
                  {row.cycles} cyc
                </div>
                <div className="hidden sm:block col-span-2 font-mono-tech text-[9px] text-[#6E6A63] text-right truncate">
                  {row.kitchen}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-7 max-w-[74ch] font-sans-ui text-[12.5px] leading-[1.75] text-[#8B8983]">
            This is the entire reason caches exist. A single trip to DRAM costs about two hundred clock cycles —
            enough time for a modern core to retire hundreds of instructions. Every level of the hierarchy you see
            in the simulator is a station the chef does not have to walk to.
          </p>
        </div>
      </div>
    </section>
  );
}
