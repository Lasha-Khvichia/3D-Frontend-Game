import { Scene } from "@babylonjs/core/scene";

/**
 * How far the camera can see. Everything past this is clipped away entirely.
 *
 * Smaller than the map on purpose. Real air is not clear for two kilometres,
 * and the depth buffer is not precise enough to be asked for it: the near
 * plane is 0.1 m, so the ratio to the far plane is what decides how much
 * precision is left for everything in between.
 */
export const VIEW_DISTANCE_METRES = 1400;

/**
 * The furthest the render distance goes. Fog must finish inside the far
 * plane: by the time geometry reaches the clip it has already faded into the
 * sky, so nothing is ever seen to be cut off.
 */
export const MAX_RENDER_DISTANCE = 1200;

/**
 * Where haze starts, as a share of where it ends. Starting a third of the way
 * out keeps the middle distance clear and still gives the fade room to be
 * gradual.
 */
const FOG_START_SHARE = 0.35;

/**
 * Haze from a third of the render distance out to all of it.
 *
 * Without it a two-kilometre ground plane is a flat sheet of one colour
 * meeting the sky at a hard line, and distant houses are sharp models sitting
 * on it. Fog is what turns that into a horizon.
 *
 * It is also what makes streaming invisible. Babylon measures fog along the
 * straight line from the eye, not the depth into the screen, so everything
 * past the render distance is fully hidden in every direction, corners of the
 * screen included — which is why nothing needs to be built there at all.
 *
 * The weather can bring it closer: `visibility` is how far one can see
 * through fog or falling rain and snow, and never pushes it further out.
 *
 * The colour is not set here. It has to follow the sky through the day, or
 * the world sits in grey haze at midnight — `DayNightCycle` pushes the sky
 * colour into it on every step, whitened in mist.
 */
export function applyDistanceFog(
  scene: Scene,
  renderDistance = MAX_RENDER_DISTANCE,
  visibility = Infinity,
): void {
  // Linear rather than exponential. Exponential fog never fully hides
  // anything, so geometry would still be visible when the far plane cut it.
  scene.fogMode = Scene.FOGMODE_LINEAR;
  const reach = Math.min(renderDistance, MAX_RENDER_DISTANCE);
  scene.fogEnd = Math.min(reach, visibility);
  // Weather that shortens the view — fog, a downpour, a blizzard — thickens
  // from close by, not from a third of the way out.
  const share = visibility >= reach ? FOG_START_SHARE : 0.08 + 0.27 * (visibility / reach);
  scene.fogStart = scene.fogEnd * share;
}
