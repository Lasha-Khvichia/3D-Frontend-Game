import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { mergeBoxes } from "../houses/mergeBoxes";
import type { PlacedOpening } from "../houses/placeOpenings";

const BOLT_WIDTH = 0.07;
const BOLT_HEIGHT = 0.2;
const BOLT_DEPTH = 0.05;
/** How far the bolt drops when it locks. */
const DROP = 0.15;
/** Clearance so the bolt sits proud of the shutters rather than inside them. */
const STAND_OFF = 0.11;
const SLIDE_RATE = 9;

/**
 * The little bolt above a window that holds its shutters shut.
 *
 * A bolt that drops, rather than a beam across the window: a beam the size of
 * a door bar would cover the whole opening and look absurd on something this
 * small. It slides on one axis, so there is no rotation to get the wrong way
 * round, and dropping into place reads as locking at a glance.
 */
export class WindowLatch {
  private locked = false;
  private drop = 0;
  private readonly bolt: Mesh;
  private readonly restY: number;
  readonly meshes: Mesh[];

  constructor(scene: Scene, opening: PlacedOpening, material: Material) {
    const node = new TransformNode(`${opening.houseName}-latch-node`, scene);
    node.position
      .copyFrom(opening.centre)
      .addInPlace(opening.outward.scale(opening.wallThickness / 2 + STAND_OFF));
    node.position.y = opening.sill + opening.height;

    const bolt = mergeBoxes(scene, `${opening.houseName}-latch`, [
      { x: 0, y: 0, z: 0, width: BOLT_WIDTH, height: BOLT_HEIGHT, depth: BOLT_DEPTH },
    ]);
    if (!bolt) throw new Error(`${opening.houseName} latch produced no geometry`);
    bolt.material = material;
    bolt.parent = node;
    bolt.isPickable = false;
    // Merged meshes come back frozen, and a frozen matrix ignores the drop.
    bolt.unfreezeWorldMatrix();

    const keeper = mergeBoxes(scene, `${opening.houseName}-latch-keeper`, [
      { x: 0, y: 0.06, z: -0.03, width: BOLT_WIDTH + 0.08, height: 0.09, depth: 0.04 },
    ]);
    if (keeper) {
      keeper.material = material;
      keeper.parent = node;
      keeper.isPickable = false;
    }

    this.bolt = bolt;
    this.restY = DROP;
    this.bolt.position.y = this.restY;
    this.meshes = keeper ? [bolt, keeper] : [bolt];
  }

  get isLocked(): boolean {
    return this.locked;
  }

  toggle(): void {
    this.locked = !this.locked;
  }

  /** Waits for the shutters to close before dropping, like the door bar. */
  update(seconds: number, shuttersAreShut: boolean): void {
    const wanted = this.locked && shuttersAreShut ? 1 : 0;
    this.drop += (wanted - this.drop) * Math.min(1, seconds * SLIDE_RATE);
    this.bolt.position.y = this.restY - this.drop * DROP;
  }
}
