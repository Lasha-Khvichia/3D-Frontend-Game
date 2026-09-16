import { MOUNTAIN_RANGES } from "../../terrain/landRelief";
import { depthAtHeight } from "./snowDepth";

/**
 * The two ranges that keep their snow: the great massif north of the island
 * and the southern one. The eastern hill is 150 m and stays bare rock — the
 * player's choice, and it gives the east a different look.
 */
export const SNOWY_RANGES = [MOUNTAIN_RANGES[0]!, MOUNTAIN_RANGES[1]!] as const;

/** Above this, on those two ranges, the snow never melts in any year. */
export const PERMANENT_LINE = 95;
/** Metres of fade from bare ground to the full cap, and how deep the cap lies. */
export const PERMANENT_EDGE = 14;
export const PERMANENT_DEPTH = 0.5;
/** Metres of snow that hides the ground, and that a boot can print in. */
export const COVERS_GROUND = 0.05;
export const HOLDS_A_PRINT = 0.03;

/** 1 where the ground belongs to a snowy range, 0 elsewhere. */
export function inSnowyRange(x: number, z: number): number {
  for (const range of SNOWY_RANGES) {
    if (Math.hypot(x - range.x, z - range.z) < range.radius) return 1;
  }
  return 0;
}

/** The cap that outlasts every summer: deep on the two high ranges, nothing anywhere else. */
export function permanentDepthAt(x: number, z: number, height: number): number {
  if (inSnowyRange(x, z) === 0) return 0;
  const over = (height - PERMANENT_LINE) / PERMANENT_EDGE;
  return PERMANENT_DEPTH * Math.min(1, Math.max(0, over));
}

/**
 * How deep the snow is here: what the winter has laid down at this height
 * (`SnowTrail`), or the cap on the high ranges, whichever is deeper.
 */
export function snowDepthAt(
  bands: readonly number[],
  x: number,
  z: number,
  height: number,
): number {
  return Math.max(depthAtHeight(bands, height), permanentDepthAt(x, z, height));
}
