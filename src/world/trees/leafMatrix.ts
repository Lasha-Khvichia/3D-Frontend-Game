import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { LeafSpec } from "./scatterLeaves";

const UP = new Vector3(0, 1, 0);

/** Working objects, held once so composing a leaf allocates nothing. */
export type LeafScratch = {
  readonly scale: Vector3;
  readonly aim: Quaternion;
  readonly roll: Quaternion;
  readonly turn: Quaternion;
  readonly matrix: Matrix;
};

export function createLeafScratch(): LeafScratch {
  return {
    scale: new Vector3(),
    aim: new Quaternion(),
    roll: new Quaternion(),
    turn: new Quaternion(),
    matrix: new Matrix(),
  };
}

/** Spins a leaf about its own stalk, aims it, sizes it, and puts it in place. */
export function composeLeafMatrix(spec: LeafSpec, size: number, scratch: LeafScratch): Matrix {
  Quaternion.FromUnitVectorsToRef(UP, spec.direction, scratch.aim);
  Quaternion.RotationAxisToRef(UP, spec.roll, scratch.roll);
  // a.multiplyToRef(b) applies b first: spin about the stalk, then aim.
  scratch.aim.multiplyToRef(scratch.roll, scratch.turn);
  scratch.scale.set(size, size, size);
  Matrix.ComposeToRef(scratch.scale, scratch.turn, spec.position, scratch.matrix);
  return scratch.matrix;
}
