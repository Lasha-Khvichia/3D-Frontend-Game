import { wandering } from "./weatherNoise";

/** Metres a second: the stillest the air gets, and how far the windiest spells reach above it. */
const STILL = 0.3;
const WINDIEST = 10;
/** Game hours from one spell of wind to the next: about five real minutes. */
const SPELL_HOURS = 6;
/** Game hours from one gust to the next: a couple of real seconds. */
const GUST_HOURS = 1 / 25;
/** How far a storm's gusts swing its wind either way. */
const GUST_SWING = 0.35;
/** Metres a second a kind must add before its wind gusts fully: a thunderstorm's. */
const GUSTY = 9;

/**
 * The wind of the hour before the weather adds to it: its own spell, calm,
 * breezy or windy, whatever is falling. Squared, so calm spells are common and
 * gales are rare — rain on a still day falls straight down.
 */
export function baseWindAt(totalHours: number): number {
  const share = (wandering(totalHours / SPELL_HOURS, 1) + 1) / 2;
  return STILL + WINDIEST * share * share;
}

/**
 * The wind at the ground, metres a second: the hour's own, plus what the
 * weather brings (`added`, the blended `KIND_LOOKS.wind`: a storm's wind, or
 * fog's stillness). The more a storm brings, the harder it gusts.
 */
export function windAt(totalHours: number, added: number): number {
  const steady = Math.max(STILL, baseWindAt(totalHours) + added);
  const stormy = Math.min(1, Math.max(0, added / GUSTY));
  return steady * (1 + GUST_SWING * stormy * wandering(totalHours / GUST_HOURS, 4));
}
