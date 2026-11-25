import React from 'react';
import { motion } from 'framer-motion';
import { SimulationStep, ArchitectureTopology } from '../types/simulation';

function Bar({ value, tone = '#B65335', label }: { value: number; tone?: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[6px] flex-1 bg-[#EDE8DE] overflow-hidden">
        <motion.div className="h-full" style={{ backgroundColor: tone }} animate={{ width: `${Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))}%` }} transition={{ duration: 0.5 }} />
      </div>
      {label !== undefined && <span className="w-8 shrink-0 font-mono-tech text-[9px] text-[#5A554C] text-right">{label}</span>}
    </div>
  );
}

/** A precise level meter: hatched track, solid fill, mono read-out. */
function Meter({
  value,
  label,
  tone,
  hotTone,
  hot = false,
  compact = false,
}: {
  value: number;
  label: string;
  tone: string;
  hotTone: string;
  hot?: boolean;
  compact?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div>
      <div
        className={`relative ${compact ? 'h-5' : 'h-8'} w-full overflow-hidden border border-[#D9D2C6] bg-diagonal-stone`}
      >
        <motion.div
          className="absolute bottom-0 left-0 top-0"
          style={{ backgroundColor: hot ? hotTone : tone }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
        {v > 0 && (
          <span
            className="absolute top-0 h-full w-px bg-[#191815]/35"
            style={{ left: `calc(${v}% - 1px)` }}
          />
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-1">
        <span className="font-mono-tech text-[7.5px] tracking-[0.12em] text-[#8B8983]">{label}</span>
        <span className={`font-mono-tech ${compact ? 'text-[7px]' : 'text-[8px]'} tabular-nums ${v > 0 ? 'text-[#191815]' : 'text-[#B0AAA0]'}`}>
          {Math.round(v)}
        </span>
      </div>
    </div>
  );
}

export default function Metrics({ step, topology }: { step: SimulationStep; topology: ArchitectureTopology }) {
  const m = step.metrics;
  const hasCpu = topology !== 'gpu-only';
  const hasGpu = topology !== 'cpu-only';
  const totalCycles = [m.stageCycles.compute, m.stageCycles.memory, m.stageCycles.control, m.stageCycles.stall].reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) || 1;
  const segments = [
    { key: 'COMPUTE', value: m.stageCycles.compute, tone: '#B65335' },
    { key: 'MEMORY', value: m.stageCycles.memory, tone: '#B69A63' },
    { key: 'CONTROL', value: m.stageCycles.control, tone: '#85865A' },
    { key: 'STALL', value: m.stageCycles.stall, tone: '#641E25' },
  ];

  return (
    <div className="border border-[#D9D2C6] bg-[#FFFFFF]">
      <div className="flex items-center justify-between border-b border-[#D9D2C6] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-[#85865A]" />
          <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#191815]">TELEMETRY · MODELLED</span>
        </div>
        <span className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983]">NOT MEASURED HARDWARE</span>
      </div>

      <div className="p-4 space-y-4">
        {/* utilization */}
        <div className="grid grid-cols-1 gap-3">
          {hasCpu && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono-tech text-[8px] tracking-[0.18em] text-[#8B8983]">CPU CORE UTILISATION</span>
                <span className="font-mono-tech text-[9px] text-[#641E25]">
                  {Math.round(m.cpuUtilization.reduce((a, b) => a + b, 0) / 4)}% AVG
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {m.cpuUtilization.map((v, i) => (
                  <Meter key={i} value={v} label={`C${i}`} hot={v > 60} tone="#B65335" hotTone="#641E25" />
                ))}
              </div>
            </div>
          )}

          {hasGpu && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono-tech text-[8px] tracking-[0.18em] text-[#8B8983]">GPU BRIGADE UTILISATION</span>
                <span className="font-mono-tech text-[9px] text-[#7A6438]">
                  {Math.round(m.gpuUtilization.reduce((a, b) => a + b, 0) / 8)}% AVG
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {m.gpuUtilization.map((v, i) => (
                  <Meter key={i} value={v} label={`${i}`} hot={v > 80} tone="#8C7448" hotTone="#B69A63" compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* counters */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-[#EDE8DE] pt-3">
          {[
            ['INSTRUCTIONS', m.instructionsExecuted.toLocaleString()],
            ['CACHE HITS', m.cacheHits.toLocaleString()],
            ['CACHE MISSES', m.cacheMisses.toLocaleString()],
            ['MEMORY ACCESSES', m.memoryAccesses.toLocaleString()],
            ['DATA TRANSFERRED', `${m.bytesTransferred.toLocaleString()} B`],
            [
              'EST. EXECUTION',
              m.estimatedTimeNs <= 0
                ? '—'
                : m.estimatedTimeNs >= 1000
                  ? `${(m.estimatedTimeNs / 1000).toFixed(1)} µs`
                  : `${m.estimatedTimeNs.toFixed(1)} ns`,
            ],
          ].map(([l, v]) => (
            <div key={l} className="flex items-baseline justify-between gap-2">
              <span className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">{l}</span>
              <span className="font-mono-tech text-[10.5px] text-[#191815]">{v}</span>
            </div>
          ))}
        </div>

        {/* stage breakdown */}
        <div className="border-t border-[#EDE8DE] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono-tech text-[8px] tracking-[0.18em] text-[#8B8983]">EXECUTION STAGE MIX</span>
            <span className="font-mono-tech text-[8.5px] text-[#5A554C]">{totalCycles} cyc</span>
          </div>
          <div className="flex h-2 w-full overflow-hidden">
            {segments.map((s) => (
              <motion.div
                key={s.key}
                style={{ backgroundColor: s.tone }}
                animate={{ width: `${Number.isFinite((s.value / totalCycles) * 100) ? (s.value / totalCycles) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: s.tone }} />
                <span className="font-mono-tech text-[7.5px] tracking-[0.1em] text-[#8B8983]">{s.key}</span>
                <span className="ml-auto font-mono-tech text-[8.5px] text-[#5A554C]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* bottleneck callout */}
        <div className="border-t border-[#EDE8DE] pt-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-[8px] tracking-[0.18em] text-[#8B8983]">BOTTLENECK</span>
            <span
              className="px-1.5 py-0.5 font-mono-tech text-[8px] tracking-[0.12em] text-[#F8F6F0]"
              style={{
                backgroundColor:
                  m.bottleneck.severity === 'high' ? '#641E25' : m.bottleneck.severity === 'moderate' ? '#B65335' : '#85865A',
              }}
            >
              {m.bottleneck.severity.toUpperCase()}
            </span>
          </div>
          <div className="mt-1.5 font-sans-ui text-[11.5px] leading-[1.5] text-[#191815]">{m.bottleneck.title}</div>
          <p className="mt-1 font-sans-ui text-[10.5px] leading-[1.6] text-[#5A554C]">{m.bottleneck.beginnerText}</p>
        </div>
      </div>
    </div>
  );
}

export function BottleneckPanel({ step }: { step: SimulationStep }) {
  return (
    <div className="border border-[#D9D2C6] bg-[#EDE8DE]/45 p-4">
      <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">ENGINEERING READING</div>
      <p className="mt-1.5 font-mono-tech text-[10.5px] leading-[1.75] text-[#3A352E]">{step.metrics.bottleneck.engineeringText}</p>
    </div>
  );
}
