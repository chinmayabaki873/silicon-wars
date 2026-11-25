import { ExperimentId, RawSimulationStep, SimulationStep } from '../types/simulation';
import { emptyMetrics } from './core';
import { pipelineSteps, schedulingSteps, cacheSteps } from './cpuExperiments';
import { vectorSteps, matmulSteps, threadBlockSteps, warpSteps, imageSteps } from './gpuExperiments';
import { showdownSteps, transferSteps } from './showdownExperiments';
import {
  registersSteps,
  encodingSteps,
  isaSteps,
  branchSteps,
  openmpSteps,
  falseSharingSteps,
  ilpSteps,
  simdSteps,
  atomicsSteps,
  rooflineSteps,
} from './extraExperiments';

type Generator = (param: string) => RawSimulationStep[];

const registry: Record<ExperimentId, Generator> = {
  'vector-addition': vectorSteps as unknown as Generator,
  'matrix-multiplication': matmulSteps as unknown as Generator,
  'cpu-pipeline': pipelineSteps as unknown as Generator,
  'cpu-scheduling': schedulingSteps as unknown as Generator,
  'cache-vs-ram': cacheSteps as unknown as Generator,
  'gpu-thread-blocks': threadBlockSteps as unknown as Generator,
  'warps-simd-simt': warpSteps as unknown as Generator,
  'cpu-vs-gpu': showdownSteps as unknown as Generator,
  'memory-transfer': transferSteps as unknown as Generator,
  'image-processing': imageSteps as unknown as Generator,
  'registers-asm': registersSteps as unknown as Generator,
  'instruction-encoding': encodingSteps as unknown as Generator,
  'isa-compare': isaSteps as unknown as Generator,
  'branch-predict': branchSteps as unknown as Generator,
  'openmp-scaling': openmpSteps as unknown as Generator,
  'false-sharing': falseSharingSteps as unknown as Generator,
  'instruction-parallelism': ilpSteps as unknown as Generator,
  'simd-fma': simdSteps as unknown as Generator,
  'atomics-locks': atomicsSteps as unknown as Generator,
  'roofline': rooflineSteps as unknown as Generator,
};

const DEFAULT_STORAGE = { registersText: 'idle', l1Text: '—', ramText: 'resident' };

/** Normalises every generator's output into a complete, indexed trace. */
export function buildSteps(id: ExperimentId, param: string): SimulationStep[] {
  const gen = registry[id];
  const raw: RawSimulationStep[] = gen ? gen(param) : [];
  return raw.map((step, index) => ({
    cycle: step.cycle ?? index + 1,
    stageShort: step.stageShort ?? 'STEP',
    activeComponents: step.activeComponents ?? [],
    workers: step.workers ?? [],
    packets: step.packets ?? [],
    storageHighlights: step.storageHighlights ?? DEFAULT_STORAGE,
    metrics: step.metrics ?? emptyMetrics(),
    inspector: step.inspector,
    specialVisual: step.specialVisual,
    stepIndex: index,
  }));
}
