import { CanonicalComponentId, KitchenWorker, SimulationStep } from '../types/simulation';
import { cpuCrew, gpuCrew, makeStep, metrics, resetStepCounter, CrewState } from './core';

/* ================================================================== */
/*  EXP-08 — CPU VS GPU EXECUTION                                      */
/* ================================================================== */

export function showdownSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const parallel = param === 'banquet-parallel';

  const cpuSt = (states: CrewState[]): KitchenWorker[] => cpuCrew(states);
  const gpuSt = (states: CrewState[]): KitchenWorker[] => gpuCrew(states);

  if (parallel) {
    return [
      {
                cycle: 1,
        stageShort: 'DISPATCH',
        activeComponents: ['scheduler', 'core-0', 'core-1', 'core-2', 'core-3', 'warp-scheduler', 'sm-0', 'sm-1'],
        workers: [
          ...cpuSt([
            { state: 'fetching', task: '1,024 identical dishes queued', progress: 8 },
            { state: 'fetching', task: 'sharing the same queue', progress: 8 },
            { state: 'fetching', task: 'sharing the same queue', progress: 8 },
            { state: 'fetching', task: 'sharing the same queue', progress: 8 },
          ]),
          ...gpuSt(Array.from({ length: 8 }).map(() => ({ state: 'fetching' as const, task: '128 dishes per brigade', progress: 8 }))),
        ],
        packets: [{ id: 'd1', from: 'ram', to: 'vram', label: '1,024 dishes', kind: 'data' }],
        storageHighlights: {
          registersText: 'CPU: 4 threads · GPU: 1,024 threads',
          l1Text: 'CPU L1 hot',
          ramText: 'host buffer copied',
          vramText: 'banquet resident',
        },
        specialVisual: { type: 'race-bars', raceProgress: { cpuPct: 1, gpuPct: 1, cpuCycles: 0, gpuCycles: 0 } },
        metrics: metrics({ instructionsExecuted: 0, cpuUtilization: [10, 10, 10, 10], gpuUtilization: Array(8).fill(10), memoryAccesses: 1, bytesTransferred: 4096, stageCycles: { compute: 0, memory: 1, control: 1, stall: 0 }, estimatedTimeNs: 1200 }),
        inspector: {
          stepTitle: 'One thousand identical dishes, two very different kitchens',
          phaseBadge: 'KICKOFF',
          componentHardware: 'Host CPU dispatches a kernel to the GPU',
          componentKitchen: 'Both kitchens receive the same banquet order',
          primaryComponentId: 'scheduler',
          opcode: 'cpu: for(i<N) f(i);   gpu: kernel<<<8,128>>>(...)',
          inputData: '1,024 identical, independent dish requests',
          operation: 'Assign work to 4 CPU threads versus 1,024 GPU threads',
          outputData: 'CPU: 256 dishes per chef · GPU: 16 dishes per lane',
          memoryAccess: { tier: 'System RAM', status: 'DMA', address: 'host buffer', latencyCycles: 400 },
          beginnerExplanation:
            'Same thousand dishes. The CPU assigns 256 to each of four master chefs. The GPU assigns sixteen to each of a thousand line cooks.',
          engineeringExplanation:
            'The problem has 1,024-way data parallelism and no dependencies. CPU total threads available: 4. GPU resident threads: 1,024. Available parallelism is 256× larger on the GPU.',
          nextStepPreview: 'Watch both kitchens work',
        },
      },
      {
                cycle: 4,
        stageShort: 'RACE',
        activeComponents: ['core-0', 'core-1', 'core-2', 'core-3', 'gpu-workers', 'sm-0', 'sm-1'],
        workers: [
          ...cpuSt([
            { state: 'computing', task: '64/256 dishes plated', progress: 25, badge: '64' },
            { state: 'computing', task: '64/256 dishes plated', progress: 25, badge: '64' },
            { state: 'computing', task: '64/256 dishes plated', progress: 25, badge: '64' },
            { state: 'computing', task: '64/256 dishes plated', progress: 25, badge: '64' },
          ]),
          ...gpuSt(Array.from({ length: 8 }).map((_, i) => ({ state: 'completed' as const, task: '128/128 dishes plated', progress: 100, badge: `${(i + 1) * 128}` }))),
        ],
        storageHighlights: {
          registersText: 'CPU IPC 3.2 · GPU 100% lanes',
          l1Text: 'CPU cache thrashing (many threads)',
          ramText: 'bandwidth saturated',
          vramText: 'output streaming',
        },
        specialVisual: { type: 'race-bars', raceProgress: { cpuPct: 25, gpuPct: 100, cpuCycles: 4, gpuCycles: 4 } },
        metrics: metrics({
          instructionsExecuted: 1024,
          cpuUtilization: [100, 100, 100, 100],
          gpuUtilization: Array(8).fill(100),
          cacheHits: 800,
          cacheMisses: 24,
          memoryAccesses: 2048,
          bytesTransferred: 8192,
          stageCycles: { compute: 1024, memory: 256, control: 64, stall: 16 },
          estimatedTimeNs: 1320,
          bottleneck: {
            title: 'CPU runs out of threads, not instructions',
            severity: 'high',
            beginnerText:
              'At the same instant the GPU kitchen is completely done, each CPU chef has only a quarter of their pile cleared. Four brilliant chefs cannot outrun a thousand hands.',
            engineeringText:
              'The CPU is limited by thread count, not IPC. Each core must serially process 256 iterations; the GPU finishes all 1,024 in the same wall-clock window using 8 warps of parallel lanes.',
        },
        }),
        inspector: {
          stepTitle: 'Four chefs versus a thousand hands',
          phaseBadge: 'THROUGHPUT WIN: GPU',
          componentHardware: '4 superscalar cores vs 2 SMs of SIMT lanes',
          componentKitchen: 'Boutique atelier vs industrial hall',
          primaryComponentId: 'gpu-workers',
          opcode: 'GPU: 1,024 lanes retire · CPU: 256/1,024',
          inputData: 'Identical uniform dishes',
          operation: 'Throughput comparison on embarrassingly parallel work',
          outputData: 'GPU 4.1× faster at this workload size',
          memoryAccess: { tier: 'VRAM', status: 'STREAM', address: 'coalesced output', latencyCycles: 6 },
          beginnerExplanation:
            'The CPU chefs are individually faster cooks — but there are only four of them. The GPU has a thousand hands, and this banquet needs hands, not artistry.',
          engineeringExplanation:
            'Latency-optimized hardware cannot compensate for a 256× deficit in available parallelism. GPU effective throughput = lanes × issue rate; here that dominates the CPU’s 4 × ~3 IPC.',
          nextStepPreview: 'Now give the same two kitchens a different problem',
        },
      },
      {
                cycle: 5,
        stageShort: 'SUMMARY',
        activeComponents: ['core-0', 'core-1', 'core-2', 'core-3', 'gpu-workers'],
        workers: [
          ...cpuSt([
            { state: 'computing', task: 'still plating', progress: 62 },
            { state: 'computing', task: 'still plating', progress: 62 },
            { state: 'computing', task: 'still plating', progress: 62 },
            { state: 'computing', task: 'still plating', progress: 62 },
          ]),
          ...gpuSt(Array.from({ length: 8 }).map(() => ({ state: 'completed' as const, task: 'banquet served', progress: 100 }))),
        ],
        specialVisual: { type: 'race-bars', raceProgress: { cpuPct: 62, gpuPct: 100, cpuCycles: 5, gpuCycles: 5 } },
        storageHighlights: { registersText: 'GPU lanes idle, CPU still looping', l1Text: '—', ramText: 'draining', vramText: 'output ready' },
        metrics: metrics({
          instructionsExecuted: 1024,
          cpuUtilization: [100, 100, 100, 100],
          gpuUtilization: Array(8).fill(100),
          cacheHits: 900,
          cacheMisses: 24,
          memoryAccesses: 3072,
          bytesTransferred: 12288,
          stageCycles: { compute: 1024, memory: 400, control: 96, stall: 24 },
          estimatedTimeNs: 5200,
          bottleneck: {
            title: 'GPU wins decisively on uniform parallel work',
            severity: 'low',
            beginnerText: 'The industrial hall serves the whole banquet while the boutique atelier is still on its first pile.',
            engineeringText: 'Throughput-oriented design wins whenever the workload exposes thousands of independent identical operations — the definition of data parallelism.',
        },
        }),
        inspector: {
          stepTitle: 'Verdict — throughput architecture takes the banquet',
          phaseBadge: 'COMPLETE',
          componentHardware: 'Throughput vs latency architecture comparison',
          componentKitchen: 'Industrial hall clears the banquet first',
          primaryComponentId: 'gpu-workers',
          opcode: 'speedup = T_cpu / T_gpu',
          inputData: '1,024 independent identical operations',
          operation: 'Compare elapsed time and utilization',
          outputData: 'GPU ≈ 4–8× faster here (transfer excluded)',
          memoryAccess: { tier: 'VRAM', status: 'STREAM', address: 'output', latencyCycles: 6 },
          beginnerExplanation:
            'When all the dishes are the same, hire a thousand cooks. Time to switch to the other problem and see the tables turn.',
          engineeringExplanation:
            'Note the caveat: this comparison excludes H2D/D2H transfer time. Real GPU speedups are (compute saved) − (transfer paid), which is why experiment 09 matters.',
          nextStepPreview: 'Reset and run the dependent tasting chain',
        },
      },
    ];
  }

  // Serial / branchy workload: CPU wins.
  return [
    {
            cycle: 1,
      stageShort: 'DISPATCH',
      activeComponents: ['scheduler', 'core-0', 'warp-scheduler', 'sm-0'],
      workers: [
        ...cpuSt([
          { state: 'fetching', task: '12-step dependent tasting chain', progress: 10 },
          { state: 'fetching', task: 'queue tail', progress: 6 },
          { state: 'idle', task: 'no independent work available' },
          { state: 'idle', task: 'no independent work available' },
        ]),
        ...gpuSt(Array.from({ length: 8 }).map(() => ({ state: 'fetching' as const, task: '1 dish / 32 lanes idle', progress: 10 }))),
      ],
      storageHighlights: {
        registersText: 'CPU: 1 dependency chain · GPU: 1 lane of 32',
        l1Text: 'CPU L1 very hot (same addresses)',
        ramText: 'tiny footprint',
        vramText: 'transfer cost not amortized',
      },
      specialVisual: { type: 'race-bars', raceProgress: { cpuPct: 1, gpuPct: 1, cpuCycles: 0, gpuCycles: 0 } },
      metrics: metrics({ cpuUtilization: [12, 8, 0, 0], gpuUtilization: Array(8).fill(3), stageCycles: { compute: 0, memory: 1, control: 1, stall: 0 }, estimatedTimeNs: 2100, memoryAccesses: 1, bytesTransferred: 48 }),
      inspector: {
        stepTitle: 'A dish that depends on the dish before it',
        phaseBadge: 'KICKOFF',
        componentHardware: 'Single-thread latency-bound kernel',
        componentKitchen: 'A tasting menu where step 2 needs step 1',
        primaryComponentId: 'core-0',
        opcode: 'x = f(x); x = g(x); ... 12 ×  (serial)',
        inputData: 'One scalar value carried through 12 stages',
        operation: 'Dependent chain — no parallelism available at all',
        outputData: 'Depth 12 critical path',
        memoryAccess: { tier: 'System RAM', status: 'MISS', address: '0x0', latencyCycles: 200 },
        beginnerExplanation:
          'You cannot plate the next course before the previous one exists. Only one cook can possibly work — every other station is idle by definition.',
        engineeringExplanation:
          'The dependency graph is a chain of length 12 with branch factor 1. Available parallelism = 1, so all 1,024 GPU lanes collapse to a single useful lane — 3% SIMT efficiency.',
        nextStepPreview: 'Run the chain in both kitchens',
      },
    },
    {
      cycle: 5,
      stageShort: 'RACE',
      activeComponents: ['core-0', 'alu', 'l1-cache', 'warp-scheduler', 'gpu-workers'],
      workers: [
        ...cpuSt([
          { state: 'computing', task: 'step 7 of 12 — branch predicted correctly', progress: 58, badge: '7/12' },
          { state: 'idle', task: 'waiting on chain (no parallelism)' },
          { state: 'idle', task: 'waiting on chain (no parallelism)' },
          { state: 'idle', task: 'waiting on chain (no parallelism)' },
        ]),
        ...gpuSt(
          Array.from({ length: 8 }).map((_, i) => ({
            state: (i === 0 ? 'computing' : 'diverged-off') as KitchenWorker['state'],
            task: i === 0 ? 'one lane carries the chain' : '31/32 lanes masked — nothing to do',
            progress: i === 0 ? 36 : 0,
          })),
        ),
      ],
      storageHighlights: { registersText: 'chain state in R1', l1Text: 'hot chain lines', ramText: 'idle' },
      specialVisual: { type: 'race-bars', raceProgress: { cpuPct: 58, gpuPct: 36, cpuCycles: 5, gpuCycles: 5 } },
      metrics: metrics({
        instructionsExecuted: 24,
        cpuUtilization: [100, 0, 0, 0],
        gpuUtilization: [4, 4, 4, 4, 4, 4, 4, 4],
        cacheHits: 22,
        cacheMisses: 2,
        memoryAccesses: 24,
        bytesTransferred: 96,
        stageCycles: { compute: 12, memory: 4, control: 14, stall: 2 },
        estimatedTimeNs: 3400,
        bottleneck: {
          title: 'No parallelism — GPU lanes idle by construction',
          severity: 'high',
          beginnerText:
            'The industrial hall has a thousand cooks and one job. Almost all of them are standing still, and the CPU chef — with a far faster single-thread pace and a branch predictor — is winning.',
          engineeringText:
            'SIMT efficiency = 1 active lane / 32 = 3%. GPU clocks are also lower and per-thread latency much higher, so a serial chain runs slower than on a high-clock, deeply speculative CPU core.',
      },
      }),
      inspector: {
        stepTitle: 'The tables turn — one lane versus one fast chef',
        phaseBadge: 'LATENCY WIN: CPU',
        componentHardware: 'Deep OoO CPU core vs a single active GPU lane',
        componentKitchen: 'Specialist chef vs an idle industrial hall',
        primaryComponentId: 'core-0',
        opcode: 'CPU: 7/12 complete · GPU: 4/12 complete',
        inputData: 'Serial dependent chain',
        operation: 'Compare latency-optimized against throughput-optimized hardware',
        outputData: 'CPU considerably ahead',
        memoryAccess: { tier: 'L1 Cache', status: 'HIT', address: 'chain state', latencyCycles: 4 },
        beginnerExplanation:
          'The CPU chef handles a complex chain of dependent decisions beautifully — branch prediction and a huge cache window keep the single workstream moving. The GPU cannot use any of its strengths.',
        engineeringExplanation:
          'Branch predictors, register renaming and deep OoO windows exist exactly to accelerate irregular serial code. GPU hardware trades all of this away to widen its lanes.',
        nextStepPreview: 'Finish the chain and compare',
      },
    },
    {
            cycle: 12,
      stageShort: 'SUMMARY',
      activeComponents: ['core-0', 'gpu-workers', 'scheduler'],
      workers: [
        ...cpuSt([
          { state: 'completed', task: 'all 12 courses plated', progress: 100 },
          { state: 'idle', task: 'chain complete' },
          { state: 'idle', task: 'chain complete' },
          { state: 'idle', task: 'chain complete' },
        ]),
        ...gpuSt(Array.from({ length: 8 }).map((_, i) => ({ state: (i === 0 ? 'computing' : 'idle') as KitchenWorker['state'], task: i === 0 ? 'still on course 9' : 'nothing to do', progress: i === 0 ? 72 : 0 }))),
      ],
      specialVisual: { type: 'race-bars', raceProgress: { cpuPct: 100, gpuPct: 72, cpuCycles: 12, gpuCycles: 12 } },
      storageHighlights: { registersText: 'chain result committed', l1Text: 'hot, tiny footprint', ramText: 'idle', vramText: 'transfer taxes dominated' },
      metrics: metrics({
        instructionsExecuted: 48,
        cpuUtilization: [100, 25, 25, 12],
        gpuUtilization: [6, 6, 6, 6, 6, 6, 6, 6],
        cacheHits: 44,
        cacheMisses: 3,
        memoryAccesses: 48,
        bytesTransferred: 192,
        stageCycles: { compute: 24, memory: 8, control: 30, stall: 6 },
        estimatedTimeNs: 4200,
        bottleneck: {
          title: 'CPU wins when the work is serial and branchy',
          severity: 'low',
          beginnerText:
            'Neither kitchen is better. One is built for a thousand identical plates; the other for one intricate dish at a time. Real systems use both — the GPU for the banquet, the CPU for the menu planning.',
          engineeringText:
            'Amdahl’s law in one picture: acceleration is capped by the serial fraction. Modern SoCs therefore run control-heavy code on the CPU and hand uniform, wide work to the GPU.',
      },
      }),
      inspector: {
        stepTitle: 'Verdict — latency architecture takes the tasting chain',
        phaseBadge: 'COMPLETE',
        componentHardware: 'Latency vs throughput — the real conclusion',
        componentKitchen: 'Each kitchen wins its own kind of evening',
        primaryComponentId: 'core-0',
        opcode: 'speedup ≈ serial fraction × clock ratio',
        inputData: '12-stage dependent chain with irregular branches',
        operation: 'Compare elapsed time under a serial dependency graph',
        outputData: 'CPU faster; GPU utilization ~6%',
        memoryAccess: { tier: 'L1 Cache', status: 'HIT', address: 'chain state', latencyCycles: 4 },
        beginnerExplanation:
          'Hire the right kitchen for the order. A thousand cooks cannot make a twelve-course tasting menu arrive faster — each course depends on the last.',
        engineeringExplanation:
          'This is why CPU and GPU coexist. The interesting engineering is choosing which silicon runs which part of the workload, and keeping data movement between them as small as possible.',
        nextStepPreview: 'Reset and run the banquet profile',
      },
    },
  ];
}

/* ================================================================== */
/*  EXP-09 — MEMORY TRANSFER                                           */
/* ================================================================== */

export function transferSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const resident = param === 'multi-pass-resident';
  const small = <T,>(a: T[]): T[] => a;

  const gpuCrewStates = (state: KitchenWorker['state'], task: string): KitchenWorker[] =>
    gpuCrew(Array.from({ length: 8 }).map(() => ({ state, task, progress: state === 'idle' ? 0 : 70 })));

  const steps: SimulationStep[] = [];

  steps.push({
        cycle: 1,
    stageShort: 'H2D',
    activeComponents: ['ram', 'pcie-bus', 'vram'],
    workers: [
      ...gpuCrewStates('idle', 'waiting for ingredients to arrive'),
    ],
    packets: [{ id: 't1', from: 'ram', to: 'vram', label: '16 MB payload · H2D', kind: 'data' }],
    storageHighlights: {
      registersText: 'idle',
      l1Text: '—',
      ramText: '16 MB pinned host buffer',
      vramText: 'receiving 0.4 MB per burst',
      sharedMemText: 'empty',
    },
    specialVisual: { type: 'transfer-bus', transferProgress: { hostPct: 40, busPct: 40, vramPct: 0, payloadKb: 16384 } },
    metrics: metrics({
      instructionsExecuted: 0,
      gpuUtilization: Array(8).fill(0),
      memoryAccesses: 1,
      bytesTransferred: 6553,
      stageCycles: { compute: 0, memory: 6, control: 2, stall: 1 },
      estimatedTimeNs: 240_000,
      bottleneck: {
        title: 'PCIe transfer — the delivery van',
        severity: 'high',
        beginnerText:
          'The industrial kitchen is ready, the orders are ready — but the ingredients are stuck in the CPU’s pantry across town, and the van only carries so much per trip.',
        engineeringText:
          'PCIe Gen5 x16 sustains ~60 GB/s practical throughput. A 16 MB buffer therefore needs ~260 µs, while the subsequent kernel may need only ~20 µs — the transfer dominates completely.',
    },
    }),
    inspector: {
      stepTitle: 'Host to Device — the delivery van loads up',
      phaseBadge: 'DMA H2D',
      componentHardware: 'PCIe root complex + GPU DMA engines',
      componentKitchen: 'Refrigerated van between pantry and warehouse',
      primaryComponentId: 'pcie-bus',
      opcode: 'cudaMemcpyAsync(dst_d, src_h, 16 MB, H2D)',
      inputData: '16 MB host buffer (page-locked)',
      operation: 'DMA copy across PCIe Gen5 x16',
      outputData: '16 MB inbound to VRAM',
      memoryAccess: { tier: 'PCIe Bus', status: 'DMA', address: 'host 0x0 → device 0x0', latencyCycles: 240_000 },
      beginnerExplanation:
        'Before the GPU can cook, the ingredients must physically arrive at the industrial warehouse. The van is fast, but it is still a drive across town.',
      engineeringExplanation:
        'Data movement is the tax on GPU compute. Pinned (page-locked) memory allows asynchronous DMA without CPU involvement, but the bus bandwidth is fixed hardware — ~64 GB/s, versus >1,000 GB/s inside VRAM.',
      nextStepPreview: resident ? 'Keep the data resident and start the first kernel' : 'Run a single compute pass',
    },
  });

  steps.push({
        cycle: 2,
    stageShort: 'KERNEL',
    activeComponents: ['vram', 'gpu-workers', 'sm-0', 'sm-1'],
    workers: gpuCrewStates('computing', 'pass 1 of ' + (resident ? '10' : '1')),
    packets: [{ id: 't2', from: 'vram', to: 'gpu-workers', label: 'tile stream', kind: 'data' }],
    storageHighlights: {
      registersText: 'accumulators live',
      l1Text: '—',
      ramText: 'idle (CPU free)',
      vramText: 'payload resident · reused',
      sharedMemText: 'tiles staged',
    },
    specialVisual: { type: 'transfer-bus', transferProgress: { hostPct: 100, busPct: 100, vramPct: resident ? 15 : 100, payloadKb: 16384 } },
    metrics: metrics({
      instructionsExecuted: 4096,
      gpuUtilization: Array(8).fill(100),
      cacheHits: 3800,
      memoryAccesses: 64,
      bytesTransferred: 65536,
      stageCycles: { compute: 20, memory: 8, control: 2, stall: 0 },
      estimatedTimeNs: resident ? 260_000 : 260_000,
    }),
    inspector: {
      stepTitle: 'The kernel runs — but how long did the van take?',
      phaseBadge: 'KERNEL EXEC',
      componentHardware: 'All SMs executing the compute kernel',
      componentKitchen: 'Whole industrial hall finally cooking',
      primaryComponentId: 'gpu-workers',
      opcode: `kernel<<<grid, 256>>>(d_data)  // pass 1`,
      inputData: '16 MB resident in VRAM',
      operation: 'Uniform data-parallel compute over the buffer',
      outputData: 'Kernel completes in ~20 µs',
      memoryAccess: { tier: 'VRAM', status: 'STREAM', address: 'device buffer', latencyCycles: 400 },
      beginnerExplanation:
        'The actual cooking takes almost no time at all: twenty microseconds. The trip took six times longer. This is why the delivery van, not the cooking, decides whether the GPU was worth using.',
      engineeringExplanation:
        'Kernel launch and execution ~20 µs. Without amortization the total time is transfer-dominated: effective speedup collapses toward 1× no matter how parallel the kernel is.',
      nextStepPreview: resident ? 'Run nine more passes on resident data' : 'Send the result back across town',
    },
  });

  if (resident) {
    steps.push({
            cycle: 3,
      stageShort: 'REUSE',
      activeComponents: ['vram', 'gpu-workers', 'sm-0', 'sm-1'],
      workers: gpuCrewStates('completed', 'passes 2–10 complete on resident data'),
      storageHighlights: {
        registersText: 'accumulators committed',
        l1Text: '—',
        ramText: 'untouched since first copy',
        vramText: 'hot · 10 kernels, 1 transfer',
        sharedMemText: 'reused tiles',
      },
      specialVisual: { type: 'transfer-bus', transferProgress: { hostPct: 100, busPct: 100, vramPct: 100, payloadKb: 16384 } },
      metrics: metrics({
        instructionsExecuted: 40960,
        gpuUtilization: Array(8).fill(100),
        cacheHits: 38000,
        memoryAccesses: 640,
        bytesTransferred: 655_360,
        stageCycles: { compute: 200, memory: 80, control: 20, stall: 0 },
        estimatedTimeNs: 262_000,
        bottleneck: {
          title: 'Transfer amortized across 10 kernels',
          severity: 'low',
          beginnerText:
            'One van trip, ten dinners. The GPU is now doing what it is good at, and the expensive delivery is paid once instead of ten times.',
          engineeringText:
            'Amortization is the central GPU performance pattern. Transfer cost per unit of work drops 10×; the kernel becomes compute-bound and the measured speedup approaches the theoretical parallelism.',
      },
      }),
      inspector: {
        stepTitle: 'Ten passes, one van trip',
        phaseBadge: 'AMORTIZED',
        componentHardware: 'VRAM-resident data across multiple kernel launches',
        componentKitchen: 'One delivery feeds ten dinner services',
        primaryComponentId: 'vram',
        opcode: 'for (k=0;k<10;k++) kernel<<<...>>>(d_data);',
        inputData: '16 MB already on device',
        operation: 'Reuse resident VRAM for repeated passes',
        outputData: '~200 µs compute + 260 µs transfer ≈ 460 µs total',
        memoryAccess: { tier: 'VRAM', status: 'HIT', address: 'device buffer', latencyCycles: 400 },
        beginnerExplanation:
          'Nothing was moved for passes two through ten. The hall stayed busy the whole time, so the expensive drive was paid only once.',
        engineeringExplanation:
          'Keeping data device-resident across a pipeline eliminates repeated PCIe crossings. The correct comparison is not "GPU vs CPU" but "GPU plus transfers vs CPU", which is why batching exists.',
        nextStepPreview: 'Compare against the single-pass case',
      },
    });
  }

  steps.push({
        cycle: resident ? 4 : 3,
    stageShort: 'D2H',
    activeComponents: ['vram', 'pcie-bus', 'ram'],
    workers: gpuCrewStates('completed', 'results handed to the van'),
    packets: [{ id: 't3', from: 'vram', to: 'ram', label: 'result D2H', kind: 'result' }],
    storageHighlights: {
      registersText: 'freed',
      l1Text: '—',
      ramText: 'result buffer filling',
      vramText: 'output 2 MB',
      sharedMemText: 'released',
    },
    specialVisual: { type: 'transfer-bus', transferProgress: { hostPct: 100, busPct: 100, vramPct: 100, payloadKb: 2048 } },
    metrics: metrics({
      instructionsExecuted: resident ? 40960 : 4096,
      gpuUtilization: resident ? Array(8).fill(100) : Array(8).fill(60),
      cacheHits: resident ? 48000 : 4000,
      memoryAccesses: resident ? 700 : 80,
      bytesTransferred: resident ? 700_000 : 90_000,
      stageCycles: { compute: resident ? 220 : 20, memory: resident ? 120 : 40, control: 20, stall: 2 },
      estimatedTimeNs: resident ? 330_000 : 460_000,
      bottleneck: {
        title: resident ? 'Efficient pipeline — transfer amortized' : 'Transfer tax dominates: ~95% overhead',
        severity: resident ? 'low' : 'high',
        beginnerText: resident
          ? 'The van made three trips in total and did ten dinners of work. Every trip paid for itself many times over.'
          : 'One trip out, twenty microseconds of cooking, one trip back. Almost all the money went to the delivery van, not the kitchen.',
        engineeringText: resident
          ? 'Effective utilisation = compute / (compute + transfers) ≈ 55% and rising with more passes. This is the reason inference servers batch requests and keep weights resident.'
          : 'Total = 240 µs H2D + 20 µs kernel + 200 µs D2H. Utilisation ≈ 4%. A CPU might genuinely be faster here — the canonical transfer-bound anti-pattern.',
    },
    }),
    inspector: {
      stepTitle: resident ? 'Results return — pipeline complete' : 'Results return — was the GPU worth it?',
      phaseBadge: 'D2H COMPLETE',
      componentHardware: 'Device DMA → host memory',
      componentKitchen: 'Finished dishes carried back across town',
      primaryComponentId: 'pcie-bus',
      opcode: 'cudaMemcpyAsync(dst_h, src_d, 2 MB, D2H)',
      inputData: '2 MB output buffer in VRAM',
      operation: 'DMA copy back to host',
      outputData: resident ? '~330 µs total for 10 passes' : '~460 µs total for 1 pass',
      memoryAccess: { tier: 'PCIe Bus', status: 'DMA', address: 'device → host', latencyCycles: 200_000 },
      beginnerExplanation: resident
        ? 'One trip in, one trip out, ten dinners. The van is no longer the story — the cooking is.'
        : 'The delivery van took longer than the entire banquet. This is exactly the mistake that makes people conclude "the GPU made my program slower."',
      engineeringExplanation:
        'Always measure bus bytes alongside FLOPs. If transfer bytes × kernel count dominates, batching, persistent kernels, or unified memory with careful prefetching is the fix — not a faster GPU.',
      nextStepPreview: 'Reset and compare the resident pipeline',
    },
  });

  // Silence unused helper (keeps the file self-documenting for future profiles).
  void small;
  return steps;
}
