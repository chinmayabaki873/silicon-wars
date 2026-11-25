import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CanonicalComponentId, KitchenWorker, SimulationStep } from '../types/simulation';
import { SPECIAL_VISUALS } from './visuals';

const STATE_COLOR: Record<KitchenWorker['state'], { ring: string; dot: string; label: string }> = {
  idle: { ring: '#D9D2C6', dot: '#B9B3A8', label: 'IDLE' },
  fetching: { ring: '#B69A63', dot: '#B69A63', label: 'FETCH' },
  computing: { ring: '#B65335', dot: '#B65335', label: 'EXEC' },
  stalled: { ring: '#641E25', dot: '#641E25', label: 'STALL' },
  completed: { ring: '#85865A', dot: '#85865A', label: 'DONE' },
  'diverged-off': { ring: '#8B8983', dot: '#8B8983', label: 'MASKED' },
};

/**
 * TWO PHYSICALLY DIFFERENT CREW GLYPHS
 * -----------------------------------------------------------------
 * CPU = a single master chef: full whites, tall toque, burgundy apron,
 *       standing alone at a station. Few, wide, expensive.
 * GPU = a line cook: no toque (cap instead), narrow build, olive apron,
 *       drawn always in a row of three so the eye reads "many identical".
 * This is the primary CPU-vs-GPU signal in the simulator.
 */
function ChefGlyph({ state, die, small = false }: { state: KitchenWorker['state']; die: 'cpu' | 'gpu'; small?: boolean }) {
  const dim = state === 'idle' || state === 'diverged-off';
  const apron = die === 'cpu' ? '#641E25' : '#85865A';

  if (die === 'cpu') {
    return (
      <svg viewBox="0 0 28 36" width={26} height={33} aria-hidden="true">
        <g opacity={dim ? 0.42 : 1}>
          <ellipse cx={14} cy={34} rx={7} ry={2} fill="rgba(25,24,21,0.18)" />
          <path d="M10,26 L10,33" stroke="#332C25" strokeWidth={3} strokeLinecap="round" />
          <path d="M17,26 L17,33" stroke="#332C25" strokeWidth={3} strokeLinecap="round" />
          <path d="M6,14 L22,14 L19,27 L9,27 Z" fill="#F4EFE5" stroke="#191815" strokeOpacity={0.25} strokeWidth={0.8} />
          <path d="M9,20 L19,20 L18,27 L10,27 Z" fill={apron} />
          <path d="M7,15 L3,22" stroke="#F4EFE5" strokeWidth={3} strokeLinecap="round" />
          <path d="M21,15 L25,22" stroke="#F4EFE5" strokeWidth={3} strokeLinecap="round" />
          <circle cx={14} cy={9.5} r={3.6} fill="#D2A276" />
          {/* tall toque — the CPU chef's silhouette */}
          <path d="M9.5,7 L18.5,7 L17.6,1.6 Q14,-1 10.4,1.6 Z" fill="#F8F6F0" stroke="#191815" strokeOpacity={0.28} strokeWidth={0.8} />
        </g>
        {state === 'stalled' && (
          <g>
            <circle cx={23} cy={5} r={5.6} fill="#641E25" />
            <text x={23} y={7.4} fontSize={6.4} textAnchor="middle" fill="#F8F6F0" fontFamily="JetBrains Mono, monospace">!</text>
          </g>
        )}
        {state === 'completed' && (
          <g>
            <circle cx={23} cy={5} r={5.6} fill="#85865A" />
            <path d="M20.2,5 L22.4,7.2 L26,3.4" stroke="#F8F6F0" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          </g>
        )}
      </svg>
    );
  }

  // GPU line cook — narrow, flat cap, no toque, drawn as a rank of three
  return (
    <svg viewBox="0 0 44 34" width={small ? 30 : 40} height={small ? 23 : 31} aria-hidden="true">
      {[3, 16, 29].map((x, i) => (
        <g key={x} opacity={dim ? 0.34 : 1 - i * 0.16}>
          <ellipse cx={x + 6} cy={32} rx={5} ry={1.6} fill="rgba(25,24,21,0.16)" />
          <path d={`M${x + 4},25 L${x + 4},31`} stroke="#332C25" strokeWidth={2.4} strokeLinecap="round" />
          <path d={`M${x + 8},25 L${x + 8},31`} stroke="#332C25" strokeWidth={2.4} strokeLinecap="round" />
          {/* narrow tunic */}
          <path d={`M${x + 2},13 L${x + 10},13 L${x + 9},25 L${x + 3},25 Z`} fill="#F1EDE2" stroke="#191815" strokeOpacity={0.22} strokeWidth={0.7} />
          <path d={`M${x + 3},18 L${x + 9},18 L${x + 9},25 L${x + 3},25 Z`} fill={apron} />
          <circle cx={x + 6} cy={9.4} r={2.9} fill="#D2A276" />
          {/* flat cap, not a toque */}
          <path d={`M${x + 3.2},7.4 L${x + 8.8},7.4 L${x + 8.8},5.6 Q${x + 6},4.4 ${x + 3.2},5.6 Z`} fill="#F8F6F0" stroke="#191815" strokeOpacity={0.24} strokeWidth={0.7} />
        </g>
      ))}
      {/* lockstep bar: all three move as one */}
      <rect x={2} y={0.5} width={39} height={1.2} fill={apron} opacity={dim ? 0.25 : 0.75} />
      {state === 'stalled' && (
        <g>
          <circle cx={38} cy={7} r={5.2} fill="#641E25" />
          <text x={38} y={9.2} fontSize={6} textAnchor="middle" fill="#F8F6F0" fontFamily="JetBrains Mono, monospace">!</text>
        </g>
      )}
      {state === 'completed' && (
        <g>
          <circle cx={38} cy={7} r={5.2} fill="#85865A" />
          <path d="M35.6,7 L37.6,8.9 L40.8,5.6" stroke="#F8F6F0" strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export function WorkerCard({
  w,
  active,
  onSelect,
  compact = false,
}: {
  w: KitchenWorker;
  active: boolean;
  onSelect: (id: CanonicalComponentId) => void;
  compact?: boolean;
}) {
  const c = STATE_COLOR[w.state];
  const die: 'cpu' | 'gpu' = w.role === 'line-cook' ? 'gpu' : 'cpu';
  const dieTone = die === 'cpu' ? '#641E25' : '#85865A';
  return (
    <button
      onClick={() => onSelect(w.componentId)}
      className={`group relative w-full overflow-hidden text-left border transition-all duration-300 ${
        active ? 'border-[#B69A63] bg-[#29221D]' : 'border-[#332B25] bg-[#211C18] hover:border-[#5A4E43]'
      }`}
    >
      {/* die stripe: burgundy = CPU core, olive = GPU lane */}
      <span className="absolute inset-y-0 left-0 w-[2px]" style={{ backgroundColor: dieTone }} />
      <div className="flex items-center gap-2 p-2 sm:gap-3 sm:p-2.5">
        <div className="relative shrink-0">
          <ChefGlyph state={w.state} die={die} small={compact} />
          <span
            className="absolute -right-0.5 top-0 h-2 w-2 rounded-full ring-2 ring-[#211C18]"
            style={{ backgroundColor: c.dot }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              title={w.label}
              className={`min-w-0 truncate font-mono-tech ${compact ? 'text-[9.5px] tracking-[0.06em]' : 'text-[9px] tracking-[0.14em]'} text-[#B69A63]`}
            >
              {compact ? w.label.toUpperCase().replace('BRIGADE 0', 'B').replace('BRIGADE ', 'B') : w.label.toUpperCase()}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {!compact && (
                <span
                  className="font-mono-tech text-[7px] tracking-[0.1em] px-1 py-[1px]"
                  style={{ color: dieTone, border: `1px solid ${dieTone}` }}
                >
                  {die === 'cpu' ? 'CPU' : 'GPU'}
                </span>
              )}
              <span className={`font-mono-tech ${compact ? 'text-[7px]' : 'text-[8px]'} tracking-[0.12em]`} style={{ color: c.dot }}>
                {c.label}
              </span>
            </span>
          </div>
          {!compact && (
            <div className="mt-0.5 truncate font-sans-ui text-[10.5px] text-[#D9D2C6]/70">
              {w.taskLabel || '—'}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-[3px] min-w-0 flex-1 bg-[#332B25] overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: c.dot }}
                animate={{ width: `${Math.max(3, Math.min(100, Number.isFinite(w.progress) ? w.progress : 0))}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {w.valueBadge && (
              <span className="shrink-0 border border-[#3A312B] bg-[#15130F] px-1 py-0.5 font-mono-tech text-[9px] leading-none text-[#EDE8DE]">
                {w.valueBadge}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function KitchenView({
  step,
  selected,
  onSelect,
  param,
}: {
  step: SimulationStep;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
  param: string;
}) {
  const visuals = SPECIAL_VISUALS[step.specialVisual?.type ?? 'none'];
  const Visual = visuals?.component;
  const cpuWorkers = step.workers.filter((w) => w.role === 'master-chef');
  const gpuWorkers = step.workers.filter((w) => w.role === 'line-cook');

  return (
    <div className="relative bg-[#191815] bg-drafting-charcoal">
      <div className="flex items-center justify-between border-b border-[#332B25] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-[#B65335]" />
          <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#EDE8DE]">
            KITCHEN SIMULATION
          </span>
        </div>
        <span className="font-mono-tech text-[9px] tracking-[0.16em] text-[#8B8983]">
          CYCLE {step.cycle} · {step.stageShort}
        </span>
      </div>

      <div className="p-4 lg:p-5">
        {/* die legend — the whole point: know which silicon you are watching */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[#2C2420] pb-2.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[#641E25]" />
            <span className="font-mono-tech text-[7.5px] tracking-[0.16em] text-[#C9C1B2]">CPU · 16 CORES · 4 CHEFS SHOWN</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 border border-dashed border-[#85865A]"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(133,134,90,0.9) 0.6px, transparent 0.7px)', backgroundSize: '2px 2px' }}
            />
            <span className="font-mono-tech text-[7.5px] tracking-[0.16em] text-[#C9C1B2]">GPU · LINE COOKS IN LOCKSTEP · THROUGHPUT</span>
          </span>
        </div>
        {/* floor / stage visual */}
        <div className="relative min-h-[188px] lg:min-h-[214px] border border-[#2C2420] bg-[#15130F] overflow-hidden">
          {Visual && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${step.stepIndex}-${step.specialVisual?.type}`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                <Visual step={step} param={param} selected={selected} onSelect={onSelect} />
              </motion.div>
            </AnimatePresence>
          )}
          {!Visual && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono-tech text-[9.5px] tracking-[0.18em] text-[#4A443C]">
                STATIONS IDLE · AWAITING ORDERS
              </span>
            </div>
          )}
        </div>

        {/* worker racks */}
        <div
          className={`mt-4 grid grid-cols-1 gap-3 ${
            cpuWorkers.length > 0 && gpuWorkers.length > 0 ? 'lg:grid-cols-1' : 'sm:grid-cols-2'
          }`}
        >
          {cpuWorkers.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">
                  <span className="inline-block h-2 w-2 bg-[#641E25]" />
                  CPU STATIONS
                  <span className="text-[7.5px] tracking-[0.1em] text-[#6E6A63]">RYZEN 9 8940HX</span>
                </span>
                <span className="font-mono-tech text-[8.5px] tracking-[0.16em] text-[#6E6A63]">
                  {cpuWorkers.filter((w) => w.state !== 'idle').length}/{cpuWorkers.length} ACTIVE
                </span>
              </div>
              <div className="space-y-1.5">
                {cpuWorkers.map((w) => (
                  <WorkerCard
                    key={w.id}
                    w={w}
                    active={selected === w.componentId}
                    onSelect={onSelect}
                    compact={cpuWorkers.length > 4}
                  />
                ))}
              </div>
            </div>
          )}

          {gpuWorkers.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">
                  <span className="inline-block h-2 w-2 border border-dashed border-[#85865A] bg-[#85865A]/30" />
                  GPU BRIGADES
                  <span className="text-[7.5px] tracking-[0.1em] text-[#6E6A63]">RTX 5060 · 26 SM</span>
                </span>
                <span className="font-mono-tech text-[8.5px] tracking-[0.16em] text-[#6E6A63]">
                  {gpuWorkers.filter((w) => w.state !== 'idle' && w.state !== 'diverged-off').length}/{gpuWorkers.length} ACTIVE
                </span>
              </div>
              <div className={`grid gap-1.5 ${gpuWorkers.length > 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
                {gpuWorkers.map((w) => (
                  <WorkerCard key={w.id} w={w} active={selected === w.componentId} onSelect={onSelect} compact />
                ))}
              </div>
            </div>
          )}

          {cpuWorkers.length === 0 && gpuWorkers.length === 0 && (
            <div className="col-span-2 border border-dashed border-[#332B25] p-6 text-center">
              <span className="font-mono-tech text-[9.5px] tracking-[0.18em] text-[#6E6A63]">
                NO CREW ASSIGNED TO THIS TOPOLOGY
              </span>
            </div>
          )}
        </div>

        {/* memory shelves — the storage side of the kitchen */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            ['L1 RACK', step.storageHighlights.l1Text],
            ['REGISTERS', step.storageHighlights.registersText],
            ['PANTRY (RAM)', step.storageHighlights.ramText],
            ...(step.storageHighlights.vramText
              ? [['VRAM WAREHOUSE', step.storageHighlights.vramText] as [string, string]]
              : [['SHARED TABLE', step.storageHighlights.sharedMemText ?? '—'] as [string, string]]),
          ].map(([label, value]) => (
            <div key={label} className="border border-[#2C2420] bg-[#1B1713] p-2.5">
              <div className="font-mono-tech text-[7.5px] tracking-[0.18em] text-[#6E6A63]">{label}</div>
              <div className="mt-1 font-mono-tech text-[9.5px] leading-[1.5] text-[#D9D2C6]/80">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
