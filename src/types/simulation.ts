export type ExplanationLevel = 'beginner' | 'engineering';

export type ExperimentId =
  | 'vector-addition'
  | 'matrix-multiplication'
  | 'cpu-pipeline'
  | 'cpu-scheduling'
  | 'cache-vs-ram'
  | 'gpu-thread-blocks'
  | 'warps-simd-simt'
  | 'cpu-vs-gpu'
  | 'memory-transfer'
  | 'image-processing'
  | 'registers-asm'
  | 'instruction-encoding'
  | 'isa-compare'
  | 'branch-predict'
  | 'openmp-scaling'
  | 'false-sharing'
  | 'instruction-parallelism'
  | 'simd-fma'
  | 'atomics-locks'
  | 'roofline';

export type ArchitectureTopology = 'cpu-only' | 'gpu-only' | 'heterogeneous';

/**
 * Canonical component IDs shared between the Kitchen Simulation and
 * the Real Architecture Diagram so clicking either highlights both.
 */
export type CanonicalComponentId =
  | 'scheduler'
  | 'core-0'
  | 'core-1'
  | 'core-2'
  | 'core-3'
  | 'registers'
  | 'alu'
  | 'pipeline'
  | 'l1-cache'
  | 'l2-cache'
  | 'l3-cache'
  | 'tensor-cores'
  | 'ram'
  | 'pcie-bus'
  | 'vram'
  | 'warp-scheduler'
  | 'sm-0'
  | 'sm-1'
  | 'shared-mem'
  | 'gpu-workers';

export interface MetaphorItem {
  id: CanonicalComponentId | 'cpu-overview' | 'gpu-overview' | 'instructions';
  hardwareTitle: string;
  kitchenTitle: string;
  shortTag: string;
  latencyCycles: string;
  kitchenTimeEquivalent: string;
  capacitySpec: string;
  beginnerSummary: string;
  engineeringSummary: string;
  linkedComponentId: CanonicalComponentId;
}

export interface WorkloadParamOption {
  value: string;
  label: string;
  description: string;
}

export interface ExperimentMeta {
  id: ExperimentId;
  number: string;
  title: string;
  subtitle: string;
  category: 'Parallel Compute' | 'CPU Microarchitecture' | 'Memory Hierarchy' | 'System Architecture';
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  duration: string;
  topology: ArchitectureTopology;
  shortExplanation: string;
  learningObjectives: string[];
  paramLabel: string;
  paramOptions: WorkloadParamOption[];
  defaultParam: string;
}

export type WorkerState = 'idle' | 'fetching' | 'computing' | 'stalled' | 'completed' | 'diverged-off';

export interface KitchenWorker {
  id: string;
  label: string;
  role: 'master-chef' | 'line-cook' | 'head-chef';
  componentId: CanonicalComponentId;
  state: WorkerState;
  taskLabel: string;
  valueBadge?: string;
  progress: number; // 0..100
  group?: string;
}

export interface MovingPacket {
  id: string;
  from: CanonicalComponentId;
  to: CanonicalComponentId;
  label: string;
  kind: 'instruction' | 'data' | 'result' | 'cache-miss';
}

export interface PipelineSlot {
  stage: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';
  kitchenStage: 'Order' | 'Prep' | 'Sear' | 'Pantry' | 'Plate';
  instruction: string;
  status: 'active' | 'stall' | 'forwarded' | 'empty';
}

export interface GridCell {
  row: number;
  col: number;
  value: number | string;
  status: 'pending' | 'reading' | 'active' | 'done';
  intensity?: number; // 0..255 for image processing
}

export interface SimulationMetrics {
  cpuUtilization: number[]; // 4 cores percentages 0..100
  gpuUtilization: number[]; // 8 worker groups / SM percentages 0..100
  instructionsExecuted: number;
  cacheHits: number;
  cacheMisses: number;
  memoryAccesses: number;
  bytesTransferred: number;
  estimatedTimeNs: number;
  stageCycles: {
    compute: number;
    memory: number;
    control: number;
    stall: number;
  };
  bottleneck: {
    title: string;
    severity: 'low' | 'moderate' | 'high';
    beginnerText: string;
    engineeringText: string;
  };
}

export interface StepInspectorData {
  stepTitle: string;
  phaseBadge: string;
  componentHardware: string;
  componentKitchen: string;
  primaryComponentId: CanonicalComponentId;
  opcode: string;
  inputData: string;
  operation: string;
  outputData: string;
  memoryAccess: {
    tier: 'Register' | 'L1 Cache' | 'L2 Cache' | 'Shared Mem' | 'System RAM' | 'VRAM' | 'PCIe Bus' | 'None';
    status: 'HIT' | 'MISS' | 'STREAM' | 'DMA' | 'INTERNAL';
    address: string;
    latencyCycles: number;
  };
  beginnerExplanation: string;
  engineeringExplanation: string;
  nextStepPreview: string;
}

export interface SimulationStep {
  stepIndex?: number;
  cycle: number;
  stageShort: string;
  activeComponents: CanonicalComponentId[];
  workers: KitchenWorker[];
  packets?: MovingPacket[];
  storageHighlights: {
    registersText: string;
    l1Text: string;
    ramText: string;
    vramText?: string;
    sharedMemText?: string;
  };
  specialVisual?: {
    type:
      | 'vector'
      | 'matrix'
      | 'pipeline'
      | 'warp-mask'
      | 'image-grid'
      | 'race-bars'
      | 'transfer-bus'
      | 'register-file'
      | 'bit-fields'
      | 'isa-stack'
      | 'predictor'
      | 'thread-scaling'
      | 'cache-line'
      | 'dependency-graph'
      | 'simd-lanes'
      | 'contention'
      | 'roofline';
    pipelineSlots?: PipelineSlot[];
    gridCells?: GridCell[];
    inputGridCells?: GridCell[];
    warpMask?: boolean[]; // 16 or 32 lanes active/inactive
    raceProgress?: { cpuPct: number; gpuPct: number; cpuCycles: number; gpuCycles: number };
    vectorItems?: { idx: number; a: number; b: number; out: number | null; status: 'idle' | 'active' | 'done' }[];
    transferProgress?: { hostPct: number; busPct: number; vramPct: number; payloadKb: number };

    /* ---- registrations / encodings ---- */
    registers?: {
      name: string;
      value: string;
      role: 'arg' | 'temp' | 'result' | 'pointer';
      hot: boolean;
      note?: string;
    }[];
    asmLines?: {
      indent: number;
      text: string;
      comment?: string;
      tone: 'c' | 'asm' | 'macro' | 'note';
    }[];
    /* ---- instruction encoding ---- */
    bitFields?: {
      name: string;
      bits: number;
      value: string;
      meaning: string;
      tone: string;
    }[];
    /* ---- ISA comparison ---- */
    isaStack?: {
      level: 'c' | 'ptx' | 'sass' | 'asm';
      title: string;
      lines: string[];
      cost?: string;
    }[];
    /* ---- branch predictor ---- */
    predictor?: {
      pattern: string;
      predicted: 'T' | 'N' | '?' | 'X';
      actual: 'T' | 'N' | 'X';
      cost: number;
      label?: string;
    }[];
    /* ---- thread scaling ---- */
    threadScaling?: {
      threads: number;
      barPct: number;
      speedup: number;
      ideal: number;
      note?: string;
      active?: boolean;
    }[];
    /* ---- cache line ---- */
    cacheLine?: {
      bytes: { tag: number; owner: 'A' | 'B' | 'shared' | 'free'; hot: boolean }[];
      lineAddr: string;
      note?: string;
    };
    /* ---- dependency graph / ILP ---- */
    dependencyGraph?: {
      nodes: { id: number; op: string; cycle: number; lane: number; status: 'ready' | 'waiting' | 'done' | 'stalled' }[];
      edges: [number, number][];
    };
    /* ---- SIMD lanes ---- */
    simd?: {
      width: number;
      lanes: { label: string; value: number; state: 'idle' | 'loaded' | 'fma' | 'done' }[];
      scalar: boolean;
      fma: boolean;
    };
    /* ---- contention ---- */
    contention?: {
      banks: { bank: number; accesses: number; conflict: boolean; owners: string[] }[];
      serialized: number;
      ideal: number;
    };
    /* ---- roofline ---- */
    roofline?: {
      points: { label: string; ai: number; gflops: number; x: number; y: number; tone: string; active?: boolean }[];
      ridge: number;
      peakTflops: number;
      peakGbs: number;
    };
  };
  inspector: StepInspectorData;
  metrics: SimulationMetrics;
}

/** Generators may omit any visual/metric field; buildSteps fills defaults. */
export type RawSimulationStep = Partial<Omit<SimulationStep, 'inspector'>> & {
  inspector: StepInspectorData;
};
