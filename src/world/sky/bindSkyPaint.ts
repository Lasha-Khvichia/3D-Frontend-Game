import type { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import type { SkyPaint } from "./SkyDome";

/** Everything the sky's fragment shader reads, in both languages. */
export const SKY_UNIFORMS = [
  "horizonColour",
  "zenithColour",
  "sunDirection",
  "sunGlow",
  "duskGlow",
  "starAxisX",
  "starAxisY",
  "starAxisZ",
  "starState",
  "meteorHead",
  "meteorTail",
];

/**
 * Hands the sky's paint to its material once. A shader material keeps the
 * colour and vector objects it is given, so updating them in place each step
 * reaches the shader without binding anything again.
 */
export function bindSkyPaint(material: ShaderMaterial, paint: SkyPaint): void {
  material.setColor3("horizonColour", paint.horizon);
  material.setColor3("zenithColour", paint.zenith);
  material.setVector3("sunDirection", paint.sunDirection);
  material.setColor3("sunGlow", paint.sunGlow);
  material.setColor3("duskGlow", paint.duskGlow);
  const { stars } = paint;
  material.setVector3("starAxisX", stars.axisX);
  material.setVector3("starAxisY", stars.axisY);
  material.setVector3("starAxisZ", stars.axisZ);
  material.setVector4("starState", stars.state);
  material.setVector4("meteorHead", stars.meteorHead);
  material.setVector3("meteorTail", stars.meteorTail);
}
