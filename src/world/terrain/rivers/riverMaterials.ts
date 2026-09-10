import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { createRockMaterial } from "../../rocks/rockMaterial";

/** Every material the rivers use, made once and shared by all three rivers. */
export function createRiverMaterials(scene: Scene) {
  const water = new StandardMaterial("river-water", scene);
  water.diffuseColor = new Color3(0.14, 0.34, 0.42);
  water.specularColor = new Color3(0.4, 0.4, 0.4);
  water.specularPower = 96;
  water.alpha = 0.78;
  // A ribbon has no inside; drawing both faces means its winding cannot hide it.
  water.backFaceCulling = false;

  const timber = new StandardMaterial("bridge-timber", scene);
  timber.diffuseColor = new Color3(0.42, 0.3, 0.19);
  timber.specularColor = Color3.Black();

  // Unlit, so no sun or firelight can pick out the inside of the black block.
  const darkness = new StandardMaterial("spring-darkness", scene);
  darkness.disableLighting = true;
  darkness.diffuseColor = Color3.Black();
  darkness.specularColor = Color3.Black();

  return { water, timber, darkness, rock: createRockMaterial(scene) };
}
