import { SEA_LEVEL } from "../../terrain/terrainConstants";
import { bandReaderGlsl, bandReaderWgsl } from "./bandShaders";
import { ICE_HOLDS_A_PERSON } from "./WinterGround";

const f = (value: number): string => value.toFixed(3);
/** Ice shows as soon as it skins the water, and is solid white-blue well before it holds a person. */
const SKIN = 0.02;
const SOLID = ICE_HOLDS_A_PERSON * 0.8;
/** The sea never freezes: water that has reached it stays open, as `WinterGround` agrees. */
const OPEN_BELOW = SEA_LEVEL + 0.05;

/**
 * River water turning to ice, in GLSL and then WGSL, line for line alike.
 *
 * The thickness is read by the water's own height from the same bands the
 * player's footing reads (`WinterGround`), so the ice you see is the ice that
 * holds you. Ice is opaque, so alpha goes to 1 as it thickens; and snow lies
 * on it once it can carry snow. `diffuseColor` is whitened too — the water's
 * blue is multiplied in after this, and would tint the ice back to water.
 */
export const RIVER_ICE_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `${bandReaderGlsl("riverIce", "iceDeep")}
${bandReaderGlsl("riverSnow", "snowDeep")}`,
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
{
  float iceThick = riverIceAt(vPositionW.y);
  float frozen = smoothstep(${f(SKIN)}, ${f(SOLID)}, iceThick) * step(${f(OPEN_BELOW)}, vPositionW.y);
  if (frozen > 0.0) {
    float snowed = smoothstep(0.004, 0.05, riverSnowAt(vPositionW.y)) * step(0.05, iceThick);
    vec3 surface = mix(vec3(0.7, 0.8, 0.86), vec3(0.93, 0.95, 0.98), snowed);
    baseColor.rgb = mix(baseColor.rgb, surface, frozen);
    diffuseColor = mix(diffuseColor, vec3(1.0), frozen);
    alpha = mix(alpha, 1.0, frozen);
  }
}
`,
};

export const RIVER_ICE_WGSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `${bandReaderWgsl("riverIce", "iceDeep")}
${bandReaderWgsl("riverSnow", "snowDeep")}`,
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
{
  let iceThick = riverIceAt(fragmentInputs.vPositionW.y);
  let frozen = smoothstep(${f(SKIN)}, ${f(SOLID)}, iceThick) * step(${f(OPEN_BELOW)}, fragmentInputs.vPositionW.y);
  if (frozen > 0.0) {
    let snowed = smoothstep(0.004, 0.05, riverSnowAt(fragmentInputs.vPositionW.y)) * step(0.05, iceThick);
    let surface = mix(vec3f(0.7, 0.8, 0.86), vec3f(0.93, 0.95, 0.98), snowed);
    baseColor = vec4f(mix(baseColor.rgb, surface, frozen), baseColor.a);
    diffuseColor = mix(diffuseColor, vec3f(1.0), frozen);
    alpha = mix(alpha, 1.0, frozen);
  }
}
`,
};
