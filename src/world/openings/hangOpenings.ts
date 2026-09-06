import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";
import type { PlacedOpening } from "../houses/placeOpenings";
import { createHingedLeaf, type HingedLeaf } from "./createHingedLeaf";
import { Door } from "./Door";
import { DoorBar } from "./DoorBar";
import { ShutteredWindow } from "./ShutteredWindow";
import { WindowLatch } from "./WindowLatch";

/** Gap left around a leaf so it is not jammed against its own jambs. */
const CLEARANCE = 0.05;
const DOOR_THICKNESS = 0.06;
/**
 * The door's collider is far thicker than its boards. A sprint covers 0.133 m
 * in one step, so a collider as thin as a real door could be crossed between
 * two steps without ever being touched.
 */
const DOOR_COLLIDER_THICKNESS = 0.22;
const SHUTTER_THICKNESS = 0.045;
const SHUTTER_COLLIDER_THICKNESS = 0.12;

export type OpeningMaterials = {
  readonly door: Material;
  readonly ironwork: Material;
};

/** A door on its hinges, with the bar that holds it shut. */
export function hangDoor(scene: Scene, opening: PlacedOpening, materials: OpeningMaterials): Door {
  const width = opening.width - CLEARANCE;
  const leaf = createHingedLeaf(scene, {
    name: `${opening.houseName}-door`,
    hingePoint: opening.centre.subtract(opening.along.scale(width / 2)),
    reach: opening.along,
    outward: opening.outward,
    width,
    height: opening.height - CLEARANCE,
    thickness: DOOR_THICKNESS,
    colliderThickness: DOOR_COLLIDER_THICKNESS,
    material: materials.door,
  });
  finish([leaf]);
  return new Door(opening, leaf, new DoorBar(scene, opening, materials.ironwork));
}

/**
 * A pair of shutters on the outside of a window, and the bolt above them.
 *
 * Outside rather than inside, because a window is something the street sees.
 * Each leaf hangs from its own jamb and swings out until it lies back on the
 * wall.
 */
export function hangShutters(
  scene: Scene,
  opening: PlacedOpening,
  materials: OpeningMaterials,
): ShutteredWindow {
  const width = (opening.width - CLEARANCE) / 2;
  const standOff = opening.wallThickness / 2 + SHUTTER_THICKNESS;
  const leaves = ([1, -1] as const).map((side) => {
    const reach = opening.along.scale(-side);
    return createHingedLeaf(scene, {
      name: `${opening.houseName}-shutter-${side > 0 ? "left" : "right"}`,
      hingePoint: opening.centre
        .add(opening.along.scale(side * width))
        .add(opening.outward.scale(standOff)),
      reach,
      outward: opening.outward,
      width,
      height: opening.height - CLEARANCE,
      thickness: SHUTTER_THICKNESS,
      colliderThickness: SHUTTER_COLLIDER_THICKNESS,
      material: materials.door,
    });
  });
  finish(leaves);
  return new ShutteredWindow(opening, leaves, new WindowLatch(scene, opening, materials.ironwork));
}

/**
 * Leaves are drawn up close only. There are over a hundred of them across the
 * village, and on the mini-map each is smaller than a pixel.
 */
function finish(leaves: readonly HingedLeaf[]): void {
  for (const leaf of leaves) {
    leaf.panel.layerMask = FINE_DETAIL_LAYER;
    leaf.panel.receiveShadows = true;
  }
}
