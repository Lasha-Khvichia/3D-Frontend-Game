import type { Surface } from "../../world/GroundSurfaces";
import type { Hit, Tone } from "./playHit";

/** How one surface sounds underfoot: bursts of noise, knocks, and grains of crunch. */
export type StepRecipe = {
  readonly hits: readonly Hit[];
  readonly tones: readonly Tone[];
  readonly grains: number;
};

const hit = (
  filter: BiquadFilterType,
  frequency: number,
  q: number,
  delay: number,
  attack: number,
  decay: number,
  gain: number,
  sweepTo = 0,
): Hit => ({ filter, frequency, q, delay, attack, decay, gain, sweepTo });

/**
 * Each surface as a few sounds laid together. Grass is a soft brush of high
 * noise; dirt a dull scuff; sand a gritty slide; stone a hard click; wood a
 * hollow knock; snow a crunch of tiny grains; ice a click with a faint ring;
 * water a splash that falls in pitch.
 */
export const STEP_RECIPES: Readonly<Record<Surface, StepRecipe>> = {
  grass: {
    hits: [
      hit("bandpass", 2600, 0.7, 0, 0.012, 0.09, 0.9),
      hit("highpass", 4000, 0.5, 0.05, 0.01, 0.07, 0.4),
    ],
    tones: [],
    grains: 0,
  },
  dirt: {
    hits: [hit("lowpass", 1100, 0.7, 0, 0.006, 0.07, 1)],
    tones: [{ from: 110, to: 70, decay: 0.05, gain: 0.25 }],
    grains: 0,
  },
  sand: { hits: [hit("bandpass", 1600, 0.6, 0, 0.02, 0.12, 0.8, 900)], tones: [], grains: 3 },
  stone: {
    hits: [
      hit("highpass", 2800, 0.7, 0, 0.002, 0.03, 0.9),
      hit("bandpass", 900, 1.5, 0.004, 0.003, 0.05, 0.5),
    ],
    tones: [],
    grains: 0,
  },
  wood: {
    hits: [hit("bandpass", 650, 2.2, 0, 0.003, 0.06, 0.8)],
    tones: [{ from: 150, to: 95, decay: 0.09, gain: 0.5 }],
    grains: 0,
  },
  snow: { hits: [hit("lowpass", 900, 0.7, 0, 0.02, 0.1, 0.4)], tones: [], grains: 9 },
  ice: {
    hits: [hit("highpass", 3500, 0.7, 0, 0.001, 0.02, 0.8)],
    tones: [{ from: 2300, to: 2000, decay: 0.12, gain: 0.08 }],
    grains: 0,
  },
  water: {
    hits: [
      hit("bandpass", 2400, 0.9, 0, 0.01, 0.2, 1, 700),
      hit("lowpass", 500, 0.7, 0.03, 0.03, 0.18, 0.6),
    ],
    tones: [],
    grains: 0,
  },
};

/** One grain of crunch: snow and sand are many of these within a tenth of a second. */
export const CRUNCH_GRAIN = hit("bandpass", 3200, 1.2, 0, 0.001, 0.012, 0.9);
/** Soaked ground under grass or dirt: a wet suck as the foot presses in. */
export const SQUELCH = hit("bandpass", 1300, 3, 0.02, 0.01, 0.1, 0.5, 700);
/** Under every landing: the weight coming down. */
export const THUD: Tone = { from: 90, to: 50, decay: 0.12, gain: 0.7 };
