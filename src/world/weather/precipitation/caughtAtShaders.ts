import { CATCH_LOWEST, CATCH_RANGE } from "./CatchMap";
import { ROOF_SLOTS } from "./NearRoofs";

const f = (value: number): string => value.toFixed(4);

/**
 * Where rain lands under a point: the catch map's packed height of the ground
 * or water, far below off its edge, or the highest of the nearest roofs over
 * it, each tested as the exact gable it is (`NearRoofs`).
 */
export const CAUGHT_AT_GLSL = `
uniform sampler2D catchMap;
uniform vec4 catchArea;
uniform vec4 roofs[${ROOF_SLOTS * 2}];
float caughtAt(vec2 xz) {
  float landed = -1000.0;
  vec2 cell = (xz - catchArea.xy) / catchArea.z;
  if (cell.x >= 0.0 && cell.y >= 0.0 && cell.x <= 1.0 && cell.y <= 1.0) {
    vec4 texel = texture2D(catchMap, cell);
    landed = (texel.r * 65280.0 + texel.g * 255.0) / 65535.0 * ${f(CATCH_RANGE)} + ${f(CATCH_LOWEST)};
  }
  for (int i = 0; i < ${ROOF_SLOTS}; i++) {
    vec4 place = roofs[i * 2];
    vec4 shape = roofs[i * 2 + 1];
    vec2 local = xz - place.xy;
    local = shape.z > 0.5 ? local : local.yx;
    if (abs(local.x) <= place.z && abs(local.y) <= place.w) landed = max(landed, shape.x - abs(local.y) * shape.y);
  }
  return landed;
}
`;

/** The same in WGSL, for WebGPU. Kept line for line alike. */
export const CAUGHT_AT_WGSL = `
var catchMapSampler: sampler;
var catchMap: texture_2d<f32>;
uniform catchArea: vec4f;
uniform roofs: array<vec4f, ${ROOF_SLOTS * 2}>;
fn caughtAt(xz: vec2f) -> f32 {
  var landed = -1000.0;
  let cell = (xz - uniforms.catchArea.xy) / uniforms.catchArea.z;
  if (cell.x >= 0.0 && cell.y >= 0.0 && cell.x <= 1.0 && cell.y <= 1.0) {
    let texel = textureSampleLevel(catchMap, catchMapSampler, cell, 0.0);
    landed = (texel.r * 65280.0 + texel.g * 255.0) / 65535.0 * ${f(CATCH_RANGE)} + ${f(CATCH_LOWEST)};
  }
  for (var i = 0; i < ${ROOF_SLOTS}; i++) {
    let place = uniforms.roofs[i * 2];
    let shape = uniforms.roofs[i * 2 + 1];
    var local = xz - place.xy;
    local = select(local.yx, local, shape.z > 0.5);
    if (abs(local.x) <= place.z && abs(local.y) <= place.w) { landed = max(landed, shape.x - abs(local.y) * shape.y); }
  }
  return landed;
}
`;
