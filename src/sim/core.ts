import {
  CanonicalComponentId,
  ExperimentId,
  KitchenWorker,
  SimulationMetrics,
  SimulationStep,
  WorkerState,
} from '../types/simulation';

/* ------------------------------------------------------------------ */
/*  Kitchen crew factories — the bridge between metaphor and hardware  */
/* ------------------------------------------------------------------ */

export const CPU_STATIONS: { id: CanonicalComponentId; name: string; short: string }[] = [
  { id: 'core-0', name: 'Master Chef 01', short: 'CORE 0' },
  { id: 'core-1', name: 'Master Chef 02', short: 'CORE 1' },
  { id: 'core-2', name: 'Master Chef 03', short: 'CORE 2' },
  { id: 'core-3', name: 'Master Chef 04', short: 'CORE 3' },
];

export const GPU_BRIGADES: { id: string; label: string; group: string }[] = [
  { id: 'g0', label: 'Brigade 01', group: 'SM 0' },
  { id: 'g1', label: 'Brigade 02', group: 'SM 0' },
  { id: 'g2', label: 'Brigade 03', group: 'SM 0' },
  { id: 'g3', label: 'Brigade 04', group: 'SM 0' },
  { id: 'g4', label: 'Brigade 05', group: 'SM 1' },
  { id: 'g5', label: 'Brigade 06', group: 'SM 1' },
  { id: 'g6', label: 'Brigade 07', group: 'SM 1' },
  { id: 'g7', label: 'Brigade 08', group: 'SM 1' },
];

export type CrewState = {
  state: WorkerState;
  task?: string;
  badge?: string;
  progress?: number;
};

export function cpuCrew(states: CrewState[]): KitchenWorker[] {
  return CPU_STATIONS.map((s, i) => {
    const st = states[i] ?? { state: 'idle' as WorkerState };
    return {
      id: s.id,
      label: s.name,
      role: 'master-chef',
      componentId: s.id,
      state: st.state,
      taskLabel: st.task ?? (st.state === 'idle' ? 'Station idle' : ''),
      valueBadge: st.badge,
      progress: st.progress ?? (st.state === 'idle' ? 0 : 100),
    };
  });
}

export function gpuCrew(states: CrewState[]): KitchenWorker[] {
  return GPU_BRIGADES.map((b, i) => {
    const st = states[i] ?? { state: 'idle' as WorkerState };
    return {
      id: b.id,
      label: b.label,
      role: 'line-cook',
      componentId: 'gpu-workers',
      state: st.state,
      taskLabel: st.task ?? (st.state === 'idle' ? 'Waiting for call' : ''),
      valueBadge: st.badge,
      progress: st.progress ?? (st.state === 'idle' ? 0 : 100),
      group: b.group,
    };
  });
}

export function idleCpu(task = 'Standing by'): CrewState[] {
  return CPU_STATIONS.map(() => ({ state: 'idle' as WorkerState, task }));
}

export function idleGpu(task = 'Awaiting warp call'): CrewState[] {
  return GPU_BRIGADES.map(() => ({ state: 'idle' as WorkerState, task }));
}

/* ------------------------------------------------------------------ */
/*  Metrics helper                                                     */
/* ------------------------------------------------------------------ */

export const emptyMetrics = (): SimulationMetrics => ({
  cpuUtilization: [0, 0, 0, 0],
  gpuUtilization: [0, 0, 0, 0, 0, 0, 0, 0],
  instructionsExecuted: 0,
  cacheHits: 0,
  cacheMisses: 0,
  memoryAccesses: 0,
  bytesTransferred: 0,
  estimatedTimeNs: 0,
  stageCycles: { compute: 0, memory: 0, control: 0, stall: 0 },
  bottleneck: {
    title: 'No bottleneck yet',
    severity: 'low',
    beginnerText: 'Run the simulation to let the kitchen reveal where it slows down.',
    engineeringText: 'Awaiting workload execution trace before computing the critical path.',
  },
});

export function metrics(over: Partial<SimulationMetrics>): SimulationMetrics {
  const base = emptyMetrics();
  const stageCycles = { ...base.stageCycles, ...(over.stageCycles ?? {}) };
  const bottleneck = {
    ...base.bottleneck,
    ...(over.bottleneck ?? {}),
  };
  // A bottleneck that arrives half-filled is a modelling error, not a UI problem —
  // top up the missing strings so the telemetry panel can always render.
  if (!bottleneck.engineeringText) bottleneck.engineeringText = base.bottleneck.engineeringText;
  if (!bottleneck.beginnerText) bottleneck.beginnerText = base.bottleneck.beginnerText;
  if (!bottleneck.title) bottleneck.title = base.bottleneck.title;
  if (!bottleneck.severity) bottleneck.severity = 'low';
  return { ...base, ...over, stageCycles, bottleneck };
}

export function util(values: number[], pad = 4): number[] {
  return [...values, ...Array(Math.max(0, pad - values.length)).fill(0)];
}

/* ------------------------------------------------------------------ */
/*  Step helper                                                        */
/* ------------------------------------------------------------------ */

let stepCounter = 0;
export function resetStepCounter() {
  stepCounter = 0;
}

export function makeStep(s: Omit<SimulationStep, 'stepIndex'>): SimulationStep {
  return { stepIndex: stepCounter++, ...s };
}

export function stepsFrom(builder: () => Omit<SimulationStep, 'stepIndex'>[]): SimulationStep[] {
  resetStepCounter();
  return builder().map((s) => ({ stepIndex: stepCounter++, ...s }));
}

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

export type StepGenerator = (param: string) => SimulationStep[];

const registry: Partial<Record<ExperimentId, StepGenerator>> = {};

export function registerGenerator(id: ExperimentId, gen: StepGenerator) {
  registry[id] = gen;
}

export function getGenerator(id: ExperimentId): StepGenerator {
  return registry[id] ?? (() => []);
}
