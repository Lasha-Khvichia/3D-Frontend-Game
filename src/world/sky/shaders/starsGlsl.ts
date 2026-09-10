import { STAR_NOISE_GLSL } from "./starNoiseGlsl";

/** Cells along each side of each of the six faces the star field is cut into. */
export const STAR_CELLS = 150;
/** Share of cells holding a star, before corners and the Milky Way: about 10,000 stars in all. */
export const STAR_DENSITY = 0.11;

/**
 * The night sky in GLSL: stars, the Milky Way and shooting stars. Its twin is
 * `starsWgsl.ts`.
 *
 * Stars live on a cube round the eye, one possible star per cell, found again
 * every frame from a hash of the cell — nothing is stored. Each pixel looks at
 * its own cell and the eight round it. Cells near a cube corner cover less sky,
 * so fewer of them hold a star, or the corners would be crowded.
 *
 * Brightness follows a steep power: nearly all stars are faint and a handful
 * are bright, which is how the real sky is. Angles are taken from the
 * difference of two directions, never from 1 − dot: near 1, a float has too
 * few steps left and every star comes out square.
 */
export const STARS_GLSL = `
uniform vec3 starAxisX;
uniform vec3 starAxisY;
uniform vec3 starAxisZ;
uniform vec4 starState;
uniform vec4 meteorHead;
uniform vec3 meteorTail;

${STAR_NOISE_GLSL}
vec3 starLight(vec3 s, float up) {
  vec3 a = abs(s);
  float face = a.x >= a.y && a.x >= a.z ? (s.x > 0.0 ? 0.0 : 1.0) : a.y >= a.z ? (s.y > 0.0 ? 2.0 : 3.0) : (s.z > 0.0 ? 4.0 : 5.0);
  vec2 uv = face < 1.5 ? s.yz / a.x : face < 3.5 ? s.xz / a.y : s.xy / a.z;
  vec2 cell = floor((uv * 0.5 + 0.5) * STAR_CELLS);
  vec3 light = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 c = cell + vec2(float(x), float(y));
      // Not in the row of cells along a face's edge: the next face never looks at them,
      // and a star there would be drawn cut in half.
      if (c.x < 1.0 || c.y < 1.0 || c.x >= STAR_CELLS - 1.0 || c.y >= STAR_CELLS - 1.0) continue;
      vec3 h = starHash(vec3(c, face * 131.0));
      vec2 at = (c + 0.15 + 0.7 * h.yz) / STAR_CELLS * 2.0 - 1.0;
      vec3 here = normalize(onFace(face, at));
      // Crowded along the Milky Way, as the real sky is: most faint stars lie in its plane.
      float plane = dot(here, vec3(-0.8676, -0.1980, 0.4560));
      float crowd = 1.0 + 2.5 * exp(-plane * plane / 0.02);
      if (h.x > STAR_DENSITY * crowd * pow(1.0 + dot(at, at), -1.5)) continue;
      vec3 k = starHash(vec3(c + 17.3, face * 57.0));
      // Moonlight brightens the sky itself: faint stars sink under it, bright ones stay.
      float bright = max(0.02 + 2.6 * pow(k.x, 9.0) - starState.w, 0.0);
      float twinkle = 1.0 + (1.0 - up) * 0.6 * sin(starState.y * (7.0 + 11.0 * k.y) + k.z * 6.2832);
      float spread = starState.z * (0.7 + 0.9 * sqrt(bright));
      vec3 off = s - here;
      vec3 tint = k.z < 0.15 ? vec3(0.72, 0.8, 1.0) : k.z < 0.78 ? vec3(1.0, 0.97, 0.92) : k.z < 0.94 ? vec3(1.0, 0.84, 0.6) : vec3(1.0, 0.64, 0.45);
      light += tint * bright * twinkle * exp(-dot(off, off) / (spread * spread));
    }
  }
  return light;
}

vec3 milkyWay(vec3 s) {
  float lat = dot(s, vec3(-0.8676, -0.1980, 0.4560));
  float band = exp(-lat * lat / 0.045);
  if (band < 0.01) return vec3(0.0);
  float core = pow(max(dot(s, vec3(-0.0550, -0.8734, -0.4839)), 0.0), 3.0);
  float clouds = valueNoise(s * 9.0) * 0.55 + valueNoise(s * 21.0) * 0.3 + valueNoise(s * 47.0) * 0.15;
  float dust = smoothstep(0.45, 0.72, valueNoise(s * 6.0 + 17.0)) * exp(-lat * lat / 0.004);
  return vec3(0.78, 0.8, 1.0) * band * (0.35 + 0.9 * core) * clouds * (1.0 - 0.75 * dust) * 0.2;
}

vec3 meteorLight(vec3 ray) {
  if (meteorHead.w <= 0.0) return vec3(0.0);
  vec3 along = meteorHead.xyz - meteorTail;
  float t = clamp(dot(ray - meteorTail, along) / dot(along, along), 0.0, 1.0);
  vec3 off = ray - normalize(meteorTail + along * t);
  float width = starState.z * 1.4;
  return vec3(1.0, 0.95, 0.85) * meteorHead.w * t * t * exp(-dot(off, off) / (width * width));
}

vec3 nightSky(vec3 ray) {
  if (starState.x <= 0.0) return vec3(0.0);
  vec3 s = vec3(dot(ray, starAxisX), dot(ray, starAxisY), dot(ray, starAxisZ));
  // Starlight crosses more air near the horizon and dies away into it.
  float air = smoothstep(-0.02, 0.3, ray.y);
  return ((starLight(s, ray.y) + milkyWay(s)) * air + meteorLight(ray)) * starState.x;
}
`
  .replace(/STAR_CELLS/g, STAR_CELLS.toFixed(1))
  .replace(/STAR_DENSITY/g, STAR_DENSITY.toFixed(3));
