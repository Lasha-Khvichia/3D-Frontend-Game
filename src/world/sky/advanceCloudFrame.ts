import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { CloudFrame } from "./bindCloudUniforms";
import { CLOUD_HISTORY_KEEP } from "./cloudQuality";

/**
 * Moves the traced clouds on a frame, seen from `camera`: this frame blends
 * into `history`, the target the last one wrote, and writes `target`. Each frame starts its rays
 * at a new offset along the golden ratio, so the noise averages out; the
 * first frame after a rebuild has nothing to keep.
 */
export function advanceCloudFrame(
  state: CloudFrame,
  camera: Camera,
  engine: AbstractEngine,
  history: RenderTargetTexture,
  target: RenderTargetTexture,
): void {
  state.before.copyFrom(state.view);
  state.camera = camera;
  state.view.readFrom(camera, engine);
  const first = state.history === null;
  state.history = history;
  state.frame[0] = (state.frame[0] + 0.618034) % 1;
  state.frame[1] = first ? 0 : CLOUD_HISTORY_KEEP;
  state.size[0] = target.getRenderWidth();
  state.size[1] = target.getRenderHeight();
}
