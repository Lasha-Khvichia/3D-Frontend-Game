import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { createMiniMapCamera } from "./createMiniMapCamera";
import { blendPose, createPose, POSE_TRANSITION_SECONDS } from "./miniMapPoses";
import { drawMiniMapDecor, type MiniMapDecor } from "./drawMiniMapDecor";
import { readMiniMapCanvas } from "../ui/bridge";
import type { DayNightCycle } from "../world/DayNightCycle";

/** Side of the map in CSS pixels. Must match `.overlay__minimap` in overlay.css. */
export const MINI_MAP_SIZE_CSS = 180;
/** Gap from the bottom-left corner of the screen, in CSS pixels. */
const MINI_MAP_MARGIN_CSS = 16;

/**
 * A second camera that follows the player, drawn into the bottom left corner,
 * with a small 2D canvas on top carrying the frame, compass letters and sky
 * markers.
 *
 * It has two poses. By default it sits over your shoulder looking at your back,
 * which reads as a 3D map. Holding the key slides it overhead into a flat map,
 * higher and wider. Releasing slides it back.
 *
 * Either way the camera's yaw is your yaw, so the map is always player-up.
 */
export class MiniMap {
  readonly camera: TargetCamera;

  private readonly engine: AbstractEngine;
  private readonly pose = createPose();
  private blend = 0;
  private readonly decor: MiniMapDecor = {
    playerYaw: 0,
    sunBearing: 0,
    moonBearing: 0,
    sunUp: false,
    moonUp: false,
    overheadBlend: 0,
    groundSquash: 1,
  };

  constructor(scene: Scene) {
    this.camera = createMiniMapCamera(scene);
    this.engine = scene.getEngine();
  }

  /** 0 over the shoulder, 1 straight overhead. */
  get overheadBlend(): number {
    return this.blend;
  }

  update(
    seconds: number,
    player: TransformNode,
    wantsOverhead: boolean,
    dayNight: DayNightCycle,
  ): void {
    this.advanceBlend(seconds, wantsOverhead);
    const pitch = this.placeCamera(player);
    this.placeViewport();
    this.paintDecor(player.rotation.y, pitch, dayNight);
  }

  /** Runs on the fixed step, so the slide takes the same time at any frame rate. */
  private advanceBlend(seconds: number, wantsOverhead: boolean): void {
    const step = seconds / POSE_TRANSITION_SECONDS;
    const target = wantsOverhead ? 1 : 0;
    if (this.blend < target) this.blend = Math.min(target, this.blend + step);
    else if (this.blend > target) this.blend = Math.max(target, this.blend - step);
  }

  /**
   * The camera sits behind the player along their heading. Setting its yaw to
   * theirs keeps it behind them and, once overhead, makes the map player-up:
   * a camera pitched straight down has its local up lying along its heading.
   */
  private placeCamera(player: TransformNode): number {
    const pitch = blendPose(this.blend, this.pose);
    const yaw = player.rotation.y;
    const back = this.pose.distanceBack;

    this.camera.position.set(
      player.position.x - Math.sin(yaw) * back,
      player.position.y + this.pose.height,
      player.position.z - Math.cos(yaw) * back,
    );
    this.camera.rotation.set(pitch, yaw, 0);

    this.camera.orthoLeft = -this.pose.halfExtent;
    this.camera.orthoRight = this.pose.halfExtent;
    this.camera.orthoTop = this.pose.halfExtent;
    this.camera.orthoBottom = -this.pose.halfExtent;
    return pitch;
  }

  /**
   * Babylon viewports are fractions of the render target, but the map is a
   * fixed pixel size, so this has to be recomputed whenever the window changes.
   */
  private placeViewport(): void {
    const scaling = this.engine.getHardwareScalingLevel();
    const sizePixels = MINI_MAP_SIZE_CSS / scaling;
    const marginPixels = MINI_MAP_MARGIN_CSS / scaling;
    const width = this.engine.getRenderWidth();
    const height = this.engine.getRenderHeight();
    if (width <= 0 || height <= 0) return;

    this.camera.viewport = new Viewport(
      marginPixels / width,
      marginPixels / height,
      sizePixels / width,
      sizePixels / height,
    );
  }

  private paintDecor(yaw: number, pitch: number, dayNight: DayNightCycle): void {
    this.decor.playerYaw = yaw;
    this.decor.sunBearing = dayNight.sunBearing;
    this.decor.moonBearing = dayNight.moonBearing;
    this.decor.sunUp = dayNight.sunHeight > 0;
    this.decor.moonUp = dayNight.moonHeight > 0;
    this.decor.overheadBlend = this.blend;
    this.decor.groundSquash = Math.sin(pitch);
    drawMiniMapDecor(readMiniMapCanvas(), this.decor);
  }
}
