/**
 * The mist, as shader code for `HeightMistPlugin`, in GLSL and WGSL line for
 * line alike.
 *
 * Mist density falls off exponentially with height, `d(y) = k·e^(−b(y − floor))`.
 * Along a straight line of sight from the eye that has a closed form (Íñigo
 * Quílez, "Better Fog"): what is lost is `k·e^(−b(eye − floor))` times the
 * distance, times how much thinner the mist gets over the line's rise. What is
 * kept is `e` to minus that. Looking level, the rise is nearly zero and the
 * second factor is 1.
 *
 * The keys starting with "!" are regular expressions: they replace Babylon's
 * own fog line, after its includes are expanded, with the mist and then it.
 */
export const HEIGHT_MIST_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
float mistKept(vec3 eye, vec3 point) {
  float density = mistShape.x;
  if (density <= 0.0) return 1.0;
  float falloff = mistShape.y;
  vec3 ray = point - eye;
  float rise = ray.y;
  float start = density * exp(-falloff * (eye.y - mistShape.z));
  float along = 1.0;
  if (abs(rise) > 0.01) along = (1.0 - exp(-falloff * rise)) / (falloff * rise);
  return exp(-start * length(ray) * along);
}`,
  "!float fog=CalcFogFactor\\(\\);": `color.rgb=mix(mistColour,color.rgb,mistKept(vEyePosition.xyz,vPositionW));
float fog=CalcFogFactor();`,
};

export const HEIGHT_MIST_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
fn mistKept(eye: vec3f, point: vec3f) -> f32 {
  let density = uniforms.mistShape.x;
  if (density <= 0.0) { return 1.0; }
  let falloff = uniforms.mistShape.y;
  let ray = point - eye;
  let rise = ray.y;
  let start = density * exp(-falloff * (eye.y - uniforms.mistShape.z));
  var along = 1.0;
  if (abs(rise) > 0.01) { along = (1.0 - exp(-falloff * rise)) / (falloff * rise); }
  return exp(-start * length(ray) * along);
}`,
  "!var fog: f32=CalcFogFactor\\(\\);": `color=vec4f(mix(uniforms.mistColour,color.rgb,mistKept(scene.vEyePosition.xyz,fragmentInputs.vPositionW)),color.a);
var fog: f32=CalcFogFactor();`,
};
