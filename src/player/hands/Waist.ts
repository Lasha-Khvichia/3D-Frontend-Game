import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { createBelt } from "./createBelt";

/** Metres from the eye down to the belt: eye 1.62 m, waist about 1 m. */
const BELOW_THE_EYE = 0.62;

const tilt = new Quaternion();

/**
 * Your waist: a frame that turns with your body but not with your head, and
 * the belt round it.
 *
 * It hangs off the camera, so it is smoothed between steps with everything
 * else in your hands, and each drawn frame it is turned back by exactly the
 * camera's tilt and roll. Look down and the belt is below you where it should
 * be; look up and it does not swing up after your eyes.
 */
export class Waist {
  readonly node: TransformNode;
  readonly belt: readonly Mesh[];

  constructor(
    scene: Scene,
    private readonly camera: Camera & { rotation: { x: number; z: number } },
  ) {
    this.node = new TransformNode("waist", scene);
    this.node.parent = camera;
    this.node.rotationQuaternion = Quaternion.Identity();
    this.belt = createBelt(scene);
    for (const mesh of this.belt) {
      mesh.parent = this.node;
      mesh.position.y -= BELOW_THE_EYE;
    }
  }

  /** Once per drawn frame, after the camera has been turned. */
  present(): void {
    Quaternion.RotationYawPitchRollToRef(0, this.camera.rotation.x, this.camera.rotation.z, tilt);
    // A unit quaternion's inverse is its conjugate.
    tilt.conjugateToRef(this.node.rotationQuaternion!);
  }
}

export { BELOW_THE_EYE };
