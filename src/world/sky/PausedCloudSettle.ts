import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { CameraBasis } from "./CameraBasis";

/**
 * Frames traced while paused after the sky changes: each keeps 86% of the
 * last (`CLOUD_HISTORY_KEEP`), so after 30 the old sky is 1% of the picture.
 */
const SETTLE_FRAMES = 30;

/**
 * Whether the clouds trace a frame while the game is paused. Each trace starts
 * its rays at a new offset, so tracing on would keep the picture shimmering.
 * It traces only to settle a change the menu made — the clock, the weather,
 * the quality, the size of the picture or the field of view.
 */
export class PausedCloudSettle {
  /** The camera as it is now, to notice the menu changing the field of view. */
  private readonly probe = new CameraBasis();
  private settling = 0;

  /** The sky has changed: trace a few more frames. */
  restart(): void {
    this.settling = SETTLE_FRAMES;
  }

  /** For a paused frame; `traced` is the view the last frame was traced for. */
  shouldTrace(camera: Camera, engine: AbstractEngine, traced: CameraBasis): boolean {
    this.probe.readFrom(camera, engine);
    if (!this.probe.equals(traced)) this.settling = SETTLE_FRAMES;
    if (this.settling <= 0) return false;
    this.settling -= 1;
    return true;
  }
}
