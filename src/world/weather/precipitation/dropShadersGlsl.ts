import { CAUGHT_AT_GLSL } from "./caughtAtShaders";

/**
 * Rain, sleet and hail as streaks, or snow as flakes with `#define FLAKES`.
 * Its twin is `dropShadersWgsl.ts`; the two must stay line for line alike.
 *
 * Every drop is fixed in the world and moves by `travelled` — the fall and
 * the wind so far, kept small on the CPU so it never loses precision — then
 * is wrapped into a box round the eye, so the rain never runs out. A drop
 * whose lowest point is below where rain lands is hidden, and a streak is as
 * long as the drop falls while the eye's shutter is open.
 *
 * Nothing is drawn thinner than a pixel and a half: a centimetre-wide streak
 * ten metres off would break into dashes or vanish. It is widened instead and
 * made fainter by the same share, so distant rain reads as the grey veil it is.
 * Drops within a metre of the eye fade out: one passing the lens would lie
 * across half the screen as a bright bar.
 */
export const DROP_VERTEX_GLSL = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;
uniform vec3 travelled;
uniform vec4 fall;
uniform vec4 drift;
uniform vec4 dropSize;
varying vec2 vCorner;
varying float vFade;
${CAUGHT_AT_GLSL}
void main() {
  float box = fall.y;
  vec3 offset = position * box + travelled - cameraPosition + box * 0.5;
  offset = offset - box * floor(offset / box);
  vec3 p = cameraPosition + offset - box * 0.5;
  p.x += sin(drift.w * 1.7 + position.x * 60.0) * drift.y;
  p.z += cos(drift.w * 1.3 + position.z * 60.0) * drift.y;
  vec3 velocity = vec3(drift.x, -fall.x, drift.z);
  vec3 toEye = normalize(cameraPosition - p);
  float away = length(p - cameraPosition);
  float pixel = dropSize.z * away;
  float right = mod(uv.x, 2.0) - 0.5;
  float up = floor(uv.x / 2.0) - 0.5;
#ifdef FLAKES
  float size = max(dropSize.y, pixel * 2.5);
  float faint = dropSize.y * dropSize.y / (size * size);
  vec3 across = cross(vec3(0.0, 1.0, 0.0), toEye);
  across = normalize(across + vec3(0.0001, 0.0, 0.0));
  vec3 world = p + (across * right + normalize(cross(toEye, across)) * up) * size;
  vec3 lowest = p - vec3(0.0, size * 0.5, 0.0);
#else
  float width = max(dropSize.x, pixel * 1.5);
  float faint = dropSize.x / width;
  vec3 along = normalize(velocity);
  float span = length(velocity) * fall.w;
  vec3 across = cross(along, toEye);
  across = normalize(across + vec3(0.0001, 0.0, 0.0)) * width;
  vec3 world = p + across * right + along * span * up;
  vec3 lowest = p + along * span * 0.5;
#endif
  float shown = step(uv.y, fall.z) * step(caughtAt(lowest.xz), lowest.y);
  gl_Position = shown > 0.5 ? viewProjection * vec4(world, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  vCorner = vec2(right, up) * 2.0;
  vFade = faint * smoothstep(0.3, 1.0, away) * (1.0 - smoothstep(box * 0.3, box * 0.5, away));
}
`;

/** A soft streak, thin at its edges and faded at both ends; or a round flake. */
export const DROP_FRAGMENT_GLSL = `
precision highp float;
uniform vec4 tint;
varying vec2 vCorner;
varying float vFade;
void main() {
#ifdef FLAKES
  float shape = 1.0 - smoothstep(0.3, 1.0, length(vCorner));
#else
  float shape = (1.0 - abs(vCorner.x)) * (1.0 - vCorner.y * vCorner.y);
#endif
  float alpha = tint.a * shape * vFade;
  gl_FragColor = vec4(tint.rgb * alpha, alpha);
}
`;
