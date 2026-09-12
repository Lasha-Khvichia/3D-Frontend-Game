import { STARS_GLSL } from "./starsGlsl";

/** Metres from the eye the sky is drawn at: behind the sun and moon, inside the far plane. */
export const SKY_RADIUS = 1398;
/** Metres from the eye the clouds are laid in: in front of the sun and moon, behind the land. */
export const VEIL_RADIUS = 1300;

/** A sphere around the eye, for the sky and the cloud veil alike. Its direction is the view ray. */
export const DOME_VERTEX_GLSL = `
precision highp float;
attribute vec3 position;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;
uniform float radius;
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = viewProjection * vec4(position * radius + cameraPosition, 1.0);
}
`;

/**
 * The sky itself: pale at the horizon, deep overhead, a halo round the sun, and
 * a warm band hugging the horizon under a low sun. The horizon colour is the
 * fog's, so distant land fades into exactly the sky behind it.
 */
export const SKY_FRAGMENT_GLSL = `
precision highp float;
varying vec3 vDirection;
uniform vec3 horizonColour;
uniform vec3 zenithColour;
uniform vec3 sunDirection;
uniform vec3 sunGlow;
uniform vec3 duskGlow;
${STARS_GLSL}
void main() {
  vec3 ray = normalize(vDirection);
  float up = max(ray.y, 0.0);
  vec3 sky = mix(horizonColour, zenithColour, 1.0 - exp(-up * 3.5));
  float toward = max(dot(ray, sunDirection), 0.0);
  float halo = pow(toward, 10.0) * 0.28 + pow(toward, 160.0) * 0.7;
  float band = pow(toward, 2.0) * exp(-up * 6.0);
  sky += sunGlow * halo + duskGlow * band;
  sky += nightSky(ray);
  // Half a step of noise, so the gradient never shows as bands.
  sky += (starHash(ray * 4096.0).x - 0.5) / 255.0;
  gl_FragColor = vec4(sky, 1.0);
}
`;

/**
 * Lays the clouds, drawn small this frame, into the scene. The direction is
 * turned back into the screen position the cloud pass drew it at, the exact
 * inverse of how that pass made its rays — so it lines up on every backend
 * without trusting which way up either one counts pixels.
 */
export const VEIL_FRAGMENT_GLSL = `
precision highp float;
varying vec3 vDirection;
uniform sampler2D cloudSampler;
uniform vec3 camRight;
uniform vec3 camUp;
uniform vec3 camForward;
uniform vec2 tanHalf;
uniform float cloudFade;
void main() {
  vec3 ray = normalize(vDirection);
  float ahead = dot(ray, camForward);
  if (ahead <= 0.0) discard;
  vec2 uv = vec2(dot(ray, camRight), dot(ray, camUp)) / ahead / tanHalf * 0.5 + 0.5;
  gl_FragColor = texture2D(cloudSampler, uv) * cloudFade;
}
`;
