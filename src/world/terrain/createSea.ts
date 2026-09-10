import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { VIEW_DISTANCE_METRES } from "../distanceFog";
import { DEEP_SEA_FLOOR, GRID_HALF_EXTENT, SEA_LEVEL } from "./terrainConstants";
import { DEEP } from "./terrainColour";

/** Wide enough that from the edge of the grid there is still sea to the fog. */
const SEA_METRES = (GRID_HALF_EXTENT + VIEW_DISTANCE_METRES) * 2;

/**
 * The sea: one sheet of water to the horizon, and a dark floor under it.
 *
 * Two triangles each, whatever the size. The water is see-through so the
 * sand shows under the shallows — which is also why there has to be a floor.
 * The terrain stops at the edge of its grid, and see-through water over
 * nothing shows the sky, so the open sea would look paler than the bay.
 */
export function createSea(scene: Scene): Mesh[] {
  const water = CreateGround("sea", { width: SEA_METRES, height: SEA_METRES }, scene);
  water.position.y = SEA_LEVEL;
  const surface = new StandardMaterial("sea-water", scene);
  surface.diffuseColor = new Color3(0.1, 0.3, 0.4);
  // Glints of sun on the water are most of what makes it read as water.
  surface.specularColor = new Color3(0.4, 0.4, 0.4);
  surface.specularPower = 96;
  surface.alpha = 0.8;
  water.material = surface;

  const floor = CreateGround("sea-floor", { width: SEA_METRES, height: SEA_METRES }, scene);
  floor.position.y = DEEP_SEA_FLOOR - 0.5;
  const bed = new StandardMaterial("sea-floor", scene);
  // The same colour the terrain paints its own deep seabed, so the join
  // between the two — where terrain squares stop being built — cannot be seen.
  bed.diffuseColor = new Color3(...DEEP);
  bed.specularColor = Color3.Black();
  floor.material = bed;

  for (const mesh of [water, floor]) {
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.freezeWorldMatrix();
  }
  return [water, floor];
}
