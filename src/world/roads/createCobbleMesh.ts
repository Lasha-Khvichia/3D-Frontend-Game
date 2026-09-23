import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";

/** Sides round a stone, and how much narrower its crown is than its base. */
const SIDES = 6;
const CROWN = 0.72;

/**
 * One cobble: a six-sided stone, wider at the bottom than the top, one unit
 * across and one tall so a thin instance can size it as it likes.
 *
 * Tapered rather than square, because a box laid in a street reads as a tile
 * dropped on it: the eye reads the shading down a stone's sides as its
 * roundness, and a box has none to read.
 */
export function createCobbleMesh(scene: Scene): Mesh {
  const mesh = new Mesh("cobble", scene);
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let side = 0; side < SIDES; side += 1) {
    const from = (side / SIDES) * Math.PI * 2;
    const to = ((side + 1) / SIDES) * Math.PI * 2;
    const corners = [
      [Math.cos(from) / 2, Math.sin(from) / 2],
      [Math.cos(to) / 2, Math.sin(to) / 2],
    ] as const;
    const base = positions.length / 3;
    for (const [x, z] of corners) {
      positions.push(x, -0.5, z);
      normals.push(x * 2, 0.35, z * 2);
    }
    for (const [x, z] of corners) {
      positions.push(x * CROWN, 0.5, z * CROWN);
      normals.push(x * 2, 0.35, z * 2);
    }
    // Babylon winds a front face the opposite way to the usual rule: on its
    // own box every triangle's wound normal points inward. Checked against one.
    indices.push(base, base + 3, base + 2, base, base + 1, base + 3);
  }

  const crown = positions.length / 3;
  positions.push(0, 0.5, 0);
  normals.push(0, 1, 0);
  for (let side = 0; side < SIDES; side += 1) {
    const angle = (side / SIDES) * Math.PI * 2;
    positions.push((Math.cos(angle) / 2) * CROWN, 0.5, (Math.sin(angle) / 2) * CROWN);
    normals.push(0, 1, 0);
  }
  for (let side = 0; side < SIDES; side += 1) {
    const next = ((side + 1) % SIDES) + crown + 1;
    indices.push(crown, side + crown + 1, next);
  }

  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.indices = indices;
  data.applyToMesh(mesh);
  return mesh;
}
