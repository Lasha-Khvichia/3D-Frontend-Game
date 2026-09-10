import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Effect } from "@babylonjs/core/Materials/effect";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { CameraBasis } from "./CameraBasis";
import type { CloudTextures } from "./createCloudTextures";
import type { CloudWeather } from "./CloudWeather";

/** The light the clouds are lit by this step: from the sun by day, the moon by night. */
export type CloudLighting = {
  /** Toward the light. */
  readonly direction: Vector3;
  /** The light's colour, already scaled by how strong it is. */
  readonly colour: Color3;
  readonly zenith: Color3;
  readonly horizon: Color3;
};

export type CloudFrame = {
  camera: Camera;
  readonly view: CameraBasis;
  readonly before: CameraBasis;
  readonly textures: CloudTextures;
  history: BaseTexture | null;
  readonly weather: CloudWeather;
  readonly lighting: CloudLighting;
  /** Jitter this frame, and how much of the last frame to keep. */
  readonly frame: [number, number];
  /** Pixels in the target being drawn. */
  readonly size: [number, number];
};

/** A fresh frame's worth of state, before anything has been traced. */
export function createCloudFrame(
  camera: Camera,
  view: CameraBasis,
  before: CameraBasis,
  textures: CloudTextures,
  weather: CloudWeather,
  lighting: CloudLighting,
): CloudFrame {
  return {
    camera,
    view,
    before,
    textures,
    history: null,
    weather,
    lighting,
    frame: [0, 0],
    size: [1, 1],
  };
}

export const CLOUD_UNIFORMS = [
  "cameraPos",
  "camRight",
  "camUp",
  "camForward",
  "tanHalf",
  "prevRight",
  "prevUp",
  "prevForward",
  "lightDir",
  "lightColour",
  "skyZenith",
  "skyHorizon",
  "weatherState",
  "frame",
] as const;

export const CLOUD_SAMPLERS = ["historySampler", "shapeSampler", "detailSampler", "weatherSampler"];

/** Everything the cloud march reads, set on its effect just before it draws. */
export function bindCloudUniforms(effect: Effect, state: CloudFrame): void {
  const { view, before, lighting, weather } = state;
  effect.setVector3("cameraPos", state.camera.globalPosition);
  effect.setVector3("camRight", view.right);
  effect.setVector3("camUp", view.up);
  effect.setVector3("camForward", view.forward);
  effect.setFloat2("tanHalf", view.tanHalf.x, view.tanHalf.y);
  effect.setVector3("prevRight", before.right);
  effect.setVector3("prevUp", before.up);
  effect.setVector3("prevForward", before.forward);
  effect.setVector3("lightDir", lighting.direction);
  effect.setColor3("lightColour", lighting.colour);
  effect.setColor3("skyZenith", lighting.zenith);
  effect.setColor3("skyHorizon", lighting.horizon);
  effect.setFloat4("weatherState", weather.cover, weather.drift.x, weather.drift.z, weather.rise);
  effect.setFloat4("frame", state.frame[0], state.frame[1], state.size[0], state.size[1]);
  effect.setTexture("historySampler", state.history);
  effect.setTexture("shapeSampler", state.textures.shape);
  effect.setTexture("detailSampler", state.textures.detail);
  effect.setTexture("weatherSampler", state.textures.weather);
}
