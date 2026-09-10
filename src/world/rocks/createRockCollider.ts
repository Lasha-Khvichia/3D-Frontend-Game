import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { addFlatTriangle, type TriangleBuffers } from "../houses/addFlatTriangle";

/**
 * The solid a rock is bumped into and stood on: an invisible upright prism
 * round the rock's outline, plumb sides and a level top.
 *
 * Two properties are the whole point, and both were learned the hard way:
 *
 * - **Plumb sides.** Babylon's solver slides the player along whatever it
 *   hits, and against a rounded rock that slide runs downward. With the ground
 *   out of the solver nothing stopped it, and the player sank under the
 *   stone's edge. A vertical wall can only slide them sideways.
 * - **No material.** Babylon tests both sides of every face on a mesh that has
 *   a material, so a player who got inside a rock found a wall in every
 *   direction and could not move. This mesh has none, so only its outer faces
 *   collide: from inside, every way is out.
 *
 * `outline` goes round the rock, in world coordinates, and must be
 * star-shaped about `middle` — each face is wound to point away from it.
 */
export function createRockCollider(
  scene: Scene,
  name: string,
  outline: readonly (readonly [number, number])[],
  middle: readonly [number, number],
  bottomY: number,
  topY: number,
): Mesh {
  const buffers: TriangleBuffers = { positions: [], normals: [], indices: [] };
  const inside = new Vector3(middle[0], (bottomY + topY) / 2, middle[1]);
  const at = (point: readonly [number, number], y: number): Vector3 =>
    new Vector3(point[0], y, point[1]);
  const topMiddle = at(middle, topY);
  const bottomMiddle = at(middle, bottomY);

  outline.forEach((here, index) => {
    const next = outline[(index + 1) % outline.length]!;
    addFlatTriangle(buffers, inside, at(here, bottomY), at(next, bottomY), at(next, topY));
    addFlatTriangle(buffers, inside, at(here, bottomY), at(next, topY), at(here, topY));
    // Fanned from the middle, not from a corner: a rock's outline is rarely
    // convex, and a fan from a corner of a dented outline crosses itself.
    addFlatTriangle(buffers, inside, topMiddle, at(here, topY), at(next, topY));
    addFlatTriangle(buffers, inside, bottomMiddle, at(here, bottomY), at(next, bottomY));
  });

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = buffers.positions;
  data.indices = buffers.indices;
  data.applyToMesh(mesh);
  mesh.isVisible = false;
  mesh.isPickable = false;
  mesh.checkCollisions = true;
  mesh.freezeWorldMatrix();
  return mesh;
}
