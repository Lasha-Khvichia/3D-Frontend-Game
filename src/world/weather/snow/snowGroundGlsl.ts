import { SNOWY_RANGES } from "./snowCover";

const f = (value: number): string => value.toFixed(3);
/** How white lying snow is, and how much a boot print dulls it. */
const SNOW_COLOUR = "vec3(0.93, 0.95, 0.98)";

/**
 * Snow lying on the high ground, in GLSL. Its twin is `snowGroundWgsl.ts`.
 *
 * Height decides it, not the vertex colour, so the snow line can come down
 * the slopes through the winter and lift again in spring without a single
 * patch of ground being rebuilt. Snow thins on a steep face but never leaves
 * it: seen from the valley a mountain is almost all steep face, and snow only
 * on its ledges reads as no snow at all.
 *
 * `snowLook` is the line, the fade band, how far through the print window we
 * are, and how much of that window a print survives.
 *
 * It runs **after** the wet ground's code and takes over its `wetAmount` and
 * `wetPuddle`: snow is not wet ground, and rain does not pool on it.
 */
export const SNOW_GROUND_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
uniform sampler2D footprintMap;
float snowJitter(vec2 p) {
  return fract(sin(dot(floor(p * 0.35), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}
/** 1 where the ground belongs to a snowy range, 0 elsewhere. */
float snowRange(vec2 xz) {
  float inside = 0.0;
  for (int i = 0; i < ${SNOWY_RANGES.length}; i++) {
    inside = max(inside, step(length(xz - snowRanges[i].xy), snowRanges[i].z));
  }
  return inside;
}
/** 1 a fresh boot print, 0 untrodden ground or a print long filled in. */
float snowTrodden(vec2 xz) {
  vec2 cell = (xz - footArea.xy) / footArea.z;
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x > 1.0 || cell.y > 1.0) return 0.0;
  vec4 print = texture2D(footprintMap, cell);
  if (print.r <= 0.0) return 0.0;
  return print.g * clamp(1.0 - (snowLook.z - print.r) * snowLook.w, 0.0, 1.0);
}
`,
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
if (vPositionW.y > snowLook.x - snowLook.y * 2.0) {
  float snowLine = snowLook.x + snowJitter(vPositionW.xz) * 8.0;
  float lying = clamp((vPositionW.y - snowLine) / snowLook.y, 0.0, 1.0) * snowRange(vPositionW.xz);
  float snowSteep = 1.0 - clamp((normalize(vNormalW).y - 0.5) / 0.35, 0.0, 1.0);
  float snowHere = lying * (1.0 - 0.5 * snowSteep);
  float trodden = snowTrodden(vPositionW.xz) * step(0.05, snowHere);
  snowHere *= 1.0 - 0.1 * trodden;
  baseColor.rgb = mix(baseColor.rgb, ${SNOW_COLOUR} * (1.0 - ${f(0.3)} * trodden), snowHere);
  // Snow is not wet ground: it takes over from the rain that fell before it.
  wetAmount *= 1.0 - snowHere;
  wetPuddle *= 1.0 - snowHere;
}
`,
};
