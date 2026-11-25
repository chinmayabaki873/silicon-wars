import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Clock, Info, Layers, LayoutGrid, ListChecks, X } from 'lucide-react';
import { EXPERIMENTS } from '../data/experiments';
import { CanonicalComponentId, ExperimentId, ExplanationLevel } from '../types/simulation';
import { COMPONENT_LOOKUP } from '../data/metaphors';
import { useSimulation } from './useSimulation';
import KitchenView from './KitchenView';
import ArchitectureView from './ArchitectureView';
import Inspector from './Inspector';
import Transport from './Transport';
import Metrics, { BottleneckPanel } from './Metrics';
import TraceLog from './TraceLog';
import SnapshotPanel from './SnapshotPanel';
import { useTour } from '../tour/TourContext';
import { Logo } from '../components/ui/Chrome';

type Tab = 'kitchen' | 'architecture' | 'inspector' | 'analytics';

export default function Workspace({
  experimentId,
  onExit,
  onSwitch,
}: {
  experimentId: ExperimentId;
  onExit: () => void;
  onSwitch: (id: ExperimentId) => void;
}) {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId) ?? EXPERIMENTS[0];
  const [param, setParam] = useState(exp.defaultParam);
  const [level, setLevel] = useState<ExplanationLevel>('beginner');
  const [selected, setSelected] = useState<CanonicalComponentId | null>(null);
  const [tab, setTab] = useState<Tab>('kitchen');
  const [rightTab, setRightTab] = useState<'inspector' | 'telemetry'>('inspector');
  const tour = useTour();
  const [mobileTab, setMobileTab] = useState<Tab>('kitchen');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const sim = useSimulation(exp.id, param);

  useEffect(() => {
    setParam(exp.defaultParam);
    setSelected(null);
    setTab('kitchen');
    setMobileTab('kitchen');
  }, [exp.id, exp.defaultParam]);

  useEffect(() => {
    const jump = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') sim.jumpTo(detail);
    };
    window.addEventListener('sim-jump', jump as EventListener);
    return () => window.removeEventListener('sim-jump', jump as EventListener);
  }, [sim.jumpTo]);

  // Transport keyboard shortcuts: space = play/pause, ← → = step, R = reset, Esc = dismiss.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === 'Escape') {
        setPickerOpen(false);
        setShowInfo(false);
        setSelected(null);
        return;
      }
      if (pickerOpen || showInfo) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') {
        e.preventDefault();
        sim.toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sim.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sim.prev();
      } else if (e.key.toLowerCase() === 'r') {
        sim.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sim.toggle, sim.next, sim.prev, sim.reset, pickerOpen, showInfo]);

  const step = sim.step;
  const componentMeta = selected ? COMPONENT_LOOKUP[selected] : null;
  const option = exp.paramOptions.find((o) => o.value === param) ?? exp.paramOptions[0];

  const handleSelect = (id: CanonicalComponentId) => {
    setSelected(id);
    setTab('architecture');
    setMobileTab('architecture');
  };

  if (!step) {
    return (
      <div className="min-h-screen bg-[#191815] flex items-center justify-center">
        <span className="font-mono-tech text-[10px] tracking-[0.2em] text-[#8B8983]">PREPARING TRACE…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#191815]">
      {/* workspace header */}
      <header className="sticky top-0 z-30 border-b border-[#332B25] bg-[#191815]">
        <div className="flex h-[54px] items-center gap-3 px-3 lg:px-5">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 pr-2 font-mono-tech text-[9.5px] tracking-[0.16em] text-[#8B8983] transition-colors hover:text-[#EDE8DE]"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">EXIT LAB</span>
          </button>

          <span className="hidden sm:block h-5 w-px bg-[#332B25]" />

          <button onClick={() => setPickerOpen(true)} className="group flex min-w-0 items-center gap-2.5 text-left">
            <span className="font-mono-tech text-[9px] tracking-[0.16em] text-[#B69A63]">{exp.number}</span>
            <span data-exp-title className="truncate font-display text-[16px] leading-none text-[#F8F6F0] group-hover:text-[#B69A63] transition-colors">
              {exp.title}
            </span>
            <ChevronDown size={13} className="shrink-0 text-[#8B8983]" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:inline-flex items-center gap-1.5 border border-[#3A312B] px-2 py-1 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983]">
              <Clock size={9} /> {exp.duration.toUpperCase()}
            </span>
            <button
              onClick={() => setShowInfo((s) => !s)}
              className={`flex h-8 w-8 items-center justify-center border transition-colors ${
                showInfo ? 'border-[#B69A63] text-[#B69A63]' : 'border-[#3A312B] text-[#8B8983] hover:text-[#EDE8DE]'
              }`}
              aria-label="Experiment briefing"
            >
              <Info size={13} />
            </button>
            <div className="hidden sm:block">
              <Logo tone="light" size={0.82} />
            </div>
          </div>
        </div>

        {/* second row: workload parameters + explanation level */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#2C2420] px-3 lg:px-5 py-2">
          <span className="font-mono-tech text-[8.5px] tracking-[0.18em] text-[#6E6A63]">{exp.paramLabel.toUpperCase()}</span>
          <div className="inline-flex border border-[#3A312B]">
            {exp.paramOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setParam(o.value)}
                title={o.description}
                className={`relative px-2.5 py-1 font-mono-tech text-[8.5px] tracking-[0.12em] transition-colors ${
                  param === o.value ? 'text-[#191815]' : 'text-[#8B8983] hover:text-[#EDE8DE]'
                }`}
              >
                {param === o.value && (
                  <motion.span layoutId="paramPill" className="absolute inset-0 bg-[#B69A63]" transition={{ duration: 0.25 }} />
                )}
                <span className="relative">{o.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <span className="hidden xl:block font-sans-ui text-[10.5px] text-[#6E6A63]">{option.description}</span>

          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono-tech text-[8.5px] tracking-[0.18em] text-[#6E6A63]">EXPLANATION</span>
            <div className="inline-flex border border-[#3A312B]">
              {(['beginner', 'engineering'] as ExplanationLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`relative px-2.5 py-1 font-mono-tech text-[8.5px] tracking-[0.12em] transition-colors ${
                    level === l ? 'text-[#191815]' : 'text-[#8B8983] hover:text-[#EDE8DE]'
                  }`}
                >
                  {level === l && <motion.span layoutId="levelPill" className="absolute inset-0 bg-[#EDE8DE]" transition={{ duration: 0.25 }} />}
                  <span className="relative">{l.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* briefing drawer */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.34, ease: [0.16, 0.84, 0.24, 1] }}
              className="overflow-hidden border-t border-[#2C2420] bg-[#211C18]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 lg:px-5 py-4">
                <div className="lg:col-span-6">
                  <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#B69A63]">MISSION BRIEFING</div>
                  <p className="mt-2 font-sans-ui text-[12.5px] leading-[1.7] text-[#D9D2C6]/85">{exp.shortExplanation}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="border border-[#3A312B] px-2 py-0.5 font-mono-tech text-[8px] tracking-[0.14em] text-[#8B8983]">
                      {exp.difficulty.toUpperCase()}
                    </span>
                    <span className="border border-[#3A312B] px-2 py-0.5 font-mono-tech text-[8px] tracking-[0.14em] text-[#8B8983]">
                      {exp.category.toUpperCase()}
                    </span>
                    <span className="border border-[#3A312B] px-2 py-0.5 font-mono-tech text-[8px] tracking-[0.14em] text-[#8B8983]">
                      {sim.total} STEPS
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#B69A63]">LEARNING OBJECTIVES</div>
                  <ul className="mt-2 space-y-1.5">
                    {exp.learningObjectives.map((o) => (
                      <li key={o} className="flex gap-2 font-sans-ui text-[11.5px] leading-[1.6] text-[#D9D2C6]/75">
                        <ListChecks size={11} className="mt-[3px] shrink-0 text-[#B65335]" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* main three-view grid */}
      <main className="mx-auto max-w-[1600px] px-3 lg:px-5 py-3 lg:py-4">
        {/* mobile tabs */}
        <div className="lg:hidden mb-3 flex border border-[#D9D2C6] bg-[#FFFFFF]">
          {(
            [
              ['kitchen', 'Kitchen', LayoutGrid],
              ['architecture', 'Diagram', Layers],
              ['inspector', 'Inspector', ListChecks],
              ['analytics', 'Data', Info],
            ] as [Tab, string, typeof Info][]
          ).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono-tech text-[8.5px] tracking-[0.14em] transition-colors ${
                mobileTab === t ? 'bg-[#191815] text-[#F8F6F0]' : 'text-[#5A554C]'
              }`}
            >
              <Icon size={11} /> {label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
          {/* A — kitchen */}
          <div className={`lg:col-span-7 xl:col-span-6 ${mobileTab === 'kitchen' ? 'block' : 'hidden lg:block'}`}>
            <div data-tour="kitchen-view" className="border border-[#2C2420]">
              <KitchenView step={step} selected={selected} onSelect={(id) => { handleSelect(id); tour?.notifyAction('kitchen-clicked'); }} param={param} />
            </div>
            <div className="mt-3">
              <Transport
                index={sim.index}
                total={sim.total}
                playState={sim.playState}
                speed={sim.speed}
                onSpeedChange={sim.setSpeed}
                onPlay={() => { sim.play(); tour?.notifyAction('play-clicked'); }}
                onPause={sim.pause}
                onPrev={sim.prev}
                onNext={sim.next}
                onReset={sim.reset}
                canNext={sim.canNext}
                canPrev={sim.canPrev}
              />
            </div>
            <div className="mt-3">
              <TraceLog steps={sim.steps} index={sim.index} onJump={sim.jumpTo} />
            </div>
            <div className="mt-3 hidden xl:block">
              <BottleneckPanel step={step} />
            </div>
          </div>

          {/* B — architecture + C inspector */}
          <div className={`lg:col-span-5 xl:col-span-6 flex-1 flex-col gap-3 lg:gap-4 ${mobileTab !== 'kitchen' ? 'flex' : 'hidden lg:flex'}`}>
            <div className={`${mobileTab === 'architecture' ? 'block' : 'hidden'} lg:block`}>
              <div data-tour="architecture-view" className="border border-[#2C2420]">
                <ArchitectureView step={step} topology={exp.topology} selected={selected} onSelect={(id) => { setSelected(id); tour?.notifyAction('arch-clicked'); }} />
              </div>
              {componentMeta && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-start gap-3 border border-[#D9D2C6] bg-[#FFFFFF] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech text-[8.5px] tracking-[0.16em] text-[#641E25]">
                        {componentMeta.roleTag}
                      </span>
                      <span className="font-mono-tech text-[8.5px] text-[#8B8983]">
                        {selected?.toUpperCase().replace(/-/g, '_')}
                      </span>
                    </div>
                    <div className="mt-1 font-sans-ui text-[12px] text-[#191815]">{componentMeta.hardwareName}</div>
                    <div className="mt-0.5 font-display text-[14px] italic text-[#641E25]">{componentMeta.kitchenName}</div>
                    <p className="mt-1.5 font-sans-ui text-[11px] leading-[1.6] text-[#5A554C]">
                      {level === 'beginner' ? componentMeta.beginnerDesc : componentMeta.engineeringDesc}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Clear selection" className="shrink-0 p-1 text-[#8B8983] hover:text-[#641E25]">
                    <X size={13} />
                  </button>
                </motion.div>
              )}
            </div>

            <div className={`${mobileTab === 'inspector' || mobileTab === 'analytics' ? 'flex-1' : 'hidden'} min-h-[440px] flex-col border border-[#D9D2C6] bg-[#F8F6F0] lg:flex lg:flex-1`}>
              {/* inspector / telemetry switch */}
              <div className={`${mobileTab === 'analytics' ? 'hidden' : 'hidden lg:flex'} items-center justify-end gap-1 border-b border-[#D9D2C6] bg-[#EDE8DE]/40 px-3 py-1.5`}>
                {(['inspector', 'telemetry'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRightTab(t)}
                    className={`px-2.5 py-1 font-mono-tech text-[8.5px] tracking-[0.14em] transition-colors ${
                      rightTab === t ? 'bg-[#191815] text-[#F8F6F0]' : 'text-[#5A554C] hover:text-[#641E25]'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {mobileTab === 'analytics' || (mobileTab !== 'inspector' && rightTab === 'telemetry') ? (
                <div className="h-full overflow-y-auto p-3 bg-[#F8F6F0] dark-scroll">
                  <Metrics step={step} topology={exp.topology} />
                  <div className="mt-3 xl:hidden">
                    <BottleneckPanel step={step} />
                  </div>
                  <div className="mt-3">
                    <SnapshotPanel />
                  </div>
                </div>
              ) : (
                <Inspector
                  step={step}
                  level={level}
                  onLevelChange={setLevel}
                  onSelectComponent={handleSelect}
                  onNext={sim.next}
                  canNext={sim.canNext}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* experiment picker */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#191815]/92 backdrop-blur-sm p-4 lg:p-10 overflow-y-auto"
            onClick={() => setPickerOpen(false)}
          >
            <div className="mx-auto max-w-[1000px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="font-mono-tech text-[9.5px] tracking-[0.22em] text-[#B69A63]">SELECT EXPERIMENT</span>
                <button onClick={() => setPickerOpen(false)} className="p-2 text-[#8B8983] hover:text-[#F8F6F0]" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXPERIMENTS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onSwitch(e.id);
                      setPickerOpen(false);
                    }}
                    className={`group flex items-center gap-3 border p-3 text-left transition-colors ${
                      e.id === exp.id
                        ? 'border-[#B69A63] bg-[#29221D]'
                        : 'border-[#332B25] bg-[#211C18] hover:border-[#5A4E43]'
                    }`}
                  >
                    <span className="font-mono-tech text-[9px] tracking-[0.14em] text-[#6E6A63]">{e.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[16px] text-[#F8F6F0] group-hover:text-[#B69A63] transition-colors">
                        {e.title}
                      </span>
                      <span className="block truncate font-mono-tech text-[8.5px] tracking-[0.1em] text-[#8B8983]">
                        {e.category.toUpperCase()} · {e.difficulty.toUpperCase()}
                      </span>
                    </span>
                    {e.id === exp.id && <span className="h-1.5 w-1.5 shrink-0 bg-[#B65335]" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
