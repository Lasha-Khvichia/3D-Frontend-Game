import { dayOf, HOURS_PER_DAY } from "../calendar/calendar";
import { wrapDays, yearCurve, type Keyframe } from "./yearCurve";

/** Where the year stands for everything that grows. Every share is 0 to 1. */
export type SeasonLook = {
  /** Leaves on the broadleaf trees: 0 bare, 1 in full leaf. */
  readonly leaves: number;
  /** How far those leaves have turned from green to autumn colour. Read it with `leaves`: it holds through the winter, when there are none. */
  readonly turn: number;
  /** Blossom on the trees that flower. */
  readonly blossom: number;
  /** Leaves coming down. */
  readonly fall: number;
  /** How dry and straw-coloured the grass is at the height of summer. */
  readonly dryness: number;
  /** How far the grass has gone over to its dull winter colour. */
  readonly dormant: number;
  /** Wildflowers open in the meadow. */
  readonly flowers: number;
};

/** Leaves: buds break in late March, and the last are down by mid-November. */
const LEAVES: readonly Keyframe[] = [
  [dayOf(2, 20), 0],
  [dayOf(3, 12), 1],
  [dayOf(9, 5), 1],
  [dayOf(10, 15), 0],
];
const TURN: readonly Keyframe[] = [
  [dayOf(2, 20), 0],
  [dayOf(8, 20), 0],
  [dayOf(9, 25), 1],
  [dayOf(10, 20), 1],
];
const BLOSSOM: readonly Keyframe[] = [
  [dayOf(2, 28), 0],
  [dayOf(3, 10), 1],
  [dayOf(4, 5), 0],
  [dayOf(2, 20), 0],
];
const FALL: readonly Keyframe[] = [
  [dayOf(9, 5), 0],
  [dayOf(9, 25), 1],
  [dayOf(10, 15), 0],
  [dayOf(8, 25), 0],
];
const DRYNESS: readonly Keyframe[] = [
  [dayOf(5, 25), 0],
  [dayOf(7, 10), 1],
  [dayOf(8, 25), 0],
  [dayOf(4, 20), 0],
];
const DORMANT: readonly Keyframe[] = [
  [dayOf(10, 1), 0],
  [dayOf(11, 1), 1],
  [dayOf(1, 20), 1],
  [dayOf(2, 25), 0],
];
const FLOWERS: readonly Keyframe[] = [
  [dayOf(3, 10), 0],
  [dayOf(4, 15), 1],
  [dayOf(7, 20), 1],
  [dayOf(8, 10), 0],
];

/** The look of the growing year at this moment, blended across the days. */
export function seasonLook(totalHours: number): SeasonLook {
  const day = wrapDays(totalHours / HOURS_PER_DAY);
  return {
    leaves: yearCurve(LEAVES, day),
    turn: yearCurve(TURN, day),
    blossom: yearCurve(BLOSSOM, day),
    fall: yearCurve(FALL, day),
    dryness: yearCurve(DRYNESS, day),
    dormant: yearCurve(DORMANT, day),
    flowers: yearCurve(FLOWERS, day),
  };
}
