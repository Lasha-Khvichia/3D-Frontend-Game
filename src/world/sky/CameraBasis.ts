import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";

const RIGHT = Vector3.Right();
const UP = Vector3.Up();
const FORWARD = Vector3.Forward();

/**
 * Which way a camera faces and how wide it sees — all it takes to turn a
 * pixel into a ray, and a ray back into a pixel.
 *
 * The cloud pass makes rays from this, the veil turns rays back into pixels
 * with it, and last frame's copy is how the pass finds where each cloud was.
 * The vectors are updated in place so shader materials holding them see the
 * change without being told.
 */
export class CameraBasis {
  readonly right = new Vector3(1, 0, 0);
  readonly up = new Vector3(0, 1, 0);
  readonly forward = new Vector3(0, 0, 1);
  /** Tangent of half the field of view, across and up. */
  readonly tanHalf = new Vector2(1, 1);

  readFrom(camera: Camera, engine: AbstractEngine): void {
    camera.getDirectionToRef(RIGHT, this.right);
    camera.getDirectionToRef(UP, this.up);
    camera.getDirectionToRef(FORWARD, this.forward);
    const upward = Math.tan(camera.fov / 2);
    this.tanHalf.set(upward * engine.getAspectRatio(camera), upward);
  }

  copyFrom(other: CameraBasis): void {
    this.right.copyFrom(other.right);
    this.up.copyFrom(other.up);
    this.forward.copyFrom(other.forward);
    this.tanHalf.copyFrom(other.tanHalf);
  }
}
