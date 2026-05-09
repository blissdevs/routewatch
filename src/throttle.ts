/**
 * throttle.ts — Simulate network throttle conditions when replaying requests.
 */

export type ThrottlePreset = "slow3g" | "fast3g" | "broadband" | "none";

export interface ThrottleOptions {
  delayMs: number;
  bytesPerSecond?: number;
}

const PRESETS: Record<ThrottlePreset, ThrottleOptions> = {
  slow3g: { delayMs: 400, bytesPerSecond: 50_000 },
  fast3g: { delayMs: 100, bytesPerSecond: 180_000 },
  broadband: { delayMs: 20, bytesPerSecond: 10_000_000 },
  none: { delayMs: 0 },
};

export function getPreset(name: ThrottlePreset): ThrottleOptions {
  return PRESETS[name];
}

export function parseThrottleArgs(args: string[]): ThrottleOptions {
  const presetFlag = args.indexOf("--throttle");
  if (presetFlag !== -1) {
    const value = args[presetFlag + 1] as ThrottlePreset;
    if (!PRESETS[value]) {
      throw new Error(
        `Unknown throttle preset: "${value}". Valid: ${Object.keys(PRESETS).join(", ")}`
      );
    }
    return getPreset(value);
  }

  const delayFlag = args.indexOf("--delay");
  if (delayFlag !== -1) {
    const ms = parseInt(args[delayFlag + 1], 10);
    if (isNaN(ms) || ms < 0) throw new Error("--delay must be a non-negative integer (ms)");
    return { delayMs: ms };
  }

  return { delayMs: 0 };
}

export function computeTransferDelay(bytes: number, opts: ThrottleOptions): number {
  if (!opts.bytesPerSecond || opts.bytesPerSecond <= 0) return 0;
  return Math.ceil((bytes / opts.bytesPerSecond) * 1000);
}

export async function applyThrottle(bodyBytes: number, opts: ThrottleOptions): Promise<void> {
  const total = opts.delayMs + computeTransferDelay(bodyBytes, opts);
  if (total <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, total));
}

export function formatThrottle(opts: ThrottleOptions): string {
  const parts: string[] = [`delay=${opts.delayMs}ms`];
  if (opts.bytesPerSecond) {
    const kbps = (opts.bytesPerSecond / 1000).toFixed(0);
    parts.push(`bandwidth=${kbps}KB/s`);
  }
  return parts.join(", ");
}
