import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { BranchSpec } from "./branchSpec";
import { treeColliderBoxes } from "./treeColliderBoxes";

/**
 * How many pieces the shell is cut into for collision testing.
 *
 * Babylon checks a bounding box per submesh before it looks at any triangle, so
 * cutting the shell up means standing next to a tree tests the few hundred
 * triangles actually near the player instead of all four thousand.
 */
const SUBMESHES = 16;

/**
 * One invisible shell holding every branch in a tree.
 *
 * Merged rather than left as hundreds of separate meshes: the collision system
 * walks every mesh in the scene that has collision turned on, and a wood of
 * twelve trees would otherwise add ten thousand of them to that walk.
 *
 * It cannot reuse the visible branch mesh, because that mesh is drawn as thin
 * instances and Babylon's collision only ever sees the one shape they are made
 * from, not the four hundred copies of it.
 */
export function collideTree(
  scene: Scene,
  name: string,
  skeleton: readonly BranchSpec[],
  origin: Vector3,
): Mesh | null {
  const pieces = treeColliderBoxes(skeleton, origin).map((box, index) => {
    const piece = CreateBox(
      `${name}-solid-${index}`,
      { width: box.size.x, height: box.size.y, depth: box.size.z },
      scene,
    );
    piece.position.copyFrom(box.position);
    if (box.turn) piece.rotationQuaternion = box.turn;
    return piece;
  });
  if (pieces.length === 0) return null;

  const shell = Mesh.MergeMeshes(pieces, true, true);
  if (!shell) return null;
  shell.name = `${name}-solid`;
  shell.isVisible = false;
  shell.isPickable = false;
  shell.checkCollisions = true;
  shell.subdivide(SUBMESHES);
  shell.freezeWorldMatrix();
  return shell;
}
