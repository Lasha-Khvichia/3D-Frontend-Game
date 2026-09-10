import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { BoxSpec } from "../../houses/buildWallSegments";
import { mergeBoxes } from "../../houses/mergeBoxes";

/** Width of the walkway. Wide enough for two people to pass. */
const DECK_WIDTH = 2.8;
const DECK_THICKNESS = 0.3;
/** Top rail height: above the waist, so it stops a player rather than tripping them. */
const RAIL_HEIGHT = 0.95;
const POST_SPACING = 2;

/**
 * A plank bridge across a river: a deck on two beams, with a railing each side.
 *
 * Built from boxes like the houses, for the same reason: every face is level
 * or plumb, so there is no slope for the solver to slide anyone down, and the
 * railing is a wall the player walks along rather than off.
 *
 * Built lying along x at the origin, then turned to cross the river. Merged
 * meshes come back with their world matrix frozen, so it is thawed to be
 * placed and frozen again after — without that the turn is silently ignored.
 */
export function createBridge(
  scene: Scene,
  name: string,
  place: { x: number; z: number; yaw: number },
  span: number,
  deckTop: number,
  material: Material,
): Mesh | null {
  const half = DECK_WIDTH / 2;
  const boxes: BoxSpec[] = [
    {
      x: 0,
      y: deckTop - DECK_THICKNESS / 2,
      z: 0,
      width: span,
      height: DECK_THICKNESS,
      depth: DECK_WIDTH,
    },
    {
      x: 0,
      y: deckTop - DECK_THICKNESS - 0.15,
      z: half - 0.4,
      width: span,
      height: 0.3,
      depth: 0.25,
    },
    {
      x: 0,
      y: deckTop - DECK_THICKNESS - 0.15,
      z: -half + 0.4,
      width: span,
      height: 0.3,
      depth: 0.25,
    },
  ];
  for (const side of [-1, 1]) {
    boxes.push({
      x: 0,
      y: deckTop + RAIL_HEIGHT,
      z: side * (half - 0.07),
      width: span,
      height: 0.12,
      depth: 0.12,
    });
    for (let along = -span / 2 + 0.2; along <= span / 2; along += POST_SPACING) {
      boxes.push({
        x: along,
        y: deckTop + RAIL_HEIGHT / 2,
        z: side * (half - 0.07),
        width: 0.14,
        height: RAIL_HEIGHT,
        depth: 0.14,
      });
    }
  }

  const bridge = mergeBoxes(scene, name, boxes);
  if (!bridge) return null;
  bridge.unfreezeWorldMatrix();
  bridge.position.set(place.x, 0, place.z);
  bridge.rotation.y = place.yaw;
  bridge.computeWorldMatrix(true);
  bridge.freezeWorldMatrix();
  bridge.material = material;
  bridge.checkCollisions = true;
  bridge.receiveShadows = true;
  return bridge;
}
