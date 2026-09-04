/** Blades across one side of the patch. 352 x 352 is 123,904 blades. */
export const PATCH_CELLS = 352;
/**
 * Metres per cell, one blade per cell. 0.09 is closer than a blade is wide, so
 * they overlap into a mat: about 123 per square metre, over a patch 32 m across.
 */
export const CELL_SIZE = 0.09;
/**
 * The patch re-centres in steps of this many cells rather than continuously.
 * Each step rewrites the rows and columns that entered, and the blades that
 * appear are 16 m away.
 */
export const RECENTRE_STEP_CELLS = 12;

export const BLADE_COUNT = PATCH_CELLS * PATCH_CELLS;

/**
 * A blade's look is derived from the world cell it stands in, not from its slot
 * in the buffer. That is what lets the patch slide with the player without the
 * grass visibly reshuffling underneath them.
 */
export type BladeShape = {
  offsetX: number;
  offsetZ: number;
  yaw: number;
  height: number;
};

const HEIGHT_MIN = 0.72;
const HEIGHT_RANGE = 0.56;

export function shapeForCell(cellX: number, cellZ: number, out: BladeShape): void {
  out.offsetX = (hash(cellX, cellZ, 0x9e37) - 0.5) * CELL_SIZE;
  out.offsetZ = (hash(cellX, cellZ, 0x85eb) - 0.5) * CELL_SIZE;
  out.yaw = hash(cellX, cellZ, 0xc2b2) * Math.PI * 2;
  out.height = HEIGHT_MIN + hash(cellX, cellZ, 0x27d4) * HEIGHT_RANGE;
}

export function createBladeShape(): BladeShape {
  return { offsetX: 0, offsetZ: 0, yaw: 0, height: 1 };
}

/** Deterministic, so the same patch of ground always grows the same grass. */
function hash(x: number, z: number, salt: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ Math.imul(salt, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
