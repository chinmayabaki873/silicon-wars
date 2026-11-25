export interface TourStep {
  id: string;
  target: string | null; // CSS selector, e.g. '[data-tour="nav-experiments"]'
  title: string;
  instruction: string;
  expectedAction: string;
  actionEvent?: string; // if set, advances automatically when notifyAction(actionEvent) fires
  successMessage?: string;
  nextStepId: string | null;
  whySimple: string;
  whyTechnical: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Silicon Wars',
    instruction:
      "Welcome to Silicon Wars! Let's explore how your computer works from the inside — comparing a CPU and a GPU side by side.",
    expectedAction: 'Click Continue to begin the walkthrough.',
    nextStepId: 'highlight-experiments',
    whySimple:
      'Think of your computer as two very different kitchens: one with a few master chefs (CPU) and one with thousands of line cooks (GPU).',
    whyTechnical:
      'Modern heterogeneous systems pair a latency-optimised multi-core CPU (Ryzen 9 8940HX) with a throughput-optimised SIMT GPU (RTX 5060).',
  },
  {
    id: 'highlight-experiments',
    target: '[data-tour="nav-experiments"]',
    title: 'Open the Experiment Library',
    instruction: "Start here. This is where you'll find 20 interactive computer architecture experiments.",
    expectedAction: 'Click Experiments in the navigation bar to continue.',
    actionEvent: 'experiments-clicked',
    successMessage: "Great! You've opened the experiment library.",
    nextStepId: 'select-experiment',
    whySimple:
      'Each experiment is a different recipe — from simple chopping (vector addition) to complex banquets (matrix multiplication).',
    whyTechnical:
      'The library covers instruction pipelines, cache hierarchies, warp divergence, SIMD/FMA, atomics, and roofline analysis.',
  },
  {
    id: 'select-experiment',
    target: '[data-tour="exp-matrix-multiplication"]',
    title: 'Select an Experiment',
    instruction: "Let's investigate how a CPU and GPU perform Matrix Multiplication (or pick any experiment).",
    expectedAction: 'Click this experiment to launch its interactive workspace.',
    actionEvent: 'experiment-selected',
    successMessage: "Perfect! You've entered the simulation workspace.",
    nextStepId: 'explore-kitchen',
    whySimple:
      'Matrix multiplication reuses the same ingredients many times — so where you store them makes a huge difference.',
    whyTechnical:
      'Tiled GEMM stages sub-matrices in fast on-chip shared memory to achieve high arithmetic intensity above the roofline ridge.',
  },
  {
    id: 'explore-kitchen',
    target: '[data-tour="kitchen-view"]',
    title: 'Explore the Kitchen Simulation',
    instruction: 'These chefs represent processing units. Watch how work is distributed between CPU cores and GPU brigades.',
    expectedAction: 'Click any chef/worker card or click Next to inspect the hardware.',
    actionEvent: 'kitchen-clicked',
    successMessage: 'Exactly! Watch how the workload is distributed.',
    nextStepId: 'explore-architecture',
    whySimple:
      'Burgundy master chefs work independently on complex tasks; olive line-cook brigades execute the exact same step in lockstep.',
    whyTechnical:
      'CPU cores have large caches and out-of-order execution; GPU SMs schedule 32-thread warps in SIMT lockstep.',
  },
  {
    id: 'explore-architecture',
    target: '[data-tour="architecture-view"]',
    title: 'Explore the Architecture Diagram',
    instruction: 'This is the actual hardware structure behind the kitchen analogy. Click any component to inspect it.',
    expectedAction: 'Click a hardware block (like SM, L1 Cache, or Register File) to continue.',
    actionEvent: 'arch-clicked',
    successMessage: "Perfect! Now you're inspecting the real silicon.",
    nextStepId: 'run-simulation',
    whySimple:
      'Every station in the kitchen maps 1-to-1 to a real piece of silicon on the chip.',
    whyTechnical:
      'The diagram highlights active data paths, memory tiers, and execution units on the Ryzen 9 8940HX and RTX 5060 dies.',
  },
  {
    id: 'run-simulation',
    target: '[data-tour="play-button"]',
    title: 'Run the Simulation',
    instruction: 'Ready? Start the simulation and watch the workload execute cycle by cycle.',
    expectedAction: 'Click Play to run the simulation.',
    actionEvent: 'play-clicked',
    successMessage: 'Excellent! Watch the execution trace unfold.',
    nextStepId: 'inspect-execution',
    whySimple:
      'Stepping through the clock lets you see where the chefs wait for ingredients instead of cooking.',
    whyTechnical:
      'Each step advances the deterministic trace, updating register/cache state, utilisation meters, and bottleneck analysis.',
  },
  {
    id: 'inspect-execution',
    target: '[data-tour="execution-inspector"]',
    title: 'Inspect Execution Details',
    instruction: 'Here you can understand exactly what is happening at each execution step, in Beginner or Engineering mode.',
    expectedAction: 'Click Continue to complete the tour.',
    nextStepId: 'completion',
    whySimple:
      'You can switch between the kitchen story and real engineering terms at any time, or check the Description tab beside Data.',
    whyTechnical:
      'The Execution Inspector displays the active instruction, memory tier latency, cycle cost, and architectural bottleneck.',
  },
  {
    id: 'completion',
    target: null,
    title: 'Guided Tour Complete',
    instruction: "Excellent! You've completed your first guided experiment. You can now explore any of the 20 experiments.",
    expectedAction: 'Choose an option below.',
    nextStepId: null,
    whySimple:
      'You now know how to read the kitchen, the silicon diagram, and the step-by-step inspector.',
    whyTechnical:
      'You can restart Guided Learning anytime from the top navigation bar.',
  },
];
