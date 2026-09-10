/**
 * The hashes and noise the night sky is built from, in GLSL. Cheap and
 * stateless: the same cell always gives the same star, frame after frame.
 */
export const STAR_NOISE_GLSL = `
vec3 starHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(starHash(i).x, starHash(i + vec3(1.0, 0.0, 0.0)).x, f.x);
  float b = mix(starHash(i + vec3(0.0, 1.0, 0.0)).x, starHash(i + vec3(1.0, 1.0, 0.0)).x, f.x);
  float c = mix(starHash(i + vec3(0.0, 0.0, 1.0)).x, starHash(i + vec3(1.0, 0.0, 1.0)).x, f.x);
  float d = mix(starHash(i + vec3(0.0, 1.0, 1.0)).x, starHash(i + vec3(1.0, 1.0, 1.0)).x, f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}

vec3 onFace(float face, vec2 uv) {
  if (face < 1.5) return vec3(face < 0.5 ? 1.0 : -1.0, uv);
  if (face < 3.5) return vec3(uv.x, face < 2.5 ? 1.0 : -1.0, uv.y);
  return vec3(uv, face < 4.5 ? 1.0 : -1.0);
}
`;
