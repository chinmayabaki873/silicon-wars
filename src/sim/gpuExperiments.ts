import {
  CanonicalComponentId,
  GridCell,
  KitchenWorker,
  SimulationStep,
  StepInspectorData,
} from '../types/simulation';
import { emptyMetrics, gpuCrew, idleGpu, makeStep, metrics, resetStepCounter, CrewState, cpuCrew } from './core';

const BRIG = (states: CrewState[]): KitchenWorker[] => gpuCrew(states);
const sleep: CrewState = { state: 'idle', task: 'no warps resident' };

/* ================================================================== */
/*  EXP-01 — VECTOR ADDITION                                           */
/* ================================================================== */

export function vectorSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const parallel = param === 'gpu-parallel';
  const A = [12, 7, 19, 4, 23, 11, 8, 16];
  const B = [5, 9, 3, 14, 6, 2, 17, 10];
  const steps: SimulationStep[] = [];

  const items = (n: number, activeIdx: number, doneUpTo: number) =>
    Array.from({ length: 8 }).map((_, i) => ({
      idx: i,
      a: A[i],
      b: B[i],
      out: i < doneUpTo ? A[i] + B[i] : null,
      status: (i === activeIdx ? 'active' : i < doneUpTo ? 'done' : 'idle') as 'active' | 'done' | 'idle',
    }));

  if (parallel) {
    steps.push({
            cycle: 1,
      stageShort: 'DISPATCH',
      activeComponents: ['warp-scheduler', 'sm-0', 'sm-1', 'vram'],
      workers: BRIG([
        { state: 'fetching', task: 'Coalesced load A[0..31]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load B[0..31]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load A[32..63]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load B[32..63]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load A[64..95]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load B[64..95]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load A[96..127]', progress: 25 },
        { state: 'fetching', task: 'Coalesced load B[96..127]', progress: 25 },
      ]),
      packets: [{ id: 'v1', from: 'vram', to: 'gpu-workers', label: '1 KB vector stream', kind: 'data' }],
      storageHighlights: {
        registersText: 'Per-thread R0=a[i], R1=b[i]',
        l1Text: '— (bypassed, streaming)',
        ramText: 'Host buffer 1 KB pinned',
        vramText: 'A,B resident @ 0x0–0x7FF',
      },
      specialVisual: { type: 'vector', vectorItems: items(8, -1, 0) },
      metrics: metrics({ instructionsExecuted: 0, cacheHits: 0, memoryAccesses: 2, bytesTransferred: 64, gpuUtilization: [25, 25, 25, 25, 25, 25, 25, 25], stageCycles: { compute: 0, memory: 1, control: 1, stall: 0 }, estimatedTimeNs: 40 }),
      inspector: {
        stepTitle: 'One call moves the entire tray',
        phaseBadge: 'SINGLE WAVE',
        componentHardware: 'Warp Scheduler → coalesced LDG',
        componentKitchen: 'Floor commander shouts one instruction',
        primaryComponentId: 'warp-scheduler',
        opcode: 'LDG.E.128 R0, [V0+idx]',
        inputData: 'Arrays A[0..7], B[0..7]',
        operation: 'Single vectorized load covering every lane',
        outputData: 'All 8 register pairs populated concurrently',
        memoryAccess: { tier: 'VRAM', status: 'HIT', address: '0x0000 (coalesced)', latencyCycles: 6 },
        beginnerExplanation:
          'Instead of asking eight workers one after another, the floor commander shouts a single instruction. Eight cooks reach out and pick up their ingredient at the same instant.',
        engineeringExplanation:
          'A single wide load instruction is broadcast to the warp. Addresses of adjacent lanes are coalesced by the memory controller into one wide transaction, so 8 elements cost one VRAM round trip instead of eight.',
        nextStepPreview: 'Broadcast the ADD instruction across all lanes',
      },
    });

    steps.push({
            cycle: 2,
      stageShort: 'EXECUTE',
      activeComponents: ['gpu-workers', 'alu', 'sm-0', 'sm-1'],
      workers: BRIG(
        Array.from({ length: 8 }).map((_, i) => ({
          state: 'computing' as const,
          task: `C[${i * 4}..] = A + B`,
          progress: 70,
          badge: `${A[i] + B[i]}`,
        })),
      ),
      storageHighlights: {
        registersText: `R2 = [${A.slice(0, 4).join(',')}] + [${B.slice(0, 4).join(',')}]`,
        l1Text: '—',
        ramText: 'idle',
        vramText: 'C partially written',
      },
      specialVisual: { type: 'vector', vectorItems: items(8, -1, 8) },
      metrics: metrics({
        instructionsExecuted: 8,
        gpuUtilization: [100, 100, 100, 100, 100, 100, 100, 100],
        cacheHits: 8,
        memoryAccesses: 2,
        bytesTransferred: 64,
        stageCycles: { compute: 8, memory: 1, control: 1, stall: 0 },
        estimatedTimeNs: 55,
      }),
      inspector: {
        stepTitle: 'Eight additions, one heartbeat',
        phaseBadge: 'SIMT LOCKSTEP',
        componentHardware: 'SIMT ALU lanes inside both SMs',
        componentKitchen: 'Eight cooks chop simultaneously',
        primaryComponentId: 'gpu-workers',
        opcode: 'ADD R2, R0, R1 (×32 lanes)',
        inputData: 'R0 = a[i], R1 = b[i] for every lane',
        operation: 'Element-wise integer addition, one lane per element',
        outputData: 'C = [17, 16, 22, 18, 29, 13, 25, 26]',
        memoryAccess: { tier: 'Register', status: 'INTERNAL', address: 'VGPR R0,R1', latencyCycles: 1 },
        beginnerExplanation:
          'Every cook performs the same instruction on their own numbered ingredient. Nobody waits for anybody: eight dishes finish in the time one would.',
        engineeringExplanation:
          'The ADD instruction is issued once and executed by each active lane in parallel. Because the operation has no control flow and no inter-lane dependencies, occupancy stays at 100% with zero divergence.',
        nextStepPreview: 'Write results back as one coalesced store',
      },
    });

    steps.push({
            cycle: 3,
      stageShort: 'STORE',
      activeComponents: ['vram', 'gpu-workers'],
      workers: BRIG(
        Array.from({ length: 8 }).map((_, i) => ({
          state: 'completed' as const,
          task: 'C tile stored',
          progress: 100,
          badge: `${A[i] + B[i]}`,
        })),
      ),
      packets: [{ id: 'v2', from: 'gpu-workers', to: 'vram', label: 'C[0..7]', kind: 'result' }],
      storageHighlights: {
        registersText: 'Lanes drained · R0–R2 recycled',
        l1Text: '—',
        ramText: 'host copy ready',
        vramText: 'C resident — 2 kernels possible',
      },
      specialVisual: { type: 'vector', vectorItems: items(8, -1, 8) },
      metrics: metrics({
        instructionsExecuted: 24,
        gpuUtilization: [100, 100, 100, 100, 100, 100, 100, 100],
        cacheHits: 16,
        memoryAccesses: 4,
        bytesTransferred: 128,
        stageCycles: { compute: 8, memory: 3, control: 1, stall: 0 },
        estimatedTimeNs: 70,
        bottleneck: {
          title: 'None — perfectly parallel',
          severity: 'low',
          beginnerText: 'Everything about this workload is embarrassingly parallel. Nothing ever had to wait.',
          engineeringText: 'Zero inter-lane dependencies, fully coalesced accesses, 100% occupancy: this is the ideal case for SIMT hardware.',
      },
      }),
      inspector: {
        stepTitle: 'Coalesced store — the tray leaves as a tray',
        phaseBadge: 'COMPLETE',
        componentHardware: 'STG → VRAM write-back',
        componentKitchen: 'Eight finished bowls leave together',
        primaryComponentId: 'vram',
        opcode: 'STG.E.128 [C+idx], R2',
        inputData: 'R2 results across 8 lanes',
        operation: 'Coalesced write into contiguous VRAM',
        outputData: 'C[0..7] = [17,16,22,18,29,13,25,26]',
        memoryAccess: { tier: 'VRAM', status: 'DMA', address: '0x800 (coalesced)', latencyCycles: 6 },
        beginnerExplanation:
          'Three beats: load, add, store. Nobody stood around once, because there was nothing to wait for.',
        engineeringExplanation:
          'Total kernel cost is dominated by two memory transactions rather than arithmetic. Arithmetic intensity here is below 1 FLOP/byte — a memory-bound kernel that would gain nothing from faster math units.',
        nextStepPreview: 'Reset and try the CPU chef on the same tray',
      },
    });
  } else {
    for (let i = 0; i < 4; i++) {
      const done = i;
      steps.push({
                cycle: i * 3 + 2,
        stageShort: 'LOOP BODY',
        activeComponents: ['core-0', 'alu', 'registers', 'l1-cache'],
        workers: cpuCrew([
          { state: i < 3 ? 'computing' : 'completed', task: `loop i=${i}: C[${i}]=A[${i}]+B[${i}]`, progress: ((i + 1) / 4) * 100, badge: `${A[i] + B[i]}` },
          { state: 'idle', task: 'No work assigned (SIMD would help)' },
          { state: 'idle', task: 'No work assigned' },
          { state: 'idle', task: 'No work assigned' },
        ]),
        storageHighlights: {
          registersText: `R1=a[${i}]=${A[i]} · R2=b[${i}]=${B[i]} · R3=${A[i] + B[i]}`,
          l1Text: 'array lines cached (3 of 4 hits)',
          ramText: i === 0 ? 'cold miss on A[0]' : 'resident',
        },
        specialVisual: { type: 'vector', vectorItems: items(8, i, done) },
        metrics: metrics({
          instructionsExecuted: (i + 1) * 4,
          cacheHits: i * 2,
          cacheMisses: i === 0 ? 2 : 0,
          memoryAccesses: (i + 1) * 2,
          bytesTransferred: 64,
          cpuUtilization: [i < 3 ? 100 : 60, 0, 0, 0],
          stageCycles: { compute: (i + 1) * 3, memory: i === 0 ? 4 : 2, control: (i + 1) * 1, stall: 0 },
          estimatedTimeNs: (i + 1) * 1.3,
          bottleneck: {
            title: 'Only one chef works — 75% of the kitchen idle',
            severity: 'moderate',
            beginnerText:
              'The dish count is growing but three of our four master chefs are simply watching. A scalar loop uses one cook at a time by design.',
            engineeringText:
              'A scalar loop has one dependency-free iteration at a time issued to a single thread. Utilization of 4 cores is 25%; only compiler auto-vectorization (SSE/AVX) or explicit threading would engage the rest.',
        },
        }),
        inspector: {
          stepTitle: `Loop iteration i = ${i}`,
          phaseBadge: 'SCALAR LOOP',
          componentHardware: 'Single CPU core, scalar ALU',
          componentKitchen: 'One master chef, one dish at a time',
          primaryComponentId: 'core-0',
          opcode: `ADD R3, R1, R2   ; loop i=${i}`,
          inputData: `A[${i}] = ${A[i]}, B[${i}] = ${B[i]}`,
          operation: 'Load both operands, add, store result, increment loop counter',
          outputData: `C[${i}] = ${A[i] + B[i]}`,
          memoryAccess: { tier: i === 0 ? 'System RAM' : 'L1 Cache', status: i === 0 ? 'MISS' : 'HIT', address: `A+${i * 4}`, latencyCycles: i === 0 ? 200 : 4 },
          beginnerExplanation:
            'One chef works through the order list in strict sequence: dish 1, then dish 2, then dish 3. Each dish is finished fast, but they are strictly consecutive.',
          engineeringExplanation:
            'Each iteration is independent, yet the loop carries a loop-counter dependency and a single instruction stream. Only one core is engaged, so throughput is bounded by single-core issue width rather than by available parallelism.',
          nextStepPreview: i === 3 ? 'Compare against the GPU wave' : `Iteration i = ${i + 1}`,
        },
      });
    }

    steps.push({
            cycle: 14,
      stageShort: 'SUMMARY',
      activeComponents: ['core-0', 'core-1', 'core-2', 'core-3', 'alu'],
      workers: cpuCrew([
        { state: 'completed', task: '8 elements, 8 sequential iterations', progress: 100 },
        { state: 'idle', task: 'Unused — scalar loop' },
        { state: 'idle', task: 'Unused — scalar loop' },
        { state: 'idle', task: 'Unused — scalar loop' },
      ]),
      storageHighlights: { registersText: 'C[0..7] written', l1Text: 'all array lines resident', ramText: 'idle' },
      specialVisual: { type: 'vector', vectorItems: items(8, -1, 8) },
      metrics: metrics({
        instructionsExecuted: 32,
        cacheHits: 12,
        cacheMisses: 2,
        memoryAccesses: 16,
        bytesTransferred: 128,
        cpuUtilization: [100, 0, 0, 0],
        stageCycles: { compute: 12, memory: 6, control: 4, stall: 2 },
        estimatedTimeNs: 12.4,
        bottleneck: {
          title: 'Parallelism left on the table',
          severity: 'moderate',
          beginnerText:
            'Twelve beats versus three. The CPU chef is faster per dish, but with 8 identical dishes the parallel kitchen wins outright.',
          engineeringText:
            'Scalar iteration cost is ~4 instructions per element. The GPU finishes in 3 cycles because all lanes share one instruction issue. For wide uniform data, SIMT throughput exceeds superscalar ILP by the lane count.',
      },
      }),
      inspector: {
        stepTitle: 'Summary — Sequential specialty cooking',
        phaseBadge: 'COMPLETE',
        componentHardware: 'Single-core scalar execution complete',
        componentKitchen: 'One chef, eight dishes, twelve beats',
        primaryComponentId: 'core-0',
        opcode: 'loop 8 × {LD, LD, ADD, ST}',
        inputData: '8 independent element pairs',
        operation: 'Sequential scalar execution',
        outputData: 'Same result as the GPU, 4× the elapsed cycles',
        memoryAccess: { tier: 'L1 Cache', status: 'HIT', address: 'A,B,C arrays', latencyCycles: 4 },
        beginnerExplanation:
          'Specialty cooking is superb when the dishes differ. When eight dishes are literally identical, you want many hands.',
        engineeringExplanation:
          'Latency-optimized hardware minimizes the time of one operation; throughput-optimized hardware maximizes operations per cycle. Identical results, different cost curves — this is the core CPU/GPU tradeoff.',
        nextStepPreview: 'Reset and switch architecture',
      },
    });
  }

  return steps;
}

/* ================================================================== */
/*  EXP-02 — MATRIX MULTIPLICATION                                     */
/* ================================================================== */

export function matmulSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const tiled = param === 'tiled-shared';
  const tiles: [number, number][][] = [
    [
      [1, 2],
      [3, 4],
    ],
    [
      [5, 6],
      [7, 8],
    ],
  ];
  const acc = (k: number) => tiles[0][0][0] * tiles[1][0][k] + tiles[0][0][1] * tiles[1][1][k];

  const cellGrid = (phase: number): GridCell[] => {
    const out: GridCell[] = [];
    const C = [
      [19, 22],
      [43, 50],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const activeRow = phase === 1 ? 0 : phase === 2 ? 1 : 2;
        out.push({
          row: r,
          col: c,
          value: r === 0 && c === 0 ? '' : r < 2 && c < 2 && phase >= r + 1 ? C[r][c] : '·',
          status: r === activeRow && phase < 3 ? 'active' : phase >= r + 1 ? 'done' : 'pending',
        });
      }
    }
    return out;
  };

  const brigStates = (states: Array<[KitchenWorker['state'], string]>): KitchenWorker[] =>
    BRIG(
      states.map(([state, task]) => ({ state, task, progress: state === 'not-used' as never ? 0 : state === 'idle' ? 0 : 65 })),
    );

  return [
    {
            cycle: 1,
      stageShort: 'HOST→DEVICE',
      activeComponents: ['ram', 'pcie-bus', 'vram'],
      workers: brigStates(Array.from({ length: 8 }).map(() => ['idle', 'awaiting tiles'] as [KitchenWorker['state'], string])),
      packets: [{ id: 'mm1', from: 'ram', to: 'vram', label: 'A,B tiles 128 B', kind: 'data' }],
      storageHighlights: {
        registersText: 'empty',
        l1Text: '—',
        ramText: 'A and B in host DRAM',
        vramText: 'receiving 128 B',
        sharedMemText: 'empty',
      },
      specialVisual: { type: 'matrix', gridCells: cellGrid(0) },
      metrics: metrics({ instructionsExecuted: 0, memoryAccesses: 2, bytesTransferred: 128, stageCycles: { compute: 0, memory: 2, control: 1, stall: 0 }, estimatedTimeNs: 2100, bottleneck: { title: 'PCIe transfer tax', severity: 'moderate', beginnerText: 'Before any cooking can start, the delivery van must carry the ingredients across town.', engineeringText: 'A 128-byte H2D transfer still costs ~2 µs of DMA descriptor setup — larger than the entire 2×2 GEMM compute time.' } }),
      inspector: {
        stepTitle: 'Host → Device — ingredients cross town',
        phaseBadge: 'DMA H2D',
        componentHardware: 'PCIe Gen5 root complex + DMA engine',
        componentKitchen: 'Delivery van between the two kitchens',
        primaryComponentId: 'pcie-bus',
        opcode: 'cudaMemcpy(H2D, A|B, 128 B)',
        inputData: 'A, B 2×2 matrices in host RAM',
        operation: 'Pinned-memory DMA copy into device VRAM',
        outputData: 'A, B resident in VRAM',
        memoryAccess: { tier: 'PCIe Bus', status: 'DMA', address: 'host→device', latencyCycles: 2100 },
        beginnerExplanation:
          'The GPU kitchen has its own warehouse across town. First the ingredients must physically arrive by truck — and the truck has high capacity but a real fixed cost.',
        engineeringExplanation:
          'For very small problems the DMA transfer dominates: PCIe latency, not FLOPs, defines performance. Batch transfers and keep data resident to amortize this fixed cost.',
        nextStepPreview: tiled ? 'Stage the tiles on communal prep tables' : 'Load operands directly from the warehouse',
      },
    },
    {
            cycle: 2,
      stageShort: tiled ? 'TILE LOAD' : 'NAIVE LOAD',
      activeComponents: tiled ? ['shared-mem', 'sm-0', 'sm-1'] : ['vram', 'sm-0', 'sm-1'],
      workers: brigStates(
        tiled
          ? Array.from({ length: 8 }).map((_, i) => [i < 4 ? 'computing' : 'fetching', i < 4 ? 'carrying tile to shared table' : 'fetching B row'] as [KitchenWorker['state'], string])
          : Array.from({ length: 8 }).map(() => ['fetching', 'refetching operands from VRAM'] as [KitchenWorker['state'], string]),
      ),
      packets: tiled
        ? [{ id: 'mm2', from: 'vram', to: 'shared-mem', label: 'A tile 4×4', kind: 'data' }]
        : [
            { id: 'mm3', from: 'vram', to: 'gpu-workers', label: 'row refetch', kind: 'data' },
            { id: 'mm4', from: 'vram', to: 'gpu-workers', label: 'row refetch', kind: 'data' },
          ],
      storageHighlights: {
        registersText: 'acc0..acc3 per lane',
        l1Text: '—',
        ramText: 'idle',
        vramText: tiled ? 'A,B read once' : 'A,B read 4× each',
        sharedMemText: tiled ? 'A tile resident (2×2, 16 B)' : 'unused (0 B)',
      },
      specialVisual: { type: 'matrix', gridCells: cellGrid(0) },
      metrics: metrics({
        instructionsExecuted: 8,
        cacheHits: tiled ? 8 : 0,
        cacheMisses: tiled ? 2 : 8,
        memoryAccesses: tiled ? 2 : 8,
        bytesTransferred: tiled ? 64 : 256,
        gpuUtilization: [60, 60, 60, 60, 60, 60, 60, 60],
        stageCycles: { compute: 2, memory: tiled ? 1 : 4, control: 1, stall: tiled ? 0 : 3 },
        estimatedTimeNs: tiled ? 160 : 480,
        bottleneck: {
          title: tiled ? 'Shared memory reducing refetch' : 'VRAM bandwidth saturation',
          severity: tiled ? 'low' : 'high',
          beginnerText: tiled
            ? 'The communal prep table now holds the tile, so every cook reaches to the same table instead of walking back to the warehouse.'
            : 'Every cook walks to the warehouse for the same ingredient over and over. Nobody is sharing anything.',
          engineeringText: tiled
            ? 'A 2×2 tile staged once in banked shared memory serves all 4 output cells: VRAM traffic drops 4× and the kernel becomes compute-bound.'
            : 'Naive GEMM has O(N³) global reads for N² outputs. Without tiling, VRAM bandwidth saturates long before the FMA units do.',
      },
      }),
      inspector: {
        stepTitle: tiled ? 'Tile staged on the communal table' : 'Naive refetch — same ingredient, four walks',
        phaseBadge: tiled ? 'SHARED MEM STAGE' : 'GLOBAL RELOAD',
        componentHardware: tiled ? 'Shared Memory (48 KB banked SRAM)' : 'VRAM via L2',
        componentKitchen: tiled ? 'Communal brigade prep table' : 'Repeated warehouse trips',
        primaryComponentId: tiled ? 'shared-mem' : 'vram',
        opcode: tiled ? 'LDGSTS  // cp.async into smem' : 'LDG ×4  // redundant global loads',
        inputData: 'A 2×2 tile',
        operation: tiled ? 'Asynchronous copy global→shared, then __syncthreads()' : 'Four separate global loads of the same line',
        outputData: tiled ? 'smem[0..3] holds A tile' : 'No reuse — data discarded after each use',
        memoryAccess: { tier: tiled ? 'Shared Mem' : 'VRAM', status: tiled ? 'HIT' : 'STREAM', address: 'smem 0x0 / VRAM 0x0', latencyCycles: tiled ? 20 : 400 },
        beginnerExplanation: tiled
          ? 'One cook fetches the ingredient and puts it on the shared table where everyone can reach it. Four cooks, one trip.'
          : 'Four cooks each make the same walk to the warehouse because nothing is shared between them.',
        engineeringExplanation: tiled
          ? 'Cooperative staging in shared memory converts repeated global reads into on-chip reads. Software-managed scratchpad memory is a defining GPU advantage and the heart of every efficient GEMM.'
          : 'Redundant global traffic wastes the most constrained resource in the machine. Memory-bound kernels can lose 4–8× performance to naive access patterns even with perfect occupancy.',
        nextStepPreview: 'Broadcast FMA across the warp',
      },
    },
    {
            cycle: 3,
      stageShort: 'FMA',
      activeComponents: ['gpu-workers', 'alu', 'sm-0', 'sm-1', 'registers'],
      workers: BRIG(
        Array.from({ length: 8 }).map((_, i) => ({
          state: 'computing' as const,
          task: i === 0 ? 'FMA acc += A·B' : 'dot-product accumulation',
          progress: 70,
          badge: i === 0 ? `${acc(0)}` : `c${i % 2}`,
        })),
      ),
      storageHighlights: {
        registersText: `acc = ${acc(0)} / ${acc(1)}`,
        l1Text: '—',
        ramText: 'idle',
        vramText: 'C row 0 written',
        sharedMemText: 'tile hot · 100% hit',
      },
      specialVisual: { type: 'matrix', gridCells: cellGrid(1) },
      metrics: metrics({
        instructionsExecuted: 40,
        cacheHits: 30,
        cacheMisses: 2,
        memoryAccesses: 4,
        bytesTransferred: 128,
        gpuUtilization: [100, 100, 100, 100, 100, 100, 100, 100],
        stageCycles: { compute: 8, memory: 1, control: 1, stall: 0 },
        estimatedTimeNs: tiled ? 190 : 510,
        bottleneck: {
          title: tiled ? 'Compute-bound (throughput saturated)' : 'Bandwidth-bound',
          severity: tiled ? 'low' : 'high',
          beginnerText: tiled
            ? 'Now the cooks are the bottleneck, not the warehouse. That is exactly where you want to be.'
            : 'The cooks keep pausing to fetch ingredients. The warehouse — not the cooking — limits the kitchen.',
          engineeringText: tiled
            ? 'With reuse in shared memory the kernel reaches compute-bound territory: FMA units saturate and arithmetic intensity exceeds the machine balance point.'
            : 'Below the machine balance point, adding FLOPs is free while extra bytes are not. This kernel is limited by VRAM bandwidth, and faster math units would change nothing.',
      },
      }),
      inspector: {
        stepTitle: 'Fused multiply-add sweep',
        phaseBadge: 'FMA PIPELINE',
        componentHardware: 'FP32 FMA lanes + VGPR accumulators',
        componentKitchen: 'Cooks blend tile ingredients in a single gesture',
        primaryComponentId: 'alu',
        opcode: 'FFMA acc, A[r], B[c], acc',
        inputData: `A[0][0..1] = 1,2 · B[0..1][0] = 5,7`,
        operation: 'Two-term dot product per output cell, fused',
        outputData: `C[0][0] = 1·5 + 2·7 = ${acc(0)}`,
        memoryAccess: { tier: 'Register', status: 'INTERNAL', address: 'VGPR acc', latencyCycles: 1 },
        beginnerExplanation:
          'A "fused" multiply-add does two recipe steps in one movement: multiply then stir, without putting the spoon down. That is how a GPU packs so much arithmetic per clock.',
        engineeringExplanation:
          'FFMA retires one multiply and one add per lane per cycle with a single rounding step — higher precision and double the throughput of separate MUL+ADD. GEMM is almost entirely FFMA.',
        nextStepPreview: 'Complete the remaining output rows',
      },
    },
    {
            cycle: 4,
      stageShort: 'STORE',
      activeComponents: ['vram', 'gpu-workers', 'shared-mem'],
      workers: BRIG(Array.from({ length: 8 }).map(() => ({ state: 'completed' as const, task: 'C tile stored', progress: 100 }))),
      packets: [{ id: 'mm5', from: 'gpu-workers', to: 'vram', label: 'C 2×2', kind: 'result' }],
      storageHighlights: {
        registersText: 'acc committed',
        l1Text: '—',
        ramText: 'held for D2H',
        vramText: 'C resident',
        sharedMemText: 'released',
      },
      specialVisual: { type: 'matrix', gridCells: cellGrid(3) },
      metrics: metrics({
        instructionsExecuted: 66,
        cacheHits: 40,
        cacheMisses: tiled ? 2 : 8,
        memoryAccesses: tiled ? 3 : 10,
        bytesTransferred: tiled ? 144 : 320,
        gpuUtilization: [100, 100, 100, 100, 100, 100, 100, 100],
        stageCycles: { compute: 8, memory: tiled ? 2 : 6, control: 1, stall: tiled ? 0 : 3 },
        estimatedTimeNs: tiled ? 205 : 620,
        bottleneck: {
          title: tiled ? 'Efficient — compute-bound' : 'Memory-bound with 3× the traffic',
          severity: tiled ? 'low' : 'high',
          beginnerText: tiled
            ? 'Sixty-four little multiply-adds happened across just a few warehouse trips.'
            : 'The same sixty-four multiply-adds, but with three times the warehouse traffic to feed them.',
          engineeringText: tiled
            ? 'Arithmetic intensity rises from ~2 to ~8 FLOP/byte, crossing the machine balance point so the SMs stay saturated.'
            : 'Naive GEMM is bandwidth-limited at every tile size; this is precisely why every production GEMM library (cuBLAS, CUTLASS) is built around shared-memory tiling.',
      },
      }),
      inspector: {
        stepTitle: 'Store C and measure arithmetic intensity',
        phaseBadge: 'COMPLETE',
        componentHardware: 'STG → VRAM → PCIe D2H',
        componentKitchen: 'Finished tasting grid leaves the pass',
        primaryComponentId: 'vram',
        opcode: 'STG.128 [C], acc',
        inputData: '4 accumulated outputs',
        operation: 'Write output tile, compute intensity ratio',
        outputData: `C = [[19,22],[43,50]] · ${tiled ? '~8' : '~2'} FLOP/byte`,
        memoryAccess: { tier: 'VRAM', status: 'DMA', address: '0x800', latencyCycles: 6 },
        beginnerExplanation:
          'Same dish, same cooks, one design decision — sharing a table — and the kitchen runs three times faster.',
        engineeringExplanation:
          'Arithmetic intensity is the single most useful predictor of GPU performance. Below the machine balance point the kernel is memory-bound; above it, compute-bound. Tiling is how you move left to right on that curve.',
        nextStepPreview: 'Reset and try naive mode',
      },
    },
  ];
}

/* ================================================================== */
/*  EXP-06 — GPU THREAD BLOCKS                                         */
/* ================================================================== */

export function threadBlockSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const balanced = param === 'balanced-2sm';

  const brig = (sm0: number[], sm1: number[], task: string): KitchenWorker[] =>
    BRIG(
      Array.from({ length: 8 }).map((_, i) => {
        const inS0 = i < 4;
        const group = inS0 ? sm0 : sm1;
        const active = balanced ? true : inS0;
        return {
          state: (active ? (group[i % group.length] > 0 ? 'computing' : 'idle') : 'idle') as KitchenWorker['state'],
          task: active ? task : 'island B unassigned (no block)',
          progress: active ? group[i % group.length] : 0,
        };
      }),
    );

  return [
    {
            cycle: 1,
      stageShort: 'GRID SETUP',
      activeComponents: ['scheduler', 'sm-0', 'sm-1'],
      workers: brig([10, 10, 10, 10], balanced ? [10, 10, 10, 10] : [0, 0, 0, 0], 'receiving block assignment'),
      storageHighlights: {
        registersText: 'blockIdx.x assigned per island',
        l1Text: '—',
        ramText: 'kernel params resident',
        vramText: 'grid dim = 2 blocks × 128 threads',
        sharedMemText: balanced ? 'SM0 8 KB · SM1 8 KB' : 'SM0 8 KB · SM1 0 KB',
      },
      metrics: metrics({
        instructionsExecuted: 0,
        gpuUtilization: balanced ? [10, 10, 10, 10, 10, 10, 10, 10] : [10, 10, 10, 10, 0, 0, 0, 0],
        memoryAccesses: 1,
        bytesTransferred: 16,
        stageCycles: { compute: 0, memory: 0, control: 1, stall: 0 },
        estimatedTimeNs: 30,
      }),
      inspector: {
        stepTitle: 'The grid is dealt like cards to islands',
        phaseBadge: 'BLOCK DISPATCH',
        componentHardware: 'GigaThread engine → SM work distributor',
        componentKitchen: 'Floor manager splits the menu into islands',
        primaryComponentId: 'scheduler',
        opcode: 'grid = dim3(2,1) · block = dim3(128,1)',
        inputData: '1,024 dishes to prepare',
        operation: balanced ? 'Distribute 2 blocks evenly across 2 SMs' : 'Assign 1 oversized block to a single SM',
        outputData: balanced ? 'SM0: 512 dishes · SM1: 512 dishes' : 'SM0: 1,024 dishes · SM1: 0',
        memoryAccess: { tier: 'VRAM', status: 'HIT', address: 'kernel params', latencyCycles: 8 },
        beginnerExplanation: balanced
          ? 'A thousand dishes are split into two equal halves and handed to two brigade islands. Both islands work at the same rhythm.'
          : 'All thousand dishes are handed to a single brigade island. The other island stands completely empty — half the kitchen unused.',
        engineeringExplanation:
          'Thread blocks are the unit of independent scheduling. The hardware distributor places blocks on SMs as resources allow; block independence means the same code scales from a 2-SM laptop GPU to a 132-SM datacenter GPU.',
        nextStepPreview: 'Resident warps begin cooperative loading',
      },
    },
    {
            cycle: 2,
      stageShort: 'COOPERATIVE LOAD',
      activeComponents: ['shared-mem', 'sm-0', 'sm-1'],
      workers: brig([45, 45, 45, 45], balanced ? [45, 45, 45, 45] : [0, 0, 0, 0], 'staging ingredients on shared table'),
      packets: [
        { id: 'tb1', from: 'vram', to: 'sm-0', label: 'block 0 tile', kind: 'data' },
        ...(balanced ? [{ id: 'tb2', from: 'vram' as CanonicalComponentId, to: 'sm-1' as CanonicalComponentId, label: 'block 1 tile', kind: 'data' as const }] : []),
      ],
      storageHighlights: {
        registersText: 'threadIdx.x → dish index',
        l1Text: '—',
        ramText: 'idle',
        vramText: '2 × 512-element tiles',
        sharedMemText: balanced ? 'both tables loaded' : 'island B table untouched',
      },
      metrics: metrics({
        instructionsExecuted: 32,
        cacheHits: 16,
        memoryAccesses: 4,
        bytesTransferred: balanced ? 4096 : 2048,
        gpuUtilization: balanced ? [45, 45, 45, 45, 45, 45, 45, 45] : [45, 45, 45, 45, 0, 0, 0, 0],
        stageCycles: { compute: 2, memory: 4, control: 1, stall: 0 },
        estimatedTimeNs: 240,
        bottleneck: balanced
          ? { title: 'Balanced load', severity: 'low', beginnerText: 'Both islands fetch their own ingredients in parallel.', engineeringText: 'Both SMs issue coalesced global loads concurrently; no SM is starved and no cross-SM dependency exists.' }
          : { title: 'Half of the GPU idle', severity: 'high', beginnerText: 'Only one brigade island is working. The other is spotless and unused.', engineeringText: 'A single block cannot span SMs, so SM1 has zero resident warps. Achievable throughput is capped at 50% of the device no matter how many threads the block declares.' },
      }),
      inspector: {
        stepTitle: 'Cooperative staging — every cook feeds the table',
        phaseBadge: 'SHARED LOAD',
        componentHardware: 'Global → Shared async copy (cp.async / LDGSTS)',
        componentKitchen: 'Brigade fills its communal table together',
        primaryComponentId: 'shared-mem',
        opcode: '__shared__ float tile[256];  tile[tid] = g[tid];',
        inputData: 'Global array slice per block',
        operation: 'Coalesced load, one element per thread, into shared memory',
        outputData: balanced ? 'Both SM tables hold 1 KB' : 'Only SM0 table holds data',
        memoryAccess: { tier: 'Shared Mem', status: 'DMA', address: 'smem base', latencyCycles: 20 },
        beginnerExplanation:
          'Every cook grabs exactly one ingredient and sets it on the communal table. Because all of them move at once, a whole pallet is staged in one gesture.',
        engineeringExplanation:
          'One thread per element gives perfectly coalesced global accesses, and the shared array means the following compute phase reuses each global byte many times. This is the standard CUDA tiling idiom.',
        nextStepPreview: 'Barrier — nobody computes before the table is complete',
      },
    },
    {
            cycle: 3,
      stageShort: 'BARRIER',
      activeComponents: ['sm-0', 'sm-1', 'shared-mem'],
      workers: brig([60, 60, 60, 100], balanced ? [60, 60, 60, 100] : [0, 0, 0, 0], 'waiting at the barrier'),
      storageHighlights: {
        registersText: 'warp arrival counts 4/4',
        l1Text: '—',
        ramText: 'idle',
        vramText: 'stable',
        sharedMemText: balanced ? '__syncthreads() satisfied on both SMs' : 'SM0 satisfied · SM1 absent',
      },
      metrics: metrics({
        instructionsExecuted: 36,
        gpuUtilization: balanced ? [60, 60, 60, 100, 60, 60, 60, 100] : [60, 60, 60, 100, 0, 0, 0, 0],
        memoryAccesses: 4,
        bytesTransferred: balanced ? 4096 : 2048,
        stageCycles: { compute: 1, memory: 4, control: 3, stall: 1 },
        estimatedTimeNs: 260,
      }),
      inspector: {
        stepTitle: '__syncthreads() — nobody cooks early',
        phaseBadge: 'BLOCK BARRIER',
        componentHardware: 'Per-SM barrier unit / warp arrival counters',
        componentKitchen: 'Brigade waits until the whole table is set',
        primaryComponentId: 'sm-0',
        opcode: '__syncthreads();',
        inputData: 'Arrival counters for resident warps',
        operation: 'Block all warps until every warp reaches the barrier',
        outputData: 'All warps released simultaneously on the same clock edge',
        memoryAccess: { tier: 'Shared Mem', status: 'INTERNAL', address: 'barrier registers', latencyCycles: 4 },
        beginnerExplanation:
          'The brigade holds hands and waits. If one cook vanished to the pantry, the whole island waits — because a half-set table would ruin the next step.',
        engineeringExplanation:
          'Barriers synchronize only within a block, never across blocks. This is why blocks are guaranteed to be schedulable together: cooperation is cheap inside a block and impossible outside it without a kernel launch boundary.',
        nextStepPreview: 'Compute phase at full occupancy',
      },
    },
    {
            cycle: 4,
      stageShort: 'COMPUTE',
      activeComponents: ['gpu-workers', 'sm-0', 'sm-1', 'alu'],
      workers: brig([100, 100, 100, 100], balanced ? [100, 100, 100, 100] : [0, 0, 0, 0], 'processing tile from shared table'),
      storageHighlights: {
        registersText: 'per-thread result ready',
        l1Text: '—',
        ramText: 'idle',
        vramText: 'output tile 1 of 2',
        sharedMemText: 'high reuse · 100% shared hit',
      },
      metrics: metrics({
        instructionsExecuted: 1024,
        cacheHits: 900,
        memoryAccesses: 6,
        bytesTransferred: balanced ? 4096 : 2048,
        gpuUtilization: balanced ? [100, 100, 100, 100, 100, 100, 100, 100] : [100, 100, 100, 100, 0, 0, 0, 0],
        stageCycles: { compute: 16, memory: 4, control: 3, stall: 1 },
        estimatedTimeNs: balanced ? 380 : 700,
        bottleneck: balanced
          ? { title: 'Balanced — full device utilization', severity: 'low', beginnerText: 'Both islands cook at the same rhythm and finish together.', engineeringText: 'Even block distribution reaches 2/2 SM occupancy; the kernel is compute-bound with complete latency hiding.' }
          : { title: 'Device under-utilization (50%)', severity: 'high', beginnerText: 'One island does all the work, so dinner takes twice as long.', engineeringText: 'SM1 remains empty; total device throughput is halved. Real workloads avoid this via smaller blocks and larger grids.' },
      }),
      inspector: {
        stepTitle: 'Every island cooks at once',
        phaseBadge: 'FULL OCCUPANCY',
        componentHardware: 'All SIMT lanes across both SMs',
        componentKitchen: 'Both brigade islands at full rhythm',
        primaryComponentId: 'gpu-workers',
        opcode: 'out[i] = f(tile[tid], tile[mirror(tid)]);',
        inputData: 'Shared-memory tiles on both SMs',
        operation: 'Per-thread computation with intra-block data reuse',
        outputData: balanced ? '1,024 dishes in 380 units' : '1,024 dishes in 700 units',
        memoryAccess: { tier: 'Shared Mem', status: 'HIT', address: 'smem[]', latencyCycles: 20 },
        beginnerExplanation: balanced
          ? 'Two islands, one rhythm, done together. Adding a third island would finish this even faster — GPU work splits almost for free.'
          : 'One island does the entire banquet. The second island could have finished this in half the time and nobody assigned it any work.',
        engineeringExplanation:
          'Grid size, not block size, is what scales across devices. Declaring enough small blocks lets the scheduler fill every SM on any GPU — the reason CUDA code rarely needs rewriting across hardware generations.',
        nextStepPreview: 'Reset and change the block configuration',
      },
    },
  ];
}

/* ================================================================== */
/*  EXP-07 — WARPS & SIMD/SIMT                                         */
/* ================================================================== */

export function warpSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const divergent = param === 'divergent';
  const lanes16 = (mask: boolean[]) => mask;

  const maskA = divergent ? lanes16(Array.from({ length: 16 }, (_, i) => i % 2 === 0)) : lanes16(Array(16).fill(true));
  const maskB = divergent ? lanes16(Array.from({ length: 16 }, (_, i) => i % 2 === 1)) : lanes16(Array(16).fill(true));

  const cookStates = (active: boolean[], task: string): KitchenWorker[] =>
    BRIG(
      Array.from({ length: 8 }).map((_, i) => {
        const groupActive = active.slice(i * 2, i * 2 + 2).some(Boolean);
        return {
          state: (groupActive ? 'computing' : 'diverged-off') as KitchenWorker['state'],
          task: groupActive ? task : 'masked off — no dish in this path',
          progress: groupActive ? 88 : 0,
        };
      }),
    );

  return [
    {
            cycle: 1,
      stageShort: 'WARP FORM',
      activeComponents: ['warp-scheduler', 'gpu-workers'],
      workers: cookStates(Array(16).fill(true), 'receiving the shout'),
      storageHighlights: { registersText: '32 VGPR sets allocated', l1Text: '—', ramText: 'idle', vramText: 'orders resident' },
      specialVisual: { type: 'warp-mask', warpMask: lanes16(Array(16).fill(true)) },
      metrics: metrics({ instructionsExecuted: 0, gpuUtilization: [80, 80, 80, 80, 80, 80, 80, 80], stageCycles: { compute: 0, memory: 0, control: 1, stall: 0 }, estimatedTimeNs: 20 }),
      inspector: {
        stepTitle: 'Thirty-two cooks stand in one row',
        phaseBadge: 'WARP ALLOCATION',
        componentHardware: 'Warp allocation in an SM sub-partition',
        componentKitchen: 'Cooks line up in the brigade row',
        primaryComponentId: 'warp-scheduler',
        opcode: 'warp = 32 threads · EXEC_MASK = 0xFFFFFFFF',
        inputData: '1,024 independent orders',
        operation: 'Bundle 32 threads into a single instruction stream',
        outputData: 'One fully active warp, mask = all ones',
        memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
        beginnerExplanation:
          'Cook number 1 through 32 stand shoulder to shoulder. From this moment on, they will hear exactly the same instruction at exactly the same time.',
        engineeringExplanation:
          'Threads in a warp share one program counter and one instruction issue stream. Divergence, when it happens, is a property of this bundling — not of the code the programmer wrote.',
        nextStepPreview: 'The commander shouts the first instruction',
      },
    },
    {
            cycle: 2,
      stageShort: 'BROADCAST',
      activeComponents: ['warp-scheduler', 'alu'],
      workers: cookStates(Array(16).fill(true), 'ADD R2, R0, R1 — same step, own ingredient'),
      storageHighlights: { registersText: 'R0..R2 per lane', l1Text: '—', ramText: 'idle', vramText: 'idle' },
      specialVisual: { type: 'warp-mask', warpMask: lanes16(Array(16).fill(true)) },
      metrics: metrics({ instructionsExecuted: 32, cacheHits: 32, gpuUtilization: [100, 100, 100, 100, 100, 100, 100, 100], stageCycles: { compute: 2, memory: 0, control: 1, stall: 0 }, estimatedTimeNs: 40 }),
      inspector: {
        stepTitle: 'One shout, thirty-two cooks',
        phaseBadge: 'SIMT COHERENT',
        componentHardware: 'Warp scheduler broadcast → 32 ALU lanes',
        componentKitchen: 'One command, whole row moves together',
        primaryComponentId: 'gpu-workers',
        opcode: 'ADD R2, R0, R1   // 32 active lanes',
        inputData: 'R0 and R1 differ per lane',
        operation: 'Identical ADD applied to 32 distinct data items',
        outputData: '32 results in a single issue slot',
        memoryAccess: { tier: 'Register', status: 'INTERNAL', address: 'VGPR', latencyCycles: 1 },
        beginnerExplanation:
          'The commander shouts "add". Every cook adds their own two ingredients. Thirty-two dishes progress in the time a single cook would need for one.',
        engineeringExplanation:
          'SIMT is SIMD with per-lane data addressing: one instruction word drives 32 independent register contexts. Coherent warps reach the theoretical maximum of one lane-operation per ALU per cycle.',
        nextStepPreview: divergent ? 'Orders split into two different recipes — what now?' : 'Continue coherent execution',
      },
    },
    ...((divergent
      ? [
          {
                        cycle: 3,
            stageShort: 'BRANCH',
            activeComponents: ['warp-scheduler', 'gpu-workers'] as CanonicalComponentId[],
            workers: cookStates(maskB, 'waiting on the else path (masked)'),
            storageHighlights: { registersText: 'EXEC_MASK = 0x55555555', l1Text: '—', ramText: 'idle', vramText: 'idle' },
            specialVisual: { type: 'warp-mask' as const, warpMask: maskA },
            metrics: metrics({
              instructionsExecuted: 64,
              gpuUtilization: [50, 50, 50, 50, 50, 50, 50, 50],
              stageCycles: { compute: 2, memory: 0, control: 3, stall: 2 },
              estimatedTimeNs: 70,
              bottleneck: {
                title: 'Branch divergence — half the row idles',
                severity: 'high',
                beginnerText:
                  'Half the cooks were told "sear spicy" and half "poach gently". Different tools. The row cannot move together any more.',
                engineeringText:
                  'The branch splits the warp into two serialized paths. Path A executes with mask 0x5555…, path B with 0xAAAA…, so each instruction takes two issue slots to cover all 32 lanes.',
            },
            }),
            inspector: {
              stepTitle: 'Path A first — odd lanes masked off',
              phaseBadge: 'DIVERGENCE 1/2',
              componentHardware: 'Branch unit + reconvergence stack',
              componentKitchen: 'Only half the row cooks the spicy recipe',
              primaryComponentId: 'warp-scheduler',
              opcode: 'if (t % 2 == 0) SEAR;  // mask 0x55555555',
              inputData: '16 even lanes satisfy the predicate',
              operation: 'Execute the "if" path with inactive lanes masked',
              outputData: '16 search results; 16 lanes idle',
              memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
              beginnerExplanation:
                'The commander can only shout one instruction at a time. First she shouts the spicy version — and half the cooks stand frozen because it is not their dish.',
              engineeringExplanation:
                'Divergence is resolved by replaying the warp once per path. Utilization in each pass is 16/32 = 50%, so the branch costs twice the issue bandwidth of coherent code.',
              nextStepPreview: 'Now the other half takes its turn',
            },
          },
          {
                        cycle: 4,
            stageShort: 'BRANCH',
            activeComponents: ['warp-scheduler', 'gpu-workers'],
            workers: cookStates(maskA, 'waiting on the if path (masked)'),
            packets: [],
            storageHighlights: { registersText: 'EXEC_MASK = 0xAAAAAAA', l1Text: '—', ramText: 'idle', vramText: 'idle' },
            specialVisual: { type: 'warp-mask', warpMask: maskB },
            metrics: metrics({
              instructionsExecuted: 96,
              gpuUtilization: [50, 50, 50, 50, 50, 50, 50, 50],
              stageCycles: { compute: 2, memory: 0, control: 5, stall: 4 },
              estimatedTimeNs: 100,
              bottleneck: {
                title: 'Serialized control flow',
                severity: 'high',
                beginnerText: 'Now the other half cooks. Two rounds of half a row is the same as one round of the whole row — but done twice.',
                engineeringText: 'Path B replays the same instruction stream with the complementary mask. Total issue slots double while useful lane work stays constant.',
            },
            }),
            inspector: {
              stepTitle: 'Path B — even lanes now masked off',
              phaseBadge: 'DIVERGENCE 2/2',
              componentHardware: 'Branch unit replays the alternate path',
              componentKitchen: 'The other half of the row now poaches',
              primaryComponentId: 'warp-scheduler',
              opcode: 'else POACH;  // mask 0xAAAAAAAA',
              inputData: '16 odd lanes satisfy the else predicate',
              operation: 'Execute the alternate path with the complementary mask',
              outputData: '16 more results, now reconverged',
              memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
              beginnerExplanation:
                'Both halves eventually get cooked, but the row moved in two separate waves. If the whole row had wanted the same recipe, it would have taken one.',
              engineeringExplanation:
                'After both paths execute, the reconvergence stack restores full width. Divergence is expensive, which is why GPU code is written to keep predicate decisions uniform across a warp.',
              nextStepPreview: 'Reconverge and measure the throughput cost',
            },
          },
        ]
      : [
          {
                        cycle: 3,
            stageShort: 'COHERENT',
            activeComponents: ['warp-scheduler', 'gpu-workers', 'alu'],
            workers: cookStates(Array(16).fill(true), 'all 32 lanes take the same path'),
            storageHighlights: { registersText: 'EXEC_MASK = 0xFFFFFFFF', l1Text: '—', ramText: 'idle', vramText: 'idle' },
            specialVisual: { type: 'warp-mask' as const, warpMask: lanes16(Array(16).fill(true)) },
            metrics: metrics({
              instructionsExecuted: 96,
              gpuUtilization: [100, 100, 100, 100, 100, 100, 100, 100],
              stageCycles: { compute: 3, memory: 0, control: 2, stall: 0 },
              estimatedTimeNs: 40,
            }),
            inspector: {
              stepTitle: 'Every lane takes the same path',
              phaseBadge: 'ZERO DIVERGENCE',
              componentHardware: 'Branch unit — uniform predicate',
              componentKitchen: 'Whole row cooks the same recipe',
              primaryComponentId: 'warp-scheduler',
              opcode: 'if (t % 32 < 32) SEAR;  // uniform',
              inputData: 'Predicate identical across all lanes',
              operation: 'Single-path execution with a full mask',
              outputData: '32 results in one pass',
              memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
              beginnerExplanation:
                'Because everyone got the same recipe, the row moved once and finished. This is why GPUs love batches of identical work.',
              engineeringExplanation:
                'A uniform branch keeps the full execution mask, so no replay is required. Warp-coherent code preserves the arithmetic throughput the hardware was designed for.',
              nextStepPreview: 'Compare against the divergent case',
            },
          },
        ]) as SimulationStep[]),
    {
            cycle: 5,
      stageShort: 'SUMMARY',
      activeComponents: ['warp-scheduler', 'gpu-workers', 'sm-0'],
      workers: cookStates(Array(16).fill(true), 'warp completed'),
      specialVisual: { type: 'warp-mask', warpMask: lanes16(Array(16).fill(true)) },
      storageHighlights: { registersText: 'results committed', l1Text: '—', ramText: 'idle', vramText: 'results stored' },
      metrics: metrics({
        instructionsExecuted: divergent ? 128 : 96,
        gpuUtilization: divergent ? [50, 50, 50, 50, 50, 50, 50, 50] : [100, 100, 100, 100, 100, 100, 100, 100],
        stageCycles: divergent ? { compute: 4, memory: 0, control: 7, stall: 6 } : { compute: 4, memory: 0, control: 3, stall: 0 },
        estimatedTimeNs: divergent ? 110 : 45,
        bottleneck: {
          title: divergent ? 'Divergence cost: 55% throughput loss' : 'No bottleneck — full lane utilization',
          severity: divergent ? 'high' : 'low',
          beginnerText: divergent
            ? 'The same 32 dishes took two rounds instead of one, purely because the recipes differed. Ordering identical work together is the entire art of GPU programming.'
            : 'Identical work, one round, done. Keep your batches uniform and the GPU will keep its promise.',
          engineeringText: divergent
            ? 'Effective SIMT efficiency = useful lane-work / issued lane-slots = 32 / 64 ≈ 50%. Sorting work by predicate or using predicated selects instead of branches recovers most of it.'
            : 'Full mask throughout, no replays: SIMT efficiency 100%. This is the hardware’s design point and it is why GPUs dominate uniform data-parallel work.',
      },
      }),
      inspector: {
        stepTitle: divergent ? 'Summary — Two waves for one row' : 'Summary — One wave, full row',
        phaseBadge: 'COMPLETE',
        componentHardware: 'SIMT efficiency accounting',
        componentKitchen: 'Brigade efficiency audit',
        primaryComponentId: 'gpu-workers',
        opcode: 'SIMT efficiency = active lanes / issued slots',
        inputData: divergent ? '2 divergent paths × 16 lanes' : '1 coherent path × 32 lanes',
        operation: 'Compare useful work against issued instruction slots',
        outputData: divergent ? '≈ 50%' : '100%',
        memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
        beginnerExplanation: divergent
          ? 'Half a row cooking twice is not the same as a full row cooking once — it costs twice the time. Group similar orders, and the brigade flies.'
          : 'One row, one recipe, one round. Nothing was wasted, so nothing took longer than it had to.',
        engineeringExplanation:
          'Divergence is the GPU equivalent of a cache miss in the CPU world: not an error, but a structural tax. Warp-level programming — sorting, grouping, predication — is how production kernels stay near 100% SIMT efficiency.',
        nextStepPreview: 'Reset and compare both branch patterns',
      },
    },
  ];
}

/* ================================================================== */
/*  EXP-10 — IMAGE PROCESSING                                          */
/* ================================================================== */

export function imageSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const edge = param === 'edge-detect';
  const base = [
    [30, 45, 60, 80, 105, 130],
    [40, 55, 85, 110, 135, 150],
    [60, 80, 120, 155, 170, 180],
    [85, 110, 150, 190, 205, 210],
    [110, 140, 180, 210, 225, 230],
    [130, 160, 200, 220, 235, 240],
  ];
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const filtered = (r: number, c: number) => {
    const at = (rr: number, cc: number) => base[Math.max(0, Math.min(5, rr))][Math.max(0, Math.min(5, cc))];
    if (edge) {
      const gx = -at(r - 1, c - 1) - 2 * at(r, c - 1) - at(r + 1, c - 1) + at(r - 1, c + 1) + 2 * at(r, c + 1) + at(r + 1, c + 1);
      const gy = -at(r - 1, c - 1) - 2 * at(r - 1, c) - at(r - 1, c + 1) + at(r + 1, c - 1) + 2 * at(r + 1, c) + at(r + 1, c + 1);
      return clamp(Math.sqrt(gx * gx + gy * gy));
    }
    const blur =
      at(r - 1, c - 1) + 2 * at(r - 1, c) + at(r - 1, c + 1) +
      2 * at(r, c - 1) + 4 * at(r, c) + 2 * at(r, c + 1) +
      at(r + 1, c - 1) + 2 * at(r + 1, c) + at(r + 1, c + 1);
    return clamp(blur / 16);
  };

  const grid = (doneRows: number, activeRow: number, mode: 'in' | 'out'): GridCell[] => {
    const cells: GridCell[] = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        cells.push({
          row: r,
          col: c,
          value: mode === 'in' ? base[r][c] : doneRows > r ? filtered(r, c) : base[r][c],
          status: doneRows > r ? 'done' : r === activeRow ? 'active' : 'pending',
          intensity: mode === 'in' ? base[r][c] : doneRows > r ? filtered(r, c) : base[r][c],
        });
      }
    }
    return cells;
  };

  const steps: SimulationStep[] = [];
  steps.push({
        cycle: 1,
    stageShort: 'TILE MAP',
    activeComponents: ['warp-scheduler', 'gpu-workers', 'vram'],
    workers: BRIG(Array.from({ length: 8 }).map((_, i) => ({ state: 'fetching' as const, task: `thread (x,y) ← pixel row ${i < 4 ? 0 : 1}`, progress: 20 }))),
    packets: [{ id: 'i0', from: 'vram', to: 'gpu-workers', label: '6×6 pixel tile', kind: 'data' }],
    storageHighlights: { registersText: 'each thread: 1 pixel + 8 neighbours', l1Text: '—', ramText: 'idle', vramText: 'image resident 6×6', sharedMemText: 'halo rows staged' },
    specialVisual: { type: 'image-grid', inputGridCells: grid(0, -1, 'in'), gridCells: grid(0, -1, 'out') },
    metrics: metrics({ instructionsExecuted: 0, gpuUtilization: [20, 20, 20, 20, 20, 20, 20, 20], memoryAccesses: 2, bytesTransferred: 144, stageCycles: { compute: 0, memory: 2, control: 1, stall: 0 }, estimatedTimeNs: 120 }),
    inspector: {
      stepTitle: 'Every pixel becomes a plate',
      phaseBadge: 'THREAD MAPPING',
      componentHardware: '2D thread block indexing → VRAM textures',
      componentKitchen: 'One cook assigned per plated square',
      primaryComponentId: 'warp-scheduler',
      opcode: 'x = blockIdx.x*16 + threadIdx.x;  y = threadIdx.y;',
      inputData: '6×6 image, 1 byte per pixel',
      operation: 'Map each thread to exactly one output pixel',
      outputData: '36 threads, 36 dishes, zero coordination required',
      memoryAccess: { tier: 'VRAM', status: 'HIT', address: 'tex2D base', latencyCycles: 6 },
      beginnerExplanation:
        'A photo is just a huge grid of tiny plates. Each cook is handed exactly one plate and told: you are responsible for this square.',
      engineeringExplanation:
        '2D indexing maps threads to pixels directly, so no thread needs to know about any other. Neighbouring threads read neighbouring addresses — the definition of coalesced access.',
      nextStepPreview: 'Load the 3×3 neighbourhood for each pixel',
    },
  });

  steps.push({
        cycle: 2,
    stageShort: 'HALO LOAD',
    activeComponents: ['gpu-workers', 'shared-mem', 'sm-0'],
    workers: BRIG(Array.from({ length: 8 }).map(() => ({ state: 'fetching' as const, task: 'loading 3×3 halo stencil', progress: 45 }))),
    packets: [{ id: 'i1', from: 'vram', to: 'shared-mem', label: '9 samples / pixel', kind: 'data' }],
    storageHighlights: { registersText: '9 registers per thread', l1Text: '—', ramText: 'idle', vramText: 'read-amplified 9×', sharedMemText: 'halo rows overlap → reuse' },
    specialVisual: { type: 'image-grid', inputGridCells: grid(0, -1, 'in'), gridCells: grid(0, 0, 'out') },
    metrics: metrics({ instructionsExecuted: 36, gpuUtilization: [45, 45, 45, 45, 45, 45, 45, 45], memoryAccesses: 9, bytesTransferred: 1296, stageCycles: { compute: 1, memory: 4, control: 1, stall: 0 }, estimatedTimeNs: 340, bottleneck: { title: 'Read amplification of the stencil', severity: 'moderate', beginnerText: 'Each plate needs to look at its eight neighbours — so the same pixel is picked up nine times.', engineeringText: 'A 3×3 stencil reads each input pixel up to 9×. Without shared-memory halos, VRAM traffic scales with kernel area rather than image size.' } }),
    inspector: {
      stepTitle: 'Each cook samples a 3×3 neighbourhood',
      phaseBadge: 'STENCIL READ',
      componentHardware: 'Texture cache + shared-memory halo staging',
      componentKitchen: 'Cook looks at their plate and its neighbours',
      primaryComponentId: 'shared-mem',
      opcode: 'LDG ×9  // (x±1, y±1)',
      inputData: 'Center pixel + 8 neighbours',
      operation: 'Gather the stencil window for one output pixel',
      outputData: '9 values in registers per thread',
      memoryAccess: { tier: 'VRAM', status: 'STREAM', address: 'halo window', latencyCycles: 400 },
      beginnerExplanation:
        'Each cook needs to see the plates immediately around their own — because the finished dish depends on the neighbourhood, not just their square.',
      engineeringExplanation:
        'The read amplification of stencils is exactly why hardware texture caches and shared-memory halo tiles exist. Neighbouring threads reuse 8 of 9 samples, so caching nearly removes the cost.',
      nextStepPreview: 'Apply the 3×3 weight kernel',
    },
  });

  for (let r = 0; r < 6; r++) {
    steps.push({
            cycle: 3 + r,
      stageShort: 'CONVOLVE',
      activeComponents: ['gpu-workers', 'alu', 'registers', 'sm-0', 'sm-1'],
      workers: BRIG(
        Array.from({ length: 8 }).map((_, i) => ({
          state: 'computing' as const,
          task: `row ${r} convolution ${i < 4 ? '(SM0)' : '(SM1)'}`,
          progress: Math.round(((r + 1) / 6) * 100),
          badge: `${filtered(r, 0)}`,
        })),
      ),
      storageHighlights: {
        registersText: edge ? 'Σ|Gx|+|Gy| per pixel' : 'Σ w·p / 16 per pixel',
        l1Text: '—',
        ramText: 'idle',
        vramText: `rows 0–${r} written`,
        sharedMemText: 'halo resident',
      },
      specialVisual: { type: 'image-grid', inputGridCells: grid(r, -1, 'in'), gridCells: grid(r, r, 'out') },
      metrics: metrics({
        instructionsExecuted: 36 * (r + 2),
        cacheHits: 36 * (r + 1),
        memoryAccesses: 9 + r,
        bytesTransferred: 1296 + r * 216,
        gpuUtilization: Array(8).fill(Math.round(((r + 1) / 6) * 100)),
        stageCycles: { compute: (r + 1) * 6, memory: 4 + r, control: 1, stall: 0 },
        estimatedTimeNs: 340 + (r + 1) * 180,
        bottleneck:
          r === 5
            ? {
                title: 'Compute-bound — 36 parallel convolutions',
                severity: 'low',
                beginnerText: 'Thirty-six plates, each blended with its neighbours, all at the same time. This is what your phone does 60 times a second.',
                engineeringText: 'Each output pixel costs 9 multiply-accumulates. 36 pixels × 9 = 324 FMAs, all issued across 2 warps with full occupancy and no divergence.',
              }
            : undefined,
      }),
      inspector: {
        stepTitle: `Row ${r} — 36 plates blended in parallel`,
        phaseBadge: `OUTPUT ROW ${r + 1}/6`,
        componentHardware: 'FP32 FMA lanes + register accumulators',
        componentKitchen: 'Cooks blend their square with the neighbours',
        primaryComponentId: 'alu',
        opcode: edge ? 'SOBEL  gx,gy → sqrt(gx²+gy²)' : 'GAUSS  Σ w·p ÷ 16',
        inputData: `Neighbourhood around row ${r}`,
        operation: edge ? 'Gradient magnitude of the 3×3 window' : 'Weighted 3×3 Gaussian blend',
        outputData: `Out[${r}][0..5] = [${[0, 1, 2, 3, 4, 5].map((c) => filtered(r, c)).join(', ')}]`,
        memoryAccess: { tier: 'Register', status: 'INTERNAL', address: 'stencil regs', latencyCycles: 1 },
        beginnerExplanation: edge
          ? 'The cook compares their plate with neighbours and keeps only where the contrast jumps — producing the bright outlines you see.'
          : 'The cook averages their plate with the neighbours, weighted toward the centre, which softly melts the harsh edges.',
        engineeringExplanation: edge
          ? 'Sobel computes an approximate image gradient. Because neighbouring threads read overlapping windows, the L1/texture cache converts most of the 9 reads into hits.'
          : 'A separable Gaussian can be applied as two 1D passes (9+9 instead of 81 multiplies for a 3×3). Conv layers in neural networks are exactly this operation at scale.',
        nextStepPreview: r === 5 ? 'Store the finished image' : `Convolve row ${r + 1}`,
      },
    });
  }

  steps.push({
        cycle: 10,
    stageShort: 'STORE',
    activeComponents: ['vram', 'gpu-workers', 'sm-0', 'sm-1'],
    workers: BRIG(Array.from({ length: 8 }).map(() => ({ state: 'completed' as const, task: 'pixels stored', progress: 100 }))),
    packets: [{ id: 'i2', from: 'gpu-workers', to: 'vram', label: '6×6 output', kind: 'result' }],
    storageHighlights: { registersText: 'lanes drained', l1Text: '—', ramText: 'ready for D2H', vramText: 'output resident', sharedMemText: 'released' },
    specialVisual: { type: 'image-grid', inputGridCells: grid(6, -1, 'in'), gridCells: grid(6, -1, 'out') },
    metrics: metrics({
      instructionsExecuted: 36 * 9,
      cacheHits: 36 * 8,
      memoryAccesses: 16,
      bytesTransferred: 2592,
      gpuUtilization: Array(8).fill(100),
      stageCycles: { compute: 36, memory: 10, control: 1, stall: 0 },
      estimatedTimeNs: edge ? 1420 : 1480,
      bottleneck: {
        title: 'Compute-bound — ideal GPU workload',
        severity: 'low',
        beginnerText: 'Three hundred and twenty-four little blends, finished in a handful of beats. Nothing in this workload ever needed to wait for anything else.',
        engineeringText: 'Zero inter-thread dependencies, perfect coalescing, halo reuse in shared memory: measured SIMT efficiency approaches 100%. This is the canonical GPU sweet spot.',
    },
    }),
    inspector: {
      stepTitle: edge ? 'Edge map complete' : 'Blur complete',
      phaseBadge: 'COMPLETE',
      componentHardware: 'STG → VRAM writeback',
      componentKitchen: 'Thirty-six finished plates leave together',
      primaryComponentId: 'vram',
      opcode: 'STG [out + y*W + x], pixel',
      inputData: '36 convolved values',
      operation: 'Coalesced writeback of the output image',
      outputData: edge ? 'High-contrast outlines preserved' : 'Softened gradient field',
      memoryAccess: { tier: 'VRAM', status: 'DMA', address: 'out 0x0000', latencyCycles: 6 },
      beginnerExplanation: edge
        ? 'What remains is only where the photo changed suddenly — the outlines. Everything flat has been blended away.'
        : 'Harsh transitions have melted into a soft warm gradient, because each plate now leans toward its neighbours.',
      engineeringExplanation:
        'Every pixel took the same number of FMAs, so no warp diverged. Uniform work with local reuse is what GPU hardware was designed for — the same shape as blur, convolution layers, and physically-based shading.',
      nextStepPreview: 'Reset and change the convolution kernel',
    },
  });

  return steps;
}
