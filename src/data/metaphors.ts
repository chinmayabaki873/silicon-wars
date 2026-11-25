import { CanonicalComponentId, MetaphorItem } from '../types/simulation';

export const METAPHOR_ITEMS: MetaphorItem[] = [
  {
    id: 'cpu-overview',
    hardwareTitle: 'CPU (Central Processing Unit)',
    kitchenTitle: 'Boutique Atelier of Master Chefs',
    shortTag: 'LATENCY-OPTIMIZED PROCESSOR',
    latencyCycles: '2.4 – 5.3 GHz Boost',
    kitchenTimeEquivalent: 'Bespoke tasting-menu kitchen',
    capacitySpec: '4 – 24 Complex Superscalar Cores',
    beginnerSummary:
      'Think of a CPU as an intimate Michelin-caliber kitchen staffed by a handful of extraordinary master chefs. Each chef can improvise, handle tricky branching recipes, and finish one complex custom dish faster than anyone else.',
    engineeringSummary:
      'A latency-oriented processor dedicating massive silicon die area to out-of-order execution windows, deep branch predictors, speculative execution, and multi-megabyte L1/L2/L3 SRAM caches to minimize single-thread instruction latency.',
    linkedComponentId: 'core-0',
  },
  {
    id: 'core-0',
    hardwareTitle: 'CPU Cores',
    kitchenTitle: 'Individual Master Chefs',
    shortTag: 'SUPERSCALAR EXECUTION CORES',
    latencyCycles: '4–6 IPC (Instructions / Cycle)',
    kitchenTimeEquivalent: '1 Master Chef running a full station',
    capacitySpec: 'Private L1i/L1d + L2, OoO Reorder Buffer',
    beginnerSummary:
      'Each CPU core is an independent master chef with their own cutting board, knives, and spice rack. Four chefs can cook four totally different recipes at the exact same time without getting in each other’s way.',
    engineeringSummary:
      'An independent hardware processing engine containing fetch/decode frontends, register rename tables, reorder buffers (ROB), multiple integer/vector execution ports, and private L1/L2 caches executing independent hardware threads.',
    linkedComponentId: 'core-0',
  },
  {
    id: 'gpu-overview',
    hardwareTitle: 'GPU (Graphics Processing Unit)',
    kitchenTitle: 'Massive Parallel Culinary Hall',
    shortTag: 'THROUGHPUT-OPTIMIZED PROCESSOR',
    latencyCycles: '0.95 – 1.46 GHz Boost',
    kitchenTimeEquivalent: '1,000-banquet industrial catering floor',
    capacitySpec: 'Thousands of SIMT Lanes across SMs',
    beginnerSummary:
      'If you suddenly need 10,000 identical dumplings folded before dinner service, four master chefs will be overwhelmed. A GPU is a colossal industrial kitchen with hundreds of synchronized line cooks folding thousands of dumplings at once.',
    engineeringSummary:
      'A throughput-oriented architecture composed of dozens of Streaming Multiprocessors (SMs) housing thousands of fine-grained SIMT execution lanes, hiding memory latency via hardware zero-overhead warp context switching rather than huge caches.',
    linkedComponentId: 'sm-0',
  },
  {
    id: 'gpu-workers',
    hardwareTitle: 'GPU Workers (CUDA / Stream Cores)',
    kitchenTitle: 'Synchronized Brigade Line Cooks',
    shortTag: 'PARALLEL ARITHMETIC LANES',
    latencyCycles: '32 Lanes per Warp / Lockstep',
    kitchenTimeEquivalent: '32 line cooks chopping on one beat',
    capacitySpec: 'FP32 / INT32 / Tensor Arithmetic Lanes',
    beginnerSummary:
      'GPU workers are specialized line cooks standing shoulder-to-shoulder. They follow the exact same recipe step called out by their station leader—each cook simply applies that step to their own numbered ingredient.',
    engineeringSummary:
      'Individual scalar/SIMD execution lanes inside a Streaming Multiprocessor. Grouped into 32-thread warps, all active lanes execute the same instruction broadcast from the warp scheduler across distinct per-thread vector registers (VGPRs).',
    linkedComponentId: 'gpu-workers',
  },
  {
    id: 'instructions',
    hardwareTitle: 'Instructions (Machine Opcodes)',
    kitchenTitle: 'Printed Cooking Orders & Recipe Steps',
    shortTag: 'ISA MICRO-OPERATIONS',
    latencyCycles: '32-bit / 64-bit Encoded Words',
    kitchenTimeEquivalent: '"Dice 2 onions", "Sear 90s", "Plate"',
    capacitySpec: 'ADD, FMA, LD, ST, CMP, BRA',
    beginnerSummary:
      'Chefs never guess what to cook—they follow crisp, atomic order tickets: "Grab Salt", "Add Broth", "Check Temperature". Complex software programs break down into millions of these tiny kitchen commands.',
    engineeringSummary:
      'Binary-encoded Instruction Set Architecture (ISA) primitives fetched from instruction memory and decoded into internal micro-operations (uOps) specifying opcode, destination register, and source operands or immediate offsets.',
    linkedComponentId: 'scheduler',
  },
  {
    id: 'registers',
    hardwareTitle: 'Registers (Architectural & Vector RF)',
    kitchenTitle: 'Immediate Cutting-Board Workspace',
    shortTag: 'ZERO-WAIT ON-CORE STORAGE',
    latencyCycles: '1 Cycle (~0.3 ns)',
    kitchenTimeEquivalent: '1 second — already in the chef’s hands',
    capacitySpec: '16–32 Arch Regs (CPU) / 64K 32-bit Regs (SM)',
    beginnerSummary:
      'Registers are the wooden cutting board directly underneath the chef’s knife. Before anything can be chopped or mixed, the ingredients must sit right here—reaching them is instantaneous, but space is tiny.',
    engineeringSummary:
      'Multi-ported static flip-flop arrays wired directly into ALU operand multiplexers. Registers deliver single-cycle access without address translation or bus arbitration, representing the pinnacle of the memory hierarchy.',
    linkedComponentId: 'registers',
  },
  {
    id: 'l1-cache',
    hardwareTitle: 'Cache (L1 / L2 / L3 SRAM)',
    kitchenTitle: 'Arm’s-Reach Spice & Prep Shelves',
    shortTag: 'ON-DIE LOW-LATENCY SRAM',
    latencyCycles: 'L1: ~4 cyc | L2: ~12 cyc | L3: ~40 cyc',
    kitchenTimeEquivalent: '4 to 30 seconds — reaching the counter shelf',
    capacitySpec: '32 KB L1d → 1 MB L2 → 32+ MB Shared L3',
    beginnerSummary:
      'Smart chefs keep chopped garlic, olive oil, and salt on a shelf right above their stove. When an order asks for garlic and it’s on the shelf (a Cache Hit), cooking stays blazingly fast without walking to the basement pantry.',
    engineeringSummary:
      'Hierarchical on-die 6T-SRAM associative arrays storing 64-byte cache lines exploited via temporal and spatial locality. Hardware prefetchers and MESI coherence protocols keep hot working sets close to execution cores.',
    linkedComponentId: 'l1-cache',
  },
  {
    id: 'ram',
    hardwareTitle: 'System RAM (DDR5 DRAM)',
    kitchenTitle: 'Main Walk-In Pantry Down the Hall',
    shortTag: 'HIGH-CAPACITY OFF-CHIP DRAM',
    latencyCycles: '~180 – 240 Cycles (~65–85 ns)',
    kitchenTimeEquivalent: '4 minutes — walking down to the main pantry',
    capacitySpec: '16 GB – 128 GB | ~80 GB/s Bandwidth',
    beginnerSummary:
      'The walk-in pantry holds sacks of flour, crates of produce, and every recipe book in the restaurant. It has huge storage space, but walking down the corridor and hauling ingredients back takes an eternity compared to chopping.',
    engineeringSummary:
      'Off-package dynamic random-access memory (1T-1C capacitor cells requiring periodic refresh) accessed across a PCB memory channel via the Integrated Memory Controller (IMC), incurring row-activation (tRCD) and column-strobe (CAS) latencies.',
    linkedComponentId: 'ram',
  },
  {
    id: 'vram',
    hardwareTitle: 'VRAM (GDDR6X / HBM3 Memory)',
    kitchenTitle: 'High-Bay Industrial Loading Warehouse',
    shortTag: 'WIDE-BUS DEVICE MEMORY',
    latencyCycles: '~300+ Cycles Latency | 1,000+ GB/s',
    kitchenTimeEquivalent: 'Wide 16-lane conveyor belt from cold storage',
    capacitySpec: '16 – 80 GB | 256-bit to 5120-bit Bus',
    beginnerSummary:
      'Because 1,000 GPU cooks would jam a narrow pantry doorway, the GPU has its own dedicated warehouse with massive multi-lane conveyor belts capable of delivering whole pallets of ingredients in a single wave.',
    engineeringSummary:
      'Dedicated high-bandwidth device DRAM (GDDR6X or 3D-stacked HBM3) engineered for coalesced wide memory transactions, trading slightly higher point-to-point latency for 1–3 TB/s aggregate streaming bandwidth.',
    linkedComponentId: 'vram',
  },
  {
    id: 'alu',
    hardwareTitle: 'ALU / FPU (Arithmetic Logic Unit)',
    kitchenTitle: 'Stove, Chef’s Knife & Mixer Station',
    shortTag: 'COMBINATIONAL COMPUTE ENGINE',
    latencyCycles: '1 – 4 Cycles Pipelined',
    kitchenTimeEquivalent: 'Where raw ingredients actually transform',
    capacitySpec: 'INT64, FP32, FP64, Fused Multiply-Add (FMA)',
    beginnerSummary:
      'Shelves and pantries only hold ingredients—nothing gets cooked until it hits the stove or the knife blade. The ALU is the physical tool that combines two ingredients into a finished dish.',
    engineeringSummary:
      'Combinational and pipelined logic circuits (adders, barrel shifters, comparators, IEEE-754 fused multiply-add trees) that read source operands from register read ports and commit computed results + condition flags.',
    linkedComponentId: 'alu',
  },
  {
    id: 'scheduler',
    hardwareTitle: 'Hardware Scheduler & Issue Unit',
    kitchenTitle: 'Head Chef Calling Tickets at the Pass',
    shortTag: 'DYNAMIC DISPATCH & SCOREBOARD',
    latencyCycles: 'Every Clock Edge',
    kitchenTimeEquivalent: 'Expediter routing tickets to ready stations',
    capacitySpec: 'OoO Issue Queue (CPU) / Warp Scheduler (GPU)',
    beginnerSummary:
      'If Ticket #1 is waiting 4 minutes for truffles from the basement pantry, a great Head Chef doesn’t let the kitchen freeze—they immediately call Ticket #2 and #3 whose ingredients are already prepped on the counter.',
    engineeringSummary:
      'Tomasulo-derived out-of-order reservation stations on CPUs (tracking register readiness via wakeup/select logic) or hardware Warp Schedulers on GPUs (switching instantaneously to eligible warps with zero context-save penalty).',
    linkedComponentId: 'scheduler',
  },
  {
    id: 'pipeline',
    hardwareTitle: 'Instruction Pipeline (IF→ID→EX→MEM→WB)',
    kitchenTitle: '5-Station Culinary Assembly Line',
    shortTag: 'OVERLAPPED STAGE EXECUTION',
    latencyCycles: '5 to 19 Stages Overlapped',
    kitchenTimeEquivalent: 'Read → Prep → Sear → Garnish → Plate',
    capacitySpec: '1 Completed Instruction per Cycle Ideal',
    beginnerSummary:
      'Instead of waiting until Dish #1 is completely plated before even reading Order #2, the kitchen runs like a relay line: as soon as Dish #1 moves from Prep to the Stove, Dish #2 enters Prep.',
    engineeringSummary:
      'Temporal instruction-level parallelism partitioning datapath logic with clocked pipeline registers (Fetch, Decode, Execute, Memory, Writeback), boosting clock frequency while requiring forwarding paths and hazard interlocks.',
    linkedComponentId: 'pipeline',
  },
];

export const COMPONENT_LOOKUP: Record<
  CanonicalComponentId,
  {
    hardwareName: string;
    kitchenName: string;
    roleTag: string;
    beginnerDesc: string;
    engineeringDesc: string;
  }
> = {
  scheduler: {
    hardwareName: 'Control Unit & Instruction Scheduler',
    kitchenName: 'Head Chef at the Expediter Pass',
    roleTag: 'DISPATCH & CONTROL',
    beginnerDesc:
      'Reads incoming order tickets, checks which ingredients are ready on the counter, and assigns work to chefs so nobody stands idle.',
    engineeringDesc:
      'Fetches/decodes ISA instructions, tracks operand readiness via hardware scoreboards/reservation stations, and issues ready micro-ops to execution ports.',
  },
  'core-0': {
    hardwareName: 'CPU Core 0 (Superscalar Engine)',
    kitchenName: 'Master Chef 01 — Lead Station',
    roleTag: 'SERIAL / COMPLEX COMPUTE',
    beginnerDesc:
      'Our primary master chef capable of blistering single-dish speed, complex recipe decisions, and out-of-order multitasking.',
    engineeringDesc:
      'Full superscalar core featuring dedicated branch predictor, register file, ALU/FPU execution ports, and private L1 instruction/data caches.',
  },
  'core-1': {
    hardwareName: 'CPU Core 1 (Superscalar Engine)',
    kitchenName: 'Master Chef 02 — Second Station',
    roleTag: 'MULTI-CORE COMPUTE',
    beginnerDesc:
      'Second independent master chef working in parallel on separate orders or split portions of a menu.',
    engineeringDesc:
      'Second symmetric physical core executing independent thread contexts with coherent cache snooping.',
  },
  'core-2': {
    hardwareName: 'CPU Core 2 (Superscalar Engine)',
    kitchenName: 'Master Chef 03 — Third Station',
    roleTag: 'MULTI-CORE COMPUTE',
    beginnerDesc:
      'Third independent master chef handling concurrent dishes with full station autonomy.',
    engineeringDesc:
      'Third symmetric physical core sharing last-level interconnect bandwidth and unified memory controller access.',
  },
  'core-3': {
    hardwareName: 'CPU Core 3 (Superscalar Engine)',
    kitchenName: 'Master Chef 04 — Fourth Station',
    roleTag: 'MULTI-CORE COMPUTE',
    beginnerDesc:
      'Fourth master chef completing the quad-core boutique kitchen brigade.',
    engineeringDesc:
      'Fourth symmetric physical core operating on independent instruction streams.',
  },
  registers: {
    hardwareName: 'Register File (R0–R15 / VGPRs)',
    kitchenName: 'Chef’s Immediate Cutting Board',
    roleTag: '1-CYCLE OPERAND STORAGE',
    beginnerDesc:
      'The tiny surface right beneath the chef’s hands. Ingredients must sit here at the exact moment they are chopped or combined.',
    engineeringDesc:
      'Single-cycle multi-ported SRAM/flip-flop register bank directly feeding ALU source buses and capturing writeback results.',
  },
  alu: {
    hardwareName: 'ALU / FPU Execution Cluster',
    kitchenName: 'Searing Range & Knife Block',
    roleTag: 'ARITHMETIC & LOGIC',
    beginnerDesc:
      'The heat and steel where raw ingredients physically combine into cooked components.',
    engineeringDesc:
      'High-speed integer and IEEE-754 floating-point datapaths executing ADD, MUL, FMA, bitwise, and predicate comparisons.',
  },
  pipeline: {
    hardwareName: '5-Stage Instruction Pipeline',
    kitchenName: 'Sequential Prep-to-Plate Line',
    roleTag: 'STAGE OVERLAP',
    beginnerDesc:
      'Five connected prep counters (Order → Prep → Sear → Pantry → Plate) keeping five dishes moving simultaneously.',
    engineeringDesc:
      'Latched IF/ID/EX/MEM/WB pipeline stages with operand forwarding multiplexers and hazard detection unit.',
  },
  'l1-cache': {
    hardwareName: 'L1 Data Cache (32 KB SRAM)',
    kitchenName: 'Station Spice & Herb Rack',
    roleTag: '4-CYCLE HOT CACHE',
    beginnerDesc:
      'A small shelf right above the cutting board holding the ingredients used in the last few minutes—grabbing from here is nearly instant.',
    engineeringDesc:
      '8-way set-associative per-core L1d SRAM storing 64-byte cache lines with ~4-cycle load-to-use latency.',
  },
  'l2-cache': {
    hardwareName: 'L2 (16 MB) & Shared L3 (64 MB)',
    kitchenName: 'Kitchen Counter Cold-Prep Fridge',
    roleTag: '14 – 46 CYCLE WARM CACHE',
    beginnerDesc:
      'A larger reach-in prep fridge shared near the stations—slower than the spice rack, yet far faster than trekking to the basement pantry.',
    engineeringDesc:
      'Zen 4 has 1 MB of private L2 per core plus a 64 MB L3 shared across both CCDs. L2 costs ~14 cycles; an L3 hit costs ~46 — still 2× cheaper than DRAM.',
  },
  'l3-cache': {
    hardwareName: 'Shared L3 Cache (64 MB, 2 CCDs)',
    kitchenName: 'Back-of-House Cold Room',
    roleTag: '46-CYCLE SHARED CACHE',
    beginnerDesc:
      'A cold room shared by every station in the building. Bigger than any counter fridge, and everyone can walk to it, so two chefs rarely fight over the same shelf.',
    engineeringDesc:
      'A 32 MB L3 slice per CCD (64 MB total) with an inclusive-of-CCX victim cache. Victims from L2 land here, so a cross-core share costs ~46 cycles instead of a ~90-cycle DRAM round trip.',
  },
  'tensor-cores': {
    hardwareName: 'Tensor Cores (104, 5th gen) + RT Cores (26)',
    kitchenName: 'Paste Makers & Mandoline Stations',
    roleTag: 'FIXED-FUNCTION ACCELERATORS',
    beginnerDesc:
      'Special machines bolted to the line that do one job — rolling pasta or slicing precisely — thousands of times faster than a chef with a knife.',
    engineeringDesc:
      'On Blackwell each SM carries 4 tensor cores and 1 RT core. They execute a 4×4×4 matrix-multiply-accumulate per instruction, reaching 9.7 TFLOPS FP32 and ~572 TOPS INT8 — roughly 60× the FP32 rate of a CUDA-core lane alone.',
  },
  ram: {
    hardwareName: 'System DRAM (DDR5-5200, 2 channels)',
    kitchenName: 'Walk-In Basement Pantry',
    roleTag: '~90-CYCLE / 83 GB/s',
    beginnerDesc:
      'Massive storage holding all ingredients for the evening, but located down a long corridor—trips here stall hungry stations.',
    engineeringDesc:
      'Dual-channel DDR5-5200 gives 83.2 GB/s with ~90 core-cycle latency — an order of magnitude wider than L3 but roughly 20× slower to reach.',
  },
  'pcie-bus': {
    hardwareName: 'PCIe 5.0 ×8 Host Link',
    kitchenName: 'Cross-Town Refrigerated Delivery Van',
    roleTag: 'HOST ↔ DEVICE LINK',
    beginnerDesc:
      'The delivery truck bridging the CPU’s boutique pantry and the GPU’s industrial hall. High capacity per trip, but loading the truck takes real setup time!',
    engineeringDesc:
      'Mobile Blackwell parts wire only 8 lanes: 32 GB/s theoretical, ~25 GB/s achievable for pinned copies, and ~1.6 µs of latency before a single byte moves.',
  },
  vram: {
    hardwareName: 'GPU VRAM (8 GB GDDR7, 128-bit)',
    kitchenName: 'GPU Bulk Warehouse & Wide Conveyors',
    roleTag: '384 GB/s · 480-CYCLE',
    beginnerDesc:
      'The GPU’s own gigantic ingredient warehouse outfitted with ultra-wide conveyor belts to feed hundreds of line cooks at once.',
    engineeringDesc:
      '8 GB of GDDR7 on a 128-bit bus at 24 Gbps gives 384 GB/s — 4.6× the CPU’s 83 GB/s — but every miss costs ~480 cycles instead of 90.',
  },
  'warp-scheduler': {
    hardwareName: 'GigaThread & Warp Scheduler',
    kitchenName: 'Brigade Floor Commander (32-Cook Caller)',
    roleTag: 'SIMT LOCKSTEP DISPATCH',
    beginnerDesc:
      'Calls out one unified step through a megaphone so an entire 32-cook warp brigade executes in rhythmic unison.',
    engineeringDesc:
      'Hardware SIMT scheduler broadcasting one instruction per cycle to 32 threads in a warp while tracking active execution masks (`EXEC_MASK`).',
  },
  'sm-0': {
    hardwareName: 'Streaming Multiprocessor 0 (SM 0)',
    kitchenName: 'Parallel Brigade Island A',
    roleTag: 'THREAD BLOCK ENGINE',
    beginnerDesc:
      'An entire island of parallel line cooks sharing a central prep table so they can cooperate on a tile of dishes.',
    engineeringDesc:
      'Self-contained GPU compute cluster housing warp schedulers, 64–128 FP32/INT32 cores, large VGPR file, and on-chip Shared Memory.',
  },
  'sm-1': {
    hardwareName: 'Streaming Multiprocessor 1 (SM 1)',
    kitchenName: 'Parallel Brigade Island B',
    roleTag: 'THREAD BLOCK ENGINE',
    beginnerDesc:
      'A second parallel brigade island running additional thread blocks simultaneously for massive scale.',
    engineeringDesc:
      'Second independent Streaming Multiprocessor executing assigned thread blocks concurrently without cross-SM barrier dependencies.',
  },
  'shared-mem': {
    hardwareName: 'On-Chip Shared Memory / Scratchpad',
    kitchenName: 'Communal Brigade Prep Table',
    roleTag: 'USER-MANAGED ON-SM SRAM',
    beginnerDesc:
      'A shared stainless-steel table in the middle of a GPU brigade island where cooks place prepped ingredients for teammates to reuse.',
    engineeringDesc:
      'Software-managed banked SRAM inside each SM (~48–128 KB) enabling low-latency thread cooperation and dramatic VRAM bandwidth reduction.',
  },
  'gpu-workers': {
    hardwareName: 'SIMT CUDA / Stream Core Array',
    kitchenName: 'Synchronized Line-Cook Brigade',
    roleTag: 'MASSIVE DATA PARALLELISM',
    beginnerDesc:
      'Rows of nimble cooks performing identical transformations across dozens of ingredients in a single heartbeat.',
    engineeringDesc:
      'Dense array of pipelined scalar FMA/ALU lanes executing per-thread data operations under unified warp instruction control.',
  },
};
