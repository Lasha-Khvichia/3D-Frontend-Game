import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

/** Side of the map in CSS pixels. Must match `.overlay__minimap` in overlay.css. */
export const MINI_MAP_SIZE_CSS = 220;
/** Gap from the bottom-left corner of the screen, in CSS pixels. */
const MINI_MAP_MARGIN_CSS = 16;

/**
 * Where the mini-map sits on screen: the bottom-left corner, as fractions of
 * the render target, or null before the canvas has a size.
 *
 * Babylon viewports are fractions and the map is a fixed pixel size, so this
 * is worked out again whenever the window or the render resolution changes.
 */
export function miniMapCorner(engine: AbstractEngine): Viewport | null {
  const width = engine.getRenderWidth();
  const height = engine.getRenderHeight();
  if (width <= 0 || height <= 0) return null;

  const scaling = engine.getHardwareScalingLevel();
  const size = MINI_MAP_SIZE_CSS / scaling;
  const margin = MINI_MAP_MARGIN_CSS / scaling;
  return new Viewport(margin / width, margin / height, size / width, size / height);
}
