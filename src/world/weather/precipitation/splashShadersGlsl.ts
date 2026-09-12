import { CAUGHT_AT_GLSL } from "./caughtAtShaders";

const f = (value: number): string => value.toFixed(4);
/** Metres either side a splash looks at the surface: just past the widest ring. */
export const SPLASH_SPREAD = 0.16;

/**
 * Splashes: small rings spreading where rain lands, on a roof or the ground.
 * Each one lives a moment, then starts again somewhere new near the eye —
 * where is a hash of which splash it is and which moment, with Dave Hoskins'
 * sine-free hash, so every GPU puts it in the same place. Its twin is
 * `splashShadersWgsl.ts`, line for line alike.
 *
 * A ring is laid on the slope under it, from the surface either side: a level
 * ring on a 37-degree roof dips 11 cm into it on its uphill side, and shows
 * on the ceiling. Where the two sides disagree — a ridge, an eave, the edge
 * of a roof — the ring would hang in the air or sink, so it is not shown.
 */
export const SPLASH_VERTEX_GLSL = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;
uniform vec4 splash;
varying vec2 vCorner;
varying float vAge;
${CAUGHT_AT_GLSL}
vec2 scatter(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
void main() {
  float clock = splash.x / splash.w + position.z;
  float slot = floor(clock);
  float age = clock - slot;
  vec2 xz = cameraPosition.xz + (scatter(vec2(slot, position.x * 1000.0 + position.y)) - 0.5) * 2.0 * splash.y;
  float y = caughtAt(xz);
  float east = caughtAt(xz + vec2(${f(SPLASH_SPREAD)}, 0.0)) - y;
  float west = y - caughtAt(xz - vec2(${f(SPLASH_SPREAD)}, 0.0));
  float north = caughtAt(xz + vec2(0.0, ${f(SPLASH_SPREAD)})) - y;
  float south = y - caughtAt(xz - vec2(0.0, ${f(SPLASH_SPREAD)}));
  float planar = step(abs(east - west) + abs(north - south), 0.02);
  float shown = step(uv.y, splash.z) * step(-999.0, y) * planar;
  float radius = 0.03 + age * 0.12;
  vec2 corner = vec2(mod(uv.x, 2.0) - 0.5, floor(uv.x / 2.0) - 0.5) * 2.0;
  vec2 reach = corner * radius;
  float rise = ((east + west) * reach.x + (north + south) * reach.y) / ${f(2 * SPLASH_SPREAD)};
  vec3 world = vec3(xz.x + reach.x, y + 0.02 + rise, xz.y + reach.y);
  gl_Position = shown > 0.5 ? viewProjection * vec4(world, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  vCorner = corner;
  vAge = age;
}
`;

export const SPLASH_FRAGMENT_GLSL = `
precision highp float;
uniform vec4 tint;
varying vec2 vCorner;
varying float vAge;
void main() {
  float r = length(vCorner);
  float ring = smoothstep(0.55, 0.8, r) * (1.0 - smoothstep(0.8, 1.0, r));
  float alpha = tint.a * ring * (1.0 - vAge);
  gl_FragColor = vec4(tint.rgb * alpha, alpha);
}
`;
