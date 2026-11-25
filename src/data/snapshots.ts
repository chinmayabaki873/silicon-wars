/**
 * Rig-calibrated snapshot store.
 *
 * The simulator is deterministic: buildSteps(id, param) is a pure function of the
 * reference rig in `rig.ts`. This module freezes those traces into a portable JSON
 * snapshot, persists it in localStorage, and can re-hydrate a workspace from it.
 *
 * Why bother storing something we can recompute? Two reasons, both about honesty:
 *
 *   1. It makes "the numbers you saw" an artifact you can inspect, diff and export —
 *      not an ephemeral side effect of a render.
 *   2. If the model ever changes, a stored snapshot is the record that says *this* is
 *      what the site displayed. A checksum per trace catches drift immediately.
 *
 * Nothing here reads real hardware and nothing leaves the browser.
 */
import { ExperimentId, SimulationStep } from '../types/simulation';
import { EXPERIMENTS } from './experiments';
import { RIG_CPU, RIG_GPU, RIG_HEADLINE, RIG_MEMORY } from './rig';
import { buildSteps } from '../sim';

export const SNAPSHOT_VERSION = 1;
export const SNAPSHOT_STORAGE_KEY = 'silicon-wars:snapshot:v1';

/** Identifies this exact calibration; bump when any rig constant changes. */
export const MODEL_ID = `rz8940hx-rtx5060-${RIG_GPU.vramGb}gb-v${SNAPSHOT_VERSION}`;

/** The machine's roofline ridge: peak FLOP/s ÷ peak bytes/s. */
const RIDGE = (RIG_GPU.fp32Tflops * 1e12 / (RIG_GPU.vramGbs * 1e9)).toFixed(1);

const headline = `${RIG_CPU.cores}C/${RIG_CPU.threads}T @ ${RIG_CPU.boostGhz} GHz · ${RIG_GPU.cudaCores.toLocaleString('en-US')} CUDA · ${RIG_GPU.vramGb} GB GDDR7`;

export interface SnapshotTrace {
  /** Experiment id, e.g. `roofline`. */
  id: ExperimentId;
  /** Workload variant the trace was generated for, e.g. `gemm`. */
  param: string;
  steps: number;
  /** 32-bit FNV-1a hash of the canonical trace — detects model drift. */
  checksum: string;
}

export interface RigSnapshot {
  version: number;
  /** Stable identifier of the model run that produced this file. */
  modelId: string;
  generatedAt: string;
  /** What the model was calibrated to. Repeated here so a snapshot is self-describing. */
  rig: {
    cpu: string;
    gpu: string;
    memory: string;
    headline: string;
  };
  /** Headline derived constants, printed verbatim on the Rig section. */
  constants: Record<string, string>;
  traces: SnapshotTrace[];
  totals: { experiments: number; variants: number; steps: number };
}

/** FNV-1a over a canonical subset of the trace: everything a reader can see. */
export function traceChecksum(steps: SimulationStep[]): string {
  const canonical = steps.map((s) => [
    s.cycle,
    s.stageShort,
    s.activeComponents.join('|'),
    s.metrics.instructionsExecuted,
    s.metrics.estimatedTimeNs,
    s.metrics.stageCycles.compute,
    s.metrics.stageCycles.memory,
    s.metrics.stageCycles.stall,
    s.metrics.bottleneck.severity,
    s.workers.map((w) => `${w.id}:${w.state}:${Math.round(w.progress)}`).join('|'),
    s.storageHighlights.registersText,
    s.storageHighlights.l1Text,
    s.storageHighlights.ramText,
    s.specialVisual?.type ?? '',
  ]);
  let h = 0x811c9dc5;
  const text = canonical.map((row) => row.join('~')).join('\n');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Every variant the UI can select, per experiment — the full addressable surface. */
export function allVariants(): { id: ExperimentId; param: string }[] {
  return EXPERIMENTS.flatMap((e) =>
    (e.paramOptions && e.paramOptions.length
      ? e.paramOptions.map((o) => o.value)
      : [e.defaultParam]
    ).map((param) => ({ id: e.id, param })),
  );
}

/** Build the snapshot for the reference rig. Pure: same input, same bytes. */
export function buildSnapshot(generatedAt = new Date().toISOString()): RigSnapshot {
  const traces: SnapshotTrace[] = allVariants().map(({ id, param }) => {
    const steps = buildSteps(id, param);
    return { id, param, steps: steps.length, checksum: traceChecksum(steps) };
  });
  return {
    version: SNAPSHOT_VERSION,
    modelId: MODEL_ID,
    generatedAt,
    rig: {
      cpu: RIG_CPU.name,
      gpu: RIG_GPU.name,
      memory: 'DDR5-5200 dual-channel + 8 GB GDDR7 128-bit',
      headline: headline,
    },
    constants: {
      'DRAM latency': `${RIG_MEMORY.dramLatencyCycles} cyc`,
      'VRAM latency': `${RIG_MEMORY.vramLatencyCycles} cyc`,
      'Host link latency': `${RIG_MEMORY.pcieLatencyUs} µs`,
      'Host link width': `${RIG_GPU.pcieGen}.0 ×${RIG_GPU.pcieLanes}`,
      'Bandwidth ratio': `${RIG_HEADLINE.bandwidthRatio}× VRAM vs DDR5`,
      'Lane ratio': `${RIG_HEADLINE.laneRatio}× CUDA vs threads`,
      'Cache line': `${RIG_MEMORY.lineBytes} B`,
      'Ridge point': `${RIDGE} FLOP/byte`,
    },
    traces,
    totals: {
      experiments: EXPERIMENTS.length,
      variants: traces.length,
      steps: traces.reduce((n, t) => n + t.steps, 0),
    },
  };
}

// ---------------------------------------------------------------------------
// persistence
// ---------------------------------------------------------------------------

const hasStorage = (): boolean => {
  try {
    const k = '__sw_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
};

export function loadSnapshot(): RigSnapshot | null {
  if (typeof window === 'undefined' || !hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RigSnapshot;
    if (!parsed || parsed.version !== SNAPSHOT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: RigSnapshot = buildSnapshot()): RigSnapshot {
  if (typeof window !== 'undefined' && hasStorage()) {
    try {
      window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* quota or private mode — the in-memory snapshot still works */
    }
  }
  return snapshot;
}

export function clearSnapshot(): void {
  if (typeof window === 'undefined' || !hasStorage()) return;
  try {
    window.localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Validate a user-supplied snapshot file before letting it drive the UI. */
export function validateSnapshot(input: unknown): { ok: boolean; reason?: string; snapshot?: RigSnapshot } {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'not a JSON object' };
  const s = input as Partial<RigSnapshot>;
  if (s.version !== SNAPSHOT_VERSION) return { ok: false, reason: `version ${String(s.version)} ≠ ${SNAPSHOT_VERSION}` };
  if (!Array.isArray(s.traces) || s.traces.length === 0) return { ok: false, reason: 'no traces' };
  if (s.traces.some((t) => !t || typeof t.id !== 'string' || typeof t.checksum !== 'string')) {
    return { ok: false, reason: 'malformed trace entry' };
  }
  return { ok: true, snapshot: s as RigSnapshot };
}

/**
 * Compare a stored snapshot against a freshly generated one.
 * Returns the traces whose checksum drifted — empty means the model is unchanged.
 */
export function diffSnapshot(stored: RigSnapshot, fresh: RigSnapshot = buildSnapshot()): SnapshotTrace[] {
  const byKey = new Map(fresh.traces.map((t) => [`${t.id}::${t.param}`, t]));
  const drifted: SnapshotTrace[] = [];
  for (const t of stored.traces) {
    const now = byKey.get(`${t.id}::${t.param}`);
    if (!now || now.checksum !== t.checksum) drifted.push(t);
  }
  return drifted;
}

export function snapshotFilename(snapshot: RigSnapshot): string {
  const stamp = snapshot.generatedAt.slice(0, 10);
  return `silicon-wars-rig-snapshot-${stamp}.json`;
}

export function downloadSnapshot(snapshot: RigSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = snapshotFilename(snapshot);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readSnapshotFile(file: File): Promise<{ ok: boolean; reason?: string; snapshot?: RigSnapshot }> {
  try {
    const text = await file.text();
    return validateSnapshot(JSON.parse(text));
  } catch {
    return { ok: false, reason: 'file is not valid JSON' };
  }
}
