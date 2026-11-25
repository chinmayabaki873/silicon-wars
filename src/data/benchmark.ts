export interface MeasuredHardware {
  measuredAt: string;
  logicalCores: number;
  gpuRenderer: string;
  gpuVendor: string;
  cpuScalarMops: number; // Million ops/sec
  memoryBandwidthGbs: number; // Estimated JS typed-array copy bandwidth
  gpuDrawMs: number; // Real WebGL2 draw-call timing
}

export function detectGpu(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { vendor: 'Unavailable', renderer: 'WebGL disabled' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbg) return { vendor: 'WebGL', renderer: gl.getParameter(gl.RENDERER) || 'Generic GPU' };
    return {
      vendor: String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || 'Unknown'),
      renderer: String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || 'Unknown'),
    };
  } catch {
    return { vendor: 'Unavailable', renderer: 'Blocked by browser' };
  }
}

export async function runLiveBenchmark(): Promise<MeasuredHardware> {
  const logicalCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const gpu = detectGpu();

  // 1. CPU scalar / FMA-like loop
  const N = 2_000_000;
  let acc = 1.0001;
  const t0 = performance.now();
  for (let i = 0; i < N; i += 1) {
    acc = acc * 1.000001 + 0.5;
  }
  const t1 = performance.now();
  // prevent dead-code elimination
  if (acc < 0) console.log(acc);
  const cpuMs = Math.max(0.1, t1 - t0);
  const cpuScalarMops = Math.round((N * 2) / (cpuMs * 1000));

  // 2. Memory bandwidth (Float32Array copy, 16 MB)
  const len = 4_000_000;
  const a = new Float32Array(len);
  const b = new Float32Array(len);
  a.fill(1.5);
  const m0 = performance.now();
  b.set(a);
  const m1 = performance.now();
  const memMs = Math.max(0.05, m1 - m0);
  const bytes = len * 4 * 2; // read + write
  const memoryBandwidthGbs = Math.round(((bytes / 1e9) / (memMs / 1000)) * 10) / 10;

  // 3. GPU WebGL2 clear/draw timing
  let gpuDrawMs = 0;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const gl = canvas.getContext('webgl2');
    if (gl) {
      const g0 = performance.now();
      for (let i = 0; i < 30; i += 1) {
        gl.clearColor(0.4, 0.1, 0.15, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.finish();
      const g1 = performance.now();
      gpuDrawMs = Math.round(((g1 - g0) / 30) * 100) / 100;
    }
  } catch {
    gpuDrawMs = 0;
  }

  return {
    measuredAt: new Date().toISOString(),
    logicalCores,
    gpuRenderer: gpu.renderer,
    gpuVendor: gpu.vendor,
    cpuScalarMops,
    memoryBandwidthGbs,
    gpuDrawMs,
  };
}
