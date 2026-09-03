type Rgb = readonly [number, number, number];

export type TimeOfDayKeyframe = {
  readonly hour: number;
  readonly background: Rgb;
  readonly lightColor: Rgb;
  readonly lightIntensity: number;
};

/**
 * The colour of the void across one day, and the key light that goes with it.
 * This is the table to edit when you want day or night to look different.
 *
 * Midday is blue. Sunset at 21:00 drops into a strong dark blue that grades
 * into near black by midnight and holds there until first light.
 *
 * The hours match the sun's own schedule: it rises at 06:00, is highest at
 * 13:30, and sets at 21:00.
 *
 * Rules: sorted by hour, the first entry must be hour 0, and the last entry
 * wraps around to the first.
 */
export const TIME_OF_DAY_KEYFRAMES: readonly TimeOfDayKeyframe[] = [
  // hour                background                 light colour             intensity
  { hour: 0, background: [0.004, 0.006, 0.02], lightColor: [0.3, 0.4, 0.7], lightIntensity: 0.06 },
  {
    hour: 3.5,
    background: [0.004, 0.008, 0.026],
    lightColor: [0.3, 0.4, 0.7],
    lightIntensity: 0.07,
  },
  {
    hour: 5,
    background: [0.035, 0.055, 0.15],
    lightColor: [0.45, 0.45, 0.68],
    lightIntensity: 0.15,
  },
  { hour: 6, background: [0.18, 0.22, 0.42], lightColor: [1, 0.72, 0.55], lightIntensity: 0.35 },
  { hour: 7.5, background: [0.3, 0.52, 0.8], lightColor: [1, 0.94, 0.86], lightIntensity: 0.7 },
  { hour: 13.5, background: [0.29, 0.56, 0.85], lightColor: [1, 0.98, 0.94], lightIntensity: 0.95 },
  { hour: 18, background: [0.28, 0.52, 0.82], lightColor: [1, 0.96, 0.9], lightIntensity: 0.85 },
  { hour: 20, background: [0.23, 0.33, 0.56], lightColor: [1, 0.72, 0.48], lightIntensity: 0.5 },
  { hour: 21, background: [0.12, 0.16, 0.36], lightColor: [0.95, 0.6, 0.5], lightIntensity: 0.3 },
  {
    hour: 22,
    background: [0.02, 0.04, 0.18],
    lightColor: [0.35, 0.45, 0.75],
    lightIntensity: 0.12,
  },
  {
    hour: 23,
    background: [0.01, 0.018, 0.08],
    lightColor: [0.32, 0.42, 0.72],
    lightIntensity: 0.08,
  },
];
