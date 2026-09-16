import { kindAt, type WeatherMoment } from "../sampleWeather";
import type { WeatherKind } from "../weatherKinds";
import { hashed } from "../weatherNoise";

/** Game hours in one chance of a strike: one real second, at 50 real seconds a game hour. */
export const STRIKE_SLOT_HOURS = 1 / 50;
/** How many bolt shapes there are to pick from. */
export const BOLT_SHAPES = 4;
/** Chance of a strike in a slot: a thunderstorm flashes every eight real seconds or so, a downpour now and then. */
const CHANCE: Partial<Record<WeatherKind, number>> = { thunderstorm: 0.12, downpour: 0.008 };
/** Metres. Nearer than this is a strike on the player, which this game does not do. */
const NEAREST = 300;
/** Metres: the storm is overhead, so every flash is followed by thunder heard within 12 s. */
const FURTHEST = 4000;

export type Strike = {
  /** Game hours when it strikes. */
  at: number;
  /** Radians round from north, towards the east. */
  bearing: number;
  /** Metres from the player. */
  distance: number;
  /** 0 to 1: how much it lights the sky. */
  brightness: number;
  shape: number;
};

export function createStrike(): Strike {
  return { at: 0, bearing: 0, distance: 0, brightness: 0, shape: 0 };
}

/**
 * The strike in one slot of time, if there is one: when, which way, how far.
 *
 * A function of time like the rest of the weather, so the same moment always
 * has the same lightning and a saved storm replays the same. Distance is
 * spread by area — a ring twice as far out holds twice the ground — so far
 * strikes, heard as rumbles, are more common than near cracks.
 */
export function strikeInSlot(
  slot: number,
  held: WeatherKind | null,
  moment: WeatherMoment,
  out: Strike,
): Strike | null {
  const start = slot * STRIKE_SLOT_HOURS;
  const chance = CHANCE[held ?? kindAt(start, moment).kind] ?? 0;
  if (hashed(slot, 41) >= chance) return null;
  out.at = start + hashed(slot, 42) * STRIKE_SLOT_HOURS;
  out.bearing = hashed(slot, 43) * Math.PI * 2;
  out.distance = NEAREST + (FURTHEST - NEAREST) * Math.sqrt(hashed(slot, 44));
  out.brightness = Math.min(1, 1.25 - out.distance / 5000);
  out.shape = Math.floor(hashed(slot, 45) * BOLT_SHAPES);
  return out;
}
