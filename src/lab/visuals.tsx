import React from 'react';
import { VisualProps } from './views/types';
import VectorVisual from './views/VectorVisual';
import MatrixVisual from './views/MatrixVisual';
import PipelineVisual from './views/PipelineVisual';
import WarpVisual from './views/WarpVisual';
import ImageVisual from './views/ImageVisual';
import RaceVisual from './views/RaceVisual';
import TransferVisual from './views/TransferVisual';
import {
  RegisterVisual,
  BitFieldVisual,
  IsaStackVisual,
  PredictorVisual,
  ScalingVisual,
  CacheLineVisual,
  DependencyVisual,
  SimdVisual,
  ContentionVisual,
  RooflineVisual,
} from './views/ExtraVisuals';

export const SPECIAL_VISUALS: Record<string, { component: React.FC<VisualProps>; label: string } | undefined> = {
  vector: { component: VectorVisual, label: 'Vector lanes' },
  matrix: { component: MatrixVisual, label: 'GEMM tiles' },
  pipeline: { component: PipelineVisual, label: 'Pipeline stages' },
  'warp-mask': { component: WarpVisual, label: 'Warp lanes' },
  'image-grid': { component: ImageVisual, label: 'Pixel tile' },
  'race-bars': { component: RaceVisual, label: 'Race bars' },
  'transfer-bus': { component: TransferVisual, label: 'Transfer bus' },
  'register-file': { component: RegisterVisual, label: 'Register file' },
  'bit-fields': { component: BitFieldVisual, label: 'Instruction bits' },
  'isa-stack': { component: IsaStackVisual, label: 'C → PTX → SASS' },
  predictor: { component: PredictorVisual, label: 'Branch history' },
  'thread-scaling': { component: ScalingVisual, label: 'Thread scaling' },
  'cache-line': { component: CacheLineVisual, label: 'Cache line' },
  'dependency-graph': { component: DependencyVisual, label: 'Dependency graph' },
  'simd-lanes': { component: SimdVisual, label: 'SIMD lanes' },
  contention: { component: ContentionVisual, label: 'Line contention' },
  roofline: { component: RooflineVisual, label: 'Roofline' },
};
