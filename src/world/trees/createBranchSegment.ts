import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { addFlatTriangle, type TriangleBuffers } from "../houses/addFlatTriangle";
import { SEGMENT_TAPER } from "./branchSpec";

/** Faces around the segment. Six is enough for something this thin. */
const SIDES = 6;
// Baked into the mesh rather than set per branch, because a thin instance can
// only be scaled, not reshaped. The grower uses the same number.

/**
 * One length of branch: a six-sided tapered tube standing on the origin,
 * one metre tall and one metre across at the base.
 *
 * Every branch in a tree is this mesh, scaled and turned. Instancing it is what
 * lets four hundred of them cost one draw call.
 */
export function createBranchSegment(name: string, scene: Scene): Mesh {
  const buffers: TriangleBuffers = { positions: [], normals: [], indices: [] };
  const centre = new Vector3(0, 0.5, 0);
  const ring = (index: number, y: number, radius: number): Vector3 => {
    const angle = (index / SIDES) * Math.PI * 2;
    return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  };

  for (let side = 0; side < SIDES; side += 1) {
    const baseNear = ring(side, 0, 1);
    const baseFar = ring(side + 1, 0, 1);
    const tipNear = ring(side, 1, SEGMENT_TAPER);
    const tipFar = ring(side + 1, 1, SEGMENT_TAPER);
    addFlatTriangle(buffers, centre, baseNear, baseFar, tipFar);
    addFlatTriangle(buffers, centre, baseNear, tipFar, tipNear);
    // Capped at the top, or the outermost twigs are visibly hollow tubes.
    addFlatTriangle(buffers, centre, tipNear, tipFar, new Vector3(0, 1, 0));
  }

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = buffers.positions;
  data.normals = buffers.normals;
  data.indices = buffers.indices;
  data.applyToMesh(mesh);
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  return mesh;
}
