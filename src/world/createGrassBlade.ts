import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

/** Blade height in metres. Ankle high: tall enough to read, short enough to see over. */
export const BLADE_HEIGHT = 0.34;
const BASE_WIDTH = 0.055;
const MID_WIDTH = 0.034;
/** The blade leans forward slightly, so a field of them is not a bed of nails. */
const MID_LEAN = 0.02;
const TIP_LEAN = 0.06;

const BASE_COLOUR = [0.16, 0.3, 0.11] as const;
const TIP_COLOUR = [0.45, 0.66, 0.26] as const;

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

  const halfBase = BASE_WIDTH / 2;
  const halfMid = MID_WIDTH / 2;
  const midHeight = BLADE_HEIGHT * 0.55;

  const data = new VertexData();
  data.positions = [
    -halfBase,
    0,
    0,
    halfBase,
    0,
    0,
    -halfMid,
    midHeight,
    MID_LEAN,
    halfMid,
    midHeight,
    MID_LEAN,
    0,
    BLADE_HEIGHT,
    TIP_LEAN,
  ];
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
  data.applyToMesh(mesh);

  const material = new StandardMaterial("grass-material", scene);
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
