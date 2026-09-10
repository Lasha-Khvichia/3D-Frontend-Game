import { CLOUD_DECLARATIONS_GLSL } from "./cloudDeclarations";
import { CLOUD_DENSITY_GLSL } from "./cloudDensityGlsl";
import { CLOUD_LOOK } from "./cloudLook";

const f = (value: number): string => value.toFixed(4);

/**
 * The cloud march, in GLSL: one ray per pixel of a reduced-size target, through
 * the cloud shell, gathering the light scattered toward the eye. Its twin is
 * `cloudMarchWgsl.ts`; the two must stay line for line alike.
 *
 * Lighting is Frostbite's energy-conserving integration (Hillaire 2016): each
 * step adds what it scatters, dimmed by what lies in front of it. Sunlight
 * reaching a point is found by a short second march toward the light. Three
 * octaves of ever-weaker absorption stand in for light bouncing many times
 * inside a cloud, which is why thick clouds glow grey rather than go black; a
 * forward-leaning phase gives the silver lining when you look toward the sun.
 *
 * Each frame starts every ray at a different jittered offset and blends into
 * the last frame, turned to follow the camera — clouds are far enough away
 * that turning is all that moves them on screen — so a few dozen steps a
 * frame add up to a smooth result over several.
 */
export const CLOUD_MARCH_GLSL = `
${CLOUD_DECLARATIONS_GLSL}${CLOUD_DENSITY_GLSL}
float phase(float g, float mu) {
  float gg = g * g;
  return (1.0 - gg) / (12.5663706 * pow(1.0 + gg - 2.0 * g * mu, 1.5));
}

float lightDepth(vec3 p, float altitude) {
  float depth = 0.0;
  float stride = ${f(CLOUD_LOOK.lightStride)};
  for (int i = 0; i < LIGHT_STEPS; i++) {
    p += lightDir * stride;
    altitude += lightDir.y * stride;
    depth += cloudDensity(p, altitude, i < 2) * stride;
    stride *= 2.0;
  }
  return depth * ${f(CLOUD_LOOK.extinction)};
}

vec4 march(vec3 ray) {
  if (ray.y < -0.02) return vec4(0.0);
  float start = exitDistance(cameraPos.y, ray.y, CLOUD_BASE);
  if (start > ${f(CLOUD_LOOK.farthest)}) return vec4(0.0);
  float end = min(exitDistance(cameraPos.y, ray.y, CLOUD_TOP), start + ${f(CLOUD_LOOK.longestPath)});
  float stride = (end - start) / float(STEPS);
  float noise = fract(52.9829189 * fract(dot(floor(vUV * frame.zw), vec2(0.06711056, 0.00583715))));
  float t = start + stride * fract(noise + frame.x);
  float mu = dot(ray, lightDir);
  float through = 1.0;
  vec3 gathered = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    vec3 p = cameraPos + ray * t;
    float altitude = altitudeAt(cameraPos.y, ray.y, t);
    float density = cloudDensity(p, altitude, true);
    if (density > 0.002) {
      float depth = lightDepth(p, altitude);
      float scatter = 0.0;
      float strength = 1.0;
      for (int octave = 0; octave < 3; octave++) {
        float g = pow(0.5, float(octave));
        scatter += strength * mix(phase(0.78 * g, mu), phase(-0.3 * g, mu), 0.35) * exp(-depth * g * 0.9);
        strength *= 0.5;
      }
      float h = clamp((altitude - CLOUD_BASE) / (CLOUD_TOP - CLOUD_BASE), 0.0, 1.0);
      vec3 ambient = mix(skyHorizon * 0.8, skyZenith * 1.1, h) * ${f(CLOUD_LOOK.ambient)} + lightColour * ${f(CLOUD_LOOK.scatteredSun)} * mix(0.55, 1.0, h) * exp(-depth * 0.03);
      vec3 glow = lightColour * scatter * ${f(CLOUD_LOOK.sunStrength)} + ambient;
      float kept = exp(-density * ${f(CLOUD_LOOK.extinction)} * stride);
      gathered += through * glow * (1.0 - kept);
      through *= kept;
      if (through < 0.02) break;
    }
    t += stride;
  }
  float alpha = 1.0 - through;
  float haze = 1.0 - exp(-start / ${f(CLOUD_LOOK.hazeDistance)});
  gathered = mix(gathered, skyHorizon * alpha, haze);
  return vec4(gathered, alpha) * smoothstep(-0.02, 0.07, ray.y);
}

void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 ray = normalize(camForward + ndc.x * tanHalf.x * camRight + ndc.y * tanHalf.y * camUp);
  vec4 current = march(ray);
  float ahead = dot(ray, prevForward);
  vec2 before = vec2(dot(ray, prevRight), dot(ray, prevUp)) / max(ahead, 0.0001) / tanHalf * 0.5 + 0.5;
  bool seen = ahead > 0.0 && before.x >= 0.0 && before.x <= 1.0 && before.y >= 0.0 && before.y <= 1.0;
  vec4 history = texture2D(historySampler, before);
  gl_FragColor = mix(current, history, seen ? frame.y : 0.0);
}
`;
