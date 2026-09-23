import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { GrassSoil } from "../GrassField";
import { FLOWER_HEIGHT } from "./createFlowerMesh";

/** Metres between one possible flower and the next, and how far they are placed round the player. */
export const FLOWER_CELL = 1.4;
export const FLOWER_REACH = 26;
/** At the height of summer, this share of the cells has a flower in it. */
const THICKEST = 0.5;

/** What grows here: a meadow's worth of white, yellow, blue, pink and poppy red. */
const PETALS: readonly Color3[] = [
  new Color3(0.95, 0.95, 0.88),
  new Color3(0.95, 0.85, 0.3),
  new Color3(0.55, 0.62, 0.9),
  new Color3(0.9, 0.62, 0.78),
  new Color3(0.85, 0.24, 0.16),
];

const turn = new Quaternion();
const size = new Vector3(1, 1, 1);
const at = new Vector3();
const placed = new Matrix();

/**
 * Fills the buffers with every flower standing round `centre` right now, and
 * says how many there are.
 *
 * Where a flower can grow is a hash of its square of ground, exactly as a
 * grass blade's place is, so the same ground always grows the same flowers and
 * nothing has to be remembered as the player walks. How many of them are out
 * is the season's, and each opens at its own moment across the spring.
 */
export function fillFlowers(
  centre: Vector3,
  open: number,
  soil: GrassSoil,
  grassLeftAt: (x: number, z: number) => number,
  matrices: Float32Array,
  colours: Float32Array,
): number {
  const cells = Math.floor(FLOWER_REACH / FLOWER_CELL);
  const middleX = Math.round(centre.x / FLOWER_CELL);
  const middleZ = Math.round(centre.z / FLOWER_CELL);
  let count = 0;
  for (let row = -cells; row <= cells; row += 1) {
    for (let column = -cells; column <= cells; column += 1) {
      const cellX = middleX + column;
      const cellZ = middleZ + row;
      const chance = hash(cellX, cellZ, 0x51ed);
      if (chance > THICKEST * open) continue;
      const x = cellX * FLOWER_CELL + (hash(cellX, cellZ, 0x2f9b) - 0.5) * FLOWER_CELL;
      const z = cellZ * FLOWER_CELL + (hash(cellX, cellZ, 0x7b41) - 0.5) * FLOWER_CELL;
      if (!soil.growsAt(x, z) || grassLeftAt(x, z) < 0.9) continue;
      if (count * 16 >= matrices.length) return count;
      at.set(x, soil.heightAt(x, z) + FLOWER_HEIGHT, z);
      Quaternion.RotationYawPitchRollToRef(hash(cellX, cellZ, 0x11c7) * Math.PI, 0, 0, turn);
      Matrix.ComposeToRef(size, turn, at, placed).copyToArray(matrices, count * 16);
      const petal = PETALS[Math.floor(hash(cellX, cellZ, 0x93d1) * PETALS.length)] ?? PETALS[0]!;
      colours.set([petal.r, petal.g, petal.b, 1], count * 4);
      count += 1;
    }
  }
  return count;
}

/** The same trick the grass uses: a repeatable number from a square of ground. */
function hash(x: number, z: number, salt: number): number {
  let value = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ salt;
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
