import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { solarHourAngle } from "./celestialPath";
import type { TimeOfDayKeyframe } from "./timeOfDayKeyframe";
import { EVENING_KEYFRAMES, MORNING_KEYFRAMES } from "./timeOfDayKeyframes";
import { lerp } from "./blend";

export type TimeOfDayLighting = {
  readonly background: Color4;
  readonly zenith: Color3;
  readonly lightColor: Color3;
  lightIntensity: number;
};

export function createTimeOfDayLighting(): TimeOfDayLighting {
  return {
    background: new Color4(0, 0, 0, 1),
    zenith: new Color3(0, 0, 0),
    lightColor: new Color3(0, 0, 0),
    lightIntensity: 0,
  };
}

type Bracket = { from: TimeOfDayKeyframe; to: TimeOfDayKeyframe; progress: number };
type ColourField = "background" | "zenith" | "lightColor";

// Reused every step: this runs 60 times a second, and allocating there feeds
// the garbage collector.
const morning: Bracket = { from: MORNING_KEYFRAMES[0]!, to: MORNING_KEYFRAMES[0]!, progress: 0 };
const evening: Bracket = { from: EVENING_KEYFRAMES[0]!, to: EVENING_KEYFRAMES[0]!, progress: 0 };
let afternoon = 0;

/**
 * Reads both sky tables at the sun's height and blends them by the time of
 * day: all morning table at dawn, all evening table at dusk, half and half at
 * noon, where the two agree anyway. Writes into `out`.
 */
export function sampleTimeOfDay(
  totalHours: number,
  sunHeight: number,
  out: TimeOfDayLighting,
): void {
  const degrees = (Math.asin(Math.min(1, Math.max(-1, sunHeight))) * 180) / Math.PI;
  bracket(MORNING_KEYFRAMES, degrees, morning);
  bracket(EVENING_KEYFRAMES, degrees, evening);
  afternoon = 0.5 + 0.5 * Math.sin(solarHourAngle(totalHours));

  blendColour("background", out.background);
  blendColour("zenith", out.zenith);
  blendColour("lightColor", out.lightColor);
  out.lightIntensity = lerp(
    lerp(morning.from.lightIntensity, morning.to.lightIntensity, morning.progress),
    lerp(evening.from.lightIntensity, evening.to.lightIntensity, evening.progress),
    afternoon,
  );
}

function blendColour(field: ColourField, target: { r: number; g: number; b: number }): void {
  target.r = blendChannel(field, 0);
  target.g = blendChannel(field, 1);
  target.b = blendChannel(field, 2);
}

function blendChannel(field: ColourField, channel: 0 | 1 | 2): number {
  const early = lerp(morning.from[field][channel], morning.to[field][channel], morning.progress);
  const late = lerp(evening.from[field][channel], evening.to[field][channel], evening.progress);
  return lerp(early, late, afternoon);
}

/** Finds the two rows either side of this height, and how far between them it sits. */
function bracket(table: readonly TimeOfDayKeyframe[], degrees: number, out: Bracket): void {
  let upper = 0;
  while (upper < table.length - 1 && table[upper]!.sunDegrees < degrees) upper += 1;
  const lower = Math.max(0, upper - 1);
  out.from = table[lower]!;
  out.to = table[upper]!;
  const span = out.to.sunDegrees - out.from.sunDegrees;
  out.progress = span > 0 ? Math.min(1, Math.max(0, (degrees - out.from.sunDegrees) / span)) : 0;
}
