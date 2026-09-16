import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { placeBladeVertices } from "./grassBladeShape";

/** Seconds for one full breath of the breeze. Slow on purpose. */
const SWAY_PERIOD = 3.4;
/** How far the tip drifts, in metres. A rustle, not a gale. */
const SWAY_REACH = 0.045;
/** The sideways drift runs at a different rate, so the tip traces a figure. */
const SWAY_SIDE_PERIOD = 5.1;
const SWAY_SIDE_REACH = 0.026;

let swayTime = 0;
const swayPositions = new Float32Array(15);

/**
 * A gentle breeze, animated on the blade mesh itself rather than per blade.
 *
 * Every blade in the field is a thin instance of this one mesh, so moving these
 * five vertices moves all of them, on the GPU, every frame. Doing it per blade
 * instead means rewriting 200,000 transforms, which is far too slow to run each
 * frame: refreshing them in slices is what made the grass look like it lagged.
 *
 * Because each blade carries its own yaw, they do not all lean the same way.
 * The field rustles rather than tilting as one slab.
 *
 * Takes every blade mesh at once, because the clock advances inside it. Called
 * once per mesh, the near and far patches would run at different speeds.
 */
export function swayGrassBlade(
  meshes: readonly Mesh[],
  seconds: number,
  strength = 1,
  buried = 0,
): void {
  // A stronger wind swings the blades further and quicker.
  swayTime += seconds * (0.7 + 0.3 * strength);

  const forward = Math.sin((swayTime / SWAY_PERIOD) * Math.PI * 2) * SWAY_REACH * strength;
  const sideways =
    Math.sin((swayTime / SWAY_SIDE_PERIOD) * Math.PI * 2) * SWAY_SIDE_REACH * strength;

  // Snow buries a blade from the bottom.
  placeBladeVertices(forward, sideways, Math.max(0, 1 - buried), swayPositions);
  for (const mesh of meshes) mesh.updateVerticesData(VertexBuffer.PositionKind, swayPositions);
}
