/**
 * The size and spacing of one patch of grass.
 *
 * There are two: a dense one under your feet and a sparse one reaching to the
 * horizon. Everything that used to be a fixed number now comes from here, so
 * both patches run the same code with different numbers.
 */
export type GrassLayout = {
  /** Blades across one side of the patch. */
  readonly patchCells: number;
  /** Metres per cell, one blade per cell. */
  readonly cellSize: number;
  /**
   * The patch re-centres in whole steps of this many cells rather than
   * continuously, so blades appear far from the player rather than underfoot.
   */
  readonly recentreStepCells: number;
  readonly bladeCount: number;
  /** Blades are drawn this many times their modelled height. */
  readonly heightScale: number;
  /** Half the patch's width, in metres. */
  readonly reach: number;
};

function layout(
  patchCells: number,
  cellSize: number,
  recentreStepCells: number,
  heightScale: number,
): GrassLayout {
  return {
    patchCells,
    cellSize,
    recentreStepCells,
    heightScale,
    bladeCount: patchCells * patchCells,
    reach: (patchCells * cellSize) / 2,
  };
}

/**
 * Underfoot: 0.09 m apart is more than twice a blade's width, so blades overlap
 * into a mat. About 123 per square metre, over 40 m.
 */
export const NEAR_GRASS = layout(448, 0.09, 16, 1);

/**
 * To the horizon: the same number of blades spread over eight times the ground,
 * so about 13 per square metre over 107 m.
 *
 * Sparse close up and convincing far away, which is the only place it is seen.
 * Looking at the horizon you see grass at a grazing angle, and blades that
 * stand well apart on the ground still overlap completely from there. They are
 * drawn half as tall again to help, which also hides the join with the dense
 * patch.
 */
export const FAR_GRASS = layout(384, 0.28, 24, 1.5);

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

export function shapeForCell(
  cellX: number,
  cellZ: number,
  out: BladeShape,
  grass: GrassLayout,
): void {
  out.offsetX = (hash(cellX, cellZ, 0x9e37) - 0.5) * grass.cellSize;
  out.offsetZ = (hash(cellX, cellZ, 0x85eb) - 0.5) * grass.cellSize;
  out.yaw = hash(cellX, cellZ, 0xc2b2) * Math.PI * 2;
  out.height = (HEIGHT_MIN + hash(cellX, cellZ, 0x27d4) * HEIGHT_RANGE) * grass.heightScale;
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
