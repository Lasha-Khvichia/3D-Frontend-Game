/**
 * Where the clouds are, and how big their patterns are, in metres.
 *
 * The layer sits where real fair-weather cumulus does: a flat base about
 * 1.4 km up and tops a couple of kilometres above that. Every repeat divides
 * the weather map's, so one wind offset kept below 38.4 km moves all three
 * patterns together without float precision ever running out.
 */
export const CLOUD_BASE = 1400;
export const CLOUD_TOP = 3600;
/**
 * Where in the layer a cloud's shadow is taken from, as a share of its depth:
 * low, where cumulus are widest.
 */
export const SHADOW_HEIGHT = 0.3;
export const SHADOW_ALTITUDE = CLOUD_BASE + SHADOW_HEIGHT * (CLOUD_TOP - CLOUD_BASE);
/** The Earth's. Clouds bend down to the horizon with it instead of running flat to infinity. */
export const PLANET_RADIUS = 6_360_000;
/** One repeat of the map of where clouds grow. */
export const WEATHER_TILE = 38_400;
/** One repeat of the lumps each cloud is made of. */
export const SHAPE_TILE = 3_200;
/** One repeat of the wisps eaten into their edges. */
export const DETAIL_TILE = 640;

/** How solid a cloud must be to cast its full shadow: 1 - exp(-body * this). */
export const SHADOW_BODY = 6;

/**
 * How dark a cloud's shadow is at full cover. Not black: the sky still
 * lights the ground under a cloud, and so does the light scattered through it.
 */
export const SHADOW_DARKNESS = 0.8;

/**
 * The weather map's red channel, 0 to 1, turned into how much cloud stands
 * over a point, for a sky with this much cover overall.
 *
 * The one formula shared by the march, the shadows on the ground and the CPU
 * — if these disagree, shadows fall where no cloud is.
 */
export function coverageFrom(weather: number, cover: number): number {
  const threshold = 0.92 - cover * 0.8;
  const t = Math.min(1, Math.max(0, (weather - threshold) / 0.35));
  return t * t * (3 - 2 * t);
}
