import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { buildHouse, type House } from "./buildHouse";
import { VILLAGE_HOUSES } from "./villageHouses";

/**
 * Builds the whole village from code. Nothing is downloaded.
 *
 * Phase 0: shells only. Walls, doorways, window holes and roofs, in one plain
 * colour each. Doors, shutters, stone and timber detail come in later phases,
 * and every one of them hangs off the same blueprints.
 *
 * Shadows and grass are not touched here. The caller owns those systems, and
 * every house it needs is in what comes back.
 */
export function buildVillage(scene: Scene): House[] {
  const materials = {
    walls: createMaterial(scene, "house-walls", new Color3(0.62, 0.58, 0.5)),
    roof: createMaterial(scene, "house-roof", new Color3(0.34, 0.24, 0.19)),
  };

  return VILLAGE_HOUSES.map(({ blueprint, centreX, centreZ }) =>
    buildHouse(scene, blueprint, centreX, centreZ, materials),
  );
}

function createMaterial(scene: Scene, name: string, colour: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = colour;
  // Specular on a big flat wall under a moving sun reads as a smear of gloss.
  material.specularColor = Color3.Black();
  return material;
}
