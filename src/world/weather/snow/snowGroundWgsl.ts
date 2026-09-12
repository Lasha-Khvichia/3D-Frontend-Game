import { SNOWY_RANGES } from "./snowCover";

const f = (value: number): string => value.toFixed(3);
const SNOW_COLOUR = "vec3f(0.93, 0.95, 0.98)";

/** `snowGroundGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const SNOW_GROUND_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
var footprintMapSampler: sampler;
var footprintMap: texture_2d<f32>;
fn snowJitter(p: vec2f) -> f32 {
  return fract(sin(dot(floor(p * 0.35), vec2f(12.9898, 78.233))) * 43758.5453) - 0.5;
}
fn snowRange(xz: vec2f) -> f32 {
  var inside = 0.0;
  for (var i = 0; i < ${SNOWY_RANGES.length}; i++) {
    inside = max(inside, step(length(xz - uniforms.snowRanges[i].xy), uniforms.snowRanges[i].z));
  }
  return inside;
}
fn snowTrodden(xz: vec2f) -> f32 {
  let cell = (xz - uniforms.footArea.xy) / uniforms.footArea.z;
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x > 1.0 || cell.y > 1.0) { return 0.0; }
  // Sampled by level, not plainly: WGSL only allows a plain sample from
  // uniform control flow, and this runs inside the snow's own branch.
  let print = textureSampleLevel(footprintMap, footprintMapSampler, cell, 0.0);
  if (print.r <= 0.0) { return 0.0; }
  return print.g * clamp(1.0 - (uniforms.snowLook.z - print.r) * uniforms.snowLook.w, 0.0, 1.0);
}
`,
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
if (fragmentInputs.vPositionW.y > uniforms.snowLook.x - uniforms.snowLook.y * 2.0) {
  let snowLine = uniforms.snowLook.x + snowJitter(fragmentInputs.vPositionW.xz) * 8.0;
  let lying = clamp((fragmentInputs.vPositionW.y - snowLine) / uniforms.snowLook.y, 0.0, 1.0) * snowRange(fragmentInputs.vPositionW.xz);
  let snowSteep = 1.0 - clamp((normalize(fragmentInputs.vNormalW).y - 0.5) / 0.35, 0.0, 1.0);
  var snowHere = lying * (1.0 - 0.5 * snowSteep);
  let trodden = snowTrodden(fragmentInputs.vPositionW.xz) * step(0.05, snowHere);
  snowHere *= 1.0 - 0.1 * trodden;
  baseColor = vec4f(mix(baseColor.rgb, ${SNOW_COLOUR} * (1.0 - ${f(0.3)} * trodden), snowHere), baseColor.a);
  // Snow is not wet ground: it takes over from the rain that fell before it.
  wetAmount *= 1.0 - snowHere;
  wetPuddle *= 1.0 - snowHere;
}
`,
};
