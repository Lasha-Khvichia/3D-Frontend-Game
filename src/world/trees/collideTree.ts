import { CreateBoxVertexData } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
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
 * Stamped out as raw geometry rather than built from hundreds of box meshes and
 * merged. Merging was the honest way to write it and cost **16 ms of the 23 ms**
 * it took to make a whole tree: creating a Babylon mesh is expensive, and there
 * are 368 of them in one tree. Copying one box's vertices 368 times is
 * arithmetic.
 *
 * It is merged rather than kept as separate meshes because the collision system
 * walks every mesh in the scene that has collision turned on, and forty trees
 * would otherwise add thirty thousand of them to that walk. It cannot reuse the
 * visible branch mesh, because that is drawn as thin instances and collision
 * only ever sees the one shape they are made from.
 */
export function collideTree(
  scene: Scene,
  name: string,
  skeleton: readonly BranchSpec[],
  origin: Vector3,
): Mesh | null {
  const boxes = treeColliderBoxes(skeleton, origin);
  if (boxes.length === 0) return null;

  // Babylon's own box, so its winding is right without having to reason about
  // it. A collider's facing matters: the solver ignores triangles turned away
  // from the direction of travel.
  const template = CreateBoxVertexData({ size: 1 });
  const corners = template.positions as number[];
  const faces = template.indices as number[];

  const positions: number[] = [];
  const indices: number[] = [];
  const spot = new Vector3();
  const matrix = new Matrix();
  const noTurn = Quaternion.Identity();

  for (const box of boxes) {
    const first = positions.length / 3;
    Matrix.ComposeToRef(box.size, box.turn ?? noTurn, box.position, matrix);
    for (let corner = 0; corner < corners.length; corner += 3) {
      Vector3.TransformCoordinatesFromFloatsToRef(
        corners[corner] ?? 0,
        corners[corner + 1] ?? 0,
        corners[corner + 2] ?? 0,
        matrix,
        spot,
      );
      positions.push(spot.x, spot.y, spot.z);
    }
    for (const index of faces) indices.push(first + index);
  }

  const shell = new Mesh(`${name}-solid`, scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.applyToMesh(shell);
  shell.isVisible = false;
  shell.isPickable = false;
  shell.checkCollisions = true;
  shell.subdivide(SUBMESHES);
  shell.freezeWorldMatrix();
  return shell;
}
