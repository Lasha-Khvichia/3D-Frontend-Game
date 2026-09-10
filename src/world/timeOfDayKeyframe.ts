type Rgb = readonly [number, number, number];

/** One row of the sky table: the sky and the key light with the sun at one height. */
export type TimeOfDayKeyframe = {
  /** How high the sun stands, in degrees. Negative is below the horizon. */
  readonly sunDegrees: number;
  /** The sky at the horizon, and the fog: distant land fades into exactly this. */
  readonly background: Rgb;
  /** The sky straight overhead. Deeper than the horizon, as a real sky is. */
  readonly zenith: Rgb;
  readonly lightColor: Rgb;
  readonly lightIntensity: number;
};
