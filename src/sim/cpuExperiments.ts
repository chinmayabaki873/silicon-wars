import {
  CanonicalComponentId,
  KitchenWorker,
  PipelineSlot,
  SimulationStep,
  StepInspectorData,
} from '../types/simulation';
import { emptyMetrics, makeStep, metrics, resetStepCounter } from './core';

type StepInput = Partial<Omit<SimulationStep, 'inspector'>> & { inspector: StepInspectorData };

/** Small builder that keeps step definitions readable. */
function S(input: StepInput): SimulationStep {
  const { inspector, ...rest } = input;
  return makeStep({
    cycle: rest.cycle ?? 1,
    stageShort: rest.stageShort ?? 'FETCH',
    activeComponents: rest.activeComponents ?? [],
    workers: rest.workers ?? [],
    packets: rest.packets ?? [],
    storageHighlights: rest.storageHighlights ?? {
      registersText: 'R0–R15 · unchanged',
      l1Text: 'untouched',
      ramText: 'resident',
    },
    specialVisual: rest.specialVisual,
    metrics: rest.metrics ?? emptyMetrics(),
    inspector,
  });
}

const slot = (
  stage: PipelineSlot['stage'],
  kitchenStage: string,
  instruction: string,
  status: PipelineSlot['status'],
): PipelineSlot => ({ stage, kitchenStage: kitchenStage as PipelineSlot['kitchenStage'], instruction, status });

const chef = (
  id: CanonicalComponentId,
  label: string,
  state: KitchenWorker['state'],
  taskLabel: string,
  extra: Partial<KitchenWorker> = {},
): KitchenWorker => ({
  id,
  label,
  role: 'master-chef',
  componentId: id,
  state,
  taskLabel,
  progress: state === 'idle' ? 0 : state === 'completed' ? 100 : 62,
  ...extra,
});

/* ================================================================== */
/*  EXP-03 — CPU INSTRUCTION PIPELINE                                  */
/* ================================================================== */

export function pipelineSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const forward = param === 'forwarding-on';
  const hazardNote = forward ? 'forwarded' : 'stall';

  const slotRow = (cycle: number): PipelineSlot[] => {
    // A deterministic 5x9 pipeline diagram, computed from cycle number.
    const program = ['LDR R1,[R0]', 'ADD R2,R1,R3', 'MUL R4,R2,R5', 'STR [R6],R4', 'ADD R7,R8,R9'];
    const rows: PipelineSlot[] = [];
    const stages: PipelineSlot['stage'][] = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    const kitchen: PipelineSlot['kitchenStage'][] = ['Order', 'Prep', 'Sear', 'Pantry', 'Plate'];
    const offset = forward ? 0 : 2;
    for (let instr = 0; instr < program.length; instr++) {
      // Which stage is this instruction in at `cycle`?
      let stageIdx = cycle - 1 - instr - (instr >= 2 ? offset : 0);
      const stage = stages[Math.max(0, Math.min(5, stageIdx))];
      const inRange = stageIdx >= 0 && stageIdx < 5;
      const dependentStall = !forward && stageIdx >= 2 && stageIdx <= 2 && instr >= 1 && instr <= 2;
      rows.push({
        stage,
        kitchenStage: kitchen[Math.max(0, Math.min(4, stageIdx))],
        instruction: program[instr],
        status: !inRange ? 'empty' : dependentStall ? 'stall' : instr > 0 && instr < 3 && stageIdx === 2 ? hazardNote : 'active',
      });
    }
    return rows;
  };

  return [
    S({
      cycle: 1,
      stageShort: 'IF',
      activeComponents: ['scheduler', 'pipeline', 'l1-cache'],
      workers: [
        chef('core-0', 'Master Chef 01', 'fetching', 'Reading order ticket I1 from the pass', { progress: 30 }),
        chef('core-1', 'Master Chef 02', 'idle', 'No order assigned'),
        chef('core-2', 'Master Chef 03', 'idle', 'No order assigned'),
        chef('core-3', 'Master Chef 04', 'idle', 'No order assigned'),
      ],
      storageHighlights: {
        registersText: 'PC → 0x0040 · IF/ID latch empty',
        l1Text: 'I1 line present · 1 hit',
        ramText: 'Program text resident',
      },
      specialVisual: { type: 'pipeline', pipelineSlots: slotRow(1) },
      metrics: metrics({ instructionsExecuted: 0, cacheHits: 1, stageCycles: { compute: 0, memory: 1, control: 1, stall: 0 }, estimatedTimeNs: 0.3 }),
      inspector: {
        stepTitle: 'Fetch — Order ticket enters the line',
        phaseBadge: 'STAGE 1 / 5',
        componentHardware: 'Instruction Fetch Unit + L1i Cache',
        componentKitchen: 'Order window at the expediter pass',
        primaryComponentId: 'pipeline',
        opcode: '0x8B 0x08 — LDR R1, [R0]',
        inputData: 'Program counter = 0x0040',
        operation: 'Fetch 4-byte instruction word from L1 instruction cache',
        outputData: 'I1 latched into IF/ID pipeline register',
        memoryAccess: { tier: 'L1 Cache', status: 'HIT', address: '0x0040 (I-cache line)', latencyCycles: 4 },
        beginnerExplanation:
          'The expediter reads the first order ticket and pins it to the pass. Nothing is cooked yet — we just know what dish is next.',
        engineeringExplanation:
          'The frontend reads the instruction pointed to by the program counter. A hit in the L1 instruction cache avoids a fetch from the unified L2, and the 32-bit word is latched into the IF/ID pipeline register on this clock edge.',
        nextStepPreview: 'Decode the opcode and read the source register R0',
      },
    }),
    S({
      cycle: 2,
      stageShort: 'ID',
      activeComponents: ['scheduler', 'pipeline', 'registers', 'l1-cache'],
      workers: [
        chef('core-0', 'Master Chef 01', 'fetching', 'Decoding I1 — which tools, which board?', { progress: 48 }),
        chef('core-1', 'Master Chef 02', 'idle', 'Standing by'),
        chef('core-2', 'Master Chef 03', 'idle', 'Standing by'),
        chef('core-3', 'Master Chef 04', 'idle', 'Standing by'),
      ],
      storageHighlights: {
        registersText: 'R0 = 0x2000 read port active',
        l1Text: 'I2 prefetched speculatively',
        ramText: 'Resident',
      },
      specialVisual: { type: 'pipeline', pipelineSlots: slotRow(2) },
      metrics: metrics({ instructionsExecuted: 0, cacheHits: 2, stageCycles: { compute: 0, memory: 2, control: 2, stall: 0 }, estimatedTimeNs: 0.6 }),
      inspector: {
        stepTitle: 'Decode — Recipe broken into tool moves',
        phaseBadge: 'STAGE 2 / 5',
        componentHardware: 'Instruction Decoder + Register File read ports',
        componentKitchen: 'Chef reads the ticket and reaches for the board',
        primaryComponentId: 'scheduler',
        opcode: 'uOps: LOAD_QWORD · dst=R1 · base=R0',
        inputData: 'Instruction word from IF/ID latch',
        operation: 'Decode fields, rename registers, read R0 operand',
        outputData: 'R0 = 0x2000 forwarded to ID/EX latch',
        memoryAccess: { tier: 'Register', status: 'INTERNAL', address: 'R0', latencyCycles: 1 },
        beginnerExplanation:
          'The chef reads "fetch truffles" and grabs the numbered shelf ticket (R0). Now the kitchen knows exactly which shelf in the pantry to walk to.',
        engineeringExplanation:
          'The decoder splits the x86 / ARM word into micro-ops. Architectural R0 is renamed to a physical register to eliminate false dependencies, and the operand value is read into the ID/EX pipeline register.',
        nextStepPreview: 'Compute the effective address 0x2000 in the AGU',
      },
    }),
    S({
      cycle: 3,
      stageShort: 'EX',
      activeComponents: ['core-0', 'alu', 'pipeline', 'registers'],
      workers: [
        chef('core-0', 'Master Chef 01', 'computing', 'Calculating pantry aisle address', { progress: 66 }),
        chef('core-1', 'Master Chef 02', 'fetching', 'Beginning ticket I2', { progress: 24 }),
        chef('core-2', 'Master Chef 03', 'idle', 'Standing by'),
        chef('core-3', 'Master Chef 04', 'idle', 'Standing by'),
      ],
      storageHighlights: {
        registersText: 'MAR ← 0x2000',
        l1Text: 'I3 being prefetched',
        ramText: 'Pending access to 0x2000',
      },
      specialVisual: { type: 'pipeline', pipelineSlots: slotRow(3) },
      metrics: metrics({ instructionsExecuted: 1, cacheHits: 3, memoryAccesses: 1, stageCycles: { compute: 1, memory: 2, control: 2, stall: 0 }, estimatedTimeNs: 0.9 }),
      inspector: {
        stepTitle: 'Execute — Chef walks to the pantry shelf',
        phaseBadge: 'STAGE 3 / 5',
        componentHardware: 'ALU / Address Generation Unit',
        componentKitchen: 'Chef crosses the aisle toward the shelf',
        primaryComponentId: 'alu',
        opcode: 'LEA MAR ← R0 + 0',
        inputData: 'R0 = 0x2000',
        operation: 'Effective address generation only — no arithmetic',
        outputData: 'MAR = 0x2000',
        memoryAccess: { tier: 'None', status: 'INTERNAL', address: '0x2000 (pending)', latencyCycles: 1 },
        beginnerExplanation:
          'The chef does not cook yet: they simply walk to shelf number 0x2000. Meanwhile a second chef starts reading ticket I2 — two dishes in motion at once.',
        engineeringExplanation:
          'The AGU adds the base register and displacement to form the memory address. Because this is a load, EX produces no data result; the pipeline is now waiting on the memory subsystem.',
        nextStepPreview: 'L1 lookup at 0x2000 — hit or walk to DRAM?',
      },
    }),
    S({
      cycle: 4,
      stageShort: 'MEM',
      activeComponents: ['core-0', 'l1-cache', 'ram', 'pipeline'],
      workers: [
        chef('core-0', 'Master Chef 01', 'stalled', 'Cardamom missing from the L1 rack — walking to RAM', { progress: 40 }),
        chef('core-1', 'Master Chef 02', 'computing', 'Sealing I2 — needs R1', { progress: 55 }),
        chef('core-2', 'Master Chef 03', 'fetching', 'Reading ticket I3', { progress: 20 }),
        chef('core-3', 'Master Chef 04', 'idle', 'Standing by'),
      ],
      packets: [
        { id: 'p1', from: 'l1-cache', to: 'ram', label: 'MISS 0x2000', kind: 'cache-miss' },
        { id: 'p2', from: 'ram', to: 'l1-cache', label: '64B line', kind: 'data' },
      ],
      storageHighlights: {
        registersText: 'R1 ← incoming (pending)',
        l1Text: '0x2000 MISS · line fill in flight',
        ramText: 'DRAM row active @ 0x2000',
      },
      specialVisual: { type: 'pipeline', pipelineSlots: slotRow(4) },
      metrics: metrics({
        instructionsExecuted: 2,
        cacheHits: 3,
        cacheMisses: 1,
        memoryAccesses: 2,
        bytesTransferred: 64,
        stageCycles: { compute: 1, memory: 3, control: 3, stall: 1 },
        estimatedTimeNs: 65,
        bottleneck: {
          title: 'L1 miss → DRAM latency',
          severity: 'high',
          beginnerText:
            'The cardamom was not on the counter shelf, so the chef must walk to the basement pantry. Everyone who needs that ingredient waits.',
          engineeringText:
            'Load at 0x2000 missed L1d, triggering a 64-byte line fill from DDR5. Load-to-use latency expands from 4 cycles to ~200 cycles, blocking dependent instructions 2 and 3.',
      },
      }),
      inspector: {
        stepTitle: 'Memory — The spice rack misses, pantry trip begins',
        phaseBadge: 'STAGE 4 / 5',
        componentHardware: 'Load/Store Unit → L1d → Memory Controller',
        componentKitchen: 'Empty shelf → basement walk-in',
        primaryComponentId: 'l1-cache',
        opcode: 'LDG.64 R1, [0x2000]',
        inputData: 'MAR = 0x2000',
        operation: 'L1 tag compare → miss → line fill request to DRAM',
        outputData: '64-byte cache line in flight',
        memoryAccess: { tier: 'System RAM', status: 'MISS', address: '0x2000', latencyCycles: 200 },
        beginnerExplanation:
          'The shelf above the stove is empty. The chef sends a runner to the basement pantry and the whole station pauses — this trip costs roughly 50 times more time than grabbing from the rack.',
        engineeringExplanation:
          forward
            ? 'The tag check missed. A line fill request enters the miss-status holding registers (MSHRs). When the 64-byte line returns, it lands in L1 and forwards to the pipeline; the following dependent instruction resolves via the register forwarding path rather than waiting for writeback.'
            : 'The tag check missed. Because operand forwarding is disabled in this configuration, dependent instructions must wait for the load result to complete writeback before they can even read their source register — inserting two visible bubbles into the pipeline.',
        nextStepPreview: forward ? 'Forward the loaded value directly into the next EX' : 'Insert pipeline bubbles until writeback',
      },
    }),
    S({
      cycle: forward ? 5 : 7,
      stageShort: forward ? 'WB' : 'STALL',
      activeComponents: forward ? ['core-0', 'registers', 'pipeline', 'alu'] : ['pipeline', 'core-0', 'registers'],
      workers: [
        chef('core-0', 'Master Chef 01', 'computing', forward ? 'Truffles on board — adding R1+R3' : 'Waiting on pantry delivery', {
          progress: forward ? 78 : 52,
        }),
        chef('core-1', 'Master Chef 02', 'completed', 'Dish I2 plated', { progress: 100 }),
        chef('core-2', 'Master Chef 03', 'computing', 'Cooking I3 on the range', { progress: 60 }),
        chef('core-3', 'Master Chef 04', 'fetching', 'Reading I4', { progress: 18 }),
      ],
      packets: forward
        ? [{ id: 'p3', from: 'l1-cache', to: 'registers', label: 'R1 = 0x2A', kind: 'result' }]
        : [{ id: 'p4', from: 'ram', to: 'l1-cache', label: '64B line', kind: 'data' }],
      storageHighlights: {
        registersText: forward ? 'R1 ← 0x2A written' : 'R1 still pending',
        l1Text: '0x2000 resident · later hits',
        ramText: 'Idle · row closed',
      },
      specialVisual: { type: 'pipeline', pipelineSlots: slotRow(forward ? 5 : 7) },
      metrics: metrics({
        instructionsExecuted: forward ? 3 : 2,
        cacheHits: forward ? 5 : 3,
        cacheMisses: 1,
        memoryAccesses: 3,
        bytesTransferred: forward ? 128 : 64,
        stageCycles: { compute: forward ? 3 : 1, memory: 3, control: 3, stall: forward ? 1 : 3 },
        estimatedTimeNs: forward ? 66 : 69,
        bottleneck: {
          title: forward ? 'Throughput restored (IPC ≈ 0.6)' : 'Pipeline bubbles from RAW stall',
          severity: forward ? 'moderate' : 'high',
          beginnerText: forward
            ? 'A second chef is now plating while the first keeps cooking. Nothing sits idle for long.'
            : 'Two stations stand still because the sauce is not ready. The kitchen is fully staffed but half frozen.',
          engineeringText: forward
            ? 'The bypass network routes the load result from MEM/WB into the EX inputs of the consumer, keeping the pipeline full. Steady-state throughput approaches one instruction per cycle.'
            : 'Without bypassing, three interlock stalls are inserted (`NOP` bubbles). Instruction-level parallelism is lost even though the datapath is idle, degrading IPC.',
      },
      }),
      inspector: {
        stepTitle: forward ? 'Writeback & forward — hot pan passed by hand' : 'Stall — two empty stations',
        phaseBadge: forward ? 'STAGE 5 / 5' : 'HAZARD',
        componentHardware: forward ? 'Register Writeback + Forwarding Network' : 'Hazard Interlock Unit',
        componentKitchen: forward ? 'Dish plated, second chef already cooking' : 'Expediter holds all tickets',
        primaryComponentId: 'registers',
        opcode: forward ? 'WB R1 ← 0x2A · bypass R1 → EX2' : 'STALL × 3 (bubble insert)',
        inputData: forward ? 'Loaded value from MEM/WB latch' : 'Dependent op waiting on R1',
        operation: forward ? 'Write architectural register and forward to waiting consumer' : 'Freeze fetch and issue, hold ID/EX state',
        outputData: forward ? 'R1 = 0x2A · ADD proceeds without stall' : 'Three `NOP` cycles injected',
        memoryAccess: { tier: 'Register', status: 'INTERNAL', address: 'R1', latencyCycles: 1 },
        beginnerExplanation: forward
          ? 'Instead of waiting for the plate to be formally announced, the chef simply hands the hot pan sideways to the next station. Five dishes finished in nine beats instead of fifteen.'
          : 'The head chef refuses to start order #3 until order #2 is fully plated. Each pause leaves a station empty — visible as a gap in the line.',
        engineeringExplanation: forward
          ? 'The data forwarding (bypass) path is the single most important throughput trick in modern pipelines: the result is available at the end of MEM, so a MEM→EX bypass avoids two interlock cycles entirely.'
          : 'A RAW hazard requires the consumer to read a register the producer has not yet written. With forwarding disabled the scoreboard stalls the ID stage, inserting bubbles that reduce IPC proportionally to dependency distance.',
        nextStepPreview: 'Continue overlapping tickets I4 and I5 at one instruction per cycle',
      },
    }),
    S({
      cycle: forward ? 9 : 15,
      stageShort: 'RETIRE',
      activeComponents: ['core-0', 'core-1', 'core-2', 'core-3', 'pipeline'],
      workers: [
        chef('core-0', 'Master Chef 01', 'completed', 'All five tickets plated', { progress: 100 }),
        chef('core-1', 'Master Chef 02', 'completed', 'Dish I2 plated', { progress: 100 }),
        chef('core-2', 'Master Chef 03', 'completed', 'Dish I3 plated', { progress: 100 }),
        chef('core-3', 'Master Chef 04', 'completed', 'Dish I4 plated', { progress: 100 }),
      ],
      storageHighlights: {
        registersText: forward ? 'R1..R9 committed · ROB empty' : 'R1..R9 committed after 15 cycles',
        l1Text: 'hot lines for next pass',
        ramText: 'Stable',
      },
      specialVisual: { type: 'pipeline', pipelineSlots: slotRow(forward ? 9 : 15) },
      metrics: metrics({
        instructionsExecuted: 5,
        cacheHits: forward ? 7 : 5,
        cacheMisses: 1,
        memoryAccesses: 4,
        bytesTransferred: 192,
        stageCycles: { compute: 5, memory: 4, control: 3, stall: forward ? 1 : 4 },
        estimatedTimeNs: forward ? 6.4 : 14.2,
        bottleneck: {
          title: forward ? 'Balanced — limited by the single load miss' : 'Dominated by interlock stalls',
          severity: forward ? 'low' : 'high',
          beginnerText: forward
            ? 'Nine beats for five dishes. Only the pantry trip was unavoidable.'
            : 'Fifteen beats for five dishes: the kitchen spent four of them simply waiting.',
          engineeringText: forward
            ? 'Total = 5 instructions + 5 stage depth − 1 + 1 miss penalty overlap ≈ 9 cycles. IPC ≈ 0.56, bounded by the compulsory DRAM miss, not by the pipeline.'
            : 'Each dependency inserted two bubbles, adding 6 cycles of pure idleness. IPC drops to ≈ 0.33 despite identical work — the classic argument for forwarding and OoO issue.',
        },
      }),
      inspector: {
        stepTitle: forward ? 'Retire — Clean, overlapped kitchen' : 'Retire — Late but finished',
        phaseBadge: 'COMPLETE',
        componentHardware: 'Reorder Buffer commit + retirement',
        componentKitchen: 'Pass cleared, tickets closed',
        primaryComponentId: 'pipeline',
        opcode: 'RETIRE × 5 in order',
        inputData: forward ? '9 cycles elapsed' : '15 cycles elapsed',
        operation: 'In-order architectural commit of all five results',
        outputData: forward ? 'IPC ≈ 0.56 · 0 bubbles of 9' : 'IPC ≈ 0.33 · 6 bubbles of 15',
        memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
        beginnerExplanation: forward
          ? 'Five dishes, nine heartbeats. Every station was doing something useful almost the entire time.'
          : 'Same five dishes, but fifteen heartbeats. Half the kitchen stood waiting for sauce that was already on its way.',
        engineeringExplanation:
          'Retirement happens in program order even though execution may complete out of order. Comparing the two configurations isolates the exact throughput value of bypassing: 57% fewer cycles for identical work.',
        nextStepPreview: 'Reset and try the other hazard configuration',
      },
    }),
  ];
}

/* ================================================================== */
/*  EXP-04 — CPU SCHEDULING                                            */
/* ================================================================== */

export function schedulingSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const ooo = param === 'out-of-order';

  const queue = (active: number[], done: number[]) => {
    const labels = ['I1 LDR truffles', 'I2 ADD (needs I1)', 'I3 CHOP onions', 'I4 SEASON broth', 'I5 PLATE'];
    return labels.map((l, i) =>
      slot('ID', 'Prep', l, done.includes(i) ? 'forwarded' : active.includes(i) ? 'active' : i === 0 ? 'stall' : 'empty'),
    );
  };

  const baseCrew = (over: Partial<Record<number, Partial<KitchenWorker>>>): KitchenWorker[] => {
    const defs: KitchenWorker[] = [
      chef('core-0', 'Master Chef 01', 'idle', 'Standing by'),
      chef('core-1', 'Master Chef 02', 'idle', 'Standing by'),
      chef('core-2', 'Master Chef 03', 'idle', 'Standing by'),
      chef('core-3', 'Master Chef 04', 'idle', 'Standing by'),
    ];
    return defs.map((d, i) => ({ ...d, ...over[i] }));
  };

  return [
    S({
      cycle: 1,
      stageShort: 'ISSUE',
      activeComponents: ['scheduler', 'core-0'],
      workers: baseCrew({ 0: { state: 'fetching', taskLabel: 'Reading I1: fetch truffles from pantry', progress: 20 } }),
      storageHighlights: { registersText: 'Issue queue: 5 entries', l1Text: 'I1 line cached', ramText: '0x4000 requested' },
      specialVisual: { type: 'race-bars', pipelineSlots: queue([0], []) },
      metrics: metrics({ instructionsExecuted: 0, memoryAccesses: 1, stageCycles: { compute: 0, memory: 1, control: 1, stall: 0 }, estimatedTimeNs: 0.3 }),
      inspector: {
        stepTitle: 'Issue — Head chef reads the whole ticket rail',
        phaseBadge: 'ISSUE WINDOW',
        componentHardware: 'Frontend + Reservation Station dispatch',
        componentKitchen: 'Expediter reviews five tickets at once',
        primaryComponentId: 'scheduler',
        opcode: 'DISPATCH I1 → RS[0]',
        inputData: 'Instruction stream I1..I5',
        operation: 'Allocate reservation stations; mark operand readiness',
        outputData: 'I1 ready · I2 waits on R1 · I3–I5 independent',
        memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
        beginnerExplanation:
          'A good head chef looks at every ticket on the rail, not just the top one, and notices which dishes could start right now.',
        engineeringExplanation:
          'The dispatch stage allocates reorder-buffer and reservation-station entries. Each entry records which source registers are ready; the wakeup/select logic will issue an entry the cycle its operands become valid.',
        nextStepPreview: ooo ? 'Issue independent orders while I1 waits on memory' : 'Wait for I1 to complete first',
      },
    }),
    S({
      cycle: 2,
      stageShort: 'LOAD',
      activeComponents: ['core-0', 'l1-cache', 'ram'],
      workers: baseCrew({
        0: { state: 'stalled', taskLabel: 'Truffles missing — walking to RAM pantry', progress: 35 },
        1: ooo ? { state: 'computing', taskLabel: 'I3 CHOP onions (independent)', progress: 30 } : { state: 'idle', taskLabel: 'Held: waiting behind I1' },
      }),
      packets: [{ id: 's1', from: 'l1-cache', to: 'ram', label: 'MISS', kind: 'cache-miss' }],
      storageHighlights: { registersText: 'I2 blocked on R1', l1Text: 'MISS @ 0x4000', ramText: 'Row open · 200 cyc' },
      specialVisual: { type: 'race-bars', pipelineSlots: queue(ooo ? [1] : [], []) },
      metrics: metrics({
        instructionsExecuted: ooo ? 1 : 0,
        cacheMisses: 1,
        memoryAccesses: 2,
        stageCycles: { compute: ooo ? 1 : 0, memory: 2, control: 2, stall: 1 },
        estimatedTimeNs: 65,
        bottleneck: {
          title: 'Long-latency DRAM load',
          severity: 'high',
          beginnerText: 'The truffle order is stuck in the basement. The question is whether the other chefs stand around or start something else.',
          engineeringText: 'A load with ~200-cycle latency creates a dependency chain for I2; independent instructions are available in the window.',
        },
      }),
      inspector: {
        stepTitle: 'Long-latency load enters the memory system',
        phaseBadge: 'MEMORY WAIT',
        componentHardware: 'Load/Store unit → MSHR → Memory Controller',
        componentKitchen: 'Pantry runner dispatched, station on hold',
        primaryComponentId: 'ram',
        opcode: 'LDG R1, [0x4000]',
        inputData: 'Address 0x4000',
        operation: 'Line fill request; load marked not-ready',
        outputData: 'I2 scoreboard dependency = R1 (pending)',
        memoryAccess: { tier: 'System RAM', status: 'MISS', address: '0x4000', latencyCycles: 200 },
        beginnerExplanation:
          'One order now needs a long pantry trip. Everything else depends on what happens next: idle chefs, or busy chefs?',
        engineeringExplanation:
          'The load misses L1 and allocates an MSHR entry. Its destination register R1 is marked busy in the scoreboard, so any instruction reading R1 stays in the reservation station.',
        nextStepPreview: ooo ? 'Issue I3 and I4 to idle execution ports' : 'Freeze the issue queue',
      },
    }),
    S({
      cycle: ooo ? 3 : 8,
      stageShort: ooo ? 'OOO ISSUE' : 'STALL',
      activeComponents: ooo ? ['core-1', 'core-2', 'alu', 'scheduler'] : ['core-0', 'pipeline', 'scheduler'],
      workers: ooo
        ? baseCrew({
            0: { state: 'stalled', taskLabel: 'Still waiting on truffle delivery', progress: 55 },
            1: { state: 'computing', taskLabel: 'I3 CHOP complete → I4 SEASON', progress: 70 },
            2: { state: 'computing', taskLabel: 'I5 PLATE garnish', progress: 45 },
            3: { state: 'idle', taskLabel: 'Station empty — no ticket' },
          })
        : baseCrew({
            0: { state: 'stalled', taskLabel: 'Waiting on pantry delivery', progress: 60 },
            1: { state: 'idle', taskLabel: 'BLOCKED — cannot issue I3' },
            2: { state: 'idle', taskLabel: 'BLOCKED — cannot issue I4' },
            3: { state: 'idle', taskLabel: 'BLOCKED — cannot issue I5' },
          }),
      storageHighlights: ooo
        ? { registersText: '3 results ready to commit out of order', l1Text: 'hot for I3', ramText: 'fill in flight' }
        : { registersText: 'Issue queue frozen (in-order)', l1Text: 'idle', ramText: 'fill in flight' },
      specialVisual: { type: 'race-bars', pipelineSlots: ooo ? queue([1, 2], []) : queue([], []) },
      metrics: metrics({
        instructionsExecuted: ooo ? 3 : 0,
        cacheHits: ooo ? 2 : 0,
        cacheMisses: 1,
        memoryAccesses: ooo ? 4 : 2,
        bytesTransferred: ooo ? 192 : 64,
        stageCycles: { compute: ooo ? 3 : 0, memory: 2, control: 2, stall: ooo ? 1 : 6 },
        estimatedTimeNs: ooo ? 68 : 210,
        bottleneck: {
          title: ooo ? 'Latency hidden by independent work' : 'In-order issue serialization',
          severity: ooo ? 'moderate' : 'high',
          beginnerText: ooo
            ? 'Three chefs are cooking while one waits for the pantry. Nothing is wasted.'
            : 'The head chef refuses to skip down the rail. Three perfectly cookable dishes sit untouched while one chef waits.',
          engineeringText: ooo
            ? 'Out-of-order issue exploits the instruction window: 3 of 4 dependent-distance-independent u-ops execute during the load shadow, achieving IPC > 1.'
            : 'Strict in-order issue means the head-of-line blocking load prevents all younger instructions from issuing, collapsing IPC to the inverse of memory latency.',
        },
      }),
      inspector: {
        stepTitle: ooo ? 'Out-of-order issue — Chefs kept busy' : 'Head-of-line block — Kitchen frozen',
        phaseBadge: ooo ? 'DYNAMIC DISPATCH' : 'IN-ORDER BLOCK',
        componentHardware: ooo ? 'Reservation stations + multiple ALU ports' : 'In-order issue queue (FIFO)',
        componentKitchen: ooo ? 'Expediter reassigns staffed stations' : 'Whole rail waits behind ticket #1',
        primaryComponentId: ooo ? 'alu' : 'scheduler',
        opcode: ooo ? 'ISSUE I3,I4,I5 on ports 0–2' : 'STALL (head-of-line)',
        inputData: ooo ? '3 ready reservation-station entries' : 'I2 not ready',
        operation: ooo ? 'Select ready entries, rename, read operands, launch' : 'Hold issue until oldest entry ready',
        outputData: ooo ? '3 u-ops in flight' : '0 u-ops issued',
        memoryAccess: { tier: 'None', status: 'INTERNAL', address: '—', latencyCycles: 0 },
        beginnerExplanation: ooo
          ? 'Rather than staring at the pantry door, the expediter fires off the next three dishes whose ingredients are already prepped.'
          : 'The tickets are clipped in strict order. Even though dishes 3, 4 and 5 could be cooked with what is already on the counter, nobody may touch them.',
        engineeringExplanation: ooo
          ? 'Tomasulo-style dynamic scheduling decouples dispatch order from execution order. Independent u-ops issue to free ports while the load is outstanding; only the consumer of R1 remains blocked.'
          : 'In-order architectures cannot issue past a stalled instruction. Memory latency therefore propagates directly into the critical path — which is exactly the motivation for OoO execution windows.',
        nextStepPreview: ooo ? 'Truffles arrive; commit all five in program order' : 'Truffles finally arrive; the queue drains slowly',
      },
    }),
    S({
      cycle: ooo ? 4 : 12,
      stageShort: 'RETIRE',
      activeComponents: ['core-0', 'core-1', 'core-2', 'core-3', 'registers'],
      workers: baseCrew({
        0: { state: 'completed', taskLabel: 'I1 landed → I2 ADD complete', progress: 100 },
        1: { state: 'completed', taskLabel: 'I3 plated', progress: 100 },
        2: { state: 'completed', taskLabel: 'I4 plated', progress: 100 },
        3: { state: ooo ? 'completed' : 'computing', taskLabel: ooo ? 'I5 plated' : 'I5 finally starts', progress: ooo ? 100 : 55 },
      }),
      storageHighlights: { registersText: 'ROB commits I1..I5 in order', l1Text: 'truffle line resident', ramText: 'row closed' },
      specialVisual: { type: 'race-bars', pipelineSlots: queue([], [0, 1, 2, 3, 4]) },
      metrics: metrics({
        instructionsExecuted: ooo ? 5 : 5,
        cacheHits: ooo ? 4 : 1,
        cacheMisses: 1,
        memoryAccesses: ooo ? 6 : 3,
        bytesTransferred: 256,
        stageCycles: { compute: ooo ? 5 : 3, memory: 3, control: 2, stall: ooo ? 1 : 8 },
        estimatedTimeNs: ooo ? 4.1 : 11.8,
        bottleneck: {
          title: ooo ? 'Balanced · memory-bound' : 'Memory latency fully exposed',
          severity: ooo ? 'low' : 'high',
          beginnerText: ooo
            ? 'Four beats for five dishes, with only one unavoidable wait. The kitchen felt busy the whole time.'
            : 'Twelve beats for the same five dishes. Most of that time three chefs did absolutely nothing.',
          engineeringText: ooo
            ? 'With OoO issue the 200-cycle miss is overlapped with 3 independent u-ops; effective IPC ≈ 1.2 and the workload is cleanly memory-bound, not frontend-bound.'
            : 'In-order issue exposes the full miss latency: IPC ≈ 0.42. The same silicon achieves 3× lower throughput purely because of the issue policy.',
        },
      }),
      inspector: {
        stepTitle: ooo ? 'In-order commit — Out-of-order execution' : 'Queue finally drains',
        phaseBadge: 'COMPLETE',
        componentHardware: 'Reorder buffer retirement',
        componentKitchen: 'Pass cleared',
        primaryComponentId: 'registers',
        opcode: 'RETIRE × 5',
        inputData: ooo ? '4 cycles elapsed' : '12 cycles elapsed',
        operation: 'Commit results in program order, free ROB entries',
        outputData: ooo ? 'IPC ≈ 1.2' : 'IPC ≈ 0.42',
        memoryAccess: { tier: 'Register', status: 'HIT', address: 'R1–R9', latencyCycles: 1 },
        beginnerExplanation: ooo
          ? 'Dishes leave the pass in the order the tickets were written, even though they were cooked in whatever order was fastest. The guest never notices.'
          : 'Everything finishes, but the guest waited three times longer. Same ingredients, same cooks, worse choreography.',
        engineeringExplanation:
          'Execution order is free; architectural state must stay ordered. The ROB buffers speculative results and commits in program order, which is what makes aggressive OoO execution safe and invisible to software.',
        nextStepPreview: 'Try the other scheduler policy to compare IPC',
      },
    }),
  ];
}

/* ================================================================== */
/*  EXP-05 — CACHE VS RAM                                              */
/* ================================================================== */

export function cacheSteps(param: string): SimulationStep[] {
  resetStepCounter();
  const sequential = param === 'sequential';
  const lineAddresses = sequential ? ['0x1000', '0x1004', '0x1008', '0x100C'] : ['0x1000', '0x7C40', '0x2E90', '0x9A20'];
  const hits = sequential ? [false, true, true, true] : [false, false, false, false];

  const cells = (i: number) =>
    Array.from({ length: 8 }).map((_, k) => ({
      row: 0,
      col: k,
      value: `a${k}`,
      status: (k < i ? 'done' : k === i ? 'active' : 'pending') as 'done' | 'active' | 'pending',
    }));

  const build = (
    idx: number,
    label: string,
    status: 'MISS' | 'HIT',
    cycles: number,
    cumHits: number,
    cumMisses: number,
    extra: { inspector: StepInspectorData; specialVisual?: SimulationStep['specialVisual'] },
  ): SimulationStep =>
    S({
      cycle: idx + 1,
      stageShort: status,
      activeComponents: status === 'MISS' ? ['core-0', 'l1-cache', 'ram', 'alu'] : ['core-0', 'l1-cache', 'alu', 'registers'],
      workers: [
        chef('core-0', 'Master Chef 01', status === 'MISS' ? 'stalled' : 'computing', `${status === 'MISS' ? 'Down to pantry for' : 'Grab from rack:'} ${label}`, {
          progress: ((idx + 1) / 8) * 100,
        }),
        chef('core-1', 'Master Chef 02', 'idle', 'Standing by'),
        chef('core-2', 'Master Chef 03', 'idle', 'Standing by'),
        chef('core-3', 'Master Chef 04', 'idle', 'Standing by'),
      ],
      packets:
        status === 'MISS'
          ? [
              { id: `m${idx}`, from: 'l1-cache', to: 'ram', label: `${lineAddresses[idx % 4]} MISS`, kind: 'cache-miss' },
              { id: `f${idx}`, from: 'ram', to: 'l1-cache', label: '64B fill', kind: 'data' },
            ]
          : [{ id: `h${idx}`, from: 'l1-cache', to: 'registers', label: `${label} HIT`, kind: 'data' }],
      storageHighlights: {
        registersText: `R1 ← a${idx} = ${(idx * 7 + 13) % 97}`,
        l1Text: sequential
          ? idx === 0
            ? 'cold · refilling 0x1000–0x103C'
            : 'line 0x1000 resident (4 items)'
          : 'thrashed · every line evicted',
        ramText: status === 'MISS' ? 'serving line fill' : 'idle',
      },
      specialVisual: { type: 'vector', gridCells: cells(idx), vectorItems: [] },
      metrics: metrics({
        instructionsExecuted: idx + 1,
        cacheHits: cumHits,
        cacheMisses: cumMisses,
        memoryAccesses: idx + 1,
        bytesTransferred: cumMisses * 64,
        stageCycles: { compute: idx + 1, memory: cumHits * 4 + cumMisses * 200, control: 0, stall: cumMisses },
        estimatedTimeNs: cumHits * 1.2 + cumMisses * 65,

      }),
      inspector: extra.inspector,
      ...(extra.specialVisual ? { specialVisual: extra.specialVisual } : {}),
    });

  const steps: SimulationStep[] = [];
  let h = 0;
  let m = 0;
  for (let i = 0; i < 8; i++) {
    const miss = !(sequential && i % 4 !== 0);
    if (miss) m++;
    else h++;
    const status = miss ? 'MISS' : 'HIT';
    const addr = sequential ? `0x${(0x1000 + i * 4).toString(16).toUpperCase()}` : lineAddresses[i % 4];
    steps.push(
      build(i, `a${i}`, status, miss ? 200 : 4, h, m, {
        inspector: {
          stepTitle:
            i === 0
              ? 'First ingredient — the rack is cold, pantry trip required'
              : miss
                ? 'New cache line — pantry trip again'
                : 'Neighbouring ingredient already on the rack — hit!',
          phaseBadge: miss ? 'L1 MISS' : 'L1 HIT',
          componentHardware: miss ? 'L1d Tag Check → L2 → DRAM line fill' : 'L1d Data Array read',
          componentKitchen: miss ? 'Basement pantry walk' : 'Reaching the counter spice rack',
          primaryComponentId: miss ? 'l1-cache' : 'registers',
          opcode: `LDG R1, [${addr}]`,
          inputData: `Address ${addr}`,
          operation: miss
            ? `Tag miss → fetch 64-byte line ${sequential ? 'covering a' + (i % 4) + '–a' + Math.min(7, (i % 4) + 3) : 'from a random page'}`
            : 'Tag hit → read word directly from SRAM array',
          outputData: `a${i} = ${(i * 7 + 13) % 97}`,
          memoryAccess: {
            tier: miss ? 'System RAM' : 'L1 Cache',
            status: miss ? 'MISS' : 'HIT',
            address: addr,
            latencyCycles: miss ? 200 : 4,
          },
          beginnerExplanation: miss
            ? sequential
              ? 'The chef needed an ingredient not yet on the rack, so a runner goes to the basement pantry — but returns with a whole crate containing the next three ingredients too.'
              : 'Because each ingredient is stored in a totally different aisle, every single trip is a full walk to the basement. No crate ever helps twice.'
            : 'The last pantry trip brought a whole crate. The chef reaches up and the next ingredient is already there — this takes about four heartbeats instead of two hundred.',
          engineeringExplanation: miss
            ? sequential
              ? 'A stride-1 access pattern triggers the hardware prefetcher and the 64-byte line fill delivers four consecutive int32 values. Spatial locality converts 1 miss into 3 subsequent hits: effective AMAT ≈ 53 cycles instead of 200.'
              : 'Pointer-chasing style access defeats both spatial locality and the prefetcher. Every access is a compulsory miss, so average memory access time approaches raw DRAM latency (~200 cycles).'
            : 'L1d tag match on a line already resident. The load-to-use latency is ~4 cycles and execution proceeds with the data forwarding network, leaving the memory subsystem entirely idle.',
          nextStepPreview: i === 7 ? 'Compute the final average memory access time' : `Load a${i + 1}`,
        },
      }),
    );
  }

  steps.push(
    S({
      cycle: sequential ? 12 : 60,
      stageShort: 'SUMMARY',
      activeComponents: ['core-0', 'l1-cache', 'ram'],
      workers: [
        chef('core-0', 'Master Chef 01', 'completed', sequential ? '8 items served with 2 pantry trips' : '8 items served with 8 pantry trips', { progress: 100 }),
        chef('core-1', 'Master Chef 02', 'idle', 'Standing by'),
        chef('core-2', 'Master Chef 03', 'idle', 'Standing by'),
        chef('core-3', 'Master Chef 04', 'idle', 'Standing by'),
      ],
      storageHighlights: {
        registersText: '8 values committed',
        l1Text: sequential ? '2 lines resident · 6 hits' : '0 useful lines · 0 hits',
        ramText: sequential ? '2 line fills only' : '8 separate line fills',
      },
      specialVisual: { type: 'vector', gridCells: cells(8), vectorItems: [] },
      metrics: metrics({
        instructionsExecuted: 8,
        cacheHits: sequential ? 6 : 0,
        cacheMisses: sequential ? 2 : 8,
        memoryAccesses: 8,
        bytesTransferred: sequential ? 128 : 512,
        stageCycles: { compute: 8, memory: sequential ? 424 : 1600, control: 0, stall: sequential ? 2 : 8 },
        estimatedTimeNs: sequential ? 130 : 520,
        bottleneck: {
          title: sequential ? 'Locality working as designed' : 'Memory wall — 15× slowdown',
          severity: sequential ? 'low' : 'high',
          beginnerText: sequential
            ? 'Because the chef needed neighbouring ingredients, one pantry trip fed four dishes. The rack did the rest.'
            : 'Every dish needed something from a different far-away aisle. The kitchen spent nearly all its time walking.',
          engineeringText: sequential
            ? 'AMAT = 0.75 × 4 + 0.25 × 200 ≈ 53 cycles. Sequential access lets cache lines, prefetchers and SIMD loads all pay off at once.'
            : 'AMAT ≈ 200 cycles with a 0% hit rate. Memory bandwidth required rises 4× and the pipeline stalls on nearly every load — the canonical memory wall.',
      },
      }),
      inspector: {
        stepTitle: sequential ? 'Summary — Four meals per pantry trip' : 'Summary — Eight pantry trips for eight meals',
        phaseBadge: 'COMPLETE',
        componentHardware: 'Memory hierarchy performance summary',
        componentKitchen: 'Kitchen walk-time audit',
        primaryComponentId: 'ram',
        opcode: 'AMAT = hit% × L1 + miss% × DRAM',
        inputData: `${sequential ? '2' : '8'} line fills · ${sequential ? '6' : '0'} hits`,
        operation: 'Compute average memory access time',
        outputData: sequential ? 'AMAT ≈ 53 cycles' : 'AMAT ≈ 200 cycles',
        memoryAccess: { tier: 'System RAM', status: sequential ? 'HIT' : 'MISS', address: '0x1000 block', latencyCycles: sequential ? 53 : 200 },
        beginnerExplanation: sequential
          ? 'Same eight dishes, but only two basement trips, because each trip carried four ingredients. That is the entire secret of caches.'
          : 'Same eight dishes and eight basement trips. Nothing about the chef got slower — the access pattern did.',
        engineeringExplanation:
          'Caches convert spatial and temporal locality into latency reduction. Data layout — array-of-structs versus struct-of-arrays, contiguous versus linked — changes measured performance by an order of magnitude on identical hardware.',
        nextStepPreview: 'Reset and switch the access pattern',
      },
    }),
  );

  return steps;
}
