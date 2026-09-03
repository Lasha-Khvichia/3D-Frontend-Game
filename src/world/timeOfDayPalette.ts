import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { wrapHours } from "./TimeOfDay";
import { TIME_OF_DAY_KEYFRAMES } from "./timeOfDayKeyframes";
import { lerp } from "./blend";

export type TimeOfDayLighting = {
  readonly background: Color4;
  readonly lightColor: Color3;
  lightIntensity: number;
};

export function createTimeOfDayLighting(): TimeOfDayLighting {
  return {
    background: new Color4(0, 0, 0, 1),
    lightColor: new Color3(0, 0, 0),
    lightIntensity: 0,
  };
}

/**
 * Reads the keyframe table at `hours` and blends between the two surrounding
 * entries.
 *
 * Writes into `out` instead of returning a new object. This runs on every
 * simulation step, and allocating there feeds the garbage collector.
 */
export function sampleTimeOfDay(hours: number, out: TimeOfDayLighting): void {
  const hour = wrapHours(hours);
  const fromIndex = findKeyframeIndex(hour);
  const from = TIME_OF_DAY_KEYFRAMES[fromIndex];
  const to = TIME_OF_DAY_KEYFRAMES[(fromIndex + 1) % TIME_OF_DAY_KEYFRAMES.length];
  if (!from || !to) return;

  const span = wrapHours(to.hour - from.hour) || 24;
  const progress = wrapHours(hour - from.hour) / span;

  out.background.r = lerp(from.background[0], to.background[0], progress);
  out.background.g = lerp(from.background[1], to.background[1], progress);
  out.background.b = lerp(from.background[2], to.background[2], progress);

  out.lightColor.r = lerp(from.lightColor[0], to.lightColor[0], progress);
  out.lightColor.g = lerp(from.lightColor[1], to.lightColor[1], progress);
  out.lightColor.b = lerp(from.lightColor[2], to.lightColor[2], progress);

  out.lightIntensity = lerp(from.lightIntensity, to.lightIntensity, progress);
}

function findKeyframeIndex(hour: number): number {
  for (let index = TIME_OF_DAY_KEYFRAMES.length - 1; index >= 0; index -= 1) {
    const frame = TIME_OF_DAY_KEYFRAMES[index];
    if (frame && frame.hour <= hour) return index;
  }
  return TIME_OF_DAY_KEYFRAMES.length - 1;
}
