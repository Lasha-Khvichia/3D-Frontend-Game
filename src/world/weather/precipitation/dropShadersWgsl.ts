import { CAUGHT_AT_WGSL } from "./caughtAtShaders";

/** `dropShadersGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const DROP_VERTEX_WGSL = `
attribute position: vec3f;
attribute uv: vec2f;
uniform viewProjection: mat4x4f;
uniform cameraPosition: vec3f;
uniform travelled: vec3f;
uniform fall: vec4f;
uniform drift: vec4f;
uniform dropSize: vec4f;
varying vCorner: vec2f;
varying vFade: f32;
${CAUGHT_AT_WGSL}
@vertex
fn main(input: VertexInputs) -> FragmentInputs {
  let box = uniforms.fall.y;
  var offset = vertexInputs.position * box + uniforms.travelled - uniforms.cameraPosition + box * 0.5;
  offset = offset - box * floor(offset / box);
  var p = uniforms.cameraPosition + offset - box * 0.5;
  p.x += sin(uniforms.drift.w * 1.7 + vertexInputs.position.x * 60.0) * uniforms.drift.y;
  p.z += cos(uniforms.drift.w * 1.3 + vertexInputs.position.z * 60.0) * uniforms.drift.y;
  let velocity = vec3f(uniforms.drift.x, -uniforms.fall.x, uniforms.drift.z);
  let toEye = normalize(uniforms.cameraPosition - p);
  let away = length(p - uniforms.cameraPosition);
  let pixel = uniforms.dropSize.z * away;
  let right = vertexInputs.uv.x - 2.0 * floor(vertexInputs.uv.x / 2.0) - 0.5;
  let up = floor(vertexInputs.uv.x / 2.0) - 0.5;
#ifdef FLAKES
  let size = max(uniforms.dropSize.y, pixel * 2.5);
  let faint = uniforms.dropSize.y * uniforms.dropSize.y / (size * size);
  var across = cross(vec3f(0.0, 1.0, 0.0), toEye);
  across = normalize(across + vec3f(0.0001, 0.0, 0.0));
  let world = p + (across * right + normalize(cross(toEye, across)) * up) * size;
  let lowest = p - vec3f(0.0, size * 0.5, 0.0);
#else
  let width = max(uniforms.dropSize.x, pixel * 1.5);
  let faint = uniforms.dropSize.x / width;
  let along = normalize(velocity);
  let span = length(velocity) * uniforms.fall.w;
  var across = cross(along, toEye);
  across = normalize(across + vec3f(0.0001, 0.0, 0.0)) * width;
  let world = p + across * right + along * span * up;
  let lowest = p + along * span * 0.5;
#endif
  let shown = step(vertexInputs.uv.y, uniforms.fall.z) * step(caughtAt(lowest.xz), lowest.y);
  vertexOutputs.position = select(vec4f(2.0, 2.0, 2.0, 1.0), uniforms.viewProjection * vec4f(world, 1.0), shown > 0.5);
  vertexOutputs.vCorner = vec2f(right, up) * 2.0;
  vertexOutputs.vFade = faint * smoothstep(0.3, 1.0, away) * (1.0 - smoothstep(box * 0.3, box * 0.5, away));
}
`;

export const DROP_FRAGMENT_WGSL = `
uniform tint: vec4f;
varying vCorner: vec2f;
varying vFade: f32;
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#ifdef FLAKES
  let shape = 1.0 - smoothstep(0.3, 1.0, length(input.vCorner));
#else
  let shape = (1.0 - abs(input.vCorner.x)) * (1.0 - input.vCorner.y * input.vCorner.y);
#endif
  let alpha = uniforms.tint.a * shape * input.vFade;
  fragmentOutputs.color = vec4f(uniforms.tint.rgb * alpha, alpha);
}
`;
