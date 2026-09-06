import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { addFlatTriangle, type TriangleBuffers } from "../houses/addFlatTriangle";

/** How far the midrib stands proud, folding the leaf along its length. */
const FOLD = 0.09;

/**
 * One leaf: a pointed blade with a fold down the middle, four triangles.
 *
 * Modelled rather than a flat card with a leaf painted on it in transparency.
 * Cut-out cards need a texture, need sorting when they overlap, and a canopy is
 * nothing but overlapping leaves. Four triangles of real geometry cost less
 * than that and catch the light properly. Published game trees do the same:
 * thirty thousand leaves of four triangles each.
 *
 * The fold matters more than it looks. A flat leaf has one normal, so a whole
 * canopy of them flashes uniformly as the sun moves; folded, the two halves
 * catch light separately and the canopy breaks up.
 */
export function createLeafBlade(name: string, colour: Color3, scene: Scene): Mesh {
  const base = new Vector3(0, 0, 0);
  const right = new Vector3(0.33, 0.45, 0);
  const tip = new Vector3(0, 1, 0);
  const left = new Vector3(-0.33, 0.45, 0);
  const spine = new Vector3(0, 0.45, FOLD);

  const buffers: TriangleBuffers = { positions: [], normals: [], indices: [] };
  // Behind the leaf, so every face is wound to look forward off the front.
  const behind = new Vector3(0, 0.45, -0.6);
  addFlatTriangle(buffers, behind, base, right, spine);
  addFlatTriangle(buffers, behind, right, tip, spine);
  addFlatTriangle(buffers, behind, base, spine, left);
  addFlatTriangle(buffers, behind, left, spine, tip);

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = buffers.positions;
  data.normals = buffers.normals;
  data.indices = buffers.indices;
  data.applyToMesh(mesh);

  const material = new StandardMaterial(`${name}-material`, scene);
  material.diffuseColor = colour;
  material.specularColor = Color3.Black();
  // Leaves are seen from both sides. twoSidedLighting stays off: it flips the
  // normal for the back face, which is right for a solid and wrong here, where
  // a leaf lit from behind should read as lit, not black.
  material.backFaceCulling = false;
  mesh.material = material;

  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.receiveShadows = true;
  return mesh;
}
