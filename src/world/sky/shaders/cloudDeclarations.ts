/** Everything the cloud march reads, declared for GLSL. Names match `CLOUD_UNIFORMS`. */
export const CLOUD_DECLARATIONS_GLSL = `
precision highp float;
precision highp sampler3D;
varying vec2 vUV;
uniform sampler2D historySampler;
uniform sampler3D shapeSampler;
uniform sampler3D detailSampler;
uniform sampler2D weatherSampler;
uniform vec3 cameraPos;
uniform vec3 camRight;
uniform vec3 camUp;
uniform vec3 camForward;
uniform vec2 tanHalf;
uniform vec3 prevRight;
uniform vec3 prevUp;
uniform vec3 prevForward;
uniform vec3 lightDir;
uniform vec3 lightColour;
uniform vec3 skyZenith;
uniform vec3 skyHorizon;
uniform vec4 weatherState;
uniform vec4 frame;
`;

/** The same, declared for WGSL. */
export const CLOUD_DECLARATIONS_WGSL = `
varying vUV: vec2f;
var historySamplerSampler: sampler;
var historySampler: texture_2d<f32>;
var shapeSamplerSampler: sampler;
var shapeSampler: texture_3d<f32>;
var detailSamplerSampler: sampler;
var detailSampler: texture_3d<f32>;
var weatherSamplerSampler: sampler;
var weatherSampler: texture_2d<f32>;
uniform cameraPos: vec3f;
uniform camRight: vec3f;
uniform camUp: vec3f;
uniform camForward: vec3f;
uniform tanHalf: vec2f;
uniform prevRight: vec3f;
uniform prevUp: vec3f;
uniform prevForward: vec3f;
uniform lightDir: vec3f;
uniform lightColour: vec3f;
uniform skyZenith: vec3f;
uniform skyHorizon: vec3f;
uniform weatherState: vec4f;
uniform frame: vec4f;
`;
