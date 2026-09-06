import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { BoxSpec } from "../houses/buildWallSegments";
import type { HouseBlueprint } from "../houses/houseBlueprint";
import {
  CAP_HEIGHT,
  HEARTH_DEPTH,
  HEARTH_HEIGHT,
  JAMB_WIDTH,
  LINTEL_HEIGHT,
  OPENING_HEIGHT,
  OPENING_WIDTH,
  STACK_ABOVE_RIDGE,
  STACK_DEPTH,
  STACK_WIDTH,
  SURROUND_DEPTH,
} from "./hearthSizes";
import { wallFrameFor } from "./wallFrame";

export type Hearthstone = {
  readonly houseName: string;
  /** Everything you can see: the surround inside and the stack outside. */
  readonly stonework: BoxSpec[];
  /** An invisible block across the opening, so nobody stands in the fire. */
  readonly guard: BoxSpec;
  /** Where the flames sit. */
  readonly firePoint: Vector3;
  /** The top of the stack, where the smoke leaves. */
  readonly smokePoint: Vector3;
};

/**
 * An entire fireplace, worked out from a house's numbers.
 *
 * It backs onto the house's chimney wall, which is a gable end and carries no
 * windows for exactly this reason. The stack climbs the outside of that wall
 * rather than passing through the roof: that is how these were really built,
 * and it means the roof needs no hole cut in it.
 */
export function placeHearth(
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
): Hearthstone {
  const wall = wallFrameFor(blueprint, centreX, centreZ);
  const { box, point, outward, innerFace, outerFace } = wall;

  const jamb = (OPENING_WIDTH + JAMB_WIDTH) / 2;
  const breast = OPENING_WIDTH + JAMB_WIDTH * 2;
  const lintelTop = OPENING_HEIGHT + LINTEL_HEIGHT;
  const stackTop = blueprint.wallHeight + blueprint.roofRise + STACK_ABOVE_RIDGE;
  const surroundFace = innerFace - outward * SURROUND_DEPTH;

  return {
    houseName: blueprint.name,
    stonework: [
      box(-jamb, 0, OPENING_HEIGHT, JAMB_WIDTH, surroundFace, SURROUND_DEPTH),
      box(jamb, 0, OPENING_HEIGHT, JAMB_WIDTH, surroundFace, SURROUND_DEPTH),
      box(0, OPENING_HEIGHT, lintelTop, breast, surroundFace, SURROUND_DEPTH),
      box(0, lintelTop, blueprint.wallHeight, breast, surroundFace, SURROUND_DEPTH * 0.62),
      box(0, 0, HEARTH_HEIGHT, breast + 0.3, innerFace - outward * HEARTH_DEPTH, HEARTH_DEPTH),
      box(0, 0, stackTop, STACK_WIDTH, outerFace, STACK_DEPTH),
      box(
        0,
        stackTop,
        stackTop + CAP_HEIGHT,
        STACK_WIDTH + 0.22,
        outerFace - outward * 0.11,
        STACK_DEPTH + 0.22,
      ),
    ],
    guard: box(0, HEARTH_HEIGHT, OPENING_HEIGHT, OPENING_WIDTH, surroundFace, SURROUND_DEPTH * 0.5),
    firePoint: point(0, innerFace - outward * 0.3, HEARTH_HEIGHT + 0.12),
    smokePoint: point(0, outerFace - outward * 0.37, stackTop + CAP_HEIGHT),
  };
}
