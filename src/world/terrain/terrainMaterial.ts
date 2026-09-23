import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { frostSurface } from "../seasons/FrostPlugin";
import { wetSurface } from "../weather/wet/WetGroundPlugin";
import { snowSurface } from "../weather/snow/SnowGroundPlugin";

/**
 * The one material every patch of ground shares.
 *
 * White, because the colour of the ground is all in its vertices and this
 * multiplies it. Rain darkens it and stands in puddles on the flat of it,
 * frost whitens what faces the sky, and snow lies over both: **snow must come
 * after the wet**, whose roof test and wetness it reads.
 */
export function terrainMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("terrain", scene);
  wetSurface(material, true);
  frostSurface(material);
  snowSurface(material);
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  return material;
}
