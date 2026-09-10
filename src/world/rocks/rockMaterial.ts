import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

/**
 * One weathered grey for every rock in the world.
 *
 * The rock is not all one colour on screen, but the variation is in the mesh
 * rather than here: each face carries a vertex colour that multiplies this
 * one, darker at the foot of a cliff and green on the tops where grass would
 * take hold. Doing it that way keeps a whole formation to a single draw call,
 * where a second material for the grass would double it.
 *
 * It also fails safe. If vertex colours ever stop being applied, every cliff
 * comes out plain rock grey, which is wrong but not broken.
 */
export function createRockMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("rock", scene);
  material.diffuseColor = new Color3(0.7, 0.67, 0.62);
  // Specular on a big rock face under a moving sun reads as wet plastic.
  material.specularColor = Color3.Black();
  return material;
}
