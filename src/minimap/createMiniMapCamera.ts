import { Camera } from "@babylonjs/core/Cameras/camera";
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { WITHOUT_FINE_DETAIL } from "../world/fineDetailLayer";

export const MINI_MAP_NAME = "minimap-camera";

/**
 * The mini-map camera.
 *
 * Orthographic, not perspective: a map wants a constant scale, so two metres
 * near the edge read the same as two metres at the centre. It also means the
 * chase pose and the overhead pose blend by sliding numbers, with no change of
 * projection part way through.
 *
 * Position, rotation and the orthographic box are all set every frame by
 * MiniMap, so the values here are only a starting point.
 */
export function createMiniMapCamera(scene: Scene): TargetCamera {
  const camera = new TargetCamera(MINI_MAP_NAME, new Vector3(0, 9, -14), scene);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  // Negative on purpose, and only sane because this camera is orthographic.
  //
  // An orthographic camera's rays are parallel, so the bottom of its box is
  // 18 m below the camera itself. Pitched down over the player's shoulder, the
  // ground along that bottom edge lies BEHIND the camera plane, at negative
  // view depth. With the usual small positive near plane it was clipped away,
  // and the bottom 18% of the map showed the first-person view through it.
  //
  // 100 m is comfortably more than the widest the box ever gets (45 m), so
  // nothing the map can contain is ever behind the near plane. Orthographic
  // depth is linear, so the wider range costs no precision worth having.
  camera.minZ = -100;
  camera.maxZ = 400;

  // Without this, Babylon builds the view matrix against the fixed world up of
  // (0, 1, 0). Looking straight down makes that parallel to the view direction,
  // so which way is "up" on the map comes out of floating point noise: the map
  // drifts by tens of degrees and flips as you turn. Deriving the up vector
  // from the camera's own rotation is exact at any pitch.
  camera.updateUpVectorFromRotation = true;

  // Stone and timber detail is smaller than a pixel at map scale: see
  // fineDetailLayer. Skipping it here is a draw call per house for nothing.
  camera.layerMask = WITHOUT_FINE_DETAIL;

  return camera;
}
