import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Inventory } from "../../items/Inventory";

/**
 * Where a thing rests in front of the camera, how it is turned, and how big it
 * is drawn.
 *
 * Held things are drawn smaller than they are. At a field of view of 70
 * degrees a thing half a metre from the eye fills a third of the screen, so a
 * hoe at its true length is a telegraph pole across the view. Every
 * first-person game cheats this; these numbers are the cheat.
 */
export type HandPlace = {
  readonly at: Vector3;
  readonly turn: Vector3;
  readonly scale: number;
};

/** In the right hand, carried across the body with the blade down and forward. */
const HOE_HAND: HandPlace = {
  at: new Vector3(0.26, 0.02, 0.86),
  turn: new Vector3(0.3, -0.3, -0.72),
  scale: 0.5,
};
/** In the left hand, held up where it lights the way. */
const LANTERN_HAND: HandPlace = {
  at: new Vector3(-0.3, -0.21, 0.82),
  turn: new Vector3(0, 0, 0.06),
  scale: 0.72,
};
/** Clipped to the belt: lower, further back, and tipped by the hip. */
const LANTERN_BELT: HandPlace = {
  at: new Vector3(-0.27, -0.46, 0.6),
  turn: new Vector3(0.12, 0, 0.26),
  scale: 0.72,
};

const sway = new Vector3();

/**
 * Where each carried thing rests this step.
 *
 * The lantern is drawn whether it is in the left hand or on the belt, in a
 * different place for each; the hoe only when the main hand holds it.
 */
export function restPlaces(inventory: Inventory): {
  hoe: HandPlace | null;
  lantern: HandPlace | null;
} {
  const main = inventory.mainHand;
  const off = inventory.offHand;
  const belt = inventory.belt;
  return {
    hoe: main?.id === "hoe" ? HOE_HAND : null,
    lantern: off?.id === "lantern" ? LANTERN_HAND : belt?.id === "lantern" ? LANTERN_BELT : null,
  };
}

/**
 * The small lift and roll of something carried while walking.
 *
 * Counted in simulation seconds, not real ones, so it stops dead with
 * everything else the moment the game is paused.
 */
export function swayAt(seconds: number, walkShare: number): Vector3 {
  const pace = seconds * 7.4;
  const depth = 0.012 * walkShare;
  sway.set(Math.sin(pace) * depth, Math.abs(Math.cos(pace)) * depth * -1.4, 0);
  return sway;
}
