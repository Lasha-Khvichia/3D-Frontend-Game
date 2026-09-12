import { SHELTER_SLOTS } from "./wetField";

/** `wetGroundGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export function wetGroundWgsl(darken: number): Record<string, string> {
  return {
    CUSTOM_FRAGMENT_DEFINITIONS: `
fn wetHash(p: vec2f) -> f32 {
  var q = fract(vec3f(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
fn wetNoise(p: vec2f) -> f32 {
  let cell = floor(p);
  var t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  let low = mix(wetHash(cell), wetHash(cell + vec2f(1.0, 0.0)), t.x);
  let high = mix(wetHash(cell + vec2f(0.0, 1.0)), wetHash(cell + vec2f(1.0, 1.0)), t.x);
  return mix(low, high, t.y);
}
#ifdef WETGROUND
fn wetUnderRoof(xz: vec2f) -> f32 {
  var under = 0.0;
  for (var slot = 0; slot < ${SHELTER_SLOTS}; slot++) {
    let place = uniforms.wetRoofs[slot * 2];
    var local = xz - place.xy;
    local = select(local.yx, local, uniforms.wetRoofs[slot * 2 + 1].z > 0.5);
    let inside = vec2f(place.z, place.w) - abs(local);
    under = max(under, min(smoothstep(-0.2, 0.3, inside.x), smoothstep(-0.2, 0.3, inside.y)));
  }
  return under;
}
fn wetPuddleAt(xz: vec2f, level: f32) -> f32 {
  let dip = wetNoise(xz * 0.33) * 0.72 + wetNoise(xz * 1.1) * 0.28;
  let edge = -0.04 + 0.52 * level;
  return smoothstep(edge + 0.035, edge - 0.035, dip);
}
fn wetRipple(xz: vec2f, clock: f32) -> f32 {
  let cell = floor(xz);
  let life = fract(clock * 0.6 + wetHash(cell));
  let middle = vec2f(wetHash(cell + 11.3), wetHash(cell + 27.7));
  let away = length(fract(xz) - middle);
  let front = life * 0.45;
  return sin(60.0 * (away - front)) * exp(-14.0 * abs(away - front)) * (1.0 - life);
}
#endif
`,
    CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
var wetAmount = 0.0;
var wetPuddle = 0.0;
if (uniforms.wetLook.x > 0.002) {
  wetAmount = uniforms.wetLook.x;
#ifdef WETGROUND
  wetAmount *= 1.0 - wetUnderRoof(fragmentInputs.vPositionW.xz);
  let wetFlat = smoothstep(0.93, 0.99, normalize(fragmentInputs.vNormalW).y);
  wetPuddle = wetPuddleAt(fragmentInputs.vPositionW.xz, uniforms.wetLook.y * wetFlat * wetAmount);
#endif
  let soaked = mix(1.0, ${darken.toFixed(3)}, wetAmount) * mix(1.0, 0.7, wetPuddle);
  baseColor = vec4f(baseColor.rgb * soaked, baseColor.a);
}
`,
    CUSTOM_FRAGMENT_BEFORE_FOG: `
if (wetAmount > 0.002) {
  var wetN = normalize(fragmentInputs.vNormalW);
  let wetV = normalize(scene.vEyePosition.xyz - fragmentInputs.vPositionW);
#ifdef WETGROUND
  if (wetPuddle > 0.01 && uniforms.wetLook.z > 0.01) {
    let q = fragmentInputs.vPositionW.xz * 1.6;
    let here = wetRipple(q, uniforms.wetLook.w);
    let slope = vec2f(wetRipple(q + vec2f(0.06, 0.0), uniforms.wetLook.w), wetRipple(q + vec2f(0.0, 0.06), uniforms.wetLook.w)) - here;
    wetN = normalize(wetN + vec3f(slope.x, 0.0, slope.y) * (0.45 * uniforms.wetLook.z * wetPuddle));
  }
#endif
  let wetEdge = pow(1.0 - clamp(dot(wetN, wetV), 0.0, 1.0), 5.0);
  let mirror = (0.05 + 0.95 * wetEdge) * (0.3 * wetAmount + 0.7 * wetPuddle);
  let glint = pow(max(dot(reflect(-uniforms.wetSun.xyz, wetN), wetV), 0.0), 80.0) * uniforms.wetSun.w;
  let mirrored = mix(color.rgb, uniforms.wetSky.rgb * uniforms.wetSky.a, clamp(mirror, 0.0, 0.8));
  color = vec4f(mirrored + glint * (0.12 * wetAmount + 0.55 * wetPuddle), color.a);
}
`,
  };
}
