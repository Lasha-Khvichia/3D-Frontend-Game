import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

/** Blade height in metres. Shin high, so the field has depth to walk into. */
export const BLADE_HEIGHT = 0.46;
const BASE_WIDTH = 0.042;
const MID_WIDTH = 0.024;
/** The blade curves forward, so a field of them is not a bed of nails. */
const MID_LEAN = 0.035;
const TIP_LEAN = 0.135;

// Deep at the root where light does not reach, lighter and slightly yellow at
// the tip. Cooler and richer than the first pass, which read as astroturf.
const BASE_COLOUR = [0.09, 0.21, 0.08] as const;
const TIP_COLOUR = [0.38, 0.62, 0.21] as const;

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
  // Updatable: the sway rewrites these five vertices every frame.
  data.applyToMesh(mesh, true);

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
 */
export function swayGrassBlade(mesh: Mesh, seconds: number): void {
  swayTime += seconds;

  const forward = Math.sin((swayTime / SWAY_PERIOD) * Math.PI * 2) * SWAY_REACH;
  const sideways = Math.sin((swayTime / SWAY_SIDE_PERIOD) * Math.PI * 2) * SWAY_SIDE_REACH;

  const halfBase = BASE_WIDTH / 2;
  const halfMid = MID_WIDTH / 2;
  const midHeight = BLADE_HEIGHT * 0.55;
  // The base stays planted; the bend grows towards the tip.
  const midForward = MID_LEAN + forward * 0.32;
  const midSide = sideways * 0.32;
  const tipForward = TIP_LEAN + forward;
  const tipSide = sideways;

  swayPositions.set([
    -halfBase,
    0,
    0,
    halfBase,
    0,
    0,
    -halfMid + midSide,
    midHeight,
    midForward,
    halfMid + midSide,
    midHeight,
    midForward,
    tipSide,
    BLADE_HEIGHT,
    tipForward,
  ]);
  mesh.updateVerticesData(VertexBuffer.PositionKind, swayPositions);
}
