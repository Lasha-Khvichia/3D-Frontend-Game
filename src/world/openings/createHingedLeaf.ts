import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { mergeBoxes } from "../houses/mergeBoxes";
import { createPlankPanel } from "./createPlankPanel";

export type HingedLeafOptions = {
  readonly name: string;
  /** Where the leaf pivots, in world space. */
  readonly hingePoint: Vector3;
  /** Unit vector from the hinge towards the leaf's free edge. */
  readonly reach: Vector3;
  /** Unit vector pointing out of the building. */
  readonly outward: Vector3;
  readonly width: number;
  readonly height: number;
  readonly thickness: number;
  /** The collider is thicker than the boards, so a sprint cannot cross it. */
  readonly colliderThickness: number;
  readonly material: Material;
};

export type HingedLeaf = {
  readonly hinge: TransformNode;
  readonly panel: Mesh;
  readonly collider: Mesh;
  /** Angle sign that swings the free edge outwards. The other sign swings in. */
  readonly outwardSign: 1 | -1;
  /** Where the edge furthest from the hinge is now, in world space. */
  freeEdge(): Vector3;
};

/**
 * A board panel on a hinge: a door leaf, or one shutter.
 *
 * The panel and its collider are built in the hinge's own coordinates and then
 * parented to it, so swinging the whole thing is one number.
 */
export function createHingedLeaf(scene: Scene, options: HingedLeafOptions): HingedLeaf {
  const hinge = new TransformNode(`${options.name}-hinge`, scene);
  hinge.position.copyFrom(options.hingePoint);
  // With rotation.y = a, the node's local +X points at (cos a, 0, -sin a).
  hinge.rotation.y = Math.atan2(-options.reach.z, options.reach.x);

  const panel = mergeBoxes(
    scene,
    options.name,
    createPlankPanel(options.width, options.height, options.thickness),
  );
  if (!panel) throw new Error(`${options.name} produced no geometry`);
  panel.material = options.material;
  panel.receiveShadows = true;
  attachToHinge(panel, hinge);

  const collider = CreateBox(
    `${options.name}-collider`,
    { width: options.width, height: options.height, depth: options.colliderThickness },
    scene,
  );
  collider.position.set(options.width / 2, 0, 0);
  collider.isVisible = false;
  collider.checkCollisions = true;
  attachToHinge(collider, hinge);

  return {
    hinge,
    panel,
    collider,
    outwardSign: swingDirection(hinge.rotation.y, options),
    // The collider sits at half the leaf's width, so twice its offset from the
    // hinge is the far edge.
    freeEdge: () => {
      const pivot = hinge.absolutePosition;
      return collider.getAbsolutePosition().subtract(pivot).scaleInPlace(2).addInPlace(pivot);
    },
  };
}

/**
 * A merged mesh comes back with its world matrix frozen, which is right for
 * scenery and wrong here: frozen means the parent can turn all it likes and the
 * mesh will not follow, with no error to say why.
 */
function attachToHinge(mesh: Mesh, hinge: TransformNode): void {
  mesh.parent = hinge;
  mesh.isPickable = false;
  mesh.unfreezeWorldMatrix();
}

/** Which way to turn the hinge so the free edge swings out of the building. */
function swingDirection(baseYaw: number, options: HingedLeafOptions): 1 | -1 {
  const turned = new Vector3(Math.cos(baseYaw + 0.1), 0, -Math.sin(baseYaw + 0.1));
  return turned.subtract(options.reach).dot(options.outward) > 0 ? 1 : -1;
}
