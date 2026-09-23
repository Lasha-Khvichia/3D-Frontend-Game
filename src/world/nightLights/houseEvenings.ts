import { Color3 } from "@babylonjs/core/Maths/math.color";
import { between, createSeededRandom, seedFromText } from "../houses/seededRandom";

/** One household's evening: when its lamps go on, when it goes to bed, and how warm its light is. */
export type HouseEvening = {
  /** The sun's height, 0 to 1, below which the house lights up. */
  readonly duskAt: number;
  /** Hour of the day, 22 to 24, the windows go dark. */
  readonly bedtime: number;
  readonly glow: Color3;
};

/** Storm darkness past this lights the windows by day, and the lanterns with them. */
export const STORM_DARK = 0.8;
/** The sun's height below which the lanterns are fully lit, and above which they are out. */
const LANTERNS_FULL = 0.02;
const LANTERNS_OUT = 0.1;

/** Worked out from the house's name, so every house keeps its own hours between loads. */
export function houseEvening(name: string): HouseEvening {
  const random = createSeededRandom(seedFromText(`${name}-evening`));
  const duskAt = between(random, 0, 0.08);
  const bedtime = between(random, 22, 24);
  const warmth = between(random, 0.88, 1);
  const glow = new Color3(
    warmth,
    warmth * between(random, 0.6, 0.7),
    warmth * between(random, 0.28, 0.36),
  );
  return { duskAt, bedtime, glow };
}

/**
 * Whether a house's windows are lit: from its own dusk until its bedtime, and
 * by day under a black storm. Never after midnight or before noon at dusk —
 * the household is asleep.
 */
export function windowsLit(
  evening: HouseEvening,
  hour: number,
  sunHeight: number,
  darkness: number,
) {
  if (hour >= evening.bedtime || hour < 6) return false;
  return darkness > STORM_DARK || (hour >= 12 && sunHeight < evening.duskAt);
}

/** How lit the lanterns are, 0 to 1: they burn from dusk to dawn, and in a black storm. */
export function lanternsLit(sunHeight: number, darkness: number): number {
  const night = 1 - smooth(LANTERNS_FULL, LANTERNS_OUT, sunHeight);
  return Math.max(night, smooth(STORM_DARK - 0.1, STORM_DARK + 0.1, darkness));
}

function smooth(low: number, high: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}
