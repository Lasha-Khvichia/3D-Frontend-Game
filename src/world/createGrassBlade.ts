import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { wetSurface } from "./weather/wet/WetGroundPlugin";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { placeBladeVertices } from "./grassBladeShape";

export { BLADE_HEIGHT } from "./grassBladeShape";

// Deep at the root where light does not reach, lighter and slightly yellow at
// the tip. Cooler and richer than the first pass, which read as astroturf.
export const BASE_COLOUR = [0.09, 0.21, 0.08] as const;
export const TIP_COLOUR = [0.38, 0.62, 0.21] as const;

/**
 * One grass blade, with its pivot at the base so leaning it is a rotation.
 *
 * Five vertices and three triangles. Every blade in the field is a thin
 * instance of this one mesh, so the whole field is a single draw call.
 *
 * Normals point straight up rather than out of the blade's face. Grass lit like
 * the ground under it reads as a field; grass lit like thousands of little
 * billboards reads as half of them being black. That choice is why two-sided
 * lighting has to stay off below.
 */
export function createGrassBlade(scene: Scene): Mesh {
  const mesh = new Mesh("grass-blade", scene);

  const data = new VertexData();
  const positions: number[] = [];
  placeBladeVertices(0, 0, 1, positions);
  data.positions = positions;
  data.indices = [0, 2, 1, 1, 2, 3, 2, 4, 3];
  data.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  data.colors = [
    ...BASE_COLOUR,
    1,
    ...BASE_COLOUR,
    1,
    ...mixColour(0.55),
    1,
    ...mixColour(0.55),
    1,
    ...TIP_COLOUR,
    1,
  ];
  // Updatable: the sway rewrites these five vertices every frame.
  data.applyToMesh(mesh, true);

  const material = new StandardMaterial("grass-material", scene);
  // Wet grass darkens too, though it sheds most of the rain and holds no puddles.
  wetSurface(material, false);
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  material.emissiveColor = Color3.Black();
  // Blades are flat, so both faces have to be drawn.
  material.backFaceCulling = false;
  // But NOT two-sided lighting. It compiles to
  //   normalW = gl_FrontFacing ? normalW : -normalW;
  // which is right when normals point out of a face, and wrong here: ours
  // point straight up, so flipping them points them straight down, and every
  // blade seen from behind goes black under a sun that is above it.
  material.twoSidedLighting = false;
  mesh.material = material;

  mesh.isPickable = false;
  mesh.receiveShadows = true;
  // Never a shadow caster: the frustum auto-fits around casters, and 9,000
  // blades spread over 40 m would blow it up and blur the player's own shadow.
  mesh.alwaysSelectAsActiveMesh = true;

  return mesh;
}

function mixColour(amount: number): [number, number, number] {
  return [
    BASE_COLOUR[0] + (TIP_COLOUR[0] - BASE_COLOUR[0]) * amount,
    BASE_COLOUR[1] + (TIP_COLOUR[1] - BASE_COLOUR[1]) * amount,
    BASE_COLOUR[2] + (TIP_COLOUR[2] - BASE_COLOUR[2]) * amount,
  ];
}
