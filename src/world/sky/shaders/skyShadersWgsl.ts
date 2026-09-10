import { STARS_WGSL } from "./starsWgsl";

/** `skyShadersGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const DOME_VERTEX_WGSL = `
attribute position: vec3f;
uniform viewProjection: mat4x4f;
uniform cameraPosition: vec3f;
uniform radius: f32;
varying vDirection: vec3f;
@vertex
fn main(input: VertexInputs) -> FragmentInputs {
  vertexOutputs.vDirection = vertexInputs.position;
  vertexOutputs.position = uniforms.viewProjection * vec4f(vertexInputs.position * uniforms.radius + uniforms.cameraPosition, 1.0);
}
`;

export const SKY_FRAGMENT_WGSL = `
varying vDirection: vec3f;
uniform horizonColour: vec3f;
uniform zenithColour: vec3f;
uniform sunDirection: vec3f;
uniform sunGlow: vec3f;
uniform duskGlow: vec3f;
${STARS_WGSL}
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  let ray = normalize(input.vDirection);
  let up = max(ray.y, 0.0);
  var sky = mix(uniforms.horizonColour, uniforms.zenithColour, 1.0 - exp(-up * 3.5));
  let toward = max(dot(ray, uniforms.sunDirection), 0.0);
  let halo = pow(toward, 10.0) * 0.28 + pow(toward, 160.0) * 0.7;
  let band = pow(toward, 2.0) * exp(-up * 6.0);
  sky += uniforms.sunGlow * halo + uniforms.duskGlow * band;
  sky += nightSky(ray);
  sky += (starHash(ray * 4096.0).x - 0.5) / 255.0;
  fragmentOutputs.color = vec4f(sky, 1.0);
}
`;

export const VEIL_FRAGMENT_WGSL = `
varying vDirection: vec3f;
var cloudSamplerSampler: sampler;
var cloudSampler: texture_2d<f32>;
uniform camRight: vec3f;
uniform camUp: vec3f;
uniform camForward: vec3f;
uniform tanHalf: vec2f;
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  let ray = normalize(input.vDirection);
  let ahead = dot(ray, uniforms.camForward);
  if (ahead <= 0.0) { discard; }
  let uv = vec2f(dot(ray, uniforms.camRight), dot(ray, uniforms.camUp)) / ahead / uniforms.tanHalf * 0.5 + 0.5;
  fragmentOutputs.color = textureSampleLevel(cloudSampler, cloudSamplerSampler, uv, 0.0);
}
`;
