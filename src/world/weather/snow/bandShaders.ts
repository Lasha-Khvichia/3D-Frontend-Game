import { BAND_METRES, SNOW_BANDS } from "./snowAndIceHour";

const f = (value: number): string => value.toFixed(3);

/**
 * Reading a value by height in a shader: sixteen numbers packed as four vec4,
 * one every 20 m, read between. Snow depth and ice thickness are both kept
 * this way (`snowDepth.ts`), and both read with this one formula, so the ice
 * the player stands on is the ice that is drawn.
 *
 * `name` names the two functions made: `<name>Band(i)` and `<name>At(y)`.
 */
export function bandReaderGlsl(name: string, uniform: string): string {
  return `
float ${name}Band(int index) {
  vec4 four = ${uniform}[index / 4];
  int lane = index - (index / 4) * 4;
  return lane == 0 ? four.x : (lane == 1 ? four.y : (lane == 2 ? four.z : four.w));
}
float ${name}At(float y) {
  float at = clamp(y / ${f(BAND_METRES)}, 0.0, ${f(SNOW_BANDS - 1.001)});
  int low = int(at);
  return mix(${name}Band(low), ${name}Band(low + 1), at - float(low));
}`;
}

/** `bandReaderGlsl` in WGSL, for WebGPU. */
export function bandReaderWgsl(name: string, uniform: string): string {
  return `
fn ${name}Band(index: i32) -> f32 {
  let four = uniforms.${uniform}[index / 4];
  let lane = index - (index / 4) * 4;
  return select(select(select(four.w, four.z, lane == 2), four.y, lane == 1), four.x, lane == 0);
}
fn ${name}At(y: f32) -> f32 {
  let at = clamp(y / ${f(BAND_METRES)}, 0.0, ${f(SNOW_BANDS - 1.001)});
  let low = i32(at);
  return mix(${name}Band(low), ${name}Band(low + 1), at - f32(low));
}`;
}
