import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react';
import HeroScene from '../components/illustrations/HeroScene';

export default function Hero({ onLaunch, onExplore }: { onLaunch: () => void; onExplore: () => void }) {
  const reduce = useReducedMotion();
  const ease = [0.16, 0.84, 0.24, 1] as const;

  return (
    <section className="relative bg-[#F8F6F0] overflow-hidden">
      {/* drafting grid, faint, only in the upper band */}
      <div className="absolute inset-0 bg-drafting-ivory opacity-[0.55] [mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_88%)]" />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pt-[118px] pb-0">
        {/* meta strip */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="flex flex-wrap items-center justify-between gap-y-3 border-b border-[#D9D2C6] pb-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping bg-[#B65335] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 bg-[#641E25]" />
            </span>
            <span className="font-mono-tech text-[10px] tracking-[0.24em] text-[#641E25]">
              INTERACTIVE ARCHITECTURE LABORATORY
            </span>
          </div>
          <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[#8B8983]">
            ISSUE 01 · CPU / GPU EXECUTION MODELS
          </div>
        </motion.div>

        {/* editorial headline — asymmetric, not centered */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8 pt-12 lg:pt-16">
          <div className="lg:col-span-7 xl:col-span-8">
            <motion.h1
              initial={reduce ? undefined : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.05, ease, delay: 0.06 }}
              className="font-display text-[#191815] leading-[0.94] tracking-[-0.028em] text-[clamp(46px,8.4vw,116px)]"
            >
              Every processor
              <br />
              has a{' '}
              <span className="relative italic text-[#641E25]">
                story
                <svg
                  viewBox="0 0 300 18"
                  className="absolute -bottom-2 left-0 w-full h-[0.18em] text-[#B65335]/45"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M2 12 C 70 4, 150 4, 298 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-[#B65335]">.</span>
            </motion.h1>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-end">
            <motion.p
              initial={reduce ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.24 }}
              className="font-sans-ui text-[15.5px] leading-[1.72] text-[#3A352E] max-w-[46ch]"
            >
              Step inside your computer. Explore how CPUs and GPUs execute instructions, move data and
              solve problems through an interactive world of engineering.
            </motion.p>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.34 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={onLaunch}
                className="group relative inline-flex items-center gap-2.5 bg-[#641E25] text-[#F8F6F0] px-6 py-3.5 text-[13px] font-sans-ui tracking-wide overflow-hidden"
              >
                <span className="absolute inset-0 bg-[#191815] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,0.84,0.24,1)]" />
                <span className="relative flex items-center gap-2.5">
                  <Play size={13} className="fill-current" />
                  Enter the Simulation
                </span>
              </button>
              <button
                onClick={onExplore}
                className="group inline-flex items-center gap-2 border border-[#191815]/25 px-6 py-3.5 text-[13px] font-sans-ui text-[#191815] hover:border-[#191815] transition-colors duration-300"
              >
                Explore Experiments
                <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </motion.div>

            <motion.div
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="mt-10 flex items-center gap-6"
            >
              {[
                ['20', 'EXPERIMENTS'],
                ['80+', 'EXECUTION STEPS'],
                ['2', 'SILICON DIES'],
              ].map(([n, l]) => (
                <div key={l} className="flex flex-col">
                  <span className="font-display text-[26px] leading-none text-[#191815]">{n}</span>
                  <span className="mt-1.5 font-mono-tech text-[9px] tracking-[0.18em] text-[#8B8983]">{l}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* hero illustration — full-bleed-ish, treated as a plate in a book */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.15, ease, delay: 0.42 }}
          className="relative mt-12 lg:mt-14"
        >
          <div className="relative border-y border-[#D9D2C6] py-2">
            {/* corner ticks, like photographic registration marks */}
            {[
              'left-0 top-0',
              'right-0 top-0',
              'left-0 bottom-0',
              'right-0 bottom-0',
            ].map((pos) => (
              <span key={pos} className={`absolute ${pos} h-2.5 w-2.5 text-[#B69A63]`}>
                <span className="absolute inset-0 border-t border-l border-current" />
              </span>
            ))}
            <>
              <HeroScene className="w-full h-auto hidden md:block" />
              <HeroScene className="w-full h-auto md:hidden" stacked />
              <div className="md:hidden mt-4 grid grid-cols-2 gap-4 border-t border-stone/70 pt-3">
                <div>
                  <p className="font-mono-tech text-[10px] tracking-[0.2em] text-burgundy">CPU — ATELIER</p>
                  <p className="font-mono-tech text-[9px] tracking-[0.14em] text-softGrey mt-1">4 CHEFS · LATENCY</p>
                </div>
                <div>
                  <p className="font-mono-tech text-[10px] tracking-[0.2em] text-olive">GPU — HALL</p>
                  <p className="font-mono-tech text-[9px] tracking-[0.14em] text-softGrey mt-1">64 COOKS · THROUGHPUT</p>
                </div>
              </div>
            </>
          </div>
        </motion.div>
      </div>

      {/* explanatory strip beneath the illustration */}
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-6 pt-7 items-start">
          <p className="md:col-span-4 font-display text-[19px] leading-[1.45] text-[#191815]">
            Two kitchens. One bowl of vector addition. The difference is not speed — it is{' '}
            <span className="italic text-[#641E25]">architecture</span>.
          </p>
          <p className="md:col-span-5 font-sans-ui text-[13.5px] leading-[1.75] text-[#3A352E]">
            A CPU is a boutique atelier: a few master chefs who can improvise anything, one intricate dish at a
            time. A GPU is an industrial hall: hundreds of line cooks, all folding the same dumpling, all at once.
            Every idea in this site starts with food and ends with silicon.
          </p>
          <div className="md:col-span-3 flex md:justify-end">
            <button
              onClick={onExplore}
              className="group inline-flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.2em] text-[#641E25]"
            >
              READ THE METAPHOR
              <span className="h-px w-8 bg-[#641E25] transition-all duration-300 group-hover:w-12" />
              <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
