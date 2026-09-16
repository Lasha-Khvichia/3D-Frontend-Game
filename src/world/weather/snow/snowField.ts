import type { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { FOOT_SPAN, PRINT_FADE_HOURS, PRINT_WINDOW_HOURS } from "./footprintStamps";
import { PERMANENT_DEPTH, PERMANENT_EDGE, PERMANENT_LINE, SNOWY_RANGES } from "./snowCover";
import { SNOW_BANDS } from "./snowDepth";

/** Two vec4 for the shader: where each snowy range is and how far it reaches. */
const ranges = SNOWY_RANGES.flatMap((range) => [range.x, range.z, range.radius, 0]);

/** This step's lying snow, shared with the materials that show it. `SnowGround` sets it. */
export const snowField = {
  /** Metres of snow at each height band, from the sea upward (`snowDepth.ts`). */
  deep: new Array<number>(SNOW_BANDS).fill(0),
  /** The cap that never melts: where it starts, how far it fades in, how deep it lies. */
  cap: { line: PERMANENT_LINE, edge: PERMANENT_EDGE, depth: PERMANENT_DEPTH },
  /** How far through the print window we are, so the shader can age each print. */
  nowShare: 0,
  /** How much of that window a print survives: shorter while snow is filling them in. */
  printLife: PRINT_WINDOW_HOURS / PRINT_FADE_HOURS,
  ranges,
  /** The footprint map's corner and size in metres. */
  foot: { x: -FOOT_SPAN / 2, z: -FOOT_SPAN / 2, size: FOOT_SPAN },
  /** Null until the snow system is built; the plugin binds an empty map until then. */
  prints: null as RawTexture | null,
};
