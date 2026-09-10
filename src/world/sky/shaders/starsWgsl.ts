import { STAR_CELLS, STAR_DENSITY } from "./starsGlsl";

/** `starsGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const STARS_WGSL = `
uniform starAxisX: vec3f;
uniform starAxisY: vec3f;
uniform starAxisZ: vec3f;
uniform starState: vec4f;
uniform meteorHead: vec4f;
uniform meteorTail: vec3f;

fn starHash(seed: vec3f) -> vec3f {
  var p = fract(seed * vec3f(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

fn valueNoise(p: vec3f) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  let a = mix(starHash(i).x, starHash(i + vec3f(1.0, 0.0, 0.0)).x, f.x);
  let b = mix(starHash(i + vec3f(0.0, 1.0, 0.0)).x, starHash(i + vec3f(1.0, 1.0, 0.0)).x, f.x);
  let c = mix(starHash(i + vec3f(0.0, 0.0, 1.0)).x, starHash(i + vec3f(1.0, 0.0, 1.0)).x, f.x);
  let d = mix(starHash(i + vec3f(0.0, 1.0, 1.0)).x, starHash(i + vec3f(1.0, 1.0, 1.0)).x, f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}

fn onFace(face: f32, uv: vec2f) -> vec3f {
  if (face < 1.5) { return vec3f(select(-1.0, 1.0, face < 0.5), uv); }
  if (face < 3.5) { return vec3f(uv.x, select(-1.0, 1.0, face < 2.5), uv.y); }
  return vec3f(uv, select(-1.0, 1.0, face < 4.5));
}

fn starLight(s: vec3f, up: f32) -> vec3f {
  let a = abs(s);
  let face = select(select(select(5.0, 4.0, s.z > 0.0), select(3.0, 2.0, s.y > 0.0), a.y >= a.z), select(1.0, 0.0, s.x > 0.0), a.x >= a.y && a.x >= a.z);
  let uv = select(select(s.xy / a.z, s.xz / a.y, face < 3.5), s.yz / a.x, face < 1.5);
  let cell = floor((uv * 0.5 + 0.5) * STAR_CELLS);
  var light = vec3f(0.0);
  for (var y: i32 = -1; y <= 1; y++) {
    for (var x: i32 = -1; x <= 1; x++) {
      let c = cell + vec2f(f32(x), f32(y));
      if (c.x < 1.0 || c.y < 1.0 || c.x >= STAR_CELLS - 1.0 || c.y >= STAR_CELLS - 1.0) { continue; }
      let h = starHash(vec3f(c, face * 131.0));
      let at = (c + 0.15 + 0.7 * h.yz) / STAR_CELLS * 2.0 - 1.0;
      let here = normalize(onFace(face, at));
      let plane = dot(here, vec3f(-0.8676, -0.1980, 0.4560));
      let crowd = 1.0 + 2.5 * exp(-plane * plane / 0.02);
      if (h.x > STAR_DENSITY * crowd * pow(1.0 + dot(at, at), -1.5)) { continue; }
      let k = starHash(vec3f(c + 17.3, face * 57.0));
      let bright = max(0.02 + 2.6 * pow(k.x, 9.0) - uniforms.starState.w, 0.0);
      let twinkle = 1.0 + (1.0 - up) * 0.6 * sin(uniforms.starState.y * (7.0 + 11.0 * k.y) + k.z * 6.2832);
      let spread = uniforms.starState.z * (0.7 + 0.9 * sqrt(bright));
      let off = s - here;
      let tint = select(select(select(vec3f(1.0, 0.64, 0.45), vec3f(1.0, 0.84, 0.6), k.z < 0.94), vec3f(1.0, 0.97, 0.92), k.z < 0.78), vec3f(0.72, 0.8, 1.0), k.z < 0.15);
      light += tint * bright * twinkle * exp(-dot(off, off) / (spread * spread));
    }
  }
  return light;
}

fn milkyWay(s: vec3f) -> vec3f {
  let lat = dot(s, vec3f(-0.8676, -0.1980, 0.4560));
  let band = exp(-lat * lat / 0.045);
  if (band < 0.01) { return vec3f(0.0); }
  let core = pow(max(dot(s, vec3f(-0.0550, -0.8734, -0.4839)), 0.0), 3.0);
  let clouds = valueNoise(s * 9.0) * 0.55 + valueNoise(s * 21.0) * 0.3 + valueNoise(s * 47.0) * 0.15;
  let dust = smoothstep(0.45, 0.72, valueNoise(s * 6.0 + 17.0)) * exp(-lat * lat / 0.004);
  return vec3f(0.78, 0.8, 1.0) * band * (0.35 + 0.9 * core) * clouds * (1.0 - 0.75 * dust) * 0.2;
}

fn meteorLight(ray: vec3f) -> vec3f {
  if (uniforms.meteorHead.w <= 0.0) { return vec3f(0.0); }
  let along = uniforms.meteorHead.xyz - uniforms.meteorTail;
  let t = clamp(dot(ray - uniforms.meteorTail, along) / dot(along, along), 0.0, 1.0);
  let off = ray - normalize(uniforms.meteorTail + along * t);
  let width = uniforms.starState.z * 1.4;
  return vec3f(1.0, 0.95, 0.85) * uniforms.meteorHead.w * t * t * exp(-dot(off, off) / (width * width));
}

fn nightSky(ray: vec3f) -> vec3f {
  if (uniforms.starState.x <= 0.0) { return vec3f(0.0); }
  let s = vec3f(dot(ray, uniforms.starAxisX), dot(ray, uniforms.starAxisY), dot(ray, uniforms.starAxisZ));
  let air = smoothstep(-0.02, 0.3, ray.y);
  return ((starLight(s, ray.y) + milkyWay(s)) * air + meteorLight(ray)) * uniforms.starState.x;
}
`
  .replace(/STAR_CELLS/g, STAR_CELLS.toFixed(1))
  .replace(/STAR_DENSITY/g, STAR_DENSITY.toFixed(3));
