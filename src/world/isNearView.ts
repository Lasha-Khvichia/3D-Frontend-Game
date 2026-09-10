import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

const forward = new Vector3();

/**
 * Whether a direction from the eye lands on screen, or within `margin`
 * radians of its edge. For skipping a pass whose whole effect is centred on
 * something out of sight — the sun's halo, its shafts — which otherwise
 * redraws the world every frame to add nothing.
 *
 * Tests against the screen's corners, the farthest a visible point can sit
 * from the centre, so it errs towards drawing.
 */
export function isNearView(camera: Camera, direction: Vector3, margin: number): boolean {
  camera.getDirectionToRef(Axis.Z, forward);
  const aspect = camera.getEngine().getAspectRatio(camera);
  // Babylon's field of view is vertical.
  const tanHalf = Math.tan(camera.fov / 2);
  const corner = Math.atan(tanHalf * Math.sqrt(1 + aspect * aspect));
  const along = Vector3.Dot(forward, direction) / Math.max(1e-6, direction.length());
  return along >= Math.cos(Math.min(Math.PI, corner + margin));
}
