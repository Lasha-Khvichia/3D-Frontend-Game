import type { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { FOOT_SPAN, PRINT_FADE_HOURS, PRINT_WINDOW_HOURS } from "./footprintStamps";
import { SNOW_EDGE, SNOWY_RANGES } from "./snowCover";

/** Two vec4 for the shader: where each snowy range is and how far it reaches. */
const ranges = SNOWY_RANGES.flatMap((range) => [range.x, range.z, range.radius, 0]);

/** This step's lying snow, shared with the ground material. `SnowGround` sets it. */
export const snowField = {
  /** Metres: snow lies above this, fading in over `edge`. */
  line: 95,
  edge: SNOW_EDGE,
  /** How far through the print window we are, so the shader can age each print. */
  nowShare: 0,
  /** How much of that window a print survives: higher while snow is filling them in. */
  printLife: PRINT_WINDOW_HOURS / PRINT_FADE_HOURS,
  ranges,
  /** The footprint map's corner and size in metres. */
  foot: { x: -FOOT_SPAN / 2, z: -FOOT_SPAN / 2, size: FOOT_SPAN },
  /** Null until the snow system is built; the plugin binds an empty map until then. */
  prints: null as RawTexture | null,
};
