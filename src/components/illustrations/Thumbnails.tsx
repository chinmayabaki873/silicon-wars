import React from 'react';
import { ExperimentId } from '../../types/simulation';

const INK = '#191815';
const BURG = '#641E25';
const TERR = '#B65335';
const OLIVE = '#85865A';
const BRASS = '#B69A63';
const STONE = '#D9D2C6';
const SAND = '#EDE8DE';

const Frame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <svg viewBox="0 0 160 104" className="w-full h-full" role="img" aria-label={label}>
    <rect width="160" height="104" fill="#191815" />
    <g opacity="0.35">
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={104} stroke="#29221D" strokeWidth="0.6" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 20} x2={160} y2={i * 20} stroke="#29221D" strokeWidth="0.6" />
      ))}
    </g>
    {children}
  </svg>
);

export function Thumbnail({ id }: { id: ExperimentId }) {
  switch (id) {
    case 'vector-addition':
      return (
        <Frame label="Vector addition diagram">
          {Array.from({ length: 8 }).map((_, i) => {
            const x = 14 + i * 16.5;
            return (
              <g key={i}>
                <rect x={x} y={22} width={10} height={10} fill={STONE} opacity={0.9} />
                <rect x={x} y={68} width={10} height={10} fill={BRASS} opacity={0.9} />
                <rect x={x} y={44} width={10} height={12} fill={i < 6 ? TERR : '#3A312B'} />
                <line x1={x + 5} y1={34} x2={x + 5} y2={42} stroke="#5A4E43" strokeWidth="0.8" />
                <line x1={x + 5} y1={58} x2={x + 5} y2={66} stroke="#5A4E43" strokeWidth="0.8" />
              </g>
            );
          })}
          <text x={12} y={16} fontSize={6} fill="#8B8983" fontFamily="JetBrains Mono, monospace" letterSpacing="1.6">
            A + B → C · 8 LANES
          </text>
        </Frame>
      );
    case 'matrix-multiplication':
      return (
        <Frame label="Matrix tiling diagram">
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3].map((c) => {
              const on = r === 1 && c === 2;
              const tile = (r < 2 && c < 2) || (r >= 2 && c >= 2);
              return (
                <rect
                  key={`${r}-${c}`}
                  x={18 + c * 15}
                  y={20 + r * 15}
                  width={13}
                  height={13}
                  fill={on ? TERR : tile ? '#4A3F36' : '#2C2420'}
                  stroke={on ? TERR : '#3A312B'}
                  strokeWidth="0.7"
                />
              );
            }),
          )}
          <line x1={88} y1={20} x2={88} y2={80} stroke={BURG} strokeWidth="1.2" />
          <rect x={98} y={20} width={44} height={44} fill="none" stroke={BRASS} strokeDasharray="2 2" strokeWidth="0.8" />
          <text x={98} y={16} fontSize={5.4} fill={BRASS} fontFamily="JetBrains Mono, monospace">
            SHARED TILE
          </text>
          <text x={98} y={78} fontSize={5.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
            64 FMA / OUTPUT
          </text>
        </Frame>
      );
    case 'cpu-pipeline':
      return (
        <Frame label="Five stage pipeline diagram">
          {['IF', 'ID', 'EX', 'MEM', 'WB'].map((s, i) => (
            <g key={s}>
              <rect x={12 + i * 28} y={20} width={24} height={16} fill={i === 2 ? BURG : '#332A24'} stroke="#4A3F36" strokeWidth="0.7" />
              <text x={12 + i * 28 + 12} y={31} fontSize={6.4} textAnchor="middle" fill={i === 2 ? STONE : '#B69A63'} fontFamily="JetBrains Mono, monospace">
                {s}
              </text>
            </g>
          ))}
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 5 }).map((_, c) => {
              const stage = c - r;
              const bubble = stage === 2 && (r === 1 || r === 2);
              return (
                <rect
                  key={`${r}-${c}`}
                  x={12 + c * 28}
                  y={44 + r * 11}
                  width={24}
                  height={9}
                  fill={bubble ? 'none' : stage >= 0 && stage < 5 ? (r === 0 ? TERR : BRASS) : '#211C18'}
                  stroke={bubble ? '#641E25' : 'none'}
                  strokeDasharray={bubble ? '2 2' : undefined}
                  strokeWidth="0.8"
                  opacity={stage >= 0 && stage < 5 ? 0.9 - r * 0.14 : 1}
                />
              );
            }),
          )}
        </Frame>
      );
    case 'cpu-scheduling':
      return (
        <Frame label="Scheduler issue queue diagram">
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={12} y={16 + i * 20} width={56} height={15} fill={i === 0 ? '#4A161C' : '#332A24'} stroke={i === 0 ? BURG : '#3A312B'} strokeWidth="0.8" />
              <text x={18} y={26 + i * 20} fontSize={5.6} fill={i === 0 ? TERR : '#8B8983'} fontFamily="JetBrains Mono, monospace">
                {['LDR R1', 'ADD R2,R1', 'CHOP', 'PLATE'][i]}
              </text>
            </g>
          ))}
          <path d="M70 23 L92 23" stroke={BURG} strokeWidth="1" markerEnd="url(#ar)" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={92} y={16 + i * 20} width={56} height={15} fill={i === 0 ? '#5A4E43' : '#332A24'} stroke="#3A312B" strokeWidth="0.7" />
              <text x={98} y={26 + i * 20} fontSize={5.4} fill={i === 0 ? '#8B8983' : '#B69A63'} fontFamily="JetBrains Mono, monospace">
                {i === 0 ? 'STALL · mem' : i === 1 ? 'ISSUE · alu' : 'ISSUE · alu'}
              </text>
            </g>
          ))}
          <defs>
            <marker id="ar" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5" fill={BURG} />
            </marker>
          </defs>
          <text x={92} y={84} fontSize={5.2} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
            OoO ISSUE WINDOW
          </text>
        </Frame>
      );
    case 'cache-vs-ram':
      return (
        <Frame label="Memory hierarchy diagram">
          <rect x={12} y={30} width={28} height={42} fill="#332A24" stroke={BRASS} strokeWidth="0.8" />
          <text x={26} y={52} fontSize={6} textAnchor="middle" fill={BRASS} fontFamily="JetBrains Mono, monospace">L1</text>
          <text x={26} y={62} fontSize={4.6} textAnchor="middle" fill="#8B8983" fontFamily="JetBrains Mono, monospace">4 cyc</text>
          <rect x={54} y={38} width={24} height={26} fill="#2C2420" stroke="#5A4E43" strokeWidth="0.8" />
          <text x={66} y={54} fontSize={5.4} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">L2</text>
          <rect x={88} y={12} width={58} height={76} fill="#211C18" stroke={BURG} strokeWidth="0.8" />
          <text x={117} y={44} fontSize={6} textAnchor="middle" fill={TERR} fontFamily="JetBrains Mono, monospace">DRAM</text>
          <text x={117} y={56} fontSize={4.6} textAnchor="middle" fill="#8B8983" fontFamily="JetBrains Mono, monospace">200 cyc</text>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={96 + i * 16} y={66} width={12} height={12} fill={i === 0 ? TERR : '#4A3F36'} />
          ))}
          <path d="M40 48 L52 48" stroke={BRASS} strokeWidth="0.9" />
          <path d="M78 48 L86 48" stroke={BURG} strokeWidth="0.9" strokeDasharray="2 1.6" />
        </Frame>
      );
    case 'gpu-thread-blocks':
      return (
        <Frame label="Thread block distribution diagram">
          <rect x={10} y={16} width={64} height={72} fill="#1F1A17" stroke="#3A312B" strokeWidth="0.8" />
          <rect x={80} y={16} width={64} height={72} fill="#1F1A17" stroke="#3A312B" strokeWidth="0.8" />
          <text x={42} y={28} fontSize={5.4} textAnchor="middle" fill="#B69A63" fontFamily="JetBrains Mono, monospace">SM 0</text>
          <text x={112} y={28} fontSize={5.4} textAnchor="middle" fill="#B69A63" fontFamily="JetBrains Mono, monospace">SM 1</text>
          {Array.from({ length: 24 }).map((_, i) => {
            const inS0 = i % 2 === 0;
            return (
              <rect
                key={i}
                x={(inS0 ? 16 : 86) + (i % 4) * 12}
                y={36 + Math.floor((i % 16) / 4) * 11}
                width={8}
                height={8}
                fill={i % 5 === 0 ? TERR : inS0 ? '#6E5B4A' : '#5A4E43'}
              />
            );
          })}
          <line x1={8} y1={94} x2={152} y2={94} stroke="#3A312B" strokeWidth="0.8" />
          <text x={10} y={101} fontSize={4.8} fill="#8B8983" fontFamily="JetBrains Mono, monospace">GRID = 2 BLOCKS × 128 THREADS</text>
        </Frame>
      );
    case 'warps-simd-simt':
      return (
        <Frame label="Warp execution mask diagram">
          <text x={12} y={18} fontSize={5.2} fill="#8B8983" fontFamily="JetBrains Mono, monospace">EXEC_MASK · ONE WARP · 32 LANES</text>
          {Array.from({ length: 32 }).map((_, i) => {
            const even = i % 2 === 0;
            return (
              <rect
                key={i}
                x={12 + (i % 16) * 8.6}
                y={i < 16 ? 28 : 56}
                width={7}
                height={20}
                fill={even ? TERR : '#2C2420'}
              />
            );
          })}
          <rect x={12} y={28} width={137} height={20} fill="none" stroke={TERR} strokeWidth="0.8" />
          <rect x={12} y={56} width={137} height={20} fill="none" stroke="#5A4E43" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x={12} y={88} fontSize={5} fill={TERR} fontFamily="JetBrains Mono, monospace">PATH A 0x5555…</text>
          <text x={12} y={96} fontSize={5} fill="#8B8983" fontFamily="JetBrains Mono, monospace">PATH B 0xAAAA…  → 50% SIMT EFFICIENCY</text>
        </Frame>
      );
    case 'cpu-vs-gpu':
      return (
        <Frame label="CPU versus GPU race diagram">
          <text x={12} y={18} fontSize={5.2} fill="#B69A63" fontFamily="JetBrains Mono, monospace">CPU · 4 CHEFS</text>
          <rect x={12} y={24} width={40} height={9} fill={TERR} />
          <rect x={12} y={36} width={40} height={9} fill="#4A3F36" />
          <text x={12} y={58} fontSize={5.2} fill="#B69A63" fontFamily="JetBrains Mono, monospace">GPU · 64 COOKS</text>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={12 + i * 8.4} y={64} width={6} height={9} fill={BRASS} />
          ))}
          <rect x={12} y={78} width={134} height={9} fill={OLIVE} opacity={0.85} />
          <text x={150} y={86} fontSize={5} textAnchor="end" fill="#191815" fontFamily="JetBrains Mono, monospace">1,024 DISHES</text>
        </Frame>
      );
    case 'memory-transfer':
      return (
        <Frame label="PCIe transfer diagram">
          <rect x={10} y={34} width={34} height={32} fill="#332A24" stroke="#5A4E43" strokeWidth="0.8" />
          <text x={27} y={53} fontSize={4.8} textAnchor="middle" fill="#B69A63" fontFamily="JetBrains Mono, monospace">RAM</text>
          <rect x={116} y={34} width={34} height={32} fill="#4A161C" stroke={BURG} strokeWidth="0.8" />
          <text x={133} y={53} fontSize={4.8} textAnchor="middle" fill={TERR} fontFamily="JetBrains Mono, monospace">VRAM</text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={50 + i * 10} y={44} width={7} height={12} fill={i < 4 ? BRASS : '#3A312B'} />
          ))}
          <line x1={46} y1={50} x2={116} y2={50} stroke="#3A312B" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x={10} y={80} fontSize={4.8} fill="#8B8983" fontFamily="JetBrains Mono, monospace">PCIe GEN5 ×16 · ~64 GB/s · DMA</text>
          <text x={10} y={92} fontSize={4.8} fill={TERR} fontFamily="JetBrains Mono, monospace">TRANSFER 240 µs   COMPUTE 20 µs</text>
        </Frame>
      );
    case 'image-processing':
      return (
        <Frame label="Image convolution diagram">
          {Array.from({ length: 64 }).map((_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const v = Math.round((r * 24 + c * 12) % 220);
            const active = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            return (
              <rect
                key={i}
                x={14 + c * 10}
                y={16 + r * 10}
                width={9}
                height={9}
                fill={`rgb(${v * 0.55 + 40},${v * 0.42 + 30},${v * 0.3 + 22})`}
                stroke={active ? BRASS : 'none'}
                strokeWidth={active ? 0.8 : 0}
              />
            );
          })}
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`k${r}${c}`} x={104 + c * 13} y={28 + r * 13} width={11} height={11} fill={['#2C2420', '#4A3F36', '#2C2420'][r]} stroke="#5A4E43" strokeWidth="0.6" />
            )),
          )}
          <text x={104} y={22} fontSize={4.8} fill={BRASS} fontFamily="JetBrains Mono, monospace">3×3 STENCIL</text>
          <text x={104} y={76} fontSize={4.6} fill="#8B8983" fontFamily="JetBrains Mono, monospace">9 READS</text>
          <text x={104} y={84} fontSize={4.6} fill="#8B8983" fontFamily="JetBrains Mono, monospace">1 WRITE</text>
          <text x={104} y={96} fontSize={4.6} fill={TERR} fontFamily="JetBrains Mono, monospace">36 PARALLEL</text>
        </Frame>
      );
    case 'registers-asm':
      return (
        <Frame label="Register file and assembly listing">
          {Array.from({ length: 4 }).map((_, i) => (
            <g key={i}>
              <rect x={14} y={16 + i * 13} width={44} height={10} fill={i === 0 ? BURG : '#2C2420'} stroke={i === 0 ? TERR : '#3A312B'} strokeWidth={0.7} />
              <text x={20} y={23 + i * 13} fontSize={4.6} fill={STONE} fontFamily="JetBrains Mono, monospace">
                {['RAX', 'RBX', 'RCX', 'RSI'][i]}
              </text>
            </g>
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={`a${i}`}>
              <rect x={66} y={16 + i * 11} width={20 + (i % 3) * 26} height={2.4} fill={i === 2 ? BRASS : '#4A3F36'} />
              <text x={90 + (i % 3) * 26} y={19 + i * 11} fontSize={3.8} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
                {['mov', 'add', 'imul', 'lea', 'mov', 'add', 'jmp'][i]}
              </text>
            </g>
          ))}
          <text x={14} y={76} fontSize={4.4} fill={BRASS} fontFamily="JetBrains Mono, monospace">-O0 → -O3</text>
          <text x={14} y={86} fontSize={4.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">11 → 5 INSTR/ELEM</text>
        </Frame>
      );
    case 'instruction-encoding':
      return (
        <Frame label="Instruction bit fields">
          {[
            { w: 22, c: BURG, t: 'REX' },
            { w: 26, c: TERR, t: '01' },
            { w: 34, c: OLIVE, t: 'D8' },
          ].map((f, i, arr) => {
            const x = 14 + arr.slice(0, i).reduce((a, b) => a + b.w, 0);
            return (
              <g key={i}>
                <rect x={x} y={30} width={f.w - 2} height={22} fill={f.c} opacity={0.5} stroke={f.c} strokeWidth={0.8} />
                <text x={x + f.w / 2 - 1} y={44} fontSize={6} textAnchor="middle" fill={STONE} fontFamily="JetBrains Mono, monospace">
                  {f.t}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={14 + i * 8.3} y={64} width={6} height={6} fill={i < 12 ? BRASS : '#3A312B'} opacity={i < 12 ? 0.8 : 1} />
          ))}
          <text x={14} y={88} fontSize={4.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">OPCODE · MODRM · DISP</text>
        </Frame>
      );
    case 'isa-compare':
      return (
        <Frame label="C to PTX to SASS stack">
          {['C', 'PTX', 'SASS'].map((t, i) => (
            <g key={t}>
              <rect x={14 + i * 46} y={22 + i * 6} width={40} height={48 - i * 4} fill={['#2C2420', '#3A312B', '#4A3F36'][i]} stroke={[OLIVE, BRASS, TERR][i]} strokeWidth={0.8} />
              <text x={34 + i * 46} y={36 + i * 6} fontSize={6} textAnchor="middle" fill={[OLIVE, BRASS, TERR][i]} fontFamily="JetBrains Mono, monospace">
                {t}
              </text>
              {Array.from({ length: 3 }).map((_, k) => (
                <rect key={k} x={19 + i * 46} y={42 + i * 6 + k * 4} width={30 - k * 6} height={1.8} fill="#6E6A63" />
              ))}
              {i < 2 && <path d={`M${55 + i * 46},${46} l5,-2 v4 Z`} fill={BRASS} />}
            </g>
          ))}
          <text x={14} y={88} fontSize={4.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">ONE SOURCE · THREE MACHINES</text>
        </Frame>
      );
    case 'branch-predict':
      return (
        <Frame label="Branch predictor history">
          {Array.from({ length: 10 }).map((_, i) => {
            const ok = i % 3 !== 1;
            return (
              <g key={i}>
                <rect x={14 + i * 13.4} y={24} width={11} height={22} fill={ok ? '#2A3020' : '#3A1A1E'} stroke={ok ? OLIVE : TERR} strokeWidth={0.7} />
                <text x={19.5 + i * 13.4} y={34} fontSize={4.6} textAnchor="middle" fill={BRASS} fontFamily="JetBrains Mono, monospace">T</text>
                <text x={19.5 + i * 13.4} y={42} fontSize={4.6} textAnchor="middle" fill={STONE} fontFamily="JetBrains Mono, monospace">{ok ? 'T' : 'N'}</text>
              </g>
            );
          })}
          <line x1={14} y1={56} x2={148} y2={56} stroke="#3A312B" />
          <rect x={14} y={62} width={134} height={7} fill="#1B1815" stroke="#2C2420" />
          <rect x={14} y={62} width={92} height={7} fill={OLIVE} />
          <text x={14} y={80} fontSize={4.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">70% ACCURACY</text>
          <text x={14} y={90} fontSize={4.4} fill={TERR} fontFamily="JetBrains Mono, monospace">18 CYC FLUSH</text>
        </Frame>
      );
    case 'openmp-scaling':
      return (
        <Frame label="Thread scaling bars">
          {[1, 2, 4, 8, 16, 32].map((t, i) => {
            const h = [8, 16, 30, 52, 74, 80][i];
            return (
              <g key={t}>
                <rect x={16 + i * 22} y={84 - h} width={14} height={h} fill={i === 5 ? BURG : '#3A2620'} stroke={i === 5 ? TERR : '#4A3A32'} strokeWidth={0.7} />
                <text x={23 + i * 22} y={93} fontSize={3.8} textAnchor="middle" fill="#6E6A63" fontFamily="JetBrains Mono, monospace">{t}</text>
              </g>
            );
          })}
          <line x1={14} y1={84} x2={148} y2={84} stroke="#3A312B" />
          <text x={14} y={16} fontSize={4.4} fill={BRASS} fontFamily="JetBrains Mono, monospace">12.2× AT 16C · SMT FLAT</text>
        </Frame>
      );
    case 'false-sharing':
      return (
        <Frame label="False sharing cache line">
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={14 + i * 16.6} y={34} width={15} height={20} fill={i === 0 ? BURG : i === 1 ? OLIVE : '#241F1B'} stroke={i < 2 ? BRASS : '#3A312B'} strokeWidth={i < 2 ? 0.9 : 0.6} />
          ))}
          <text x={14} y={28} fontSize={4.2} fill="#8B8983" fontFamily="JetBrains Mono, monospace">ONE 64-BYTE LINE · TWO CORES</text>
          <path d="M22,60 L22,70 L38,70" stroke={TERR} strokeWidth={0.9} fill="none" markerEnd="" />
          <path d="M150,60 L150,70 L134,70" stroke={TERR} strokeWidth={0.9} fill="none" />
          <text x={14} y={84} fontSize={4.4} fill={TERR} fontFamily="JetBrains Mono, monospace">PING-PONG 46 CYC/WRITE</text>
          <text x={14} y={94} fontSize={4.4} fill={OLIVE} fontFamily="JetBrains Mono, monospace">FIX: alignas(64)</text>
        </Frame>
      );
    case 'instruction-parallelism':
      return (
        <Frame label="Instruction dependency graph">
          {[0, 1, 2, 3].map((lane) =>
            [0, 1, 2].map((c) => (
              <rect key={`${lane}${c}`} x={26 + lane * 30} y={22 + c * 18} width={22} height={11} fill={c === 2 ? '#2A3020' : '#241F1B'} stroke={c === 2 ? OLIVE : '#3A312B'} strokeWidth={0.7} />
            )),
          )}
          {[0, 1, 2, 3].map((lane) => (
            <line key={lane} x1={37 + lane * 30} y1={33} x2={37 + lane * 30} y2={76} stroke="#5A4E43" strokeWidth={0.7} />
          ))}
          <text x={14} y={16} fontSize={4.2} fill={BRASS} fontFamily="JetBrains Mono, monospace">4 INDEPENDENT CHAINS</text>
          <text x={14} y={90} fontSize={4.4} fill={OLIVE} fontFamily="JetBrains Mono, monospace">IPC 4.0</text>
          <text x={80} y={90} fontSize={4.4} fill={TERR} fontFamily="JetBrains Mono, monospace">SERIAL: IPC 1.0</text>
        </Frame>
      );
    case 'simd-fma':
      return (
        <Frame label="SIMD lanes fused multiply add">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={14 + i * 8.3} y={26} width={6.6} height={16} fill={i < 12 ? TERR : '#3A312B'} opacity={i < 12 ? 0.9 : 1} />
          ))}
          <text x={14} y={20} fontSize={4.2} fill={BRASS} fontFamily="JetBrains Mono, monospace">ZMM · 512-BIT · 16 fp32</text>
          <text x={14} y={56} fontSize={7} fill={STONE} fontFamily="JetBrains Mono, monospace">a × b + c</text>
          <text x={14} y={70} fontSize={4.4} fill={OLIVE} fontFamily="JetBrains Mono, monospace">ONE INSTRUCTION</text>
          <text x={14} y={80} fontSize={4.4} fill={OLIVE} fontFamily="JetBrains Mono, monospace">ONE ROUNDING</text>
          <text x={14} y={94} fontSize={4.4} fill={BRASS} fontFamily="JetBrains Mono, monospace">32 FLOP / CYC LE / CORE</text>
        </Frame>
      );
    case 'atomics-locks':
      return (
        <Frame label="Contended atomic counter">
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={30 + i * 15} y={28 + (i % 2) * 6} width={11} height={11} fill={TERR} opacity={0.35 + i * 0.1} />
          ))}
          <path d="M34,54 L60,54 L60,62" stroke={BRASS} strokeWidth={0.8} fill="none" />
          <rect x={44} y={64} width={32} height={18} fill={BURG} stroke={TERR} strokeWidth={0.9} />
          <text x={60} y={76} fontSize={5} textAnchor="middle" fill={STONE} fontFamily="JetBrains Mono, monospace">LOCK</text>
          <text x={14} y={94} fontSize={4.4} fill={TERR} fontFamily="JetBrains Mono, monospace">32 THREADS · 1 LINE</text>
        </Frame>
      );
    case 'roofline':
      return (
        <Frame label="Roofline plot">
          <line x1={18} y1={84} x2={148} y2={84} stroke="#3A312B" />
          <line x1={18} y1={18} x2={18} y2={84} stroke="#3A312B" />
          <line x1={18} y1={84} x2={62} y2={26} stroke={BRASS} strokeWidth={1.4} />
          <line x1={62} y1={26} x2={148} y2={26} stroke={OLIVE} strokeWidth={1.4} />
          <circle cx={34} cy={68} r={2.6} fill={TERR} />
          <circle cx={66} cy={34} r={2.6} fill={BRASS} />
          <circle cx={120} cy={26} r={2.6} fill={OLIVE} />
          <text x={18} y={16} fontSize={3.8} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">GFLOPS</text>
          <text x={100} y={94} fontSize={3.8} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">FLOP/BYTE</text>
        </Frame>
      );
    default:
      return <Frame label="Experiment">{null}</Frame>;
  }
}
