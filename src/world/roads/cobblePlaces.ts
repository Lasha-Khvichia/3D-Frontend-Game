import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { roadShareAt } from "./roadField";
import { villageStreet } from "./villageStreet";

/** Metres between one stone and the next, and how much of that gap each stone fills. */
const APART = 0.42;
const SIZE = 1.14;
/** How far a stone stands proud of the ground, and how deep it is bedded in. */
const PROUD = 0.035;
const DEEP = 0.14;
/** Only the worn middle of the street is paved; the edges are left to the dirt. */
const PAVED = 0.75;

const turn = new Quaternion();
const size = new Vector3();
const at = new Vector3();
const placed = new Matrix();

/**
 * Lays the cobbles of the village street: one stone to a small square of
 * ground, each turned and sized a little differently, and each sunk into the
 * ground so only its crown shows.
 *
 * Where a stone goes is hashed from its square, as a grass blade's place is,
 * so the street is the same every time it is built and nothing has to be
 * remembered. Stones follow the ground, which is flat here but need not be.
 */
export function layCobbles(
  heightAt: (x: number, z: number) => number,
  matrices: Float32Array,
  colours: Float32Array,
): number {
  const street = villageStreet();
  let count = 0;
  for (let x = street.westX; x <= street.eastX; x += APART) {
    for (
      let z = street.centreZ - street.halfWidth;
      z <= street.centreZ + street.halfWidth;
      z += APART
    ) {
      const cellX = Math.round(x / APART);
      const cellZ = Math.round(z / APART);
      const stoneX = x + (hash(cellX, cellZ, 0x31a1) - 0.5) * APART * 0.42;
      const stoneZ = z + (hash(cellX, cellZ, 0x6b27) - 0.5) * APART * 0.42;
      if (roadShareAt(stoneX, stoneZ) < PAVED) continue;
      if (count * 16 >= matrices.length) return count;
      const wide = APART * SIZE * (0.86 + hash(cellX, cellZ, 0x1f83) * 0.24);
      const long = APART * SIZE * (0.86 + hash(cellX, cellZ, 0x2c19) * 0.24);
      size.set(wide, PROUD + DEEP, long);
      Quaternion.RotationYawPitchRollToRef(hash(cellX, cellZ, 0x9e11) * Math.PI, 0, 0, turn);
      at.set(stoneX, heightAt(stoneX, stoneZ) + PROUD - (PROUD + DEEP) / 2, stoneZ);
      Matrix.ComposeToRef(size, turn, at, placed).copyToArray(matrices, count * 16);
      const grey = 0.34 + hash(cellX, cellZ, 0x77c5) * 0.2;
      const warm = 1 + (hash(cellX, cellZ, 0x4d2b) - 0.5) * 0.12;
      colours.set([grey * warm, grey, grey / warm, 1], count * 4);
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
