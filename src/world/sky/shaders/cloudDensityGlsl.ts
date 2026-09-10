import {
  CLOUD_BASE,
  CLOUD_TOP,
  DETAIL_TILE,
  PLANET_RADIUS,
  SHAPE_TILE,
  WEATHER_TILE,
} from "../cloudLayer";

const f = (value: number): string => value.toFixed(1);

/**
 * How dense the cloud is at a point, in GLSL. Kept in step, line for line, with
 * `cloudDensityWgsl.ts` — change one and change the other.
 *
 * Built the way Guerrilla's Nubis builds it: the weather map says whether a
 * cloud stands here and how tall; the shape volume gives it lumps; cover
 * decides how much of each lump survives; the detail volume eats the edges
 * into wisps — billowing at the bottom, wispy at the top.
 */
export const CLOUD_DENSITY_GLSL = `
const float CLOUD_BASE = ${f(CLOUD_BASE)};
const float CLOUD_TOP = ${f(CLOUD_TOP)};
const float PLANET_RADIUS = ${f(PLANET_RADIUS)};
const float WEATHER_TILE = ${f(WEATHER_TILE)};
const float SHAPE_TILE = ${f(SHAPE_TILE)};
const float DETAIL_TILE = ${f(DETAIL_TILE)};

float remap(float value, float fromLow, float fromHigh, float toLow, float toHigh) {
  return toLow + (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow);
}

float coverageFrom(float weather, float cover) {
  float t = clamp((weather - (0.92 - cover * 0.8)) / 0.35, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// Flat bases, rounded tops; tall clouds use the whole layer, low ones a third.
float heightShape(float h, float tall) {
  float top = mix(0.35, 1.0, tall);
  return smoothstep(0.0, 0.07, h) * (1.0 - smoothstep(top * 0.55, top, h));
}

float cloudDensity(vec3 p, float altitude, bool detailed) {
  float h = (altitude - CLOUD_BASE) / (CLOUD_TOP - CLOUD_BASE);
  if (h < 0.0 || h > 1.0) return 0.0;
  vec2 drift = weatherState.yz;
  vec4 weather = textureLod(weatherSampler, (p.xz + drift) / WEATHER_TILE, 0.0);
  float cover = coverageFrom(weather.r, weatherState.x);
  if (cover < 0.001) return 0.0;
  // Upper parts are carried further by the wind, so clouds lean downwind.
  vec3 q = vec3(p.x + drift.x + h * 500.0, altitude - weatherState.w, p.z + drift.y);
  vec4 low = textureLod(shapeSampler, q / SHAPE_TILE, 0.0);
  float lowFbm = low.g * 0.625 + low.b * 0.25 + low.a * 0.125;
  float body = remap(low.r, lowFbm - 1.0, 1.0, 0.0, 1.0) * heightShape(h, weather.g);
  body = clamp(remap(body, 1.0 - cover, 1.0, 0.0, 1.0), 0.0, 1.0) * cover;
  if (body <= 0.0 || !detailed) return body;
  vec3 wisp = textureLod(detailSampler, (q + vec3(drift.x, 0.0, drift.y) * 0.6) / DETAIL_TILE, 0.0).rgb;
  float detail = wisp.r * 0.625 + wisp.g * 0.25 + wisp.b * 0.125;
  float erosion = mix(detail, 1.0 - detail, clamp(h * 4.0, 0.0, 1.0));
  return clamp(remap(body, erosion * 0.42, 1.0, 0.0, 1.0), 0.0, 1.0);
}

// Distance along a ray from a camera at height y to where it leaves the shell
// at this altitude. Written so the Earth's radius cancels before it can eat
// the float's precision.
float exitDistance(float y, float rayY, float altitude) {
  float b = rayY * (PLANET_RADIUS + y);
  float c = (y - altitude) * (2.0 * PLANET_RADIUS + y + altitude);
  return -c / (b + sqrt(max(b * b - c, 0.0)));
}

// Height above the sea at distance t along the ray: straight up, plus the drop of the curved Earth.
float altitudeAt(float y, float rayY, float t) {
  return y + t * rayY + t * t * (1.0 - rayY * rayY) / (2.0 * PLANET_RADIUS);
}
`;
