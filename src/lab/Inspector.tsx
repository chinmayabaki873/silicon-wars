import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CornerDownRight } from 'lucide-react';
import { ExplanationLevel, SimulationStep } from '../types/simulation';
import { COMPONENT_LOOKUP } from '../data/metaphors';

const statusTone = (s: string) =>
  s === 'MISS' ? '#B65335' : s === 'HIT' ? '#85865A' : s === 'DMA' ? '#B69A63' : '#8B8983';

export default function Inspector({
  step,
  level,
  onLevelChange,
  onSelectComponent,
  onNext,
  canNext,
}: {
  step: SimulationStep;
  level: ExplanationLevel;
  onLevelChange: (l: ExplanationLevel) => void;
  onSelectComponent: (id: SimulationStep['inspector']['primaryComponentId']) => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const i = step.inspector;
  const meta = COMPONENT_LOOKUP[i.primaryComponentId];
  const beginner = level === 'beginner';
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div data-tour="execution-inspector" className="flex h-full flex-col bg-[#F8F6F0]">
      <div className="flex items-center justify-between border-b border-[#D9D2C6] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-[#641E25]" />
          <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#191815]">EXECUTION INSPECTOR</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWhyOpen((v) => !v)}
            className={`px-2 py-1 font-mono-tech text-[8px] tracking-[0.12em] border transition-colors ${
              whyOpen ? 'border-[#641E25] bg-[#641E25] text-[#F8F6F0]' : 'border-[#D9D2C6] text-[#5A554C] hover:border-[#641E25] hover:text-[#641E25]'
            }`}
          >
            WHY AM I SEEING THIS?
          </button>
          <div className="inline-flex border border-[#D9D2C6]">
          {(['beginner', 'engineering'] as ExplanationLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => onLevelChange(l)}
              className={`relative px-2.5 py-1 font-mono-tech text-[8.5px] tracking-[0.14em] transition-colors ${
                level === l ? 'text-[#F8F6F0]' : 'text-[#5A554C] hover:text-[#641E25]'
              }`}
            >
              {level === l && <motion.span layoutId="inspLevel" className="absolute inset-0 bg-[#191815]" transition={{ duration: 0.25 }} />}
              <span className="relative">{l.toUpperCase()}</span>
            </button>
          ))}
        </div>
        </div>
      </div>
      {whyOpen && (
        <div className="border-b border-[#D9D2C6] bg-[#EDE8DE]/60 px-4 py-3 space-y-2">
          <div className="font-mono-tech text-[8px] tracking-[0.18em] text-[#641E25]">
            CONTEXTUAL LEARNING · TWO WAYS TO READ THIS STEP
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border-l-2 border-[#B69A63] pl-2.5">
              <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#7A6438]">SIMPLE (KITCHEN ANALOGY)</div>
              <p className="mt-1 font-sans-ui text-[11px] leading-[1.6] text-[#3A352E]">{i.beginnerExplanation}</p>
            </div>
            <div className="border-l-2 border-[#641E25] pl-2.5">
              <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#641E25]">TECHNICAL (ARCHITECTURE)</div>
              <p className="mt-1 font-sans-ui text-[11px] leading-[1.6] text-[#3A352E]">{i.engineeringExplanation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto dark-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.stepIndex ?? 0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 0.84, 0.24, 1] }}
            className="p-4 lg:p-5"
          >
            {/* step header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">
                  STEP {String((step.stepIndex ?? 0) + 1).padStart(2, '0')} · CYCLE {step.cycle}
                </div>
                <h3 className="mt-1.5 font-display text-[21px] leading-[1.2] text-[#191815]">{i.stepTitle}</h3>
              </div>
              <span className="shrink-0 border border-[#641E25]/30 bg-[#641E25]/08 px-2 py-1 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#641E25]">
                {i.phaseBadge}
              </span>
            </div>

            {/* component bridge */}
            <button
              onClick={() => onSelectComponent(i.primaryComponentId)}
              className="group mt-4 w-full border border-[#D9D2C6] bg-[#FFFFFF] p-3 text-left hover:border-[#B69A63] transition-colors"
            >
              <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">COMPONENT INVOLVED</div>
              <div className="mt-1.5 grid grid-cols-1 gap-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-tech text-[8px] tracking-[0.12em] text-[#641E25] w-[38px] shrink-0">SILICON</span>
                  <span className="font-sans-ui text-[11.5px] leading-[1.4] text-[#191815]">{i.componentHardware}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-tech text-[8px] tracking-[0.12em] text-[#7A6438] w-[38px] shrink-0">KITCHEN</span>
                  <span className="font-display text-[13.5px] italic leading-[1.35] text-[#641E25]">{i.componentKitchen}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#EDE8DE] pt-2">
                <span className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983]">
                  {meta?.roleTag ?? 'ACTIVE COMPONENT'}
                </span>
                <span className="flex items-center gap-1 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#641E25]">
                  LOCATE <CornerDownRight size={10} />
                </span>
              </div>
            </button>

            {/* data table */}
            <div className="mt-4 divide-y divide-[#EDE8DE] border-y border-[#D9D2C6]">
              {[
                ['INSTRUCTION', i.opcode, true],
                ['INPUT DATA', i.inputData, false],
                ['OPERATION', i.operation, false],
                ['OUTPUT DATA', i.outputData, false],
              ].map(([label, value, mono]) => (
                <div key={label as string} className="grid grid-cols-[92px_1fr] gap-3 py-2">
                  <span className="font-mono-tech text-[8px] tracking-[0.18em] text-[#8B8983] pt-[2px]">{label}</span>
                  <span
                    className={
                      mono
                        ? 'font-mono-tech text-[10.5px] leading-[1.6] text-[#191815] break-words'
                        : 'font-sans-ui text-[11.5px] leading-[1.6] text-[#3A352E]'
                    }
                  >
                    {value as string}
                  </span>
                </div>
              ))}
            </div>

            {/* memory access */}
            <div className="mt-4 border border-[#D9D2C6] bg-[#EDE8DE]/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">MEMORY ACCESS</span>
                <span
                  className="px-1.5 py-0.5 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#F8F6F0]"
                  style={{ backgroundColor: statusTone(i.memoryAccess.status) }}
                >
                  {i.memoryAccess.status}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  ['TIER', i.memoryAccess.tier],
                  ['ADDRESS', i.memoryAccess.address],
                  ['LATENCY', `${i.memoryAccess.latencyCycles} cyc`],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div className="font-mono-tech text-[7.5px] tracking-[0.16em] text-[#8B8983]">{l}</div>
                    <div className="mt-0.5 font-mono-tech text-[10px] text-[#191815] truncate" title={v}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* explanation */}
            <div className="mt-4">
              <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">
                {beginner ? 'IN PLAIN LANGUAGE' : 'TECHNICAL NOTE'}
              </div>
              <p className="mt-2 font-sans-ui text-[12px] leading-[1.75] text-[#3A352E]">
                {beginner ? i.beginnerExplanation : i.engineeringExplanation}
              </p>
            </div>

            {/* next step */}
            <button
              onClick={onNext}
              disabled={!canNext}
              className="group mt-5 flex w-full items-start gap-3 border border-[#D9D2C6] bg-[#FFFFFF] p-3 text-left transition-colors hover:border-[#641E25] disabled:opacity-50 disabled:hover:border-[#D9D2C6]"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">NEXT EXECUTION STEP</div>
                <div className="mt-1 font-sans-ui text-[11.5px] leading-[1.55] text-[#3A352E]">
                  {canNext ? i.nextStepPreview : 'Trace complete — reset to run again.'}
                </div>
              </div>
              <ArrowRight size={14} className="mt-1 shrink-0 text-[#641E25] transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
