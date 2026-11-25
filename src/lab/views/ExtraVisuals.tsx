import React from 'react';
import { VisualProps } from './types';

const MONO = 'JetBrains Mono, monospace';
const CPU = '#F0B7AC'; // CPU text accent inside dark panes
const GPU = '#D6D79C'; // GPU text accent
const MUTED = '#6E6A63';
const PIP = '#2C2420';

const Caption = ({ x, y, children }: { x: number; y: number; children: React.ReactNode }) => (
  <text x={x} y={y} fontSize={6.6} fill={MUTED} fontFamily={MONO} letterSpacing={1.5}>
    {children}
  </text>
);

/* ================================================================== */
/*  Register file + assembly listing (EXP-11)                          */
/* ================================================================== */

export function RegisterVisual({ step }: VisualProps) {
  const v = step.specialVisual;
  const regs = v?.registers ?? [];
  const asm = v?.asmLines ?? [];
  const ROLE: Record<string, string> = { arg: '#85865A', temp: '#B69A63', result: '#B65335', pointer: '#8B8983' };

  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>REGISTER FILE · WHAT THE CORE CAN TOUCH IN ONE CYCLE</Caption>

      {regs.map((r, i) => {
        const y = 26 + i * 26;
        return (
          <g key={`${r.name}-${i}`}>
            <rect
              x={14}
              y={y}
              width={140}
              height={21}
              fill={r.hot ? '#241E1A' : '#1B1815'}
              stroke={r.hot ? ROLE[r.role] ?? '#5A4E43' : PIP}
              strokeWidth={r.hot ? 1 : 0.7}
            />
            <rect x={14} y={y} width={2.5} height={21} fill={ROLE[r.role] ?? '#5A4E43'} />
            <text x={22} y={y + 9} fontSize={8} fill="#EDE8DE" fontFamily={MONO}>
              {r.name}
            </text>
            <text x={22} y={y + 17} fontSize={6} fill={MUTED} fontFamily={MONO}>
              {r.role.toUpperCase()}
            </text>
            <text x={148} y={y + 14} fontSize={8.5} textAnchor="end" fill={r.hot ? '#F8F6F0' : '#7A7469'} fontFamily={MONO}>
              {r.value}
            </text>
            {r.note && (
              <text x={162} y={y + 13} fontSize={5.8} fill="#57524A" fontFamily={MONO}>
                {r.note.length > 62 ? r.note.slice(0, 62) + '…' : r.note}
              </text>
            )}
          </g>
        );
      })}

      {/* assembly listing */}
      <line x1={14} y1={152} x2={466} y2={152} stroke={PIP} />
      <Caption x={14} y={166}>GENERATED ASSEMBLY</Caption>
      {asm.slice(0, 8).map((l, i) => (
        <g key={i}>
          <text
            x={16 + l.indent * 8}
            y={178 + i * 7}
            fontSize={6.2}
            fill={l.tone === 'note' ? '#8B8983' : '#D9D2C6'}
            fontFamily={MONO}
          >
            {l.text}
          </text>
          {l.comment && (
            <text x={300} y={178 + i * 7} fontSize={5.6} fill="#57524A" fontFamily={MONO}>
              {l.comment}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Instruction bit fields (EXP-12)                                    */
/* ================================================================== */

export function BitFieldVisual({ step }: VisualProps) {
  const fields = step.specialVisual?.bitFields ?? [];
  const total = fields.reduce((a, f) => a + f.bits, 0) || 1;
  let cursor = 14;
  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={16}>INSTRUCTION ENCODING · {total} BITS · LITTLE-ENDIAN BYTES</Caption>

      {fields.map((f, i) => {
        const w = (452 * f.bits) / total;
        const x = cursor;
        cursor += w;
        return (
          <g key={i}>
            <rect x={x} y={30} width={w - 1.5} height={34} fill={f.tone} opacity={0.32} stroke={f.tone} strokeWidth={0.8} />
            <text x={x + w / 2 - 0.75} y={46} fontSize={8} textAnchor="middle" fill="#F8F6F0" fontFamily={MONO}>
              {f.value}
            </text>
            <text x={x + w / 2 - 0.75} y={57} fontSize={5.4} textAnchor="middle" fill="#EDE8DE" opacity={0.75} fontFamily={MONO}>
              {f.bits} bit
            </text>
            <text x={x + w / 2 - 0.75} y={76} fontSize={5.8} textAnchor="middle" fill={f.tone} fontFamily={MONO} letterSpacing={0.5}>
              {f.name}
            </text>
            <text x={x + w / 2 - 0.75} y={86} fontSize={5.2} textAnchor="middle" fill={MUTED} fontFamily={MONO}>
              {f.meaning.length > 22 ? f.meaning.slice(0, 22) + '…' : f.meaning}
            </text>
          </g>
        );
      })}

      {/* bit ruler */}
      <line x1={14} y1={100} x2={466} y2={100} stroke={PIP} />
      {[0, 8, 16, 24, 32, 40, 48, 56, 64].map((b) => (
        <text key={b} x={14 + (452 * b) / Math.max(total, 64)} y={112} fontSize={5} fill="#4A443C" fontFamily={MONO} textAnchor="middle">
          {b}
        </text>
      ))}

      {/* decode result */}
      <rect x={14} y={126} width={452} height={40} fill="#1B1815" stroke={PIP} />
      <text x={22} y={141} fontSize={6.4} fill={MUTED} fontFamily={MONO} letterSpacing={1.2}>
        DECODER RESULT
      </text>
      <text x={22} y={156} fontSize={7.6} fill={CPU} fontFamily={MONO}>
        {fields.map((f) => f.meaning).join(' · ')}
      </text>

      <text x={14} y={186} fontSize={6} fill="#57524A" fontFamily={MONO}>
        x86 length is only known after ModRM — fixed-width ISAs decode in parallel.
      </text>
      <text x={14} y={200} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Prefixes change meaning of every following byte; that is the CISC trade.
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  ISA stack: C → PTX → SASS → x86 (EXP-13)                           */
/* ================================================================== */

export function IsaStackVisual({ step }: VisualProps) {
  const stack = step.specialVisual?.isaStack ?? [];
  const activeIdx = (step.specialVisual as any)?.isaStack?.findIndex?.((s: any) => s.active) ?? -1;
  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>ONE KERNEL · FOUR MACHINE VIEWS</Caption>
      {stack.map((s, i) => {
        const x = 14 + i * 116;
        const on = i === activeIdx;
        const tone = s.level === 'c' ? '#8B8983' : s.level === 'ptx' ? '#85865A' : s.level === 'sass' ? '#B69A63' : '#B65335';
        return (
          <g key={i}>
            <rect x={x} y={28} width={108} height={150} fill={on ? '#241E1A' : '#1B1815'} stroke={on ? tone : PIP} strokeWidth={on ? 1.1 : 0.7} />
            <rect x={x} y={28} width={108} height={3} fill={tone} opacity={on ? 1 : 0.45} />
            <text x={x + 8} y={44} fontSize={6} fill={tone} fontFamily={MONO} letterSpacing={1.1}>
              {s.level.toUpperCase()}
            </text>
            <text x={x + 8} y={54} fontSize={5.4} fill={MUTED} fontFamily={MONO}>
              {s.cost}
            </text>
            {s.lines.slice(0, 9).map((ln, k) => (
              <text
                key={k}
                x={x + 6}
                y={68 + k * 11}
                fontSize={4.9}
                fill={on ? '#D9D2C6' : '#6E6A63'}
                fontFamily={MONO}
              >
                {ln.length > 30 ? ln.slice(0, 30) + '…' : ln}
              </text>
            ))}
            {i < stack.length - 1 && (
              <g>
                <line x1={x + 108} y1={103} x2={x + 116} y2={103} stroke="#5A4E43" strokeWidth={0.9} />
                <path d={`M${x + 116},103 l-3,-2 v4 Z`} fill="#5A4E43" />
              </g>
            )}
          </g>
        );
      })}
      <text x={14} y={196} fontSize={6} fill="#57524A" fontFamily={MONO}>
        nvcc: C++ → NVVM IR → PTX. The driver then JIT-compiles PTX into SASS for the exact SM count.
      </text>
      <text x={14} y={208} fontSize={6} fill="#57524A" fontFamily={MONO}>
        gcc: C++ → GIMPLE → RTL → x86-64. Same source, completely different scheduling contract.
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  Branch predictor history (EXP-14)                                  */
/* ================================================================== */

export function PredictorVisual({ step }: VisualProps) {
  const rows = step.specialVisual?.predictor ?? [];
  const hits = rows.filter((r) => r.predicted === r.actual).length;
  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>BRANCH HISTORY · PREDICTED vs ACTUAL</Caption>

      {rows.slice(0, 12).map((r, i) => {
        const x = 18 + i * 38;
        const ok = r.predicted === r.actual;
        return (
          <g key={i}>
            <rect x={x} y={26} width={30} height={54} fill={ok ? '#1E2418' : '#2A1418'} stroke={ok ? '#3C4429' : '#5A1E25'} strokeWidth={0.8} />
            <text x={x + 15} y={40} fontSize={6} textAnchor="middle" fill={MUTED} fontFamily={MONO}>
              B{i + 1}
            </text>
            <text x={x + 15} y={55} fontSize={9} textAnchor="middle" fill="#B69A63" fontFamily={MONO}>
              {r.predicted}
            </text>
            <text x={x + 15} y={70} fontSize={9} textAnchor="middle" fill="#EDE8DE" fontFamily={MONO}>
              {r.actual}
            </text>
            <text x={x + 15} y={92} fontSize={5.4} textAnchor="middle" fill={ok ? '#85865A' : '#B65335'} fontFamily={MONO}>
              {ok ? 'HIT' : `+${r.cost}`}
            </text>
          </g>
        );
      })}

      <text x={18} y={112} fontSize={5} fill="#4A443C" fontFamily={MONO}>
        PREDICTED (BRASS) / ACTUAL (IVORY)
      </text>

      <line x1={14} y1={122} x2={466} y2={122} stroke={PIP} />

      <text x={14} y={138} fontSize={6.4} fill={MUTED} fontFamily={MONO} letterSpacing={1.2}>
        ACCURACY
      </text>
      <rect x={14} y={144} width={452} height={12} fill="#1B1815" stroke={PIP} />
      <rect
        x={14}
        y={144}
        height={12}
        width={Number.isFinite(hits) ? (452 * hits) / Math.max(rows.length, 1) : 0}
        fill="#85865A"
      />
      <text x={22} y={153} fontSize={6.4} fill="#191815" fontFamily={MONO}>
        {Math.round((hits / Math.max(rows.length, 1)) * 100)}% CORRECT
      </text>

      <text x={14} y={176} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Each mispredict discards up to 18 cycles of speculative work on Zen 4.
      </text>
      <text x={14} y={190} fontSize={6} fill="#57524A" fontFamily={MONO}>
        On a divergent GPU warp, no guess is made: both paths run, one mask at a time.
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  Thread scaling (EXP-15)                                            */
/* ================================================================== */

export function ScalingVisual({ step }: VisualProps) {
  const rows = step.specialVisual?.threadScaling ?? [];
  const maxIdeal = 32;
  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>SPEED-UP vs THREAD COUNT · RYZEN 9 8940HX</Caption>

      {/* ideal line */}
      {rows.map((r, i) => {
        const x = 30 + i * 72;
        const hIdeal = (150 * r.ideal) / maxIdeal;
        const hReal = (150 * r.speedup) / 12;
        return (
          <g key={i}>
            <line x1={x} y1={190 - hIdeal} x2={x} y2={190} stroke="#3A312B" strokeDasharray="2 2" strokeWidth={0.7} />
            <rect
              x={x - 15}
              y={190 - Math.min(hReal, 160)}
              width={30}
              height={Math.min(hReal, 160)}
              fill={r.active ? '#641E25' : '#3A2620'}
              stroke={r.active ? '#B65335' : '#4A3A32'}
              strokeWidth={0.8}
            />
            <text x={x} y={204} fontSize={4.6} fill={MUTED} fontFamily={MONO} textAnchor="middle">
              {r.threads}
            </text>
            <text x={x} y={190 - Math.min(hReal, 160) - 4} fontSize={6.4} textAnchor="middle" fill={r.active ? '#F8F6F0' : '#B69A63'} fontFamily={MONO}>
              {r.speedup}×
            </text>
            {r.note && (
              <text x={x} y={214} fontSize={4.2} fill="#57524A" fontFamily={MONO} textAnchor="middle">
                {r.note}
              </text>
            )}
          </g>
        );
      })}

      <line x1={14} y1={190} x2={466} y2={190} stroke={PIP} />
      <text x={14} y={186} fontSize={5} fill="#4A443C" fontFamily={MONO}>
        IDEAL = LINEAR (DASHED)
      </text>
      <text x={466} y={186} fontSize={5} fill="#4A443C" fontFamily={MONO} textAnchor="end">
        THREADS
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  Cache line / false sharing (EXP-16)                                */
/* ================================================================== */

export function CacheLineVisual({ step }: VisualProps) {
  const cl = step.specialVisual?.cacheLine;
  const bytes = cl?.bytes ?? [];
  const OWN: Record<string, { fill: string; label: string }> = {
    A: { fill: '#641E25', label: 'CORE 0' },
    B: { fill: '#85865A', label: 'CORE 1' },
    shared: { fill: '#B69A63', label: 'SHARED' },
    free: { fill: '#1B1815', label: '—' },
  };
  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>64-BYTE CACHE LINE · {cl?.lineAddr ?? ''}</Caption>

      {bytes.map((b, i) => {
        const x = 14 + i * 57;
        const o = OWN[b.owner] ?? OWN.free;
        return (
          <g key={i}>
            <rect x={x} y={28} width={54} height={40} fill={o.fill} opacity={b.hot ? 0.55 : 0.18} stroke={b.hot ? o.fill : PIP} strokeWidth={b.hot ? 1.1 : 0.7} />
            <text x={x + 27} y={44} fontSize={5.4} textAnchor="middle" fill="#8B8983" fontFamily={MONO}>
              +{b.tag}B
            </text>
            <text x={x + 27} y={58} fontSize={5.6} textAnchor="middle" fill={b.hot ? '#F8F6F0' : '#57524A'} fontFamily={MONO}>
              {b.owner === 'free' ? '—' : o.label}
            </text>
          </g>
        );
      })}

      <text x={14} y={84} fontSize={6} fill={cl?.note?.includes('share') ? '#B65335' : '#85865A'} fontFamily={MONO}>
        {cl?.note ?? ''}
      </text>

      {/* the ping-pong trace */}
      <line x1={14} y1={100} x2={466} y2={100} stroke={PIP} />
      <Caption x={14} y={116}>COHERENCE TRAFFIC</Caption>
      {[0, 1, 2, 3, 4].map((i) => {
        const bad = cl?.note?.includes('share');
        const x = 24 + i * 88;
        return (
          <g key={i} opacity={bad ? 1 - i * 0.13 : 0.5}>
            <rect x={x} y={124} width={70} height={16} fill={bad ? '#2A1418' : '#1E2418'} stroke={bad ? '#5A1E25' : '#3C4429'} />
            <text x={x + 35} y={135} fontSize={5.4} textAnchor="middle" fill={bad ? '#E0A79D' : '#B9C08A'} fontFamily={MONO}>
              {bad ? 'RFO + INV' : 'L1 HIT'}
            </text>
          </g>
        );
      })}

      <text x={14} y={164} fontSize={6} fill="#57524A" fontFamily={MONO}>
        {cl?.note?.includes('share')
          ? 'Every store takes exclusive ownership: ~46 cycles per write instead of 1.'
          : 'Each counter owns its line: stores never leave the local L1 (~1 cycle).'}
      </text>
      <text x={14} y={178} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Nothing is logically shared — the 64-byte granularity creates the interference.
      </text>
      <text x={14} y={192} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Fix: alignas(64), padding, or per-thread accumulators reduced at the end.
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  Dependency graph / ILP (EXP-17)                                    */
/* ================================================================== */

export function DependencyVisual({ step }: VisualProps) {
  const g = step.specialVisual?.dependencyGraph;
  const nodes = g?.nodes ?? [];
  const edges = g?.edges ?? [];
  const lanes = 4;
  const px = (lane: number) => 60 + lane * 100;
  const py = (cycle: number) => 26 + (cycle - 1) * 22;
  const TONE = { ready: '#B69A63', waiting: '#5A4E43', done: '#85865A', stalled: '#B65335' };

  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>DEPENDENCY GRAPH · ISSUE SLOTS PER CYCLE</Caption>

      {[0, 1, 2, 3].map((l) => (
        <g key={l}>
          <text x={16} y={py(1) + l * 0 + 4} fontSize={0} fill="none">
            {l}
          </text>
          <line x1={px(l)} y1={22} x2={px(l)} y2={210} stroke="#241F1B" strokeDasharray="2 3" />
          <text x={px(l)} y={212} fontSize={4.6} textAnchor="middle" fill="#4A443C" fontFamily={MONO}>
            PIPE {l}
          </text>
        </g>
      ))}

      {edges.map(([a, b], i) => {
        const A = nodes[a];
        const B = nodes[b];
        if (!A || !B) return null;
        return (
          <line
            key={i}
            x1={px(A.lane)}
            y1={py(A.cycle) + 6}
            x2={px(B.lane)}
            y2={py(B.cycle) - 6}
            stroke="#4A3F36"
            strokeWidth={0.7}
          />
        );
      })}

      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={px(n.lane) - 22} y={py(n.cycle) - 6} width={44} height={13} fill="#1E1A16" stroke={TONE[n.status]} strokeWidth={0.8} />
          <text x={px(n.lane)} y={py(n.cycle) + 3} fontSize={5.4} textAnchor="middle" fill={TONE[n.status]} fontFamily={MONO}>
            {n.op}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  SIMD lanes (EXP-18)                                                */
/* ================================================================== */

export function SimdVisual({ step }: VisualProps) {
  const s = step.specialVisual?.simd;
  const lanes = s?.lanes ?? [];
  const cols = 16;
  const per = 22 / 2;
  const TONE = { idle: '#241F1B', loaded: '#5A4E43', fma: '#B65335', done: '#85865A' };

  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>
        {s?.scalar ? 'SCALAR · 1 LANE OF A 512-BIT UNIT' : `${s?.width ?? 16} LANES · ONE INSTRUCTION`}
      </Caption>

      {lanes.slice(0, 64).map((l, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 14 + col * 28.4;
        const y = 28 + row * 26;
        const on = l.state === 'fma' || l.state === 'done';
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={25}
              height={19}
              fill={on ? TONE[l.state] : '#1B1815'}
              fillOpacity={on ? 0.42 : 1}
              stroke={on ? TONE[l.state] : PIP}
              strokeWidth={on ? 0.9 : 0.6}
            />
            <text x={x + 12.5} y={y + 12.5} fontSize={4.6} textAnchor="middle" fill={on ? '#F8F6F0' : '#4A443C'} fontFamily={MONO}>
              {l.value}
            </text>
          </g>
        );
      })}

      <line x1={14} y1={lanes.length > 16 ? 88 : 60} x2={466} y2={lanes.length > 16 ? 88 : 60} stroke={PIP} />

      <text x={14} y={lanes.length > 16 ? 104 : 76} fontSize={6.4} fill={MUTED} fontFamily={MONO} letterSpacing={1.2}>
        {s?.fma ? 'a × b + c FUSED — ONE ROUNDING' : 'a + b'}
      </text>
      <text x={14} y={lanes.length > 16 ? 120 : 92} fontSize={6.4} fill={GPU} fontFamily={MONO}>
        {s?.scalar
          ? '1 FLOP per instruction · 15/16 of the unit idle'
          : s?.width === 64
            ? '128 FLOP per instruction (64 MACs) · tensor core'
            : '32 FLOP per instruction (16 FMA lanes)'}
      </text>

      <text x={14} y={196} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Multiplication and addition share one instruction and one rounding step.
      </text>
      <text x={14} y={208} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Higher precision per instruction: fma(a,b,c) ≥ (a×b)+c in accuracy.
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  Contention / atomics (EXP-19)                                      */
/* ================================================================== */

export function ContentionVisual({ step }: VisualProps) {
  const c = step.specialVisual?.contention;
  const banks = c?.banks ?? [];
  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={14}>CACHE-LINE OWNERSHIP · 32 THREADS, ONE ADDRESS</Caption>

      {banks.map((b, i) => {
        const x = 16 + i * 56;
        const hot = b.conflict;
        return (
          <g key={i}>
            <rect x={x} y={28} width={48} height={58} fill={hot ? '#2A1418' : '#1B1815'} stroke={hot ? '#5A1E25' : PIP} strokeWidth={hot ? 1 : 0.7} />
            <text x={x + 24} y={42} fontSize={5.4} textAnchor="middle" fill={MUTED} fontFamily={MONO}>
              BANK {b.bank}
            </text>
            {hot &&
              Array.from({ length: 6 }).map((_, k) => (
                <rect key={k} x={x + 8 + (k % 3) * 11} y={50 + Math.floor(k / 3) * 16} width={9} height={13} fill="#B65335" opacity={0.4 + k * 0.09} />
              ))}
            <text x={x + 24} y={80} fontSize={5} textAnchor="middle" fill={hot ? '#E0A79D' : '#3F3A33'} fontFamily={MONO}>
              {hot ? `${b.accesses}` : '—'}
            </text>
          </g>
        );
      })}

      <line x1={14} y1={98} x2={466} y2={98} stroke={PIP} />

      <text x={14} y={114} fontSize={6.4} fill={MUTED} fontFamily={MONO} letterSpacing={1.2}>
        SERIALISED COST
      </text>
      <rect x={14} y={120} width={220} height={11} fill="#1B1815" stroke={PIP} />
      <rect x={14} y={120} height={11} width={220} fill="#B65335" opacity={0.85} />
      <text x={240} y={129} fontSize={6} fill="#E0A79D" fontFamily={MONO}>
        {c?.serialized ?? 0} cyc (contended)
      </text>

      <rect x={14} y={136} width={220} height={11} fill="#1B1815" stroke={PIP} />
      <rect x={14} y={136} height={11} width={Math.max(4, Math.min(220, ((c?.ideal ?? 1) / Math.max(c?.serialized ?? 1, 1)) * 220))} fill="#85865A" opacity={0.9} />
      <text x={240} y={145} fontSize={6} fill="#B9C08A" fontFamily={MONO}>
        {c?.ideal ?? 0} cyc (ideal)
      </text>

      <text x={14} y={172} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Every thread contends for exclusive ownership of the same 64-byte line.
      </text>
      <text x={14} y={186} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Correctness costs serialisation: the guarantee is the bottleneck, not the ALU.
      </text>
      <text x={14} y={200} fontSize={6} fill="#57524A" fontFamily={MONO}>
        Mitigation: privatise per thread/warp, then reduce once at the end.
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  Roofline (EXP-20)                                                  */
/* ================================================================== */

export function RooflineVisual({ step }: VisualProps) {
  const r = step.specialVisual?.roofline;
  const pts = r?.points ?? [];
  const peakTf = r?.peakTflops ?? 9.7;
  const peakGbs = r?.peakGbs ?? 384;
  const ridge = r?.ridge ?? 25.3;

  // plot box
  const L = 46, R = 452, T = 34, B = 178;
  const xOf = (ai: number) => L + ((Math.log10(ai) + 1.3) / (Math.log10(400) + 1.3)) * (R - L);
  const yOf = (gf: number) => B - (Math.log10(Math.max(gf, 1)) / Math.log10(20000)) * (B - T);

  const ridgeX = xOf(ridge);
  const roofY = yOf(peakTf * 1000);

  return (
    <svg viewBox="0 0 480 232" className="h-full w-full">
      <Caption x={14} y={16}>ROOFLINE · RTX 5060 LAPTOP · {peakTf} TFLOPS / {peakGbs} GB/s</Caption>

      {/* grid */}
      {[10, 100, 1000, 10000].map((gf) => (
        <line key={gf} x1={L} y1={yOf(gf)} x2={R} y2={yOf(gf)} stroke="#241F1B" strokeWidth={0.6} />
      ))}
      {[0.1, 1, 10, 100].map((ai) => (
        <line key={ai} x1={xOf(ai)} y1={T} x2={xOf(ai)} y2={B} stroke="#241F1B" strokeWidth={0.6} />
      ))}

      {/* axes */}
      <line x1={L} y1={B} x2={R} y2={B} stroke="#3A312B" strokeWidth={0.9} />
      <line x1={L} y1={T} x2={L} y2={B} stroke="#3A312B" strokeWidth={0.9} />

      {/* y labels */}
      {[10, 100, 1000, 10000].map((gf) => (
        <text key={gf} x={L - 5} y={yOf(gf) + 2.2} fontSize={4.8} textAnchor="end" fill="#6E6A63" fontFamily={MONO}>
          {gf >= 1000 ? `${gf / 1000}k` : gf}
        </text>
      ))}
      <text x={L - 30} y={T - 8} fontSize={5} fill="#4A443C" fontFamily={MONO}>
        GFLOPS
      </text>

      {/* x labels */}
      {[0.1, 1, 10, 100].map((ai) => (
        <text key={ai} x={xOf(ai)} y={B + 9} fontSize={5.2} textAnchor="middle" fill="#6E6A63" fontFamily={MONO}>
          {ai}
        </text>
      ))}
      <text x={R} y={B + 20} fontSize={5} textAnchor="end" fill="#4A443C" fontFamily={MONO}>
        ARITHMETIC INTENSITY · FLOP/BYTE
      </text>

      {/* bandwidth roof */}
      <line x1={xOf(0.02)} y1={yOf(Math.max(0.02 * peakGbs, 1))} x2={ridgeX} y2={roofY} stroke="#B69A63" strokeWidth={2} />
      {/* compute roof */}
      <line x1={ridgeX} y1={roofY} x2={R} y2={roofY} stroke="#85865A" strokeWidth={2} />

      {/* ridge marker */}
      <line x1={ridgeX} y1={roofY} x2={ridgeX} y2={B} stroke="#4A443C" strokeDasharray="2 3" strokeWidth={0.7} />
      <text x={ridgeX + 3} y={B - 3} fontSize={4.8} fill="#8B8983" fontFamily={MONO}>
        RIDGE {ridge}
      </text>

      <text x={xOf(0.03) + 4} y={yOf(Math.max(0.03 * peakGbs, 1)) - 5} fontSize={5.4} fill="#B69A63" fontFamily={MONO}>
        {peakGbs} GB/s
      </text>
      <text x={R - 2} y={roofY - 6} fontSize={5.4} textAnchor="end" fill="#85865A" fontFamily={MONO}>
        {peakTf} TFLOPS · COMPUTE ROOF
      </text>

      {pts.map((p, i) => {
        const x = xOf(p.ai);
        const y = yOf(p.gflops);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={p.active ? 5.5 : 3.4} fill={p.active ? p.tone : '#191815'} stroke={p.tone} strokeWidth={1.3} />
            {p.active && <circle cx={x} cy={y} r={9} fill="none" stroke={p.tone} strokeWidth={0.6} opacity={0.5} />}
            <text
              x={x + 9}
              y={y + 2}
              fontSize={p.active ? 6.2 : 5.4}
              fill={p.active ? '#F8F6F0' : '#8B8983'}
              fontFamily={MONO}
            >
              {p.label}
            </text>
            <text x={x + 9} y={y + 8.5} fontSize={4.6} fill={p.active ? p.tone : '#57524A'} fontFamily={MONO}>
              AI {p.ai} · {p.gflops >= 1000 ? (p.gflops / 1000).toFixed(1) + ' TF' : p.gflops + ' GF'}
            </text>
          </g>
        );
      })}

      <text x={14} y={214} fontSize={5.4} fill="#57524A" fontFamily={MONO}>
        Below the ridge the memory roof binds; above it the compute roof binds.
      </text>
    </svg>
  );
}
