import { motion } from 'framer-motion';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/Section';
import React, { useMemo } from 'react';
import { RIG_CPU, RIG_GPU, RIG_MEMORY, RIG_HEADLINE } from '../data/rig';
import { buildSnapshot, downloadSnapshot, saveSnapshot } from '../data/snapshots';

const CPU_ROWS: [string, string][] = [
  ['Microarchitecture', `${RIG_CPU.arch} · ${RIG_CPU.codename}`],
  ['Cores / threads', `${RIG_CPU.cores} / ${RIG_CPU.threads} (SMT)`],
  ['Clock', `${RIG_CPU.baseGhz} – ${RIG_CPU.boostGhz} GHz boost`],
  ['L1d / L2', `${RIG_CPU.l1dKb} KB per core / ${RIG_CPU.l2Mb} MB total`],
  ['L3 (shared)', `${RIG_CPU.l3Mb} MB across both CCDs`],
  ['SIMD width', RIG_CPU.avx512 ? 'AVX-512 · 16 fp32 lanes' : 'AVX2 · 8 fp32 lanes'],
  ['Memory', `${RIG_CPU.memType} · ${RIG_CPU.memGbs} GB/s`],
  ['Package power', RIG_CPU.tdpW],
];

const GPU_ROWS: [string, string][] = [
  ['Microarchitecture', `${RIG_GPU.arch} · ${RIG_GPU.codename}`],
  ['SMs / CUDA cores', `${RIG_GPU.smCount} / ${RIG_GPU.cudaCores.toLocaleString('en-US')}`],
  ['Warps per SM', `${RIG_GPU.warpsPerSm} warps · ${RIG_GPU.threadsPerSm} threads`],
  ['Boost clock', `${RIG_GPU.boostGhz} GHz`],
  ['VRAM', `${RIG_GPU.vramGb} GB ${RIG_GPU.vramType} · ${RIG_GPU.busBits}-bit`],
  ['VRAM bandwidth', `${RIG_GPU.vramGbs} GB/s`],
  ['L2 / shared', `${RIG_GPU.l2Mb} MB L2 · ${RIG_GPU.sharedMemKb} KB shared per SM`],
  ['Accelerators', `${RIG_GPU.tensorCores} tensor · ${RIG_GPU.rtCores} RT cores`],
  ['Host link', `${RIG_HEADLINE.pcie} · ${RIG_GPU.pcieGbs} GB/s theoretical`],
  ['FP32 peak', `${RIG_GPU.fp32Tflops} TFLOPS`],
];

const DERIVED: [string, string, string][] = [
  ['Bandwidth ratio', `${RIG_HEADLINE.bandwidthRatio}×`, 'VRAM vs DDR5'],
  ['Lane ratio', `${RIG_HEADLINE.laneRatio}×`, 'CUDA cores vs CPU threads'],
  ['DRAM latency', `${RIG_MEMORY.dramLatencyCycles} cyc`, 'DDR5-5200, ~17 ns'],
  ['VRAM latency', `${RIG_MEMORY.vramLatencyCycles} cyc`, 'GDDR7, ~330 ns'],
  ['Host link latency', `${RIG_MEMORY.pcieLatencyUs} µs`, 'before one byte moves'],
  ['Cache line', `${RIG_MEMORY.lineBytes} B`, 'the unit of all sharing'],
];

export default function Rig({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section id="rig" className="relative bg-[#F8F6F0] border-t border-[#D9D2C6]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
        <SectionHeading
          index="03"
          kicker="THE REFERENCE RIG"
          align="split"
          title={
            <>
              Every number is modelled on <em className="italic text-[#641E25]">one</em> laptop
              <span className="text-[#B65335]">.</span>
            </>
          }
          lead={
            <>
              The simulator does not benchmark your browser. It runs a deterministic architectural model calibrated
              to a specific machine — so the traces you see are identical here, on your phone, and when this site is
              hosted on the web. Below is the hardware the model was built for.
            </>
          }
        />

        <div className="mt-14 grid grid-cols-1 gap-px bg-[#D9D2C6] lg:grid-cols-2">
          <DiePanel
            die="cpu"
            name={RIG_CPU.name}
            arch={`${RIG_CPU.arch} · ${RIG_CPU.codename}`}
            tagline="16 fast, wide, general-purpose chefs. Built for one complicated dish at a time."
            rows={CPU_ROWS}
          />
          <DiePanel
            die="gpu"
            name={RIG_GPU.name}
            arch={`${RIG_GPU.arch} · ${RIG_GPU.codename}`}
            tagline={`${RIG_GPU.cudaCores.toLocaleString('en-US')} narrow lanes. Built to make the same simple dish forever.`}
            rows={GPU_ROWS}
          />
        </div>

        {/* derived constants */}
        <Reveal className="mt-10">
          <div className="border border-[#D9D2C6] bg-[#EDE8DE]/45">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9D2C6] px-5 py-3">
              <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#641E25]">MODEL CONSTANTS</span>
              <span className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983]">
                DERIVED FROM THE TWO DIES ABOVE · NOT MEASURED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#D9D2C6] md:grid-cols-3 lg:grid-cols-6">
              {DERIVED.map(([label, value, sub], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="bg-[#F8F6F0] px-4 py-4"
                >
                  <div className="font-mono-tech text-[7.5px] tracking-[0.16em] text-[#8B8983]">{label.toUpperCase()}</div>
                  <div className="mt-1 font-display text-[22px] leading-none text-[#191815]">{value}</div>
                  <div className="mt-1.5 font-mono-tech text-[7.5px] leading-[1.5] text-[#8B8983]">{sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-8">
          <SnapshotStrip />
        </Reveal>

        <Reveal className="mt-4">
          <div className="flex flex-col gap-4 border-l-2 border-[#641E25] bg-[#FFFFFF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[70ch] font-sans-ui text-[12.5px] leading-[1.75] text-[#3A352E]">
              Change the machine and the interesting part does not change: a 4.6× bandwidth ratio and a 100× lane
              ratio is why one die streams and the other decides. The constants are published so you can check the
              arithmetic yourself.
            </p>
            <button
              onClick={onLaunch}
              className="group inline-flex shrink-0 items-center gap-2 bg-[#191815] px-5 py-2.5 text-[12px] text-[#F8F6F0] transition-colors hover:bg-[#641E25]"
            >
              See it in the simulator
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DiePanel({
  die,
  name,
  arch,
  tagline,
  rows,
}: {
  die: 'cpu' | 'gpu';
  name: string;
  arch: string;
  tagline: string;
  rows: [string, string][];
}) {
  const cpu = die === 'cpu';
  const tone = cpu ? '#641E25' : '#85865A';
  const toneHot = cpu ? '#B65335' : '#A3A472';

  return (
    <div className="relative overflow-hidden bg-[#191815] p-6 lg:p-8">
      {/* die texture — same language as the architecture diagram */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: cpu
            ? 'repeating-linear-gradient(45deg, #641E25 0 1px, transparent 1px 5px)'
            : 'radial-gradient(circle, #85865A 0.7px, transparent 0.8px)',
          backgroundSize: cpu ? undefined : '5px 5px',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3"
            style={{
              backgroundColor: cpu ? tone : 'transparent',
              border: `1px ${cpu ? 'solid' : 'dashed'} ${tone}`,
            }}
          />
          <span className="font-mono-tech text-[8.5px] tracking-[0.22em]" style={{ color: toneHot }}>
            {cpu ? 'CPU DIE' : 'GPU DIE'}
          </span>
        </div>

        <h3 className="mt-3 font-display text-[26px] leading-[1.1] text-[#F8F6F0] lg:text-[32px]">{name}</h3>
        <p className="mt-1 font-mono-tech text-[9px] tracking-[0.16em] text-[#8B8983]">{arch.toUpperCase()}</p>
        <p className="mt-3 max-w-[46ch] font-sans-ui text-[12px] italic leading-[1.7] text-[#D9D2C6]/80">
          {tagline}
        </p>

        <dl className="mt-5 divide-y divide-[#2C2420] border-t border-[#2C2420]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="font-mono-tech text-[8px] tracking-[0.14em] text-[#6E6A63]">{k.toUpperCase()}</dt>
              <dd className="text-right font-mono-tech text-[10.5px] text-[#EDE8DE]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/**
 * The data half of the rig: freeze the traces and hand the visitor the file.
 * Same numbers on localhost, on a phone, or on a static host in a year's time.
 */
function SnapshotStrip() {
  const snapshot = useMemo(() => buildSnapshot(), []);
  const kb = useMemo(() => Math.round(new Blob([JSON.stringify(snapshot)]).size / 102.4) / 10, [snapshot]);

  return (
    <div className="border border-[#2C2420] bg-[#191815] px-5 py-5 lg:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#B69A63]" />
            <span className="font-mono-tech text-[9px] tracking-[0.22em] text-[#B69A63]">SIMULATED DATA · FROZEN</span>
          </div>
          <p className="mt-2 max-w-[64ch] font-sans-ui text-[12px] leading-[1.7] text-[#D9D2C6]/80">
            Every trace is frozen from these two dies: {snapshot.totals.experiments} experiments,{' '}
            {snapshot.totals.variants} workload variants, {snapshot.totals.steps} execution steps, each with a
            checksum. Export the file and a hosted copy of this site shows these exact numbers — nothing is measured at
            runtime.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono-tech text-[8px] tracking-[0.14em] text-[#6E6A63]">
            <span>{snapshot.modelId.toUpperCase()}</span>
            <span>{kb} KB JSON</span>
            <span>{snapshot.traces.length} CHECKSUMS</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            onClick={() => {
              saveSnapshot(snapshot);
              downloadSnapshot(snapshot);
            }}
            className="inline-flex items-center gap-2 bg-[#B69A63] px-4 py-2.5 font-mono-tech text-[9px] tracking-[0.14em] text-[#191815] transition-colors hover:bg-[#EDE8DE]"
          >
            DOWNLOAD SNAPSHOT
          </button>
          <button
            onClick={() => saveSnapshot(snapshot)}
            className="inline-flex items-center gap-2 border border-[#3A312B] px-4 py-2.5 font-mono-tech text-[9px] tracking-[0.14em] text-[#D9D2C6] transition-colors hover:border-[#B69A63] hover:text-[#B69A63]"
          >
            STORE IN BROWSER
          </button>
        </div>
      </div>
    </div>
  );
}
