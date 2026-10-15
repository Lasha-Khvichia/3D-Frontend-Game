import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

/**
 * What the sword is made of. Polished steel takes a tight, bright highlight;
 * the blued guard a duller one; brass a warm one; leather almost none — which
 * is most of what tells them apart at the size a sword is held.
 */
export function swordMetals(scene: Scene) {
  return {
    steel: metal(scene, "sword-steel", new Color3(0.74, 0.77, 0.82), 0.95, 110),
    blued: metal(scene, "sword-guard", new Color3(0.2, 0.22, 0.27), 0.6, 60),
    brass: metal(scene, "sword-brass", new Color3(0.78, 0.57, 0.22), 0.65, 45),
    leather: metal(scene, "sword-grip", new Color3(0.2, 0.11, 0.06), 0.06, 8),
  };
}

function metal(scene: Scene, name: string, colour: Color3, shine: number, tight: number) {
  const made = new StandardMaterial(name, scene);
  made.diffuseColor = colour;
  made.specularColor = new Color3(shine, shine, shine * 1.02);
  made.specularPower = tight;
  return made;
}
