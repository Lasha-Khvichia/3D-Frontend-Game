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
/**
 * Hung on the belt at the left hip, in the waist's frame rather than the
 * camera's: it stays at your side when you look about, and you see it by
 * looking down, as you would.
 */
const LANTERN_BELT: HandPlace = {
  at: new Vector3(-0.2, -0.77, 0.06),
  turn: new Vector3(0, 0.35, 0),
  scale: 0.72,
};

const sway = new Vector3();

/**
 * Where each carried thing rests this step.
 *
 * A lantern is out whether it is in the left hand, chosen on the bar, or hung
 * on the belt — in the left hand's place for the first two, at the hip for the
 * last. Choosing it on the bar used to draw nothing at all: the bar fills the
 * right hand, a lantern is carried in the left, and nothing looked in both
 * places.
 */
export function restPlaces(inventory: Inventory): {
  hoe: HandPlace | null;
  lantern: HandPlace | null;
  onBelt: boolean;
} {
  const main = inventory.mainHand;
  const inHand = inventory.offHand?.id === "lantern" || main?.id === "lantern";
  const onBelt = inventory.belt?.id === "lantern";
  return {
    hoe: main?.id === "hoe" ? HOE_HAND : null,
    lantern: inHand ? LANTERN_HAND : onBelt ? LANTERN_BELT : null,
    onBelt: !inHand && onBelt,
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
