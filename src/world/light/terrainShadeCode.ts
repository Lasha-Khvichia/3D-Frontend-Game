import { SHADE_CELL } from "./terrainShade";
import { SHADE_LOWEST, SHADE_RANGE, SHADE_SOFTNESS } from "./terrainShadeField";

const f = (value: number): string => value.toFixed(3);
/** Lights a standard material can take; each gets its own injection point. */
const MOST_LIGHTS = 8;

/**
 * Dims only the directional lights — the sun and the moon — where the
 * terrain stands between them and this pixel: a mountain's shadow over the
 * valley. The shade height is read from the four cells round the pixel and
 * blended here, since two packed bytes cannot be blended by the GPU. Like the
 * cloud shadows, the light is dimmed rather than the pixel darkened, so an
 * object's own shadow fades out inside a mountain's.
 */
function perLight(body: (index: number) => string): Record<string, string> {
  const code: Record<string, string> = {};
  for (let index = 0; index < MOST_LIGHTS; index += 1) {
    code[`CUSTOM_LIGHT${index}_COLOR`] = `#ifdef DIRLIGHT${index}\n${body(index)}\n#endif`;
  }
  return code;
}

export const TERRAIN_SHADE_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
uniform sampler2D terrainShadeMap;
float terrainShadeHeight(vec2 cell) {
  vec4 packed = texture2D(terrainShadeMap, (cell + 0.5) / terrainShadeInfo.z);
  return (packed.r * 65280.0 + packed.g * 255.0) / 65535.0 * ${f(SHADE_RANGE)} + ${f(SHADE_LOWEST)};
}
float terrainShadeAt(vec3 worldPos) {
  if (terrainShadeInfo.w <= 0.0) return 1.0;
  vec2 p = (worldPos.xz - terrainShadeInfo.xy) / ${f(SHADE_CELL)};
  vec2 c = floor(p);
  vec2 t = p - c;
  float near = mix(terrainShadeHeight(c), terrainShadeHeight(c + vec2(1.0, 0.0)), t.x);
  float far = mix(terrainShadeHeight(c + vec2(0.0, 1.0)), terrainShadeHeight(c + vec2(1.0, 1.0)), t.x);
  float shade = mix(near, far, t.y);
  return mix(1.0, clamp((worldPos.y - shade + ${f(SHADE_SOFTNESS)}) / ${f(SHADE_SOFTNESS)}, 0.0, 1.0), terrainShadeInfo.w);
}`,
  CUSTOM_FRAGMENT_BEFORE_LIGHTS: `float terrainLight = terrainShadeAt(vPositionW);`,
  ...perLight((index) => `diffuse${index}.rgb *= terrainLight;`),
};

export const TERRAIN_SHADE_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
var terrainShadeMapSampler: sampler;
var terrainShadeMap: texture_2d<f32>;
fn terrainShadeHeight(cell: vec2f) -> f32 {
  let packed = textureSampleLevel(terrainShadeMap, terrainShadeMapSampler, (cell + 0.5) / uniforms.terrainShadeInfo.z, 0.0);
  return (packed.r * 65280.0 + packed.g * 255.0) / 65535.0 * ${f(SHADE_RANGE)} + ${f(SHADE_LOWEST)};
}
fn terrainShadeAt(worldPos: vec3f) -> f32 {
  if (uniforms.terrainShadeInfo.w <= 0.0) { return 1.0; }
  let p = (worldPos.xz - uniforms.terrainShadeInfo.xy) / ${f(SHADE_CELL)};
  let c = floor(p);
  let t = p - c;
  let near = mix(terrainShadeHeight(c), terrainShadeHeight(c + vec2f(1.0, 0.0)), t.x);
  let far = mix(terrainShadeHeight(c + vec2f(0.0, 1.0)), terrainShadeHeight(c + vec2f(1.0, 1.0)), t.x);
  let shade = mix(near, far, t.y);
  return mix(1.0, clamp((worldPos.y - shade + ${f(SHADE_SOFTNESS)}) / ${f(SHADE_SOFTNESS)}, 0.0, 1.0), uniforms.terrainShadeInfo.w);
}`,
  CUSTOM_FRAGMENT_BEFORE_LIGHTS: `let terrainLight = terrainShadeAt(fragmentInputs.vPositionW);`,
  ...perLight(
    (index) => `diffuse${index} = vec4f(diffuse${index}.rgb * terrainLight, diffuse${index}.a);`,
  ),
};
