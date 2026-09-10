import {
  CLOUD_BASE,
  CLOUD_TOP,
  DETAIL_TILE,
  PLANET_RADIUS,
  SHAPE_TILE,
  WEATHER_TILE,
} from "../cloudLayer";

const f = (value: number): string => value.toFixed(1);

/** `cloudDensityGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const CLOUD_DENSITY_WGSL = `
const CLOUD_BASE: f32 = ${f(CLOUD_BASE)};
const CLOUD_TOP: f32 = ${f(CLOUD_TOP)};
const PLANET_RADIUS: f32 = ${f(PLANET_RADIUS)};
const WEATHER_TILE: f32 = ${f(WEATHER_TILE)};
const SHAPE_TILE: f32 = ${f(SHAPE_TILE)};
const DETAIL_TILE: f32 = ${f(DETAIL_TILE)};

fn remap(value: f32, fromLow: f32, fromHigh: f32, toLow: f32, toHigh: f32) -> f32 {
  return toLow + (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow);
}

fn coverageFrom(weather: f32, cover: f32) -> f32 {
  let t = clamp((weather - (0.92 - cover * 0.8)) / 0.35, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

fn heightShape(h: f32, tall: f32) -> f32 {
  let top = mix(0.35, 1.0, tall);
  return smoothstep(0.0, 0.07, h) * (1.0 - smoothstep(top * 0.55, top, h));
}

fn cloudDensity(p: vec3f, altitude: f32, detailed: bool) -> f32 {
  let h = (altitude - CLOUD_BASE) / (CLOUD_TOP - CLOUD_BASE);
  if (h < 0.0 || h > 1.0) { return 0.0; }
  let drift = uniforms.weatherState.yz;
  let weather = textureSampleLevel(weatherSampler, weatherSamplerSampler, (p.xz + drift) / WEATHER_TILE, 0.0);
  let cover = coverageFrom(weather.r, uniforms.weatherState.x);
  if (cover < 0.001) { return 0.0; }
  let q = vec3f(p.x + drift.x + h * 500.0, altitude - uniforms.weatherState.w, p.z + drift.y);
  let low = textureSampleLevel(shapeSampler, shapeSamplerSampler, q / SHAPE_TILE, 0.0);
  let lowFbm = low.g * 0.625 + low.b * 0.25 + low.a * 0.125;
  var body = remap(low.r, lowFbm - 1.0, 1.0, 0.0, 1.0) * heightShape(h, weather.g);
  body = clamp(remap(body, 1.0 - cover, 1.0, 0.0, 1.0), 0.0, 1.0) * cover;
  if (body <= 0.0 || !detailed) { return body; }
  let wisp = textureSampleLevel(detailSampler, detailSamplerSampler, (q + vec3f(drift.x, 0.0, drift.y) * 0.6) / DETAIL_TILE, 0.0).rgb;
  let detail = wisp.r * 0.625 + wisp.g * 0.25 + wisp.b * 0.125;
  let erosion = mix(detail, 1.0 - detail, clamp(h * 4.0, 0.0, 1.0));
  return clamp(remap(body, erosion * 0.42, 1.0, 0.0, 1.0), 0.0, 1.0);
}

fn exitDistance(y: f32, rayY: f32, altitude: f32) -> f32 {
  let b = rayY * (PLANET_RADIUS + y);
  let c = (y - altitude) * (2.0 * PLANET_RADIUS + y + altitude);
  return -c / (b + sqrt(max(b * b - c, 0.0)));
}

fn altitudeAt(y: f32, rayY: f32, t: f32) -> f32 {
  return y + t * rayY + t * t * (1.0 - rayY * rayY) / (2.0 * PLANET_RADIUS);
}
`;
