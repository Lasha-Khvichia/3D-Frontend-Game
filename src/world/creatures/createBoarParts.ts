import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";

/** Where each leg joins the body, from the boar's feet: front pair, then back. */
export const HIPS = [
  [0.17, 0.43, 0.34],
  [-0.17, 0.43, 0.34],
  [0.17, 0.43, -0.34],
  [-0.17, 0.43, -0.34],
] as const;

type Part = [
  w: number,
  h: number,
  l: number,
  x: number,
  y: number,
  z: number,
  tilt?: number,
  lean?: number,
];

/** A wild boar, about 1.4 m nose to tail and 0.9 m at the shoulder: deep in the chest, low at the back. */
const BODY: Part[] = [
  [0.5, 0.58, 1.05, 0, 0.64, 0],
  [0.36, 0.4, 0.42, 0, 0.6, 0.66, 0.35],
  [0.2, 0.17, 0.2, 0, 0.43, 0.92],
  [0.08, 0.14, 0.04, 0.13, 0.84, 0.56, 0, -0.4],
  [0.08, 0.14, 0.04, -0.13, 0.84, 0.56, 0, 0.4],
  [0.08, 0.1, 0.9, 0, 0.95, -0.02],
  [0.04, 0.22, 0.04, 0, 0.7, -0.55, -0.5],
];
const TUSKS: Part[] = [
  [0.03, 0.1, 0.03, 0.09, 0.44, 0.97, -0.6, -0.3],
  [0.03, 0.1, 0.03, -0.09, 0.44, 0.97, -0.6, 0.3],
];

/**
 * The parts every boar is drawn from: a body, a leg (drawn four times each),
 * and a pair of tusks. Three meshes, each a template for thin instances, so
 * every boar on the island costs three draw calls between them.
 *
 * Built from Babylon's own boxes, so the winding is Babylon's own. The leg's
 * top is its origin, so it swings from the hip.
 */
export function createBoarParts(scene: Scene): { body: Mesh; leg: Mesh; tusks: Mesh } {
  const hide = colour(scene, "boar-hide", new Color3(0.4, 0.29, 0.19));
  const hoof = colour(scene, "boar-legs", new Color3(0.22, 0.15, 0.1));
  const ivory = colour(scene, "boar-tusks", new Color3(0.88, 0.84, 0.72));

  const leg = CreateBox("boar-leg", { width: 0.1, height: 0.43, depth: 0.11 }, scene);
  leg.position.y = -0.215;
  leg.bakeCurrentTransformIntoVertices();
  leg.material = hoof;

  return {
    body: merged(scene, "boar-body", BODY, hide),
    leg,
    tusks: merged(scene, "boar-tusks", TUSKS, ivory),
  };
}

function merged(scene: Scene, name: string, parts: Part[], material: StandardMaterial): Mesh {
  const boxes = parts.map(([width, height, depth, x, y, z, tilt = 0, lean = 0]) => {
    const box = CreateBox(name, { width, height, depth }, scene);
    box.position.set(x, y, z);
    box.rotation.set(tilt, 0, lean);
    return box;
  });
  const mesh = Mesh.MergeMeshes(boxes, true, true);
  if (!mesh) throw new Error(`${name} would not merge`);
  mesh.name = name;
  mesh.material = material;
  return mesh;
}

function colour(scene: Scene, name: string, diffuse: Color3): StandardMaterial {
  const made = new StandardMaterial(name, scene);
  made.diffuseColor = diffuse;
  made.specularColor = new Color3(0.04, 0.04, 0.04);
  return made;
}
