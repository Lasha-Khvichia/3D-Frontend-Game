import {
  SHADOW_ALTITUDE,
  SHADOW_BODY,
  SHADOW_DARKNESS,
  SHADOW_HEIGHT,
  SHAPE_TILE,
  WEATHER_TILE,
} from "../cloudLayer";

const f = (value: number): string => value.toFixed(3);
/** Lights a standard material can take; each gets its own injection point. */
const MOST_LIGHTS = 8;

/**
 * Dims only the directional lights — the sun and the moon — by the cloud
 * standing between them and this pixel. The sky's own light and the fire
 * indoors are untouched, and because the light itself is dimmed rather than
 * the pixel darkened, a tree's shadow fades out under a cloud the way a real
 * one does: there is no direct sun left to cast it.
 *
 * The cloud is sampled once, low in the layer where cumulus are widest, with
 * the same weather, cover and shape the clouds themselves are drawn from — so
 * each shadow is the shape of the cloud above it and moves with it.
 */
function perLight(body: (index: number) => string): Record<string, string> {
  const code: Record<string, string> = {};
  for (let index = 0; index < MOST_LIGHTS; index += 1) {
    code[`CUSTOM_LIGHT${index}_COLOR`] = `#ifdef DIRLIGHT${index}\n${body(index)}\n#endif`;
  }
  return code;
}

export const CLOUD_SHADOW_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
uniform sampler2D cloudWeatherMap;
uniform highp sampler3D cloudShapeMap;
float cloudShadowAt(vec3 worldPos) {
  vec4 toward = cloudShadowToward;
  if (toward.y < 0.02 || toward.w <= 0.0) return 1.0;
  vec2 over = worldPos.xz + toward.xz * ((${f(SHADOW_ALTITUDE)} - worldPos.y) / toward.y);
  vec2 drift = cloudShadowState.yz;
  vec4 weather = texture2D(cloudWeatherMap, (over + drift) / ${f(WEATHER_TILE)});
  float t = clamp((weather.r - (0.92 - cloudShadowState.x * 0.8)) / 0.35, 0.0, 1.0);
  float cover = t * t * (3.0 - 2.0 * t);
  if (cover < 0.001) return 1.0;
  vec3 q = vec3(over.x + drift.x + ${f(SHADOW_HEIGHT * 500)}, ${f(SHADOW_ALTITUDE)} - cloudShadowState.w, over.y + drift.y);
  vec4 low = texture(cloudShapeMap, q / ${f(SHAPE_TILE)});
  float lowFbm = low.g * 0.625 + low.b * 0.25 + low.a * 0.125;
  float top = mix(0.35, 1.0, weather.g);
  float shaped = (low.r - lowFbm + 1.0) / (2.0 - lowFbm) * (1.0 - smoothstep(top * 0.55, top, ${f(SHADOW_HEIGHT)}));
  float body = clamp((shaped - 1.0 + cover) / cover, 0.0, 1.0) * cover;
  return 1.0 - ${f(SHADOW_DARKNESS)} * (1.0 - exp(-body * ${f(SHADOW_BODY)})) * toward.w;
}`,
  CUSTOM_FRAGMENT_BEFORE_LIGHTS: `float cloudLight = cloudShadowAt(vPositionW);`,
  ...perLight((index) => `diffuse${index}.rgb *= cloudLight;`),
};

export const CLOUD_SHADOW_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
var cloudWeatherMapSampler: sampler;
var cloudWeatherMap: texture_2d<f32>;
var cloudShapeMapSampler: sampler;
var cloudShapeMap: texture_3d<f32>;
fn cloudShadowAt(worldPos: vec3f) -> f32 {
  let toward = uniforms.cloudShadowToward;
  if (toward.y < 0.02 || toward.w <= 0.0) { return 1.0; }
  let over = worldPos.xz + toward.xz * ((${f(SHADOW_ALTITUDE)} - worldPos.y) / toward.y);
  let drift = uniforms.cloudShadowState.yz;
  let weather = textureSampleLevel(cloudWeatherMap, cloudWeatherMapSampler, (over + drift) / ${f(WEATHER_TILE)}, 0.0);
  let t = clamp((weather.r - (0.92 - uniforms.cloudShadowState.x * 0.8)) / 0.35, 0.0, 1.0);
  let cover = t * t * (3.0 - 2.0 * t);
  if (cover < 0.001) { return 1.0; }
  let q = vec3f(over.x + drift.x + ${f(SHADOW_HEIGHT * 500)}, ${f(SHADOW_ALTITUDE)} - uniforms.cloudShadowState.w, over.y + drift.y);
  let low = textureSampleLevel(cloudShapeMap, cloudShapeMapSampler, q / ${f(SHAPE_TILE)}, 0.0);
  let lowFbm = low.g * 0.625 + low.b * 0.25 + low.a * 0.125;
  let top = mix(0.35, 1.0, weather.g);
  let shaped = (low.r - lowFbm + 1.0) / (2.0 - lowFbm) * (1.0 - smoothstep(top * 0.55, top, ${f(SHADOW_HEIGHT)}));
  let body = clamp((shaped - 1.0 + cover) / cover, 0.0, 1.0) * cover;
  return 1.0 - ${f(SHADOW_DARKNESS)} * (1.0 - exp(-body * ${f(SHADOW_BODY)})) * toward.w;
}`,
  CUSTOM_FRAGMENT_BEFORE_LIGHTS: `let cloudLight = cloudShadowAt(fragmentInputs.vPositionW);`,
  ...perLight(
    (index) => `diffuse${index} = vec4f(diffuse${index}.rgb * cloudLight, diffuse${index}.a);`,
  ),
};
