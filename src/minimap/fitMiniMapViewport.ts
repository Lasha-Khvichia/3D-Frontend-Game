import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Camera } from "@babylonjs/core/Cameras/camera";

/** Side of the map in CSS pixels. Must match `.overlay__minimap` in overlay.css. */
export const MINI_MAP_SIZE_CSS = 220;
/** Gap from the bottom-left corner of the screen, in CSS pixels. */
const MINI_MAP_MARGIN_CSS = 16;

/**
 * Puts the mini-map camera in the bottom-left corner of the screen.
 *
 * Babylon viewports are fractions of the render target and the map is a fixed
 * pixel size, so this has to be redone whenever the window or the render
 * resolution changes.
 *
 * A camera with no viewport of its own covers the **whole screen**, and the
 * mini-map camera draws after the player's. So this cannot wait for the first
 * simulation step: the game starts paused, no step runs until the player clicks
 * in, and until then the mini-map would be drawing over everything.
 */
export function fitMiniMapViewport(camera: Camera, engine: AbstractEngine): void {
  const width = engine.getRenderWidth();
  const height = engine.getRenderHeight();
  if (width <= 0 || height <= 0) return;

  const scaling = engine.getHardwareScalingLevel();
  const size = MINI_MAP_SIZE_CSS / scaling;
  const margin = MINI_MAP_MARGIN_CSS / scaling;
  camera.viewport = new Viewport(margin / width, margin / height, size / width, size / height);
}
