import { CAUGHT_AT_WGSL } from "./caughtAtShaders";
import { SPLASH_SPREAD } from "./splashShadersGlsl";

const f = (value: number): string => value.toFixed(4);

/** `splashShadersGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const SPLASH_VERTEX_WGSL = `
attribute position: vec3f;
attribute uv: vec2f;
uniform viewProjection: mat4x4f;
uniform cameraPosition: vec3f;
uniform splash: vec4f;
varying vCorner: vec2f;
varying vAge: f32;
${CAUGHT_AT_WGSL}
fn scatter(p: vec2f) -> vec2f {
  var q = fract(vec3f(p.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
@vertex
fn main(input: VertexInputs) -> FragmentInputs {
  let clock = uniforms.splash.x / uniforms.splash.w + vertexInputs.position.z;
  let slot = floor(clock);
  let age = clock - slot;
  let xz = uniforms.cameraPosition.xz + (scatter(vec2f(slot, vertexInputs.position.x * 1000.0 + vertexInputs.position.y)) - 0.5) * 2.0 * uniforms.splash.y;
  let y = caughtAt(xz);
  let east = caughtAt(xz + vec2f(${f(SPLASH_SPREAD)}, 0.0)) - y;
  let west = y - caughtAt(xz - vec2f(${f(SPLASH_SPREAD)}, 0.0));
  let north = caughtAt(xz + vec2f(0.0, ${f(SPLASH_SPREAD)})) - y;
  let south = y - caughtAt(xz - vec2f(0.0, ${f(SPLASH_SPREAD)}));
  let planar = step(abs(east - west) + abs(north - south), 0.02);
  let shown = step(vertexInputs.uv.y, uniforms.splash.z) * step(-999.0, y) * planar;
  let radius = 0.03 + age * 0.12;
  let corner = vec2f(vertexInputs.uv.x - 2.0 * floor(vertexInputs.uv.x / 2.0) - 0.5, floor(vertexInputs.uv.x / 2.0) - 0.5) * 2.0;
  let reach = corner * radius;
  let rise = ((east + west) * reach.x + (north + south) * reach.y) / ${f(2 * SPLASH_SPREAD)};
  let world = vec3f(xz.x + reach.x, y + 0.02 + rise, xz.y + reach.y);
  vertexOutputs.position = select(vec4f(2.0, 2.0, 2.0, 1.0), uniforms.viewProjection * vec4f(world, 1.0), shown > 0.5);
  vertexOutputs.vCorner = corner;
  vertexOutputs.vAge = age;
}
`;

export const SPLASH_FRAGMENT_WGSL = `
uniform tint: vec4f;
varying vCorner: vec2f;
varying vAge: f32;
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  let r = length(input.vCorner);
  let ring = smoothstep(0.55, 0.8, r) * (1.0 - smoothstep(0.8, 1.0, r));
  let alpha = uniforms.tint.a * ring * (1.0 - input.vAge);
  fragmentOutputs.color = vec4f(uniforms.tint.rgb * alpha, alpha);
}
`;
