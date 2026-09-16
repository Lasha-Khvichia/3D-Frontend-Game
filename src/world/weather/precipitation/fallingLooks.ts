import type { PrecipitationForm } from "../weatherState";

/** How one kind of drop falls and looks at this moment. */
export type Falling = {
  /** Metres a second downward, before each drop's own pace. Raindrops 7 to 10, snow about 1. */
  readonly speed: number;
  /** Share of the layer's drops shown: how hard it is coming down. */
  readonly share: number;
  /** Width of a streak, metres. */
  readonly width: number;
  /** Seconds the eye's shutter is open: a streak is as long as its drop falls in that time. */
  readonly shutter: number;
  /** Size of a flake, metres. */
  readonly flake: number;
  /** Metres a flake sways either side as it falls. */
  readonly sway: number;
  readonly opacity: number;
  /** 0 clear water, 1 white ice. */
  readonly white: number;
  /** Share of the wind a drop is carried by: snow further than rain, hail barely. */
  readonly carried: number;
  /** Most sideways speed per metre a second of fall: 1 leans a drop 45 degrees at most. */
  readonly lean: number;
};

/**
 * The streaks for rain, sleet and hail, or null when nothing streaks. `rate`
 * runs from 0 to 1: drizzle is about 0.15, a downpour 1. Rain is thin, fast
 * and faint, even as drizzle: slow short dashes read as snow.
 */
export function streaksFor(form: PrecipitationForm, rate: number): Falling | null {
  const heavy = Math.min(1, Math.max(0, rate));
  if (form === "rain") {
    return drop(
      7 + 3 * heavy,
      0.1 + 0.9 * heavy,
      0.005 + 0.004 * heavy,
      1 / 22,
      0.32 + 0.2 * heavy,
      0,
      1,
      1,
    );
  }
  if (form === "sleet") return drop(4, 0.1 + 0.4 * heavy, 0.01, 1 / 40, 0.35, 0.5, 0.8, 1);
  if (form === "hail") return drop(11, 0.15 + 0.85 * heavy, 0.02, 1 / 90, 0.75, 1, 0.6, 0.6);
  return null;
}

/** The flakes for snow and for sleet's icy half, or null when nothing flakes. */
export function flakesFor(form: PrecipitationForm, rate: number): Falling | null {
  const heavy = Math.min(1, Math.max(0, rate));
  if (form === "snow")
    return flake(1 + 0.3 * heavy, 0.15 + 0.85 * heavy, 0.03 + 0.02 * heavy, 0.2, 0.9);
  if (form === "sleet") return flake(2, 0.1 + 0.4 * heavy, 0.025, 0.08, 0.7);
  return null;
}

/** Splashes where water lands: none for snow, which settles instead. */
export function splashesFor(form: PrecipitationForm, rate: number): number {
  if (form === "rain" || form === "hail") return Math.min(1, Math.max(0, rate));
  return form === "sleet" ? 0.4 * rate : 0;
}

function drop(
  speed: number,
  share: number,
  width: number,
  shutter: number,
  opacity: number,
  white: number,
  carried: number,
  lean: number,
): Falling {
  return { speed, share, width, shutter, flake: 0, sway: 0, opacity, white, carried, lean };
}

function flake(speed: number, share: number, size: number, sway: number, opacity: number): Falling {
  // Snow drifts with the wind, but even a gale leans it no more than 60 degrees.
  return {
    speed,
    share,
    width: 0,
    shutter: 0,
    flake: size,
    sway,
    opacity,
    white: 1,
    carried: 0.7,
    lean: 1.7,
  };
}
