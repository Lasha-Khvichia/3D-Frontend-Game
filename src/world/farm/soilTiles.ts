import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Ground } from "../terrain/Ground";
import { cellXOf, cellZOf, middleOf, SOIL_CELL } from "./tilledField";

/** How far a tile stands proud of the ground, and how deep its skirt hangs. */
const PROUD = 0.04;
const DEEP = 0.22;
/** A hair wider than its square, so neighbouring tiles meet with no seam. */
const OVERLAP = 1.02;

const turn = new Quaternion();
const size = new Vector3();
const at = new Vector3();
const placed = new Matrix();

/**
 * Lays one thin instance of the soil tile on every broken square near the
 * player, and gives each its own colour.
 *
 * Only the squares within reach are laid: a field tilled on the far side of
 * the island is still remembered, it is simply not drawn, the same rule the
 * stones and the houses follow.
 *
 * The tile is flat and the ground is not, so each is turned to lie along the
 * slope under it. Tilling is only allowed on gentle ground, which is what
 * keeps that honest.
 */
export function laySoil(
  keys: readonly number[],
  ground: Ground,
  focusX: number,
  focusZ: number,
  reach: number,
  matrices: Float32Array,
  colours: Float32Array,
): number {
  const slope = { x: 0, z: 0 };
  let count = 0;
  for (const key of keys) {
    if (count * 16 >= matrices.length) return count;
    const x = middleOf(cellXOf(key));
    const z = middleOf(cellZOf(key));
    if (Math.hypot(x - focusX, z - focusZ) > reach) continue;

    ground.slopeAt(x, z, slope);
    size.set(SOIL_CELL * OVERLAP, PROUD + DEEP, SOIL_CELL * OVERLAP);
    Quaternion.RotationYawPitchRollToRef(0, Math.atan(slope.z), -Math.atan(slope.x), turn);
    at.set(x, ground.heightAt(x, z) + PROUD - (PROUD + DEEP) / 2, z);
    Matrix.ComposeToRef(size, turn, at, placed).copyToArray(matrices, count * 16);

    const dark = 0.9 + hash(cellXOf(key), cellZOf(key)) * 0.2;
    colours.set([dark, dark, dark, 1], count * 4);
    count += 1;
  }
  return count;
}

/** The same trick the grass uses: a repeatable number from a square of ground. */
function hash(x: number, z: number): number {
  let value = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ 0x51ab;
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
