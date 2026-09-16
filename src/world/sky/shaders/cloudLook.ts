/**
 * The numbers that decide how clouds look, shared by both shader languages.
 * This is the table to tune.
 */
export const CLOUD_LOOK = {
  /** Light lost per metre through cloud at full density. Real cumulus is 0.02 to 0.1. */
  extinction: 0.04,
  /** How bright sunlit cloud is. The phase function alone is about 0.08 at its average. */
  sunStrength: 10,
  /** How much the sky lights clouds from every side. */
  ambient: 1.0,
  /**
   * Sunlight that has bounced so many times inside a cloud it comes out of
   * every side. It is why an overcast sky is bright grey, not dark blue — and
   * it thins with the cloud above, which is what gives an overcast its
   * lighter and darker patches instead of one flat ceiling.
   */
  scatteredSun: 0.45,
  /**
   * How much of the sky's light a black storm takes off its clouds. Without it
   * a storm is one flat dark sheet; with it the thick cores go dark while
   * thinner cloud still shows the light coming through from above.
   */
  stormAmbient: 0.6,
  /**
   * How far up a black storm's base may hang, as a share of the layer: lumpy
   * where the cloud is thin, low where it is thick. With its 0.07 fade it stays
   * under 0.3, the height the shadows sample, so they stay exactly as they were.
   */
  stormBase: 0.22,
  /** First stride of the march toward the light, doubling each step after. */
  lightStride: 45,
  /** Clouds whose base is further than this along the ray are not marched at all. */
  farthest: 60_000,
  /** Longest stretch of one ray marched through the layer: edge-on near the horizon it is huge. */
  longestPath: 12_000,
  /** Distant clouds fade into the horizon's colour over roughly this distance. */
  hazeDistance: 30_000,
} as const;
