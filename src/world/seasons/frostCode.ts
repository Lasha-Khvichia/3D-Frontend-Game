/** The white of a rime, and how far it takes a surface towards it. */
const RIME_GLSL = "vec3(0.86, 0.90, 0.93)";
const RIME_WGSL = "vec3f(0.86, 0.90, 0.93)";
const DEPTH = "0.45";

/**
 * Frost on whichever side of a surface faces the sky — the same test the snow
 * makes, and for the same reason: a roof's underside and a leaf's carry the
 * same normal as their tops. It runs before the snow, so snow lies over it.
 *
 * Both the colour in the vertices and the material's own `diffuseColor` are
 * whitened; changing one alone leaves half the world its summer colour.
 */
export const FROST_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
#ifdef FROSTSURFACE
if (frostLook.x > 0.002) {
  float frostUp = (gl_FrontFacing ? 1.0 : -1.0) * normalize(vNormalW).y;
  float frostHere = frostLook.x * smoothstep(0.25, 0.75, frostUp) * ${DEPTH};
  baseColor.rgb = mix(baseColor.rgb, ${RIME_GLSL}, frostHere);
  diffuseColor = mix(diffuseColor, vec3(1.0), frostHere);
}
#endif`,
};

export const FROST_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
#ifdef FROSTSURFACE
if (uniforms.frostLook.x > 0.002) {
  let frostUp = select(-1.0, 1.0, fragmentInputs.frontFacing) * normalize(fragmentInputs.vNormalW).y;
  let frostHere = uniforms.frostLook.x * smoothstep(0.25, 0.75, frostUp) * ${DEPTH};
  baseColor = vec4f(mix(baseColor.rgb, ${RIME_WGSL}, frostHere), baseColor.a);
  diffuseColor = mix(diffuseColor, vec3f(1.0), frostHere);
}
#endif`,
};
