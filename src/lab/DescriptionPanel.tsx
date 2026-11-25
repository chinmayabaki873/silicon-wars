import React from 'react';
import { ExperimentMeta, ExplanationLevel, SimulationStep } from '../types/simulation';
import { RIG_CPU, RIG_GPU } from '../data/rig';

export default function DescriptionPanel({
  exp,
  step,
  param,
  level,
}: {
  exp: ExperimentMeta;
  step: SimulationStep;
  param: string;
  level: ExplanationLevel;
}) {
  const activeOption = exp.paramOptions.find((o) => o.value === param) ?? exp.paramOptions[0];
  const m = step.metrics;
  const totalCycles =
    m.stageCycles.compute + m.stageCycles.memory + m.stageCycles.control + m.stageCycles.stall || 1;
  const computePct = Math.round((m.stageCycles.compute / totalCycles) * 100);
  const memoryPct = Math.round((m.stageCycles.memory / totalCycles) * 100);
  const stallPct = Math.round((m.stageCycles.stall / totalCycles) * 100);

  const dieBadge =
    exp.topology === 'cpu-only'
      ? { label: `CPU ONLY · ${RIG_CPU.name}`, tone: '#641E25' }
      : exp.topology === 'gpu-only'
        ? { label: `GPU ONLY · ${RIG_GPU.name}`, tone: '#85865A' }
        : { label: 'HETEROGENEOUS · CPU + GPU', tone: '#B69A63' };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="border border-[#D9D2C6] bg-[#FFFFFF]">
        <div className="flex items-center justify-between border-b border-[#D9D2C6] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5" style={{ backgroundColor: dieBadge.tone }} />
            <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#191815]">
              EXPERIMENT DESCRIPTION
            </span>
          </div>
          <span className="font-mono-tech text-[8px] tracking-[0.14em]" style={{ color: dieBadge.tone }}>
            {dieBadge.label}
          </span>
        </div>

        <div className="divide-y divide-[#EDE8DE] p-4 space-y-4">
          {/* 1. What is this experiment */}
          <div>
            <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">
              01 · WHAT IS THIS EXPERIMENT
            </div>
            <h3 className="mt-1 font-display text-[20px] leading-[1.2] text-[#191815]">
              {exp.number} — {exp.title}
            </h3>
            <p className="mt-1.5 font-sans-ui text-[12px] leading-[1.7] text-[#3A352E]">
              {exp.shortExplanation}
            </p>
          </div>

          {/* 2. What it does */}
          <div className="pt-3.5">
            <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">
              02 · WHAT IT DOES
            </div>
            {activeOption && (
              <div className="mt-1.5 border-l-2 border-[#B69A63] bg-[#F8F6F0] px-3 py-2">
                <div className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#7A6438]">
                  ACTIVE MODE: {activeOption.label.toUpperCase()}
                </div>
                <p className="mt-0.5 font-sans-ui text-[11.5px] leading-[1.6] text-[#3A352E]">
                  {activeOption.description}
                </p>
              </div>
            )}
            <ul className="mt-2.5 space-y-1">
              {exp.learningObjectives.map((obj) => (
                <li key={obj} className="flex gap-2 font-sans-ui text-[11.5px] leading-[1.6] text-[#5A554C]">
                  <span className="font-mono-tech text-[9px] text-[#B65335]">→</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. What is happening */}
          <div className="pt-3.5">
            <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">
              03 · WHAT IS HAPPENING (STEP {(step.stepIndex ?? 0) + 1})
            </div>
            <div className="mt-1 font-sans-ui text-[13px] font-medium text-[#191815]">
              {step.stageShort}
            </div>
            <p className="mt-1 font-sans-ui text-[11.5px] leading-[1.7] text-[#3A352E]">
              {level === 'beginner'
                ? step.inspector.beginnerExplanation
                : step.inspector.engineeringExplanation}
            </p>
          </div>

          {/* 4. What result we get */}
          <div className="pt-3.5">
            <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">
              04 · WHAT RESULT WE GET
            </div>
            <div className="mt-1.5 font-sans-ui text-[12px] font-medium text-[#191815]">
              {m.bottleneck.title}
            </div>
            <p className="mt-1 font-sans-ui text-[11.5px] leading-[1.7] text-[#3A352E]">
              {level === 'beginner' ? m.bottleneck.beginnerText : m.bottleneck.engineeringText}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#EDE8DE] pt-2.5">
              <div>
                <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">COMPUTE</div>
                <div className="font-mono-tech text-[12px] text-[#B65335]">{computePct}%</div>
              </div>
              <div>
                <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">MEMORY</div>
                <div className="font-mono-tech text-[12px] text-[#7A6438]">{memoryPct}%</div>
              </div>
              <div>
                <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">STALL</div>
                <div className="font-mono-tech text-[12px] text-[#641E25]">{stallPct}%</div>
              </div>
            </div>
          </div>

          {/* 5. Important things to notice */}
          <div className="pt-3.5">
            <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#8B8983]">
              05 · IMPORTANT THINGS TO NOTICE
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="border border-[#EDE8DE] bg-[#F8F6F0] p-2.5">
                <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">MEMORY TIER</div>
                <div className="mt-0.5 font-mono-tech text-[11px] text-[#191815]">
                  {step.inspector.memoryAccess.tier} ({step.inspector.memoryAccess.status})
                </div>
              </div>
              <div className="border border-[#EDE8DE] bg-[#F8F6F0] p-2.5">
                <div className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#8B8983]">LATENCY COST</div>
                <div className="mt-0.5 font-mono-tech text-[11px] text-[#191815]">
                  {step.inspector.memoryAccess.latencyCycles} cycles
                </div>
              </div>
            </div>
            <div className="mt-2 font-mono-tech text-[8.5px] tracking-[0.1em] text-[#5A554C]">
              ACTIVE SILICON: {step.activeComponents.length ? step.activeComponents.join(' · ').toUpperCase() : 'IDLE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
