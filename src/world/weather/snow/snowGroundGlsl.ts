import { COVERS_GROUND, SNOWY_RANGES } from "./snowCover";
import { BAND_METRES, SNOW_BANDS } from "./snowDepth";

const f = (value: number): string => value.toFixed(3);
/** How white lying snow is. */
const SNOW_COLOUR = "vec3(0.93, 0.95, 0.98)";

/**
 * Snow lying on the ground and on everything that faces the sky, in GLSL.
 * Its twin is `snowGroundWgsl.ts`.
 *
 * How deep it lies comes from the weather of the whole snow year, worked out
 * at sixteen heights (`snowDepth.ts`) and read between them here — so the
 * line creeps down the slopes through winter and lifts in spring with no
 * patch of ground being rebuilt. Snow thins on a steep face but never leaves
 * it: from the valley a mountain is almost all steep face.
 *
 * Where the wet ground's plugin is also attached (`WETSURFACE`), snow takes
 * over from it, and on the ground itself (`WETGROUND`) it uses that plugin's
 * roof test, so a floor under a roof stays bare.
 */
export const SNOW_GROUND_GLSL: Record<string, string> = {
  CUSTOM_FRAGMENT_DEFINITIONS: `
uniform sampler2D footprintMap;
float snowBand(int index) {
  vec4 four = snowDeep[index / 4];
  int lane = index - (index / 4) * 4;
  return lane == 0 ? four.x : (lane == 1 ? four.y : (lane == 2 ? four.z : four.w));
}
/** Metres of snow lying at this height, read between the bands. */
float snowDeepAt(float y) {
  float at = clamp(y / ${f(BAND_METRES)}, 0.0, ${f(SNOW_BANDS - 1.001)});
  int low = int(at);
  return mix(snowBand(low), snowBand(low + 1), at - float(low));
}
float snowJitter(vec2 p) {
  return fract(sin(dot(floor(p * 0.35), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}
/** 1 where the ground belongs to a snowy range, 0 elsewhere. */
float snowRange(vec2 xz) {
  float inside = 0.0;
  for (int i = 0; i < ${SNOWY_RANGES.length}; i++) {
    inside = max(inside, step(length(xz - snowRanges[i].xy), snowRanges[i].z));
  }
  return inside;
}
/** 1 a fresh boot print, 0 untrodden snow or a print long filled in. */
float snowTrodden(vec2 xz) {
  vec2 cell = (xz - footArea.xy) / footArea.z;
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x > 1.0 || cell.y > 1.0) return 0.0;
  vec4 print = texture2D(footprintMap, cell);
  if (print.r <= 0.0) return 0.0;
  return print.g * clamp(1.0 - (footArea.w - print.r) * snowLook.w, 0.0, 1.0);
}
`,
  CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
{
  float snowTop = vPositionW.y + snowJitter(vPositionW.xz) * 8.0;
  float cap = snowRange(vPositionW.xz) * snowLook.z * clamp((snowTop - snowLook.x) / snowLook.y, 0.0, 1.0);
  float deep = max(snowDeepAt(snowTop), cap);
  if (deep > 0.002) {
    float snowUp = normalize(vNormalW).y;
#ifdef WETGROUND
    // The ground keeps half its snow on a steep face: from the valley a mountain is all steep face.
    float snowSlope = 1.0 - 0.5 * (1.0 - clamp((snowUp - 0.5) / 0.35, 0.0, 1.0));
#else
    // Everything else holds it only where it looks at the sky: roofs and sills, never walls.
    float snowSlope = smoothstep(0.35, 0.8, snowUp);
#endif
    // Only the side that faces the sky: a roof is one sheet drawn both ways,
    // and its underside carries the same upward normal as its top.
    float snowFacing = gl_FrontFacing ? 1.0 : 0.0;
    float snowHere = smoothstep(0.004, ${f(COVERS_GROUND)}, deep) * snowSlope * snowFacing;
#ifdef WETGROUND
    // Bare under a roof: the same roofs the rain is kept off by.
    snowHere *= 1.0 - wetUnderRoof(vPositionW.xz);
#endif
    float trodden = snowTrodden(vPositionW.xz) * step(0.05, snowHere);
    snowHere *= 1.0 - 0.1 * trodden;
    baseColor.rgb = mix(baseColor.rgb, ${SNOW_COLOUR} * (1.0 - ${f(0.3)} * trodden), snowHere);
    // A house or a stone keeps its colour in diffuseColor, which is multiplied
    // in after this: whiten it too, or the roof turns white and then brown again.
    diffuseColor = mix(diffuseColor, vec3(1.0), snowHere);
#ifdef WETSURFACE
    // Snow is not wet ground: it takes over from the rain that fell before it.
    wetAmount *= 1.0 - snowHere;
    wetPuddle *= 1.0 - snowHere;
#endif
  }
}
`,
};
