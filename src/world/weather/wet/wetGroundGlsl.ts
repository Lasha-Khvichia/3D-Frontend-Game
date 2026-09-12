import { SHELTER_SLOTS } from "./wetField";

/**
 * Wet ground, in GLSL. Its twin is `wetGroundWgsl.ts`; the two must stay line
 * for line alike, or the ground looks different on WebGPU.
 *
 * Three things happen to a soaked surface, and all three are what make it
 * read as wet rather than merely darker: it darkens, because the water traps
 * light that would have scattered back out; it goes glossy, mirroring the sky
 * and most strongly at a grazing angle (Fresnel), which is why a wet road
 * shines ahead of you and not at your feet; and where it is flat and can hold
 * no more, water stands in puddles, rung by the rain still falling.
 *
 * `darken` is how dark the surface goes when soaked: soil much, grass less.
 * Puddles and the dry ground under roofs are the ground's alone (`WETGROUND`).
 */
export function wetGroundGlsl(darken: number): Record<string, string> {
  return {
    CUSTOM_FRAGMENT_DEFINITIONS: `
float wetHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float wetNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  float low = mix(wetHash(cell), wetHash(cell + vec2(1.0, 0.0)), t.x);
  float high = mix(wetHash(cell + vec2(0.0, 1.0)), wetHash(cell + vec2(1.0, 1.0)), t.x);
  return mix(low, high, t.y);
}
#ifdef WETGROUND
/** How far under a roof this spot is, 0 out in the rain to 1 well inside. */
float wetUnderRoof(vec2 xz) {
  float under = 0.0;
  for (int slot = 0; slot < ${SHELTER_SLOTS}; slot++) {
    vec4 place = wetRoofs[slot * 2];
    vec2 local = xz - place.xy;
    local = wetRoofs[slot * 2 + 1].z > 0.5 ? local : local.yx;
    vec2 inside = vec2(place.z, place.w) - abs(local);
    under = max(under, min(smoothstep(-0.2, 0.3, inside.x), smoothstep(-0.2, 0.3, inside.y)));
  }
  return under;
}
/** Where the hollows are: standing water fills the low ground first. */
float wetPuddleAt(vec2 xz, float level) {
  float dip = wetNoise(xz * 0.33) * 0.72 + wetNoise(xz * 1.1) * 0.28;
  float edge = -0.04 + 0.52 * level;
  return smoothstep(edge + 0.035, edge - 0.035, dip);
}
/**
 * One ring at a time in each cell, starting at its own moment and in its own
 * place, spreading and dying away: rain landing on standing water. A ring in
 * every cell at once, all the same size, reads as corrugated metal.
 */
float wetRipple(vec2 xz, float clock) {
  vec2 cell = floor(xz);
  float life = fract(clock * 0.6 + wetHash(cell));
  vec2 middle = vec2(wetHash(cell + 11.3), wetHash(cell + 27.7));
  float away = length(fract(xz) - middle);
  float front = life * 0.45;
  return sin(60.0 * (away - front)) * exp(-14.0 * abs(away - front)) * (1.0 - life);
}
#endif
`,
    CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
float wetAmount = 0.0;
float wetPuddle = 0.0;
if (wetLook.x > 0.002) {
  wetAmount = wetLook.x;
#ifdef WETGROUND
  wetAmount *= 1.0 - wetUnderRoof(vPositionW.xz);
  float wetFlat = smoothstep(0.93, 0.99, normalize(vNormalW).y);
  wetPuddle = wetPuddleAt(vPositionW.xz, wetLook.y * wetFlat * wetAmount);
#endif
  baseColor.rgb *= mix(1.0, ${darken.toFixed(3)}, wetAmount) * mix(1.0, 0.7, wetPuddle);
}
`,
    CUSTOM_FRAGMENT_BEFORE_FOG: `
if (wetAmount > 0.002) {
  vec3 wetN = normalize(vNormalW);
  vec3 wetV = normalize(vEyePosition.xyz - vPositionW);
#ifdef WETGROUND
  if (wetPuddle > 0.01 && wetLook.z > 0.01) {
    vec2 q = vPositionW.xz * 1.6;
    float here = wetRipple(q, wetLook.w);
    vec2 slope = vec2(wetRipple(q + vec2(0.06, 0.0), wetLook.w), wetRipple(q + vec2(0.0, 0.06), wetLook.w)) - here;
    wetN = normalize(wetN + vec3(slope.x, 0.0, slope.y) * (0.45 * wetLook.z * wetPuddle));
  }
#endif
  float wetEdge = pow(1.0 - clamp(dot(wetN, wetV), 0.0, 1.0), 5.0);
  float mirror = (0.05 + 0.95 * wetEdge) * (0.3 * wetAmount + 0.7 * wetPuddle);
  float glint = pow(max(dot(reflect(-wetSun.xyz, wetN), wetV), 0.0), 80.0) * wetSun.w;
  color.rgb = mix(color.rgb, wetSky.rgb * wetSky.a, clamp(mirror, 0.0, 0.8));
  color.rgb += glint * (0.12 * wetAmount + 0.55 * wetPuddle);
}
`,
  };
}
