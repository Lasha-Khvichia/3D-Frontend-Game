import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { buildHouse, type House } from "./buildHouse";
import { VILLAGE_HOUSES } from "./villageHouses";

/**
 * Builds the whole village from code. Nothing is downloaded.
 *
 * Phase 0 built the shells. Phase 1 dresses them: a stone plinth along the
 * foot of every wall, single stones showing through the plaster above it,
 * dressed blocks up each corner, and timber over the openings and under the
 * eaves. Doors and fireplaces come later, off the same blueprints.
 *
 * Shadows and grass are not touched here. The caller owns those systems, and
 * every house it needs is in what comes back.
 */
export function buildVillage(scene: Scene): House[] {
  // Lime-plastered walls, weathered stone, dark oak, and a roof somewhere
  // between thatch and shingle. Four flat colours: Phase 1 is about shape and
  // material reading apart at a glance, not about texture.
  const materials = {
    walls: createMaterial(scene, "plaster", new Color3(0.72, 0.68, 0.57)),
    roof: makeRoofTwoSided(createMaterial(scene, "roof", new Color3(0.36, 0.27, 0.18))),
    stone: createMaterial(scene, "stone", new Color3(0.46, 0.45, 0.42)),
    timber: createMaterial(scene, "timber", new Color3(0.25, 0.17, 0.11)),
  };

  return VILLAGE_HOUSES.map(({ blueprint, centreX, centreZ }) =>
    buildHouse(scene, blueprint, centreX, centreZ, materials),
  );
}

/**
 * Lets the roof be seen from underneath.
 *
 * A wall is a solid box, so standing in a room you are looking at the box's
 * inner face and it renders normally. The roof is a single sheet with no
 * inside, so with the usual one-sided rendering you would stand in a house and
 * see sky through it.
 *
 * `twoSidedLighting` is deliberately left off. Turning it on flips the normal
 * for the face you are looking at, which is physically right and looks wrong:
 * nothing shines up at a ceiling, so the underside came out pure black. Left
 * off, the underside is lit by the same upward normal as the top, and reads as
 * a plain boarded ceiling.
 */
function makeRoofTwoSided(material: StandardMaterial): StandardMaterial {
  material.backFaceCulling = false;
  return material;
}

function createMaterial(scene: Scene, name: string, colour: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = colour;
  // Specular on a big flat wall under a moving sun reads as a smear of gloss.
  material.specularColor = Color3.Black();
  return material;
}
