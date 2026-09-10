import { CLOUD_DECLARATIONS_WGSL } from "./cloudDeclarations";
import { CLOUD_DENSITY_WGSL } from "./cloudDensityWgsl";
import { CLOUD_LOOK } from "./cloudLook";

const f = (value: number): string => value.toFixed(4);

/** `cloudMarchGlsl.ts` in WGSL, for WebGPU. Kept line for line alike. */
export const CLOUD_MARCH_WGSL = `
${CLOUD_DECLARATIONS_WGSL}${CLOUD_DENSITY_WGSL}
fn phase(g: f32, mu: f32) -> f32 {
  let gg = g * g;
  return (1.0 - gg) / (12.5663706 * pow(1.0 + gg - 2.0 * g * mu, 1.5));
}

fn lightDepth(start: vec3f, startAltitude: f32) -> f32 {
  var p = start;
  var altitude = startAltitude;
  var depth = 0.0;
  var stride = ${f(CLOUD_LOOK.lightStride)};
  for (var i: i32 = 0; i < LIGHT_STEPS; i++) {
    p += uniforms.lightDir * stride;
    altitude += uniforms.lightDir.y * stride;
    depth += cloudDensity(p, altitude, i < 2) * stride;
    stride *= 2.0;
  }
  return depth * ${f(CLOUD_LOOK.extinction)};
}

fn march(ray: vec3f, uv: vec2f) -> vec4f {
  if (ray.y < -0.02) { return vec4f(0.0); }
  let eye = uniforms.cameraPos;
  let start = exitDistance(eye.y, ray.y, CLOUD_BASE);
  if (start > ${f(CLOUD_LOOK.farthest)}) { return vec4f(0.0); }
  let end = min(exitDistance(eye.y, ray.y, CLOUD_TOP), start + ${f(CLOUD_LOOK.longestPath)});
  let stride = (end - start) / f32(STEPS);
  let noise = fract(52.9829189 * fract(dot(floor(uv * uniforms.frame.zw), vec2f(0.06711056, 0.00583715))));
  var t = start + stride * fract(noise + uniforms.frame.x);
  let mu = dot(ray, uniforms.lightDir);
  var through = 1.0;
  var gathered = vec3f(0.0);
  for (var i: i32 = 0; i < STEPS; i++) {
    let p = eye + ray * t;
    let altitude = altitudeAt(eye.y, ray.y, t);
    let density = cloudDensity(p, altitude, true);
    if (density > 0.002) {
      let depth = lightDepth(p, altitude);
      var scatter = 0.0;
      var strength = 1.0;
      for (var octave: i32 = 0; octave < 3; octave++) {
        let g = pow(0.5, f32(octave));
        scatter += strength * mix(phase(0.78 * g, mu), phase(-0.3 * g, mu), 0.35) * exp(-depth * g * 0.9);
        strength *= 0.5;
      }
      let h = clamp((altitude - CLOUD_BASE) / (CLOUD_TOP - CLOUD_BASE), 0.0, 1.0);
      let ambient = mix(uniforms.skyHorizon * 0.8, uniforms.skyZenith * 1.1, h) * ${f(CLOUD_LOOK.ambient)} + uniforms.lightColour * ${f(CLOUD_LOOK.scatteredSun)} * mix(0.55, 1.0, h) * exp(-depth * 0.03);
      let glow = uniforms.lightColour * scatter * ${f(CLOUD_LOOK.sunStrength)} + ambient;
      let kept = exp(-density * ${f(CLOUD_LOOK.extinction)} * stride);
      gathered += through * glow * (1.0 - kept);
      through *= kept;
      if (through < 0.02) { break; }
    }
    t += stride;
  }
  let alpha = 1.0 - through;
  let haze = 1.0 - exp(-start / ${f(CLOUD_LOOK.hazeDistance)});
  gathered = mix(gathered, uniforms.skyHorizon * alpha, haze);
  return vec4f(gathered, alpha) * smoothstep(-0.02, 0.07, ray.y);
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  let ndc = input.vUV * 2.0 - 1.0;
  let ray = normalize(uniforms.camForward + ndc.x * uniforms.tanHalf.x * uniforms.camRight + ndc.y * uniforms.tanHalf.y * uniforms.camUp);
  let current = march(ray, input.vUV);
  let ahead = dot(ray, uniforms.prevForward);
  let before = vec2f(dot(ray, uniforms.prevRight), dot(ray, uniforms.prevUp)) / max(ahead, 0.0001) / uniforms.tanHalf * 0.5 + 0.5;
  let seen = ahead > 0.0 && before.x >= 0.0 && before.x <= 1.0 && before.y >= 0.0 && before.y <= 1.0;
  let history = textureSampleLevel(historySampler, historySamplerSampler, before, 0.0);
  fragmentOutputs.color = mix(current, history, select(0.0, uniforms.frame.y, seen));
}
`;
