import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { createSeededRandom } from "../../houses/seededRandom";
import { FINE_DETAIL_LAYER } from "../../fineDetailLayer";

/**
 * `count` little quads for rain, snow or splashes to be drawn with, in one
 * mesh and one draw call.
 *
 * No quad is anywhere yet. Each corner carries its drop's own numbers — three
 * in `position` and one in `uv.y`, from `numbers` — and its corner number in
 * `uv.x`; the vertex shader turns those into a place, a fall and a shape
 * every frame. Nothing is sent to the GPU after this, however hard it rains.
 *
 * Babylon cannot know where the shader puts the quads, so the mesh is never
 * culled, picked or shadowed, and is kept off the mini-map with fine detail.
 */
export function createDropMesh(
  scene: Scene,
  name: string,
  count: number,
  numbers: (drop: number) => readonly [number, number, number, number],
): Mesh {
  const positions = new Float32Array(count * 12);
  const uvs = new Float32Array(count * 8);
  const indices = new Uint32Array(count * 6);
  for (let drop = 0; drop < count; drop += 1) {
    const [a, b, c, share] = numbers(drop);
    for (let corner = 0; corner < 4; corner += 1) {
      const vertex = drop * 4 + corner;
      positions.set([a, b, c], vertex * 3);
      uvs.set([corner, share], vertex * 2);
    }
    const first = drop * 4;
    indices.set([first, first + 1, first + 2, first + 1, first + 3, first + 2], drop * 6);
  }
  const data = new VertexData();
  data.positions = positions;
  data.uvs = uvs;
  data.indices = indices;
  const mesh = new Mesh(name, scene);
  data.applyToMesh(mesh, false);
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.doNotSyncBoundingInfo = true;
  mesh.isPickable = false;
  mesh.layerMask = FINE_DETAIL_LAYER;
  mesh.setEnabled(false);
  return mesh;
}

/** Four random numbers a drop, the same every time for the same seed. */
export function randomNumbers(seed: number): () => [number, number, number, number] {
  const random = createSeededRandom(seed);
  return () => [random(), random(), random(), random()];
}
