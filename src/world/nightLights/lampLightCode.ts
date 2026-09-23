import { LAMP_SLOTS } from "./lampField";

/**
 * Light added by lanterns and lit windows, after the scene's own lights.
 *
 * Each lamp lights what is in reach, fading with the square of the distance
 * left, and brighter on faces turned to it. A lamp on a wall lights nothing
 * behind that wall's face. No shadows: a lamp's light passes through a post
 * or a person, which at a few metres of warm glow the eye does not catch.
 */
export const LAMP_LIGHT_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
vec3 lampLightAt(vec3 place, vec3 normal) {
  vec3 light = vec3(0.0);
  int count = int(lampInfo.x);
  for (int i = 0; i < ${LAMP_SLOTS}; i++) {
    if (i >= count) break;
    vec3 toLamp = lampPlaces[i].xyz - place;
    float range = lampPlaces[i].w;
    if (dot(toLamp, toLamp) >= range * range) continue;
    float away = length(toLamp);
    float reach = 1.0 - away / range;
    vec4 wall = lampWalls[i];
    float front = mix(1.0, smoothstep(-wall.z - 0.08, -wall.z - 0.01, -dot(toLamp.xz, wall.xy)), wall.w);
    float facing = 0.25 + 0.75 * max(dot(normal, toLamp / max(away, 0.001)), 0.0);
    light += lampGlows[i].rgb * (reach * reach * facing * front);
  }
  return light;
}`,
  CUSTOM_FRAGMENT_BEFORE_FOG: `
#ifdef LAMPLIGHT
if (lampInfo.x > 0.0) color.rgb += lampLightAt(vPositionW, normalW) * diffuseColor * baseColor.rgb;
#endif`,
};

export const LAMP_LIGHT_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
fn lampLightAt(place: vec3f, normal: vec3f) -> vec3f {
  var light = vec3f(0.0);
  let count = i32(uniforms.lampInfo.x);
  for (var i = 0; i < ${LAMP_SLOTS}; i++) {
    if (i >= count) { break; }
    let toLamp = uniforms.lampPlaces[i].xyz - place;
    let range = uniforms.lampPlaces[i].w;
    if (dot(toLamp, toLamp) >= range * range) { continue; }
    let away = length(toLamp);
    let reach = 1.0 - away / range;
    let wall = uniforms.lampWalls[i];
    let front = mix(1.0, smoothstep(-wall.z - 0.08, -wall.z - 0.01, -dot(toLamp.xz, wall.xy)), wall.w);
    let facing = 0.25 + 0.75 * max(dot(normal, toLamp / max(away, 0.001)), 0.0);
    light += uniforms.lampGlows[i].rgb * (reach * reach * facing * front);
  }
  return light;
}`,
  CUSTOM_FRAGMENT_BEFORE_FOG: `
#ifdef LAMPLIGHT
if (uniforms.lampInfo.x > 0.0) { color = vec4f(color.rgb + lampLightAt(fragmentInputs.vPositionW, normalW) * diffuseColor * baseColor.rgb, color.a); }
#endif`,
};
