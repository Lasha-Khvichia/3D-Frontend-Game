import { Scene } from "@babylonjs/core/scene";
import type { Color4 } from "@babylonjs/core/Maths/math.color";

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
 * Where haze starts. Half the view distance is the usual choice, and it is
 * what makes the far plane invisible: by the time geometry reaches the clip
 * it has already faded into the sky, so nothing is ever seen to pop out.
 */
const FOG_NEAR_METRES = VIEW_DISTANCE_METRES * 0.3;
const FOG_FAR_METRES = VIEW_DISTANCE_METRES * 0.86;

/**
 * Haze between here and the horizon.
 *
 * Without it a two-kilometre ground plane is a flat sheet of one colour
 * meeting the sky at a hard line, and distant houses are sharp models sitting
 * on it. Fog is what turns that into a horizon.
 *
 * The colour is not set here. It has to follow the sky through the day, or
 * the world sits in grey haze at midnight — `DayNightCycle` pushes the sky
 * colour into it on every step.
 */
export function applyDistanceFog(scene: Scene): void {
  // Linear rather than exponential. Exponential fog never fully hides
  // anything, so geometry would still be visible when the far plane cut it.
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogStart = FOG_NEAR_METRES;
  scene.fogEnd = FOG_FAR_METRES;
}

/** Keeps the haze the same colour as the sky it fades into. */
export function setFogColour(scene: Scene, sky: Color4): void {
  scene.fogColor.set(sky.r, sky.g, sky.b);
}
