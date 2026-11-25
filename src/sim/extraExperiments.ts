import {
  CanonicalComponentId,
  KitchenWorker,
  SimulationStep,
} from '../types/simulation';
import { MODEL, RIG_CPU, RIG_GPU } from '../data/rig';
import { gpuCrew, cpuCrew, idleCpu, idleGpu, metrics, resetStepCounter, util } from './core';

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const GHZ = RIG_CPU.boostGhz;

/** Convert a cycle count into nanoseconds on the reference CPU clock. */
const ns = (cycles: number) => +((cycles / GHZ) * 1).toFixed(1);

const cpuAll = (state: KitchenWorker['state'], task: string, badge?: string, progress = 70) =>
  cpuCrew(
    Array.from({ length: 4 }).map(() => ({
      state,
      task,
      badge,
      progress,
    })),
  );

const gpuAll = (state: KitchenWorker['state'], task: string, badge?: string, progress = 70) =>
  gpuCrew(
    Array.from({ length: 8 }).map(() => ({
      state,
      task,
      badge,
      progress,
    })),
  );

/* ================================================================== */
/*  EXP-11 · Registers and Assembly                                    */
/* ================================================================== */

export function registersSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const o0 = param === 'o0';
  const avx = param === 'o3-avx512';

  const asmSource = (lines: [number, string, string?][]) =>
    lines.map(([indent, text, comment]) => ({ indent, text, comment, tone: 'asm' as const }));

  const o0Asm = asmSource([
    [0, 'main:', '# int dot(int n, float *a, float *b)'],
    [1, 'push   rbp', 'save frame pointer'],
    [1, 'mov    rbp, rsp'],
    [1, 'mov    DWORD PTR [rbp-4], edi', 'store n to stack'],
    [1, 'mov    QWORD PTR [rbp-16], rsi', 'store a to stack'],
    [1, 'mov    QWORD PTR [rbp-24], rdx', 'store b to stack'],
    [1, 'mov    DWORD PTR [rbp-28], 0', 'sum = 0 — in memory'],
    [1, 'mov    DWORD PTR [rbp-32], 0', 'i = 0 — in memory'],
    [0, '.L2:', ''],
    [1, 'mov    eax, DWORD PTR [rbp-32]', 'reload i from stack'],
    [1, 'cmp    eax, DWORD PTR [rbp-4]', 'compare with n (also stack)'],
    [1, 'jge    .L3'],
    [1, 'mov    eax, DWORD PTR [rbp-32]'],
    [1, 'movss  xmm0, DWORD PTR [rbp-28]', 'reload sum from stack'],
    [1, 'addss  xmm0, DWORD PTR [rsi+rax*4]'],
    [1, 'movss  DWORD PTR [rbp-28], xmm0', 'write sum back to stack'],
    [1, 'add    DWORD PTR [rbp-32], 1'],
    [1, 'jmp    .L2'],
  ]);

  const o2Asm = asmSource([
    [0, 'dot:', '# int dot(int n, float *a, float *b)'],
    [1, 'pxor   xmm0, xmm0', 'sum lives in xmm0 for the whole loop'],
    [1, 'xor    eax, eax', 'i lives in eax'],
    [0, '.L2:', ''],
    [1, 'cmp    eax, edi', 'no stack reload of n'],
    [1, 'jge    .L5'],
    [1, 'movss  xmm1, DWORD PTR [rsi+rax*4]', 'a[i]'],
    [1, 'addss  xmm0, DWORD PTR [rdx+rax*4]', 'sum += b[i]'],
    [1, 'add    eax, 1'],
    [1, 'jmp    .L2'],
  ]);

  const o3Asm = asmSource([
    [0, 'dot:', '# -O3 -mavx512f, auto-vectorised'],
    [1, 'vpxorq zmm0, zmm0, zmm0', '16 fp32 accumulators in one register'],
    [1, 'xor    eax, eax'],
    [1, 'vshufps zmm2, zmm1, zmm1, 0', 'broadcast loop constant'],
    [0, '.L7:', ''],
    [1, 'vmovups zmm3, ZMMWORD PTR [rsi+rax*4]', 'load 16 floats of a'],
    [1, 'vfmadd231ps zmm0, zmm1, ZMMWORD PTR [rdx+rax*4]', 'zmm0 += a×b, fused, 16 lanes'],
    [1, 'add    rax, 16'],
    [1, 'cmp    rax, rdi'],
    [1, 'jl     .L7'],
    [1, 'vextractf32x8 ymm1, zmm0, 1', 'horizontal reduce'],
    [1, 'vaddps ymm0, ymm0, ymm1'],
    [1, 'vaddps xmm0, xmm0, xmm1'],
  ]);

  const regs = (hot: string[]) => ({
    name: 'GPR + VEC',
    value: hot.join(' · ') || 'idle',
    role: 'temp' as const,
    hot: true,
  });

  const regsFor = (stage: 'args' | 'loop' | 'reduce') => {
    if (o0)
      return [
        { name: 'rbp', value: '0x7ffd…', role: 'pointer' as const, hot: stage !== 'args', note: 'frame base — every var addressed from here' },
        { name: '[rbp-4]', value: 'n', role: 'arg' as const, hot: stage === 'args', note: 'spilled to the stack' },
        { name: '[rbp-28]', value: '0.0', role: 'result' as const, hot: stage === 'loop', note: 'sum lives in memory, reloaded per iteration' },
        { name: '[rbp-32]', value: 'i', role: 'temp' as const, hot: stage === 'loop', note: 'loop counter also in memory' },
        { name: 'xmm0', value: '—', role: 'temp' as const, hot: false, note: 'scratch only' },
      ];
    if (avx)
      return [
        { name: 'zmm0', value: 'Σ×16', role: 'result' as const, hot: stage !== 'args', note: '16 fp32 accumulators' },
        { name: 'zmm1', value: 'a[i..i+15]', role: 'arg' as const, hot: stage === 'loop', note: 'contiguous 64-byte load' },
        { name: 'zmm3', value: 'b[i..i+15]', role: 'arg' as const, hot: stage === 'loop', note: '' },
        { name: 'rax', value: 'i', role: 'pointer' as const, hot: stage === 'loop', note: 'stride 16 elements' },
        { name: 'rdi', value: 'n', role: 'arg' as const, hot: false, note: '' },
      ];
    return [
      { name: 'xmm0', value: 'Σ', role: 'result' as const, hot: stage !== 'args', note: 'sum kept in a vector register' },
      { name: 'eax', value: 'i', role: 'pointer' as const, hot: stage === 'loop', note: 'index, never spills' },
      { name: 'edi', value: 'n', role: 'arg' as const, hot: stage === 'args', note: '' },
      { name: 'rsi', value: 'a*', role: 'arg' as const, hot: false, note: 'pointer to a' },
      { name: 'rdx', value: 'b*', role: 'arg' as const, hot: false, note: 'pointer to b' },
    ];
  };

  const cyclesPerIter = o0 ? 7 : avx ? 2 : 4;
  const instrPerIter = o0 ? 11 : avx ? 5 : 6;
  const laneCount = avx ? 16 : o0 ? 1 : 1;

  return [
    {
      cycle: 1,
      stageShort: 'PROLOGUE',
      activeComponents: ['scheduler', 'registers', 'ram'],
      workers: cpuAll('fetching', o0 ? 'Copying arguments onto the stack' : 'Reading arguments into registers', o0 ? 'STACK' : 'REG'),
      storageHighlights: {
        registersText: o0 ? 'rbp frame · 4 stack slots' : 'edi=n · rsi=a · rdx=b',
        l1Text: o0 ? 'stack lines touched' : 'hot — arguments',
        ramText: 'function entry',
        vramText: 'idle',
      },
      metrics: metrics({
        instructionsExecuted: o0 ? 6 : 2,
        cpuUtilization: util([12]),
        memoryAccesses: o0 ? 4 : 0,
        bytesTransferred: o0 ? 48 : 0,
        estimatedTimeNs: ns(o0 ? 28 : 6),
        stageCycles: { compute: 1, memory: o0 ? 6 : 0, control: 1, stall: 0 },
        bottleneck: o0
          ? {
              title: 'Everything spilled to the stack',
              severity: 'moderate',
              beginnerText:
                'At -O0 every ingredient is written down on the prep sheet, then read back before each use. Even the loop counter goes to memory.',
              engineeringText:
                '-O0 keeps all locals in stack slots addressed from rbp. Each iteration loads both i and sum from L1, so even an L1 hit costs ~4 cycles of pure bookkeeping per operand.',
            }
          : {
              title: 'Arguments already in registers',
              severity: 'low',
              beginnerText: 'Nothing to fetch — the values arrive in the chefs’ hands.',
              engineeringText:
                'The SysV ABI passes the first six integer/pointer arguments in rdi, rsi, rdx, rcx, r8, r9, so no memory traffic is needed to begin.',
            },
      }),
      specialVisual: {
        type: 'register-file',
        registers: regsFor('args'),
        asmLines: o0 ? o0Asm.slice(0, 7) : o2Asm.slice(0, 3),
      },
      inspector: {
        stepTitle: o0 ? 'Arguments are pushed onto the stack' : 'Arguments arrive in registers',
        phaseBadge: o0 ? 'PROLOGUE · SPILL' : 'PROLOGUE · REGISTERS',
        componentHardware: o0 ? 'rbp-relative stack frame in L1d' : 'rdi / rsi / rdx argument registers',
        componentKitchen: o0 ? 'Writing every ingredient onto the prep sheet' : 'Ingredients handed straight to the chef',
        primaryComponentId: 'registers',
        opcode: o0 ? 'mov DWORD PTR [rbp-4], edi' : 'mov edi, DWORD PTR [rsp]  ; n',
        inputData: 'n, a*, b* from the caller',
        operation: o0 ? 'Store each parameter into a stack slot' : 'Bind each parameter to a register',
        outputData: o0 ? '4 stack slots live at rbp-4 … rbp-32' : 'edi = n, rsi = a, rdx = b',
        memoryAccess: { tier: o0 ? 'L1 Cache' : 'Register', status: o0 ? 'MISS' : 'INTERNAL', address: o0 ? '[rbp-32]' : 'rdi / rsi / rdx', latencyCycles: o0 ? MODEL.l1Cycles : 0 },
        beginnerExplanation: o0
          ? 'Nothing is optimised. Every value lives on the prep sheet on the counter, and the chef has to look away from the work to read it before each step.'
          : 'The chef holds the three starting values in their hands. No walking, no reading — the loop can begin immediately.',
        engineeringExplanation: o0
          ? '-O0 emits a canonical frame: push rbp, mov rbp,rsp, then one mov per parameter. Each stack slot round-trips through store-to-load forwarding in the L1d, ~4–5 cycles each when it does not hit the store queue.'
          : 'Zen 4 renames 168 integer and 192 vector architectural registers, so keeping sum and i in xmm0/eax imposes no false dependencies and needs zero memory traffic.',
        nextStepPreview: 'Enter the loop body',
      },
    },
    {
      cycle: 2,
      stageShort: 'LOOP',
      activeComponents: ['core-0', 'alu', 'registers', 'l1-cache'],
      workers: cpuAll('computing', o0 ? 'Reloading operands every iteration' : 'Accumulating in a register', o0 ? 'L1×7' : avx ? 'FMA×16' : 'xmm0'),
      storageHighlights: {
        registersText: o0 ? 'eax = [rbp-32] each pass' : avx ? 'zmm0 += zmm1 × zmm3' : 'xmm0 += [rsi+rax*4]',
        l1Text: o0 ? `${2 + 2} stack loads / iteration` : 'streaming arrays',
        ramText: o0 ? 'idle after prologue' : 'streaming a[]',
        vramText: 'idle',
      },
      metrics: metrics({
        instructionsExecuted: instrPerIter,
        cpuUtilization: util([o0 ? 34 : avx ? 96 : 62]),
        memoryAccesses: o0 ? 4 : 2,
        bytesTransferred: o0 ? 32 : avx ? 128 : 8,
        estimatedTimeNs: ns(cyclesPerIter),
        stageCycles: { compute: avx ? 1 : 1, memory: o0 ? 4 : 1, control: 1, stall: o0 ? 2 : 0 },
        bottleneck: o0
          ? {
              title: 'Two loads per operand, per iteration',
              severity: 'high',
              beginnerText: 'The chef spends more time reading the prep sheet than cooking.',
              engineeringText:
                'Each -O0 iteration issues 11 instructions for one float: load i, load n, compare, branch, reload i, load sum, load a[i], add, store sum, increment i, jump. IPC is capped by the loop-carried store→load on sum.',
            }
          : avx
            ? {
                title: 'Sixteen multiplies per instruction',
                severity: 'low',
                beginnerText: 'One shout, sixteen dishes at once.',
                engineeringText:
                  'vfmadd231ps operates on a full 512-bit zmm register: 16 fp32 FMAs per instruction through port FP0/FP1. At 2 FMA units per core this is 32 FLOP/cycle/core.',
              }
            : {
                title: 'Scalar FMA — one lane of sixteen in use',
                severity: 'moderate',
                beginnerText: 'One chef, one pan. The AVX-512 station next door is empty.',
                engineeringText:
                  'ss operations use a single 32-bit lane of a 512-bit-wide execution unit. The loop is latency-bound on the addss dependency chain (3-cycle latency) rather than throughput-bound.',
              },
      }),
      specialVisual: {
        type: avx ? 'simd-lanes' : 'register-file',
        registers: regsFor('loop'),
        asmLines: o0 ? o0Asm.slice(7, 18) : avx ? o3Asm.slice(3, 10) : o2Asm.slice(3, 10),
        simd: avx
          ? {
              width: 16,
              scalar: false,
              fma: true,
              lanes: Array.from({ length: 16 }).map((_, i) => ({
                label: `f${i}`,
                value: +((i + 1) * 2.5).toFixed(1),
                state: 'fma' as const,
              })),
            }
          : undefined,
      },
      inspector: {
        stepTitle: o0 ? 'Every operand is re-fetched' : avx ? 'One instruction, sixteen products' : 'Accumulate without leaving the CPU',
        phaseBadge: o0 ? 'LOOP BODY · STACK' : avx ? 'LOOP BODY · AVX-512' : 'LOOP BODY · SCALAR',
        componentHardware: o0 ? 'L1d + store-to-load forwarding' : avx ? 'AVX-512 FMA units (512-bit)' : 'SSE addss pipeline',
        componentKitchen: o0 ? 'Reading the prep sheet mid-dish' : avx ? 'Sixteen pans on one burner row' : 'One pan, one pinch at a time',
        primaryComponentId: o0 ? 'l1-cache' : 'alu',
        opcode: o0 ? 'addss xmm0, [rsi+rax*4] ; mov [rbp-28], xmm0' : avx ? 'vfmadd231ps zmm0, zmm1, ZMMWORD PTR [rdx+rax*4]' : 'addss xmm0, DWORD PTR [rdx+rax*4]',
        inputData: o0 ? 'stack-resident sum, i, n' : avx ? '16 fp32 from a[] and b[]' : 'xmm0 accumulator + b[i]',
        operation: o0 ? 'Load, add, store — three memory ops per element' : avx ? 'Fused multiply-add across 16 lanes' : 'Scalar add with a memory operand',
        outputData: o0 ? 'Updated stack slot [rbp-28]' : avx ? '16 accumulated products in zmm0' : 'New xmm0',
        memoryAccess: { tier: o0 ? 'L1 Cache' : 'L2 Cache', status: 'STREAM', address: o0 ? '[rbp-28]' : 'a[] / b[]', latencyCycles: o0 ? MODEL.l1Cycles : MODEL.l2Cycles },
        beginnerExplanation: o0
          ? 'Between every single bite, the chef wipes their hands and consults the sheet. The cooking is fine; the walking is the problem.'
          : avx
            ? 'Sixteen nearly-identical dishes are prepared in exactly the same motion. This is what SIMD means: the same instruction, many sets of numbers.'
            : 'One dish at a time, but the bowl stays in the chef’s hand the whole loop. That single change removed most of the traffic.',
        engineeringExplanation: o0
          ? 'GCC -O0 emits `add DWORD PTR [rbp-32], 1` and reloads sum every pass. The loop-carried dependency on [rbp-28] forces store-to-load forwarding, limiting throughput to roughly one element per 7 cycles.'
          : avx
            ? 'AVX-512 gives 32 architectural zmm registers. vfmadd231ps is a single instruction with a memory operand, so Zen 4 fuses the load into the FMA; this loop sustains 32 FLOP/cycle/core, 16× the scalar rate.'
            : 'SSE addss has ~3-cycle latency and 2/cycle throughput. With a single accumulator the loop is latency-bound: the scheduler cannot hide a 3-cycle chain behind one instruction per iteration without unrolling.',
        nextStepPreview: 'Reduce the accumulator and return',
      },
    },
    {
      cycle: 3,
      stageShort: 'RETIRE',
      activeComponents: ['core-0', 'registers', 'l1-cache'],
      workers: cpuAll('completed', o0 ? 'Copying the result out of the stack' : 'Reducing the vector accumulator', o0 ? 'STACK' : 'RET', 100),
      storageHighlights: {
        registersText: o0 ? 'eax ← [rbp-28]' : avx ? 'vextractf32x8 + vaddps ×3' : 'xmm0 → rax',
        l1Text: 'result written',
        ramText: 'idle',
        vramText: 'idle',
      },
      metrics: metrics({
        instructionsExecuted: o0 ? 4 : avx ? 5 : 2,
        cpuUtilization: util([22]),
        memoryAccesses: o0 ? 2 : 0,
        bytesTransferred: o0 ? 8 : 0,
        estimatedTimeNs: ns(o0 ? 10 : avx ? 5 : 3),
        stageCycles: { compute: avx ? 3 : 1, memory: o0 ? 2 : 0, control: 1, stall: 0 },
        bottleneck: {
          title: `${instrPerIter} instructions per element`,
          severity: o0 ? 'high' : avx ? 'low' : 'moderate',
          beginnerText: o0
            ? 'For one scoop of soup, the chef performed eleven separate motions — four of them just reading labels.'
            : avx
              ? 'Sixteen dishes were finished in five instructions. Nothing was left on the table.'
              : 'One dish per six instructions. Respectable, but sixteen dishes would take sixteen turns of the same six motions.',
          engineeringText: `Measured against the model: -O0 issues ${11} instructions/element at ~7 cycles; -O2 issues 6 at ~4 cycles; -O3+AVX-512 issues 5 per 16 elements (${laneCount} lanes) at ~2 cycles. That is roughly a ${avx ? '50×' : o0 ? '1×' : '1.8×'} difference in retired instructions per result.`,
        },
      }),
      specialVisual: {
        type: o0 || !avx ? 'register-file' : 'simd-lanes',
        registers: regsFor('reduce'),
        asmLines: o0 ? o0Asm.slice(16) : avx ? o3Asm.slice(10) : o2Asm.slice(7),
        simd: avx
          ? {
              width: 16,
              scalar: false,
              fma: true,
              lanes: Array.from({ length: 16 }).map((_, i) => ({
                label: `f${i}`,
                value: +((i + 1) * 2.5).toFixed(1),
                state: 'done' as const,
              })),
            }
          : undefined,
      },
      inspector: {
        stepTitle: 'The result leaves the loop',
        phaseBadge: 'EPILOGUE',
        componentHardware: o0 ? 'Stack slot → return register' : 'Horizontal vector reduction',
        componentKitchen: o0 ? 'Copying the finished number off the sheet' : 'Pouring sixteen pans into one bowl',
        primaryComponentId: 'registers',
        opcode: o0 ? 'mov eax, DWORD PTR [rbp-28]' : avx ? 'vextractf32x8 / vaddps / vaddps' : 'ret  ; xmm0 holds sum',
        inputData: o0 ? 'Stack slot [rbp-28]' : 'zmm0 (16 partial sums)',
        operation: o0 ? 'Load once, then tear the frame down' : 'Tree-reduce 16 lanes into 1',
        outputData: 'Single float returned in xmm0',
        memoryAccess: { tier: o0 ? 'L1 Cache' : 'Register', status: o0 ? 'HIT' : 'INTERNAL', address: o0 ? '[rbp-28]' : 'zmm0', latencyCycles: o0 ? MODEL.l1Cycles : 1 },
        beginnerExplanation: o0
          ? 'The number was correct all along — it was just stored on paper the entire time. That is the whole difference optimisation makes here.'
          : 'The sixteen partial pans are combined. The arithmetic is the same as the naive version; only the number of motions changed.',
        engineeringExplanation: avx
          ? 'A horizontal reduction is log₂(16)=4 shuffle+add stages. It is pure overhead at the end of a vectorised loop, which is why reduction kernels amortise it over many iterations.'
          : 'Register allocation, not instruction count, decides this loop. The -O0 version spends 4 of its 11 instructions solely on reloading spilled state.',
        nextStepPreview: 'Switch optimisation level and compare',
      },
    },
  ];
}

/* ================================================================== */
/*  EXP-12 · Instruction Encoding                                      */
/* ================================================================== */

export function encodingSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const mem = param === 'mem-disp';
  const evex = param === 'avx512';

  const fields = evex
    ? [
        { name: 'EVEX P0', bits: 8, value: '0x62', meaning: 'EVEX prefix marker', tone: '#641E25' },
        { name: 'P1', bits: 8, value: 'F1 7C', meaning: 'R/X/B + map 0F38, W=0', tone: '#B65335' },
        { name: 'P2', bits: 8, value: '48', meaning: 'zmm0, L’L = 512-bit', tone: '#85865A' },
        { name: 'OPCODE', bits: 8, value: 'B8', meaning: 'VFMADD231PS', tone: '#B69A63' },
        { name: 'MODRM', bits: 8, value: 'C1', meaning: 'reg=zmm0, rm=zmm1', tone: '#8B8983' },
        { name: 'SIB+DISP', bits: 8, value: '04 10', meaning: 'base rsi + index*4', tone: '#29221D' },
      ]
    : mem
      ? [
          { name: 'REX.W', bits: 8, value: '0x48', meaning: '64-bit operand size', tone: '#641E25' },
          { name: 'OPCODE', bits: 8, value: '89', meaning: 'MOV r/m64, r64', tone: '#B65335' },
          { name: 'MODRM', bits: 8, value: '45', meaning: 'mod=01, reg=rax, rm=rbp', tone: '#85865A' },
          { name: 'DISP8', bits: 8, value: 'F8', meaning: '−8 (rbp-8)', tone: '#B69A63' },
        ]
      : [
          { name: 'REX', bits: 8, value: '0x48', meaning: 'W=1 · 64-bit registers', tone: '#641E25' },
          { name: 'OPCODE', bits: 8, value: '01', meaning: 'ADD r/m64, r64', tone: '#B65335' },
          { name: 'MODRM', bits: 8, value: 'D8', meaning: 'mod=11 · reg=rbx · rm=rax', tone: '#85865A' },
        ];

  const totalBytes = evex ? 6 : mem ? 4 : 3;
  const srcLine = evex ? 'vfmadd231ps zmm0, zmm1, ZMMWORD PTR [rsi+rax*4]' : mem ? 'mov QWORD PTR [rbp-8], rax' : 'add rax, rbx';

  const stages: { short: string; title: string; hardware: string; kitchen: string; op: string; beadge: string; primary: CanonicalComponentId }[] = [
    {
      short: 'FETCH',
      title: 'The instruction cache hands over raw bytes',
      hardware: 'I-cache line, 64 bytes, variable-length x86',
      kitchen: 'A strip of tickets arrives from the printer',
      op: `Read ${totalBytes} bytes starting at RIP`,
      beadge: 'FETCH',
      primary: 'l1-cache',
    },
    {
      short: 'DECODE',
      title: 'Prefixes are stripped and the opcode is recognised',
      hardware: 'Zen 4 4-wide decoders + op cache',
      kitchen: 'The expediter reads the ticket shorthand',
      op: `Split into ${fields.length} fields`,
      beadge: 'DECODE',
      primary: 'scheduler',
    },
    {
      short: 'OPERANDS',
      title: 'ModR/M names which registers actually participate',
      hardware: 'Register renaming + AGU address generation',
      kitchen: 'The ticket now says which chef and which shelf',
      op: evex ? 'zmm0 ← zmm0 + zmm1 × mem' : mem ? 'mem[rbp-8] ← rax' : 'rax ← rax + rbx',
      beadge: 'OPERAND DECODE',
      primary: 'registers',
    },
    {
      short: 'EXECUTE',
      title: 'The ALU or FPU produces a result',
      hardware: evex ? 'AVX-512 FMA unit' : 'Integer ALU',
      kitchen: 'The dish is actually cooked',
      op: evex ? '16 fp32 multiply-adds' : '64-bit integer add',
      beadge: 'EXECUTE',
      primary: 'alu',
    },
  ];

  const microOps = evex ? 1 : mem ? 2 : 1;

  return stages.map((st, i) => ({
    cycle: i + 1,
    stageShort: st.short,
    activeComponents: [st.primary, 'registers', i < 2 ? 'l1-cache' : 'alu'],
    workers: cpuAll(i === 3 ? 'completed' : 'computing', st.kitchen, st.beadge, i === 3 ? 100 : 40 + i * 20),
    storageHighlights: {
      registersText: i >= 2 ? (evex ? 'zmm0 / zmm1 renamed' : mem ? 'rax → [rbp-8]' : 'rax += rbx') : 'not yet allocated',
      l1Text: i === 0 ? `i-cache line 0x401000 (${totalBytes} B used)` : 'i-cache hit',
      ramText: i === 0 ? 'prefetched' : 'idle',
      vramText: 'idle',
    },
    metrics: metrics({
      instructionsExecuted: i === 0 ? 0 : 1,
      cpuUtilization: util([i === 3 ? 55 : 25 + i * 8]),
      memoryAccesses: mem && i >= 2 ? 1 : 0,
      bytesTransferred: i === 0 ? totalBytes : 0,
      estimatedTimeNs: ns([2, 2, 1, evex ? 4 : 1][i]),
      stageCycles: { compute: i === 3 ? (evex ? 4 : 1) : 0, memory: i === 2 && mem ? 1 : 0, control: i < 2 ? 1 : 0, stall: 0 },
      bottleneck: {
        title:
          i === 1 && !evex
            ? `Variable-length decode: ${totalBytes} bytes, ${fields.length} fields`
            : i === 3 && evex
              ? 'One instruction, sixteen multiply-adds'
              : `${microOps} µop${microOps > 1 ? 's' : ''} after decode`,
        severity: i === 1 && mem ? 'moderate' : 'low',
        beginnerText: evex
          ? 'The prefix is long, but the payoff is enormous: one ticket commands sixteen dishes at once.'
          : mem
            ? 'Because the ticket includes an address with an offset, the kitchen needs an extra lookup step before it can cook.'
            : 'Three bytes, one meaning. Small tickets move fast.',
        engineeringText: evex
          ? 'The EVEX prefix is 4 bytes versus 1 for legacy VEX, but it addresses 32 zmm registers and carries masking. Zen 4 decodes EVEX forms in its 4-wide decoders without extra µops.'
          : mem
            ? 'The ModRM byte splits into mod/reg/rm, and mod=01 selects disp8. Zen 4 fuses the load into the ALU µop, so mod=01 costs no extra µop despite the extra addressing work.'
            : 'x86 legacy encodings are 1–15 bytes; the decoder must scan prefixes before it knows the length. This is the central asymmetry against fixed-width ISAs such as SASS (16 bytes) or RISC-V (4 bytes).',
      },
    }),
    specialVisual: {
      type: 'bit-fields',
      bitFields: fields,
      asmLines: [
        { indent: 0, text: srcLine, comment: `; ${totalBytes} bytes`, tone: 'asm' as const },
        {
          indent: 0,
          text: `; ${fields.map((f) => f.value).join(' ')}`,
          comment: fields.map((f) => f.name.split(' ')[0]).join(' ').toLowerCase(),
          tone: 'note' as const,
        },
      ],
    },
    inspector: {
      stepTitle: st.title,
      phaseBadge: st.beadge,
      componentHardware: st.hardware,
      componentKitchen: st.kitchen,
      primaryComponentId: st.primary,
      opcode: srcLine,
      inputData: i === 0 ? 'RIP pointing at the next instruction' : i === 1 ? `${totalBytes} raw bytes` : i === 2 ? (evex ? 'zmm0, zmm1, [rsi+rax*4]' : mem ? 'rax, rbp' : 'rax, rbx') : 'Operand values',
      operation: st.op,
      outputData: i === 3 ? (evex ? '16 fp32 results' : mem ? 'Memory updated' : 'rax updated') : 'Decoded fields',
      memoryAccess: {
        tier: i === 0 ? 'L1 Cache' : mem && i === 2 ? 'L1 Cache' : 'None',
        status: i === 0 ? 'HIT' : mem && i === 2 ? 'HIT' : 'INTERNAL',
        address: i === 0 ? '0x401000' : mem ? '[rbp-8]' : '—',
        latencyCycles: i === 0 ? MODEL.l1Cycles : mem && i === 2 ? MODEL.l1Cycles : 0,
      },
      beginnerExplanation:
        i === 0
          ? 'Nothing has been understood yet. The machine holds a strip of bytes and only knows where to start reading.'
          : i === 1
            ? 'Now the strip is read. Each chunk of bits has a job: which operation, which register, which memory offset.'
            : i === 2
              ? 'The operands are resolved. The kitchen now knows exactly which chef and which shelf the ticket refers to.'
              : 'The dish is cooked and the result written. The whole journey took a handful of nanoseconds.',
      engineeringExplanation:
        i === 0
          ? 'Zen 4 fetches from the op cache where possible; a miss goes to the 32 KB L1i and takes ~4 cycles before decode sees the first byte.'
          : i === 1
            ? `Prefix scan → opcode → ModRM. x86 length is only known after the ModRM byte, so decode is inherently serial per instruction; fixed-width ISAs decode in parallel.`
            : i === 2
              ? 'The register renaming stage maps architectural names (rax) onto physical registers in the 168-entry file, eliminating WAW/WAR hazards without stalls.'
              : evex
                ? 'One vfmadd231ps dispatches to two FMA pipes and retires 32 FLOPs in a single µop — the highest FLOP-per-instruction density on this chip.'
                : 'The integer ALU result is written back in cycle 5 of a ~20-stage Zen 4 pipeline, but 8-wide dispatch keeps other work flowing meanwhile.',
      nextStepPreview: i < 3 ? stages[i + 1].title : 'Compare encodings across ISAs',
    },
  }));
}

/* ================================================================== */
/*  EXP-13 · x86, PTX and SASS                                         */
/* ================================================================== */

export function isaSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const cpu = param === 'cpu-x86';
  const ptx = param === 'gpu-ptx';

  const stack = [
    {
      level: 'c' as const,
      title: 'C · one language, three targets',
      lines: [
        '__global__ void axpy(float a, float* x, float* y, int n) {',
        '  int i = blockIdx.x * blockDim.x + threadIdx.x;',
        '  if (i < n) y[i] += a * x[i];',
        '}',
      ],
      cost: 'source',
    },
    {
      level: 'ptx' as const,
      title: 'PTX · virtual ISA, forward compatible',
      lines: [
        '.visible .entry axpy(.param .f32 a) {',
        '  .reg .f32 %f<4>;  .reg .b64 %rd<6>;',
        '  mov.u32 %r1, %tid.x;   mad.lo.s32 %r2, %ctaid.x, %ntid.x, %r1;',
        '  setp.lt.s32 %p1, %r2, %r3;  @%p1 ld.global.f32 %f1, [%rd1];',
        '  fma.rn.f32 %f2, %f4, %f1, %f3;  st.global.f32 [%rd2], %f2;',
        '}',
      ],
      cost: 'virtual · ~30 ops',
    },
    {
      level: 'sass' as const,
      title: 'SASS · what the SMs really execute (Blackwell)',
      lines: [
        '/* 0x0000 */ S2R      R1, SR_TID.X',
        '/* 0x0010 */ IMAD     R2, c[0x0][0x0], c[0x0][0x4], R1',
        '/* 0x0020 */ ISETP.LT.AND P0, PT, R2, c[0x0][0x8], PT',
        '/* 0x0030 */ @P0 LDG.E    R4, [R6.64]',
        '/* 0x0040 */ @P0 FFMA      R4, R4, c[0x0][0x20], R7',
        '/* 0x0050 */ @P0 STG.E    [R8.64], R4',
        '/* 0x0060 */ EXIT',
      ],
      cost: '128-bit fixed width · 7 instructions',
    },
    {
      level: 'asm' as const,
      title: 'x86-64 · the same maths on the CPU',
      lines: [
        'axpy:                       ; void axpy(float a, float *x, float *y, int n)',
        '  test  ecx, ecx',
        '  jle   .done',
        '.loop:',
        '  movss  xmm0, DWORD PTR [rdi+rax*4]   ; x[i]',
        '  mulss  xmm0, xmm1                    ; a * x[i]',
        '  addss  xmm0, DWORD PTR [rsi+rax*4]   ; + y[i]',
        '  movss  DWORD PTR [rsi+rax*4], xmm0   ; y[i] =',
        '  add    eax, 1',
        '  cmp    eax, ecx',
        '  jl     .loop',
        '.done: ret',
      ],
      cost: 'scalar loop · 4-CORE',
    },
  ];

  const chosen = cpu ? stack : ptx ? stack.slice(0, 2) : stack.slice(0, 3);
  const activeLevel = cpu ? 'x86-64' : ptx ? 'PTX' : 'SASS';
  const instrWidth = cpu ? '1–15 B variable' : ptx ? 'virtual (unbounded)' : '128 bits fixed';

  const rounds: { short: string; title: string; badge: string; len: number; hw: string; kch: string }[] = [
    { short: 'SOURCE', title: 'One kernel is written once in C++', badge: 'SOURCE', len: 1, hw: 'nvcc / gcc front end', kch: 'One recipe written on one card' },
    { short: 'IR', title: 'The compiler emits an intermediate representation', badge: 'IR EMIT', len: 2, hw: cpu ? 'GIMPLE → RTL → x86-64' : 'NVVM → PTX', kch: 'The card is rewritten in shorthand' },
    { short: 'ISA', title: `The target machine’s own instruction stream (${activeLevel})`, badge: 'TARGET ISA', len: 3, hw: `${activeLevel} · ${instrWidth}`, kch: 'Every chef gets the same recipe, written for their station' },
    { short: 'SCHEDULE', title: 'The scheduler decides how many lanes move per cycle', badge: 'SCHEDULE', len: 4, hw: cpu ? '8-wide OoO dispatch, 1 thread' : '4 warp schedulers per SM, 32 lanes each', kch: cpu ? 'One chef, fast' : 'A whole row of cooks, in step' },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: (cpu
      ? ['scheduler', 'pipeline', 'registers', 'alu']
      : ['warp-scheduler', 'sm-0', 'gpu-workers', 'shared-mem']) as CanonicalComponentId[],
    workers: cpu
      ? cpuAll(i === 3 ? 'computing' : 'idle', cpu ? 'Issuing one thread’s instructions' : 'Awaiting kernel', 'x86', i === 3 ? 80 : 30)
      : gpuAll(i === 3 ? 'computing' : 'idle', i === 3 ? 'All lanes in lockstep' : 'Awaiting launch', ptx ? 'PTX' : 'SASS', i === 3 ? 90 : 20),
    storageHighlights: {
      registersText: cpu ? '16 GPR + 32 zmm' : '255 registers per thread, 64K per SM',
      l1Text: cpu ? 'x86 decodes variable length' : 'SASS is 128-bit, always',
      ramText: cpu ? 'PTX never reaches this machine' : ptx ? 'not executed directly' : 'kernel resident in VRAM',
      vramText: ptx ? 'PTX text is cached and JIT’d' : 'SASS binary',
    },
    metrics: metrics({
      instructionsExecuted: [0, 12, chosen.reduce((a, b) => a + b.lines.length, 0), cpu ? 4 : 128][i],
      cpuUtilization: util(cpu ? [i === 3 ? 88 : 20 + i * 10, i === 3 ? 88 : 12] : [0]),
      gpuUtilization: cpu ? util([], 8) : [90, 90, 90, 90, 90, 90, 90, 90].map((v) => (i === 3 ? v : v - 30)),
      estimatedTimeNs: ns([0, 40, 120, cpu ? 3 : 2][i]),
      stageCycles: { compute: i === 3 ? (cpu ? 3 : 2) : 0, memory: i === 1 ? 12 : 0, control: i === 2 ? 8 : 1, stall: 0 },
      bottleneck: {
        title:
          i === 1
            ? 'Compilation is ahead-of-time for the CPU, at load time for the GPU'
            : i === 2
              ? `${activeLevel}: ${instrWidth}`
              : cpu
                ? 'The CPU spends its width on one thread'
                : 'Each SM keeps 48 warps resident to hide latency',
        severity: cpu && i === 3 ? 'moderate' : 'low',
        beginnerText: cpu
          ? 'The CPU kitchen has one very fast chef. Excellent for one complex dish, and a lot of unused bench for a thousand simple ones.'
          : 'PTX is the recipe everyone can read; SASS is the version the station actually follows. The driver translates between them when you launch.',
        engineeringText: cpu
          ? 'x86-64 decodes 1–15 byte instructions with a 4-wide decoder plus op cache, then dispatches up to 8 µops/cycle from a 320-entry ROB — all for a single thread.'
          : ptx
            ? 'PTX is an abstract RISC-like ISA with infinite virtual registers. The driver’s JIT (JITL) compiles it to the exact SASS the silicon wants, which is why one binary runs on future architectures.'
            : 'SASS on Blackwell is fixed 128-bit per instruction with explicit predicate and control bits, letting the scheduler decode independent instructions in parallel — the structural opposite of x86.',
      },
    }),
    specialVisual: {
      type: 'isa-stack',
      isaStack: stack.map((s, idx) => ({ ...s, active: idx === (cpu ? 3 : ptx ? 1 : 2) })),
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: cpu ? 'core-0' : i === 3 ? 'warp-scheduler' : 'sm-0',
      opcode: cpu ? 'mulss xmm0, xmm1' : ptx ? 'fma.rn.f32 %f2, %f4, %f1, %f3;' : 'FFMA R4, R4, c[0x0][0x20], R7',
      inputData: 'a, x[], y[], n',
      operation: i === 1 ? 'Lower the AST to machine-independent IR' : i === 2 ? 'Select machine instructions for the target' : 'Issue instructions at maximum width',
      outputData: i === 3 ? 'y[i] updated for every i' : `${activeLevel} text`,
      memoryAccess: { tier: cpu ? 'L1 Cache' : 'VRAM', status: i === 2 ? 'STREAM' : 'INTERNAL', address: cpu ? 'x[] / y[] in DRAM' : 'x[] / y[] in VRAM', latencyCycles: cpu ? MODEL.l1Cycles : MODEL.vramCycles },
      beginnerExplanation:
        i === 0
          ? 'One recipe, written by a human, with no idea yet which kitchen will cook it.'
          : i === 1
            ? 'The compiler rewrites the recipe into a neutral shorthand that any kitchen can read.'
            : i === 2
              ? cpu
                ? 'For the CPU, this shorthand becomes long, flexible instructions that can express any address.'
                : 'For the GPU, it becomes very regular instructions — always the same size, always with room for predicates.'
              : cpu
                ? 'The chef works alone, eight operations deep. For a banquet, that is the wrong shape of kitchen.'
                : 'Thirty-two cooks move on one beat, four schedulers per SM, forty-eight warps in flight.',
      engineeringExplanation:
        i === 1
          ? cpu
            ? 'gcc lowers to GIMPLE, then RTL, then selects x86 patterns. Register allocation happens after instruction selection, which is why flag choices change register pressure so dramatically.'
            : 'nvcc emits NVVM IR, which becomes PTX. PTX keeps virtual registers in SSA-ish form, leaving the final allocation to the device driver.'
          : i === 2
            ? cpu
              ? 'x86 gives the compiler a huge instruction space: memory operands, complex addressing, variable length. That flexibility costs decode width.'
              : 'SASS uses fixed 128-bit bundles with explicit predicate registers (P0–P7) and control codes, so four instructions can be co-issued per scheduler without re-decoding.'
            : i === 3
              ? cpu
                ? 'A single Zen 4 core sustains at most 8 µops/cycle and roughly 4 IPC in practice; all of it serves one instruction stream.'
                : 'RTX 5060 has 26 SMs × 4 partitions = 104 schedulers. Each picks one warp per cycle, so the chip can keep 3,328 CUDA lanes fed from many independent streams at once.'
              : 'The C source is the contract. Everything below it is a translation, and the ISA you target fixes what the scheduler can see.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare the two kitchens',
    },
  }));
}

/* ================================================================== */
/*  EXP-14 · Branch prediction & divergence                            */
/* ================================================================== */

export function branchSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const predictable = param === 'predictable';
  const divergent = param === 'divergent';

  const pattern = predictable
    ? Array.from({ length: 12 }).map((_, i) => (i < 11 ? 'T' : 'N') as 'T' | 'N')
    : divergent
      ? Array.from({ length: 12 }).map((_, i) => (i % 2 === 0 ? 'T' : 'N') as 'T' | 'N')
      : (['T', 'N', 'T', 'T', 'N', 'T', 'N', 'N', 'T', 'N', 'N', 'T'] as ('T' | 'N')[]);

  const mispredicts = predictable ? 1 : divergent ? 6 : 6;
  const total = pattern.length;
  const accuracy = Math.round(((total - mispredicts) / total) * 100);
  const flushCycles = 18;

  const rows = pattern.map((actual, i) => {
    const predicted: 'T' | 'N' = predictable ? (i === total - 1 ? 'N' : 'T') : i === 0 ? 'N' : pattern[i - 1];
    return {
      pattern: `B${i + 1}`,
      predicted,
      actual,
      cost: predicted === actual ? 0 : flushCycles,
      label: predicted === actual ? 'hit' : 'MISPREDICT',
    };
  });

  const rounds = [
    {
      short: 'PREDICT',
      title: 'The front end guesses the direction before it is known',
      badge: 'SPECULATION',
      cost: 1,
      hw: 'TAGE-style predictor, 2 branches/cycle',
      kch: 'Expediter guesses what the next order will be',
    },
    {
      short: 'SPECULATE',
      title: 'The CPU executes the guessed path speculatively',
      badge: 'OUT OF ORDER',
      cost: 4,
      hw: 'ROB + reorder buffer, results unretired',
      kch: 'Cooks start prepping the guessed dish',
    },
    {
      short: 'MISPREDICT',
      title: 'The guess was wrong — the pipeline must be flushed',
      badge: `${mispredicts} FLUSHES`,
      cost: flushCycles,
      hw: `Branch misprediction penalty ≈ ${flushCycles} cycles`,
      kch: 'Everything half-cooked goes in the bin',
    },
    {
      short: divergent ? 'DIVERGE' : 'RESOLVE',
      title: divergent
        ? 'Within one warp, half the lanes want the other path'
        : 'The guess was right; retire proceeds unchanged',
      badge: divergent ? 'WARP DIVERGENCE' : 'RECONVERGE',
      cost: divergent ? 2 : 0,
      hw: divergent ? 'Reconvergence stack, 2 serialised passes' : 'Retire in order, no penalty',
      kch: divergent ? 'The row cooks two recipes, one after the other' : 'The row cooks one recipe, together',
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: divergent
      ? ['warp-scheduler', 'sm-0', 'gpu-workers']
      : ['scheduler', 'pipeline', 'core-0', 'alu'],
    workers: divergent
      ? gpuCrew(
          Array.from({ length: 8 }).map((_, k) => ({
            state: (i === 2 ? (k % 2 === 0 ? 'stalled' : 'diverged-off') : i === 1 ? 'computing' : 'completed') as KitchenWorker['state'],
            task: i === 2 ? (k % 2 === 0 ? 'cooking the if-path alone' : 'masked off') : 'running the warp',
            progress: i === 3 ? 100 : 55,
          })),
        )
      : cpuAll(i === 2 ? 'stalled' : i === 3 ? 'completed' : 'computing', r.kch, i === 2 ? `FLUSH` : `${accuracy}%`, i === 3 ? 100 : 60),
    storageHighlights: {
      registersText: divergent ? 'EXEC_MASK = 0x0000FFFF then 0xFFFF0000' : i === 2 ? 'ROB rolled back' : 'speculative results kept',
      l1Text: 'branch history buffer',
      ramText: 'idle',
      vramText: divergent ? 'predicate masks' : 'idle',
    },
    metrics: metrics({
      instructionsExecuted: i === 2 ? mispredicts * 6 : i === 1 ? 24 : 12,
      cpuUtilization: util(divergent ? [0] : [i === 2 ? 18 : i === 3 ? 84 : 70]),
      gpuUtilization: util(divergent ? [i === 2 ? 30 : i === 3 ? 55 : 90, i === 2 ? 30 : 55, 55, 55, 55, 55, 55, 55].map(Number) : [], 8),
      memoryAccesses: 4,
      bytesTransferred: 0,
      estimatedTimeNs: ns(r.cost * 4),
      stageCycles: { compute: 2, memory: 0, control: 2, stall: i === 2 ? flushCycles : 0 },
      bottleneck: {
        title:
          i === 2
            ? `${mispredicts} mispredictions × ${flushCycles}-cycle flush = ${mispredicts * flushCycles} wasted cycles`
            : divergent && i === 3
              ? 'Divergence halves SIMT efficiency'
              : `${accuracy}% prediction accuracy`,
        severity: i === 2 && !predictable ? 'high' : 'low',
        beginnerText: predictable
          ? 'The expediter has seen this order ten times. The guess is free.'
          : divergent
            ? 'Half the row wants the spicy sauce and half wants the cold one. The row cannot move until it has done both, one after the other.'
            : 'The expediter is guessing. When the guess is wrong, everything in progress is thrown away and restarted.',
        engineeringText: predictable
          ? 'A loop branch is nearly deterministic, so the TAGE predictor saturates and the single not-taken exit costs one flush of ~18 cycles across the whole loop.'
          : divergent
            ? 'A divergent warp executes the if-body and the else-body as two passes with complementary execution masks; no lanes are lost, but throughput per pass halves.'
            : `Data-dependent branches defeat the predictor: with accuracy at ${accuracy}%, each mispredict discards up to ${flushCycles} cycles of speculative work — on Zen 4 that is the refill depth of the execution pipeline.`,
      },
    }),
    specialVisual: {
      type: 'predictor',
      predictor: rows,
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: divergent ? 'warp-scheduler' : 'scheduler',
      opcode: divergent ? '@!P0 BRA else_path ; @P0 ...' : 'jne .Lloop',
      inputData: `Branch history for ${total} branches`,
      operation: i === 2 ? 'Flush and refill' : i === 1 ? 'Speculative execute' : 'Predict direction',
      outputData: i === 2 ? `${mispredicts * flushCycles} cycles discarded` : `${accuracy}% correct`,
      memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation:
        i === 2
          ? `On a mispredict the front end must discard every µop younger than the branch. Zen 4 refills at roughly ${flushCycles} cycles; at one branch per 6 instructions, 50% accuracy can cost more than the work itself.`
          : i === 3
            ? divergent
              ? 'SIMT efficiency here is 50%: in each pass half the lanes are masked. The cost is not lost lanes but doubled instruction issue for the same result.'
              : 'Prediction does not change correctness — architecturally the CPU behaves as if each branch were resolved first. The speed-up is purely a scheduling illusion.'
            : 'The predictor is trained by retirement, not by execution: speculative paths never update the history buffer if they are flushed.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare CPU and GPU behaviour',
    },
  }));
}

/* ================================================================== */
/*  EXP-15 · OpenMP thread scaling                                     */
/* ================================================================== */

export function openmpSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const threads = param === 't1' ? 1 : param === 't8' ? 8 : 32;
  const serialPct = 0.04;

  const scaling = [1, 2, 4, 8, 16, 32].map((t) => {
    const speedup = +(1 / (serialPct + (1 - serialPct) / Math.min(t, RIG_CPU.cores) + (t > RIG_CPU.cores ? 0.18 : 0))).toFixed(2);
    return {
      threads: t,
      barPct: Math.round((speedup / 12) * 100),
      speedup,
      ideal: t,
      note: t > RIG_CPU.cores ? 'SMT — shared execution units' : t === RIG_CPU.cores ? 'all 16 physical cores' : '',
      active: t === threads,
    };
  });

  const chosen = scaling.find((s) => s.threads === threads)!;

  const rounds = [
    {
      short: 'SERIAL',
      title: 'The serial region: one thread, every other core idle',
      badge: 'AMDAHL’S SERIAL PART',
      hw: '1 core of 16 active',
      kch: 'One chef does the mise en place while fifteen watch',
      util: [70, 0, 0, 0],
    },
    {
      short: 'FORK',
      title: 'OpenMP forks the team and hands out loop iterations',
      badge: 'omp parallel for',
      hw: `${threads} threads spawned across ${Math.min(threads, RIG_CPU.cores)} cores`,
      kch: `${threads} cooks step up to the pass`,
      util: Array.from({ length: 4 }).map(() => (threads > 1 ? 92 : 24)),
    },
    {
      short: 'SCALE',
      title: 'Speed-up rises, then flattens against the serial fraction',
      badge: `${chosen.speedup}× SPEED-UP`,
      hw: 'Amdahl ceiling = 1 / (s + (1-s)/p)',
      kch: 'More cooks stop helping once the pass is crowded',
      util: Array.from({ length: 4 }).map(() => (threads > 16 ? 100 : threads > 4 ? 88 : 40)),
    },
    {
      short: 'JOIN',
      title: 'Threads join and the serial tail finishes the result',
      badge: 'omp barrier',
      hw: '1 core active again, barrier drained',
      kch: 'The pass empties; one chef plates',
      util: [84, 6, 4, 2],
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: ['scheduler', 'core-0', 'core-1', 'core-2', 'core-3', 'registers', 'ram'],
    workers: cpuAll(
      i === 0 || i === 3 ? (i === 3 ? 'completed' : 'computing') : threads > 1 ? 'computing' : 'idle',
      r.kch,
      `${threads}T`,
      i === 3 ? 100 : 55 + i * 10,
    ),
    storageHighlights: {
      registersText: `${threads} × 168 integer registers in flight`,
      l1Text: `${Math.min(threads, 16)} private L1d streams`,
      ramText: `${(threads * 2.1).toFixed(1)} GB/s of 83.2 GB/s`,
      vramText: 'idle',
    },
    metrics: metrics({
      instructionsExecuted: threads * 40 * (i + 1),
      cpuUtilization: util(r.util),
      memoryAccesses: threads * 8,
      bytesTransferred: threads * 64,
      estimatedTimeNs: ns(Math.round((4000 / chosen.speedup) * (i + 1) * 0.4)),
      stageCycles: { compute: threads, memory: 2, control: 1, stall: threads > RIG_CPU.cores ? 4 : 0 },
      bottleneck: {
        title:
          i === 0
            ? `A ${Math.round(serialPct * 100)}% serial region caps you at ${(1 / serialPct).toFixed(0)}×`
            : threads > RIG_CPU.cores
              ? 'SMT shares execution units — 32 threads ≠ 32 cores'
              : i === 2
                ? `Scaling efficiency ${Math.round((chosen.speedup / threads) * 100)}%`
                : 'Barrier waits dominate at the end',
        severity: i === 0 ? 'high' : threads > RIG_CPU.cores ? 'moderate' : 'low',
        beginnerText:
          i === 0
            ? 'However many chefs you hire, they all stand still while one person sets up. That fixed cost is what limits your speed-up.'
            : threads > RIG_CPU.cores
              ? 'You now have more cooks than stoves. Two cooks share one burner, so they take turns rather than working twice as fast.'
              : 'Every extra cook helps — but less each time, because the fixed setup never shrinks.',
        engineeringText:
          i === 0
            ? `Amdahl’s law with s = ${serialPct}: the maximum speed-up as p→∞ is 1/s = 25×. The Ryzen 9 has 16 cores, so the practical ceiling is 1/(0.04 + 0.96/16) = 12.2×.`
            : threads > RIG_CPU.cores
              ? `Beyond ${RIG_CPU.cores} threads the SMT sibling shares the integer ALUs, L1d and FPU pipes. Typical gain per extra logical thread is 15–25%, which matches the modelled 0.18 serial-equivalent penalty.`
              : `With ${threads} threads the measured-style speed-up is ${chosen.speedup}× against an ideal of ${threads}× — the gap is the serial fraction plus the barrier at the end of each parallel for.`,
      },
    }),
    specialVisual: {
      type: 'thread-scaling',
      threadScaling: scaling,
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: i === 0 ? 'core-0' : 'scheduler',
      opcode: '#pragma omp parallel for schedule(static)',
      inputData: 'N loop iterations, 1 independent per thread',
      operation: i === 1 ? 'Fork threads and partition the loop' : i === 2 ? 'Execute the parallel region' : i === 0 ? 'Run the serial preamble' : 'Join at the implicit barrier',
      outputData: `Speed-up ${chosen.speedup}× at ${threads} threads`,
      memoryAccess: { tier: 'System RAM', status: 'STREAM', address: 'shared array', latencyCycles: MODEL.dramCycles },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation:
        'OpenMP maps loop iterations to threads at the barrier. Static scheduling assigns contiguous chunks, which is cache-friendly for streaming arrays; dynamic scheduling reduces tail imbalance but adds atomic fetch-adds per chunk.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Try another thread count',
    },
  }));
}

/* ================================================================== */
/*  EXP-16 · False sharing                                             */
/* ================================================================== */

export function falseSharingSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const packed = param === 'false-share';

  const line = (owner: 'A' | 'B' | 'shared' | 'free', hot: boolean) =>
    Array.from({ length: 8 }).map((_, i) => ({
      tag: i,
      owner: i === 0 ? ('A' as const) : i === 1 ? ('B' as const) : 'free' as const,
      hot,
    })).map((b, i) => (i === 0 ? { ...b, owner: 'A' as const } : i === 1 ? { ...b, owner: 'B' as const } : b));

  const rounds = [
    {
      short: 'LAYOUT',
      title: packed ? 'Two counters, eight bytes apart, one 64-byte line' : 'Each counter owns a separate cache line',
      badge: packed ? 'PACKED STRUCT' : 'PADDED',
      hw: packed ? 'Both counters map to the same L1 line' : '64-byte separation with padding',
      kch: packed ? 'Two chefs reach into the same drawer' : 'Two chefs, two drawers',
      cyc: packed ? 2 : 2,
    },
    {
      short: packed ? 'INVALIDATE' : 'LOCAL',
      title: packed ? 'Core 1 writes its counter — the whole line is invalidated in core 0' : 'Core 1 writes its own line; core 0 is unaffected',
      badge: packed ? 'MESI INVALIDATE' : 'NO TRAFFIC',
      hw: packed ? 'RFO (read-for-ownership) across the L3' : 'Clean silent write',
      kch: packed ? 'The drawer is yanked away mid-reach' : 'Each chef works undisturbed',
      cyc: packed ? 46 : 1,
    },
    {
      short: packed ? 'PING-PONG' : 'STEADY',
      title: packed
        ? 'The line bounces between the two cores every write'
        : 'Both cores stream at full rate',
      badge: packed ? `${46} CYCLES / WRITE` : 'LINEAR',
      hw: packed ? 'L3 round trip on every store' : 'L1 write hit, 1 cycle',
      kch: packed ? 'The drawer crosses the kitchen 1,000 times' : 'Nothing crosses the kitchen',
      cyc: packed ? 46 : 1,
    },
    {
      short: 'RESULT',
      title: packed ? 'Correct, but 8–20× slower than it should be' : 'Correct, and near the memory-bound limit',
      badge: packed ? 'FALSE SHARING' : 'FIXED',
      hw: packed ? 'Same answer, 20× the coherence traffic' : 'Same answer, minimal traffic',
      kch: packed ? 'Two chefs made the dish; the walking was the cost' : 'Two chefs made the dish; nobody walked',
      cyc: packed ? 46 : 1,
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: ['core-0', 'core-1', 'l1-cache', 'l2-cache', 'l3-cache', 'ram'],
    workers: cpuCrew([
      { state: (i >= 2 ? 'computing' : 'stalled') as KitchenWorker['state'], task: packed ? 'Fighting over one cache line' : 'Writing its own line', badge: packed ? 'RFO' : 'L1', progress: 40 + i * 15 },
      { state: (i >= 1 ? (packed ? 'stalled' : 'computing') : 'idle') as KitchenWorker['state'], task: packed ? 'Invalidated by the other core' : 'Writing its own line', badge: packed ? 'INV' : 'L1', progress: 30 + i * 15 },
      { state: 'idle' as KitchenWorker['state'], task: 'Standing by' },
      { state: 'idle' as KitchenWorker['state'], task: 'Standing by' },
    ]),
    storageHighlights: {
      registersText: packed ? 'cntA @ 0x1000, cntB @ 0x1008' : 'cntA @ 0x1000, cntB @ 0x1040',
      l1Text: packed ? 'same line, shared state' : 'one line each, exclusive',
      ramText: 'working set fits in L1',
      vramText: 'idle',
    },
    metrics: metrics({
      instructionsExecuted: i * 250,
      cpuUtilization: util(packed ? [78, 78] : [96, 96]),
      cacheHits: packed ? i * 40 : i * 250,
      cacheMisses: packed ? i * 210 : i * 4,
      memoryAccesses: i * 250,
      bytesTransferred: i * (packed ? 64 * 210 : 64 * 4),
      estimatedTimeNs: ns(r.cyc * i * 250),
      stageCycles: { compute: i * 250, memory: 0, control: 0, stall: packed ? i * 210 * 46 : i * 4 * 46 },
      bottleneck: {
        title: packed ? 'Coherence ping-pong on a shared line' : 'No false sharing',
        severity: packed ? 'high' : 'low',
        beginnerText: packed
          ? 'The two chefs never touch the same ingredient — but because it lives in the same drawer, they keep taking the drawer off each other.'
          : 'Each chef has their own drawer, so nobody ever waits for anybody.',
        engineeringText: packed
          ? `Both counters live in one 64-byte line. Each store must gain exclusive ownership, so the line shuttles between the two cores’ L1s via the L3: ~${46} cycles per write instead of 1. At 250 writes each, the coherence bus moves ${(250 * 64).toLocaleString('en-US')} bytes for ${250 * 2} useful updates.`
          : 'Adding `alignas(64)` (or padding to 128 bytes) gives each counter its own line. The stores become clean L1 hits and coherence traffic drops to nothing — same answer, the memory system stops trampling itself.',
      },
    }),
    specialVisual: {
      type: 'cache-line',
      cacheLine: {
        bytes: Array.from({ length: 8 }).map((_, k) => ({
          tag: k * 8,
          owner: (k === 0 ? 'A' : k === 1 && packed ? 'B' : 'free') as 'A' | 'B' | 'shared' | 'free',
          hot: k <= 1,
        })),
        lineAddr: packed ? '0x1000 · one line · both counters' : '0x1000 and 0x1040 · two lines',
        note: packed ? 'A and B share a line — every write invalidates the other core' : 'Each counter owns a line — no coherence traffic',
      },
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: i === 0 ? 'l1-cache' : i === 1 ? 'l2-cache' : 'l3-cache',
      opcode: packed ? 'cntA++;   // and cntB++ on another core' : 'alignas(64) std::atomic<int> cntA, cntB;',
      inputData: 'Two independent counters written by two cores',
      operation: i === 1 ? 'Gain exclusive ownership of the line' : 'Stream stores',
      outputData: packed ? 'Correct values, 20× the traffic' : 'Correct values, minimum traffic',
      memoryAccess: { tier: packed ? 'L2 Cache' : 'L1 Cache', status: packed ? 'MISS' : 'HIT', address: packed ? '0x1000' : '0x1040', latencyCycles: r.cyc },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation:
        'False sharing is a property of layout, not logic. Two threads writing distinct variables that share a line both take RFO ownership repeatedly, so a fully parallel workload serialises through the L3 slice — and the profiler shows no lock, no atomic, and no shared variable.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare layouts',
    },
  }));
}

/* ================================================================== */
/*  EXP-17 · Instruction level parallelism                             */
/* ================================================================== */

export function ilpSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const dependent = param === 'dependent';

  const ops = ['mul', 'add', 'sub', 'fma'];
  const nodes = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    op: `${ops[i % 4]} r${i + 1}`,
    cycle: dependent ? i + 1 : 1 + Math.floor(i / 4),
    lane: dependent ? 0 : i % 4,
    status: (dependent ? (i < 3 ? 'ready' : 'waiting') : 'ready') as 'ready' | 'waiting' | 'done' | 'stalled',
  }));
  const edges: [number, number][] = dependent
    ? Array.from({ length: 11 }).map((_, i) => [i, i + 1] as [number, number])
    : [
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
        [4, 8],
        [5, 9],
        [6, 10],
        [7, 11],
      ];

  const ipc = dependent ? 1.0 : 4.0;
  const cycles = dependent ? 12 : 3;

  const rounds = [
    {
      short: 'SCHEDULE',
      title: dependent ? 'Every instruction waits on the previous one' : 'Four independent chains are available',
      badge: dependent ? 'SERIAL CHAIN' : '4 INDEPENDENT CHAINS',
      hw: dependent ? 'ROB occupancy 12, only 1 issue slot used' : 'Issue width 4, all slots filled',
      kch: dependent ? 'One chef, each step waiting on the last' : 'Four chefs, four independent dishes',
      count: dependent ? 1 : 4,
    },
    {
      short: 'ISSUE',
      title: dependent ? 'One µop dispatches per cycle — 75% of the width unused' : 'Four µops dispatch in the same cycle',
      badge: `IPC ${ipc.toFixed(2)}`,
      hw: dependent ? '4-wide dispatch, 1 used' : '4-wide dispatch, 4 used',
      kch: dependent ? 'Three chefs stand idle' : 'All four chefs cook at once',
      count: dependent ? 1 : 4,
    },
    {
      short: 'LATENCY',
      title: dependent ? 'Each mul→add dependency costs ~3 cycles of latency' : 'Latency is hidden behind independent work',
      badge: dependent ? 'LATENCY-BOUND' : 'THROUGHPUT-BOUND',
      hw: dependent ? 'Dependency chain length 12' : 'Critical path length 3',
      kch: dependent ? 'Nothing to do between steps' : 'Cooking never stops',
      count: dependent ? 1 : 4,
    },
    {
      short: 'RETIRE',
      title: dependent ? `${cycles} cycles for 12 instructions (IPC ${ipc})` : `${cycles} cycles for 12 instructions (IPC ${ipc})`,
      badge: dependent ? '4× SLOWER' : '4× FASTER',
      hw: `Retired 12 instructions in ${cycles} cycles`,
      kch: dependent ? 'The same work, one-quarter of the bench in use' : 'The same work, one-quarter of the time',
      count: dependent ? 1 : 4,
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: ['scheduler', 'pipeline', 'core-0', 'alu', 'registers'],
    workers: cpuCrew([
      { state: 'computing' as KitchenWorker['state'], task: dependent ? 'Dependent chain — one at a time' : 'Independent chain A', badge: `IPC ${ipc}`, progress: 40 + i * 20 },
      { state: (dependent ? 'idle' : 'computing') as KitchenWorker['state'], task: dependent ? 'Waiting for the chain' : 'Independent chain B', badge: dependent ? 'IDLE' : 'A', progress: dependent ? 0 : 40 + i * 20 },
      { state: (dependent ? 'idle' : 'computing') as KitchenWorker['state'], task: dependent ? 'Waiting for the chain' : 'Independent chain C', badge: dependent ? 'IDLE' : 'C', progress: dependent ? 0 : 40 + i * 20 },
      { state: (dependent ? 'idle' : 'computing') as KitchenWorker['state'], task: dependent ? 'Waiting for the chain' : 'Independent chain D', badge: dependent ? 'IDLE' : 'D', progress: dependent ? 0 : 40 + i * 20 },
    ]),
    storageHighlights: {
      registersText: dependent ? 'r1→r2→…→r12, raw hazards' : 'r1..r12 renamed, no hazards',
      l1Text: 'operands in registers',
      ramText: 'idle',
      vramText: 'idle',
    },
    metrics: metrics({
      instructionsExecuted: 12,
      cpuUtilization: util(dependent ? [22] : [92]),
      estimatedTimeNs: ns(cycles),
      stageCycles: { compute: cycles, memory: 0, control: 0, stall: dependent ? 9 : 0 },
      bottleneck: {
        title: dependent ? `Dependency chain: IPC ${ipc}, 9 idle slots` : `Full issue width: IPC ${ipc}`,
        severity: dependent ? 'high' : 'low',
        beginnerText: dependent
          ? 'The chef cannot boil the sauce before it is reduced, and cannot reduce the stock before it is strained. Each step must finish before the next begins.'
          : 'Four pots, four burners, four chefs. Nothing waits for anything.',
        engineeringText: dependent
          ? 'A pure dependency chain exposes only one instruction per cycle regardless of width: the mul result is needed 3 cycles later, and Zen 4 cannot compute it sooner. ILP is the property that lets width be used.'
          : 'Renaming makes r1…r12 independent physical registers, so the scheduler issues four µops per cycle to four ALU pipes. IPC 4 of a 4-wide dispatch is the practical ceiling without SMT.',
      },
    }),
    specialVisual: {
      type: 'dependency-graph',
      dependencyGraph: { nodes, edges },
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: i === 0 ? 'scheduler' : 'alu',
      opcode: dependent ? 'imul r2, r1  ; add r3, r2' : 'imul r1..r4  ; add r5..r8',
      inputData: dependent ? 'Each result feeds the next' : 'Four independent operand sets',
      operation: i === 1 ? 'Dispatch µops to free ALU pipes' : i === 2 ? 'Track dependency readiness' : 'Retire in program order',
      outputData: `IPC ${ipc} · ${cycles} cycles`,
      memoryAccess: { tier: 'Register', status: 'INTERNAL', address: '—', latencyCycles: 1 },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation: 'The reorder buffer lets independent instructions execute ahead of stalled ones, but it cannot invent independence. ILP is a property of the code, which is why re-associating a sum into four partial sums can quadruple throughput with no algorithm change.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare streams',
    },
  }));
}

/* ================================================================== */
/*  EXP-18 · SIMD and FMA                                              */
/* ================================================================== */

export function simdSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const scalar = param === 'scalar';
  const tensor = param === 'tensor';

  const width = scalar ? 1 : tensor ? 64 : 16;
  const lanesPerInstr = width;
  const flopsPerInstr = width * 2; // multiply + add fused

  const rounds = [
    {
      short: 'PACK',
      title: 'Values are gathered into one register',
      badge: scalar ? 'SCALAR' : tensor ? 'MMA TILE' : 'AVX-512',
      hw: scalar ? 'xmm register, 1 lane used' : tensor ? 'A 4×4×4 tensor tile' : 'zmm register, 512 bits',
      kch: scalar ? 'One pan' : tensor ? 'A block of pans lifted together' : 'Sixteen pans on one rack',
      cyc: scalar ? 1 : tensor ? 1 : 1,
    },
    {
      short: 'FMA',
      title: `a×b+c in one instruction across ${lanesPerInstr} lane${lanesPerInstr > 1 ? 's' : ''}`,
      badge: `${flopsPerInstr} FLOP / INSTRUCTION`,
      hw: scalar ? 'FMA unit, 1 lane' : tensor ? 'Tensor core, 64 MACs' : 'AVX-512 FMA, 16 lanes',
      kch: scalar ? 'One dish tossed' : tensor ? 'Sixty-four dishes tossed in one motion' : 'Sixteen dishes tossed in one motion',
      cyc: scalar ? 4 : tensor ? 1 : 4,
    },
    {
      short: 'ROUND',
      title: scalar ? 'One rounding step' : 'One rounding step for the whole vector — or none at all',
      badge: 'FUSED PRECISION',
      hw: 'Single rounding on the fused result',
      kch: 'The seasoning is added before the taste test, not after',
      cyc: 1,
    },
    {
      short: 'RESULT',
      title: `${lanesPerInstr} results per instruction`,
      badge: `${flopsPerInstr} FLOP`,
      hw: tensor ? `${RIG_GPU.tensorCores} tensor cores × 26 SM` : scalar ? '1 FLOP/instr' : '32 FLOP/cycle/core',
      kch: 'The pass fills at a completely different rate',
      cyc: scalar ? 4 : 1,
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: scalar || tensor ? ['core-0', 'alu', 'registers'] : ['core-0', 'alu', 'registers'],
    workers: scalar
      ? cpuCrew([
          { state: 'computing' as KitchenWorker['state'], task: 'One lane of sixteen in use', badge: '1/16', progress: 40 + i * 20 },
          { state: 'idle' as KitchenWorker['state'], task: 'Lane idle' },
          { state: 'idle' as KitchenWorker['state'], task: 'Lane idle' },
          { state: 'idle' as KitchenWorker['state'], task: 'Lane idle' },
        ])
      : tensor
        ? gpuCrew(
            Array.from({ length: 8 }).map(() => ({
              state: 'computing' as KitchenWorker['state'],
              task: 'Tensor core MMA 4×4×4',
              badge: '64',
              progress: 40 + i * 20,
            })),
          )
        : cpuCrew(
            Array.from({ length: 4 }).map((_, k) => ({
              state: 'computing' as KitchenWorker['state'],
              task: '16 fp32 lanes',
              badge: `${k * 16 + 16}`,
              progress: 40 + i * 20,
            })),
          ),
    storageHighlights: {
      registersText: scalar ? 'xmm0 (1 lane)' : tensor ? 'A/B accumulator fragments' : 'zmm0 / zmm1 / zmm2',
      l1Text: scalar ? '4 B loaded' : tensor ? 'tile staged in shared mem' : '64 B loaded per operand',
      ramText: 'streaming',
      vramText: tensor ? 'tiles resident in VRAM' : 'idle',
    },
    metrics: metrics({
      instructionsExecuted: 1,
      cpuUtilization: util([scalar ? 25 : 96]),
      gpuUtilization: util(tensor ? [96, 96, 96, 96, 96, 96, 96, 96] : [], 8),
      memoryAccesses: 2,
      bytesTransferred: scalar ? 8 : tensor ? 128 : 128,
      estimatedTimeNs: ns(r.cyc),
      stageCycles: { compute: r.cyc, memory: i === 0 ? 1 : 0, control: 0, stall: 0 },
      bottleneck: {
        title: scalar ? 'One lane active, fifteen dark' : tensor ? 'Tensor cores: 64 MACs per instruction' : '16 of 16 lanes active',
        severity: scalar ? 'high' : 'low',
        beginnerText: scalar
          ? 'The rack holds sixteen pans but only one is on the burner. That is what a scalar loop looks like next to AVX-512.'
          : tensor
            ? 'A dedicated machine rolls sixty-four dumplings in the time a chef rolls one — as long as the shapes match.'
            : 'Sixteen pans, one motion. The rack is the register, the motion is the instruction.',
        engineeringText: scalar
          ? 'Scalar ss operations occupy a single 32-bit lane of a 512-bit datapath. The other 15/16 of the FMA unit is wasted, which is exactly what auto-vectorisation recovers.'
          : tensor
            ? `MMA instructions on Blackwell operate on 4×4×4 fragments per tensor core. With ${RIG_GPU.tensorCores} tensor cores across ${RIG_GPU.smCount} SMs, the chip reaches ~572 TOPS INT8, versus 9.7 TFLOPS FP32 from the CUDA cores.`
            : 'vfmadd231ps on a zmm register computes 16 fp32 a×b+c with one rounding. The register file holds 32 such vectors, so an unrolled loop can have 512 values in flight per thread.',
      },
    }),
    specialVisual: {
      type: 'simd-lanes',
      simd: {
        width: scalar ? 16 : tensor ? 64 : 16,
        scalar,
        fma: true,
        lanes: Array.from({ length: scalar ? 16 : tensor ? 64 : 16 }).map((_, k) => ({
          label: `${k}`,
          value: +((k + 1) * 1.5).toFixed(1),
          state: scalar ? (k === 0 ? 'fma' : 'idle') : i === 3 ? 'done' : i >= 1 ? 'fma' : 'loaded',
        })),
      },
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: tensor ? 'tensor-cores' : 'alu',
      opcode: scalar ? 'vfmadd132ss xmm0, xmm1, xmm2' : tensor ? 'mma.sync.aligned.m16n8k8.f32.tf32.tf32.f32' : 'vfmadd231ps zmm0, zmm1, zmm2',
      inputData: `${width} pairs of fp32 operands`,
      operation: i === 1 ? 'Fused multiply-add: a×b+c, one rounding' : 'Gather, fuse, round, write',
      outputData: `${width} fp32 results`,
      memoryAccess: { tier: scalar ? 'Register' : 'L1 Cache', status: i === 0 ? 'STREAM' : 'HIT', address: 'aligned 64-B loads', latencyCycles: i === 0 ? MODEL.l1Cycles : 1 },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation:
        'FMA matters twice over: it halves instruction count, and it rounds once instead of twice, so the fused result is strictly more accurate than mul-then-add. AVX-512 makes that 16 operations wide; a tensor core does it 64 at a time on 4×4×4 fragments.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare widths',
    },
  }));
}

/* ================================================================== */
/*  EXP-19 · Atomics and locks                                         */
/* ================================================================== */

export function atomicsSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const race = param === 'race';
  const lock = param === 'lock';

  const threads = 32;
  const perOp = race ? 1 : lock ? 120 : 26;
  const total = race ? 1_000_000 : 1_000_000;
  const lost = race ? 517_412 : 0;

  const rounds = [
    {
      short: 'LOAD',
      title: 'Thirty-two threads read the same counter',
      badge: 'READ',
      hw: 'Shared counter line fetched into each L1',
      kch: 'Thirty-two cooks read the same tally sheet',
      state: 'computing' as KitchenWorker['state'],
      cyc: 1,
    },
    {
      short: race ? 'RACE' : lock ? 'ACQUIRE' : 'ATOMIC',
      title: race
        ? 'Each thread increments its private copy — updates are lost'
        : lock
          ? 'One thread takes the lock, thirty-one spin'
          : 'One cache line is locked for the read-modify-write',
      badge: race ? 'DATA RACE' : lock ? 'SPINLOCK' : 'LOCK XADD',
      hw: race ? 'No coherence guarantee between read and write' : lock ? 'Single owner, all others spinning' : 'Bus/cache lock on one line',
      kch: race ? 'Everyone writes their own total' : lock ? 'One chef holds the only pen' : 'The tally sheet is passed one at a time',
      state: race ? ('stalled' as KitchenWorker['state']) : ('computing' as KitchenWorker['state']),
      cyc: perOp,
    },
    {
      short: 'SERIALISE',
      title: race ? 'Nothing is serialised — so the answer is wrong' : `Writes serialise: ${threads} × ${perOp} cycles`,
      badge: race ? 'WRONG ANSWER' : `${perOp} CYCLES / OP`,
      hw: race ? 'Lost update window' : lock ? 'Critical section length × threads' : 'Cache line lock held per operation',
      kch: race ? 'The tally does not match the dishes' : 'A queue forms at the pen',
      state: race ? ('stalled' as KitchenWorker['state']) : ('stalled' as KitchenWorker['state']),
      cyc: perOp,
    },
    {
      short: 'RESULT',
      title: race
        ? `Counter reads ${(total - lost).toLocaleString('en-US')} instead of ${total.toLocaleString('en-US')}`
        : lock
          ? 'Correct, but the lock costs 4.6× the atomic'
          : 'Correct, at minimum coherent cost',
      badge: race ? `${lost.toLocaleString('en-US')} LOST` : lock ? 'CORRECT · SLOW' : 'CORRECT · FAST',
      hw: race ? 'Undefined behaviour, wrong result' : lock ? 'Correct with full serialisation' : 'Correct with per-op serialisation',
      kch: race ? 'You are serving phantom dishes' : 'Correct tally, longer queue',
      state: 'completed' as KitchenWorker['state'],
      cyc: perOp,
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: ['core-0', 'core-1', 'core-2', 'core-3', 'l1-cache', 'l3-cache', 'registers'],
    workers: cpuCrew(
      Array.from({ length: 4 }).map((_, k) => ({
        state: (race ? (i >= 2 ? 'stalled' : 'computing') : i >= 2 ? (lock ? 'stalled' : 'computing') : 'computing') as KitchenWorker['state'],
        task: race ? 'Incrementing a stale copy' : lock ? (i >= 2 ? (k === 0 ? 'inside critical section' : 'spinning') : 'waiting for lock') : 'atomic fetch-add',
        badge: race ? 'RACE' : lock ? (k === 0 && i >= 2 ? 'OWN' : 'SPIN') : 'LOCK',
        progress: i === 3 ? 100 : 30 + i * 20,
      })),
    ),
    storageHighlights: {
      registersText: 'counter value per core',
      l1Text: race ? 'stale copies diverge' : 'line owned exclusively while locked',
      ramText: 'counter resident',
      vramText: 'idle',
    },
    metrics: metrics({
      instructionsExecuted: total,
      cpuUtilization: util(race ? [100, 100, 100, 100] : lock ? [8, 8, 8, 8] : [34, 34, 34, 34]),
      cacheHits: 0,
      cacheMisses: race ? 0 : total * threads,
      memoryAccesses: total,
      bytesTransferred: total * 64,
      estimatedTimeNs: ns(perOp * threads),
      stageCycles: { compute: race ? 0 : 0, memory: perOp * threads, control: 1, stall: race ? 0 : perOp * threads },
      bottleneck: {
        title: race ? 'Data race — the result is simply wrong' : lock ? 'Lock serialises the whole critical section' : 'One line, one owner at a time',
        severity: race ? 'high' : lock ? 'high' : 'moderate',
        beginnerText: race
          ? 'Every cook copies the tally, adds one, and writes it back — overwriting everyone else. The kitchen is faster and the answer is nonsense.'
          : lock
            ? 'Only one chef may hold the pen, so every other chef waits in line for the entire calculation, not just the write.'
            : 'The tally sheet is passed hand to hand. Correct, and the queue is as short as it can be.',
        engineeringText: race
          ? `A non-atomic read-modify-write is three instructions; between the load and the store another core can write. With ${threads} threads racing, the model loses ${lost.toLocaleString('en-US')} increments — undefined behaviour in C++, a wrong number in practice.`
          : lock
            ? `A mutex pays for the critical section, not the increment: the section here is ${Math.round(perOp / 3)} cycles, so ${threads} threads cost ${(threads * perOp / 1e3).toFixed(1)}k cycles of pure queueing.`
            : `A lock-prefixed XADD on the Ryzen 9 takes exclusive ownership of the line (~${perOp} cycles) and serialises at the L3 slice. Contention scales badly: ${threads} threads on one counter is the worst case for any atomic.`,
      },
    }),
    specialVisual: {
      type: 'contention',
      contention: {
        banks: Array.from({ length: 8 }).map((_, k) => ({
          bank: k,
          accesses: k === 0 ? threads * (i + 1) : 0,
          conflict: k === 0,
          owners: k === 0 ? ['counter'] : [],
        })),
        serialized: threads * perOp,
        ideal: race ? 0 : perOp,
      },
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: i === 1 ? 'l3-cache' : 'l1-cache',
      opcode: race ? 'cnt++;                  // NOT atomic' : lock ? 'std::lock_guard g(m);  cnt++;' : 'std::atomic<int>::fetch_add(1)',
      inputData: `${threads} threads × 1,000,000 increments`,
      operation: i === 1 ? (race ? 'Load, add, store — with a window' : 'Acquire exclusive ownership') : 'Serialise writers',
      outputData: race ? `${(total - lost).toLocaleString('en-US')} (expected 1,000,000)` : (1_000_000).toLocaleString('en-US'),
      memoryAccess: { tier: 'L2 Cache', status: 'MISS', address: '&counter', latencyCycles: perOp },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation:
        'Synchronisation trades parallelism for certainty. The interesting engineering question is never "is it correct" in isolation, but "how much parallelism does correctness cost here" — atomics cost per-operation, locks cost per-critical-section, and the right choice flips as the section grows.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare strategies',
    },
  }));
}

/* ================================================================== */
/*  EXP-20 · Roofline analysis                                         */
/* ================================================================== */

export function rooflineSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const gemm = param === 'gemm';
  const stencil = param === 'stencil';

  // Reference rig: 9.7 TFLOPS fp32 GPU, 384 GB/s VRAM, 0.85 TFLOPS CPU AVX-512, 83.2 GB/s.
  const peakTf = RIG_GPU.fp32Tflops;
  const peakGbs = RIG_GPU.vramGbs;
  const ridge = +(peakTf * 1000 / peakGbs).toFixed(1); // FLOP/byte

  // Throughput is in GFLOPS: min(compute roof, AI × bandwidth roof).
  const peakGflops = peakTf * 1000;
  const achievable = (ai: number) => Math.min(peakGflops, ai * peakGbs);
  const kernels = [
    { label: 'vector add', ai: 0.083, gflops: +achievable(0.083).toFixed(0), tone: '#B65335' },
    { label: '3×3 stencil', ai: 4.5, gflops: +achievable(4.5).toFixed(0), tone: '#B69A63' },
    { label: 'tiled GEMM', ai: 64, gflops: +achievable(64).toFixed(0), tone: '#85865A' },
  ];
  const active = kernels[gemm ? 2 : stencil ? 1 : 0];

  const toXY = (ai: number, gf: number) => {
    const x = 22 + (Math.log10(ai) + 1.2) * 58; // log scale, 0.05 → 200
    const y = 190 - (Math.log10(gf) + 0.2) * 34; // log scale, 0.5 → 20 TFLOPS
    return { x: +x.toFixed(1), y: +y.toFixed(1) };
  };

  const rounds = [
    {
      short: 'INTENSITY',
      title: `Arithmetic intensity: ${active.ai} FLOP per byte`,
      badge: `${active.ai} FLOP/B`,
      hw: 'Counting operations and bytes for one kernel',
      kch: 'How much cooking per trip to the pantry',
      cyc: 1,
    },
    {
      short: 'ROOF',
      title: `The machine’s roof: ${peakTf} TFLOPS and ${peakGbs} GB/s`,
      badge: 'RIDGE ' + ridge,
      hw: `Ridge point at ${ridge} FLOP/byte`,
      kch: 'The height of the kitchen and the width of the door',
      cyc: 2,
    },
    {
      short: gemm ? 'COMPUTE' : 'BANDWIDTH',
      title: gemm
        ? 'GEMM sits on the flat roof — compute-bound'
        : stencil
          ? 'Stencil sits near the ridge — both matter'
          : 'Vector add sits on the slope — bandwidth-bound',
      badge: gemm ? 'COMPUTE-BOUND' : stencil ? 'NEAR RIDGE' : 'BANDWIDTH-BOUND',
      hw: gemm ? `${(active.gflops / 1000).toFixed(1)} of ${peakTf} TFLOPS achievable` : `${active.gflops} GFLOPS limited by ${peakGbs} GB/s`,
      kch: gemm ? 'The chefs are the limit, not the pantry' : 'The pantry door is the limit, not the chefs',
      cyc: 3,
    },
    {
      short: 'ACTION',
      title: gemm
        ? 'Improving verbs-per-second (tensor cores) raises the roof'
        : 'Improving memory (tiling, fusion, coalescing) is the only lever',
      badge: 'OPTIMISATION',
      hw: gemm ? 'Try tensor cores / FP16' : 'Reduce bytes per FLOP',
      kch: gemm ? 'Hire specialised machines' : 'Carry more per trip',
      cyc: 4,
    },
  ];

  return rounds.map((r, i) => ({
    cycle: i + 1,
    stageShort: r.short,
    activeComponents: gemm ? ['vram', 'sm-0', 'gpu-workers', 'tensor-cores'] : ['vram', 'sm-0', 'gpu-workers', 'shared-mem'],
    workers: gpuCrew(
      Array.from({ length: 8 }).map((_, k) => ({
        state: (gemm || i >= 2 ? 'computing' : i === 0 ? 'fetching' : 'computing') as KitchenWorker['state'],
        task: gemm ? 'fused multiply-add on tiles' : stencil ? 'halo loads from VRAM' : 'streaming loads',
        badge: gemm ? 'FMA' : 'LD',
        progress: 30 + i * 20 + k,
      })),
    ),
    storageHighlights: {
      registersText: gemm ? 'tile accumulators live here' : 'single values',
      l1Text: gemm ? 'tile staged in shared memory' : 'streaming',
      ramText: 'idle',
      vramText: `${peakGbs} GB/s ceiling · ${active.gflops} GFLOPS achieved`,
    },
    metrics: metrics({
      instructionsExecuted: 128,
      gpuUtilization: util(Array.from({ length: 8 }).map(() => (gemm ? 96 : 34)), 8),
      memoryAccesses: gemm ? 64 : 1024,
      bytesTransferred: gemm ? 4096 : 65536,
      estimatedTimeNs: ns(active.gflops > 0 ? 2000 / active.gflops : 2000),
      stageCycles: { compute: gemm ? 40 : 4, memory: gemm ? 2 : 48, control: 1, stall: 0 },
      bottleneck: {
        title: gemm ? 'Compute-bound — the roof is flat' : stencil ? 'Straddling the ridge' : 'Bandwidth-bound — the roof is a slope',
        severity: 'low',
        beginnerText: gemm
          ? 'With enough arithmetic per ingredient, the pantry stops mattering and the chefs become the limit.'
          : 'For every number loaded, only a handful of operations happen. The delivery door, not the cooking, sets the pace.',
        engineeringText: `Roofline: achievable = min(peak_FLOPs, AI × peak_bandwidth). With AI = ${active.ai} FLOP/byte and ${peakGbs} GB/s, the memory roof allows ${(active.ai * peakGbs).toFixed(0)} GFLOPS against a ${peakGflops} GFLOPS compute roof, so the kernel achieves ${active.gflops} GFLOPS. The ridge sits at ${ridge} FLOP/byte — this kernel is ${active.ai < ridge ? 'below' : 'above'} it.`,
      },
    }),
    specialVisual: {
      type: 'roofline',
      roofline: {
        ridge,
        peakTflops: peakTf,
        peakGbs,
        points: kernels.map((k) => {
          const { x, y } = toXY(k.ai, k.gflops);
          return { ...k, x, y, active: k.label === active.label };
        }),
      },
    },
    inspector: {
      stepTitle: r.title,
      phaseBadge: r.badge,
      componentHardware: r.hw,
      componentKitchen: r.kch,
      primaryComponentId: r.hw.includes('shared') ? 'shared-mem' : 'vram',
      opcode: gemm ? 'mma.m16n8k8 · 2 FLOP per MAC' : 'y[i] = a*x[i] + y[i]',
      inputData: `Kernel with AI ${active.ai} FLOP/byte`,
      operation: i === 1 ? 'Compare against bandwidth and compute roofs' : i === 2 ? 'Locate the kernel under the roof' : 'Identify the binding constraint',
      outputData: `${active.gflops} GFLOPS achievable`,
      memoryAccess: { tier: 'VRAM', status: 'STREAM', address: 'tiles / streams', latencyCycles: MODEL.vramCycles },
      beginnerExplanation: r.kch + '.',
      engineeringExplanation:
        'The roofline is a sanity check, not a benchmark: if a kernel lands far below the roof for its intensity, the gap is your optimisation budget. GEMM below the flat roof means poor tiling or occupancy; a stencil far below the slope means uncoalesced access adding bytes you never needed.',
      nextStepPreview: i < 3 ? rounds[i + 1].title : 'Compare kernels',
    },
  }));
}
