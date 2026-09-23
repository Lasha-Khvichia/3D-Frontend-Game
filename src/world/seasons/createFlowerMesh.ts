import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";

/** A bloom is this far across, and stands this high: among the tips of the grass, not under them. */
const ACROSS = 0.11;
export const FLOWER_HEIGHT = 0.3;

/**
 * One wildflower head: two little squares crossed through each other, so it
 * reads as a bloom from any side without a texture or any sorting.
 *
 * The colour comes from the thin instance, not from here, which is what lets
 * one mesh be a meadow of white, yellow, blue and red at one draw call. Its
 * normals point up, like the grass blades', so a field of them is lit as
 * ground and not as a thousand little billboards.
 */
export function createFlowerMesh(scene: Scene): Mesh {
  const mesh = new Mesh("wildflower", scene);
  const data = new VertexData();
  const half = ACROSS / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  for (const across of [0, 1]) {
    const [dx, dz] = across === 0 ? [half, 0] : [0, half];
    const base = across * 4;
    positions.push(-dx, -half, -dz, dx, -half, dz, dx, half, dz, -dx, half, -dz);
    for (let corner = 0; corner < 4; corner += 1) {
      normals.push(0, 1, 0);
      colors.push(1, 1, 1, 1);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  Object.assign(data, { positions, normals, indices, colors });
  data.applyToMesh(mesh);

  const material = new StandardMaterial("wildflower", scene);
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  material.backFaceCulling = false;
  mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  // Far too small for the mini-map, like the grass it grows in.
  mesh.layerMask = FINE_DETAIL_LAYER;
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}
