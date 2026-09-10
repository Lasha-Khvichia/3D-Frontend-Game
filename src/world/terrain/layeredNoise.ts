import type { Noise2D } from "./noise2d";

/**
 * Several octaves of the same noise stacked, each finer and fainter.
 *
 * `gain` below 0.5 on purpose. Every octave at 0.5 adds the same amount of
 * slope as the one before it, because its height halves exactly as its
 * wavelength does — so four octaves would be four times as steep as one, and
 * the hills would be too steep to walk up.
 */
export function layeredNoise(
  noise: Noise2D,
  x: number,
  z: number,
  octaves: number,
  gain: number,
): number {
  let total = 0;
  let weight = 1;
  let scale = 1;
  let sum = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    total += noise(x * scale, z * scale) * weight;
    sum += weight;
    weight *= gain;
    scale *= 2;
  }
  return total / sum;
}

/**
 * Noise folded into sharp crests, for mountains.
 *
 * Taking `1 - |n|` turns every zero crossing of smooth noise into a ridge line,
 * and squaring it sharpens the ridge and widens the valleys between. Each
 * octave is weighted by the one before, so the fine detail gathers along the
 * ridges and leaves the valley floors smooth — which is how real ranges look.
 */
export function ridgedNoise(noise: Noise2D, x: number, z: number, octaves: number): number {
  let total = 0;
  let weight = 1;
  let scale = 1;
  let amplitude = 1;
  let sum = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    const crest = 1 - Math.abs(noise(x * scale, z * scale));
    const signal = crest * crest * weight;
    total += signal * amplitude;
    sum += amplitude;
    weight = Math.min(1, signal * 2);
    amplitude *= 0.5;
    scale *= 2;
  }
  return total / sum;
}
