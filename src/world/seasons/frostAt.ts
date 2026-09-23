/** Degrees below which frost forms, and the degree at which it is thickest. */
const FORMS_BELOW = 1;
const HARD_AT = -2;
/** A clear sky lets the ground give its heat away; cloud holds it in. */
const CLOUD_KEEPS = 0.7;
/** Sun heights between which a light frost burns off. */
const SUN_LOW = 0.03;
const SUN_WARM = 0.12;
/** Warmer than this and the sun clears it; colder, and a hard frost lies all day. */
const MELTS_ABOVE = -2;
const MELT_SPAN = 3;

/**
 * How much frost lies on things right now, 0 to 1.
 *
 * A function of the moment, like the weather: cold enough, under a sky clear
 * enough to have lost its heat overnight, and not yet burnt off by the sun. A
 * hard frost stays all day; a light one is gone soon after sunrise.
 */
export function frostAt(temperature: number, cover: number, sunHeight: number): number {
  const cold = clamp((FORMS_BELOW - temperature) / (FORMS_BELOW - HARD_AT));
  if (cold <= 0) return 0;
  const clear = 1 - CLOUD_KEEPS * clamp(cover);
  const sun = smooth(SUN_LOW, SUN_WARM, sunHeight) * clamp((temperature - MELTS_ABOVE) / MELT_SPAN);
  return cold * clear * (1 - sun);
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth(low: number, high: number, value: number): number {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
}
