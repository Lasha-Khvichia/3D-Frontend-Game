import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { BoxSpec } from "./buildWallSegments";

/**
 * Builds a list of boxes and welds them into one mesh.
 *
 * A house is hundreds of small boxes. Left separate that is hundreds of draw
 * calls, and ten houses would cost more than the rest of the world put
 * together. Merged, each group of boxes sharing a material is one call.
 *
 * Returns null for an empty list, which is what Babylon does and is easier to
 * handle than an empty mesh.
 */
export function mergeBoxes(scene: Scene, name: string, boxes: readonly BoxSpec[]): Mesh | null {
  if (boxes.length === 0) return null;

  const pieces = boxes.map((box, index) => {
    const piece = CreateBox(
      `${name}-${index}`,
      { width: box.width, height: box.height, depth: box.depth },
      scene,
    );
    piece.position.set(box.x, box.y, box.z);
    return piece;
  });

  const merged = Mesh.MergeMeshes(pieces, true, true);
  if (!merged) return null;
  merged.name = name;
  merged.isPickable = false;
  merged.freezeWorldMatrix();
  return merged;
}
