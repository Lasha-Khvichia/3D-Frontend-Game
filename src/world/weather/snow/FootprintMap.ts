import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import {
  FOOT_BYTES,
  FOOT_SPAN,
  FOOT_TEXEL_METRES,
  FOOT_TEXELS,
  PRINT_WINDOW_HOURS,
  pressPrint,
  rebaseStamps,
  slideStamps,
} from "./footprintStamps";
import { blockRoom, sendPrintBlock } from "./sendPrintBlock";

/** The map follows the player once they are this far from its middle. */
const RECENTRE_METRES = 4;

/**
 * Where the player has trodden in the snow, as a map that follows them: only
 * 20 m of it, because at 5 cm a texel the whole island would be gigabytes.
 * A step sends up only the block it changed, never the whole 576 KB.
 */
export class FootprintMap {
  readonly texture: RawTexture;
  readonly area = { x: -FOOT_SPAN / 2, z: -FOOT_SPAN / 2, size: FOOT_SPAN };
  private readonly data = new Uint8Array(FOOT_TEXELS * FOOT_TEXELS * FOOT_BYTES);
  private readonly scratch = new Uint8Array(FOOT_TEXELS * FOOT_TEXELS * FOOT_BYTES);
  private readonly room = blockRoom();
  private epoch = 0;
  private pressed: { column: number; row: number } | null = null;
  private wholeMap = false;

  constructor(private readonly scene: Scene) {
    this.texture = RawTexture.CreateRGBATexture(
      this.data,
      FOOT_TEXELS,
      FOOT_TEXELS,
      scene,
      false,
      false,
      Texture.BILINEAR_SAMPLINGMODE,
    );
    this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
  }

  /** How far through the window we are now: the shader takes each print's age from this. */
  shareNow(totalHours: number): number {
    return (totalHours - this.epoch) / PRINT_WINDOW_HOURS;
  }

  /** One boot down, pointing the way the player is walking. */
  press(x: number, z: number, towardX: number, towardZ: number, totalHours: number): void {
    const share = this.shareNow(totalHours);
    if (share < 0 || share > 1) return;
    const column = Math.round((x - this.area.x) / FOOT_TEXEL_METRES);
    const row = Math.round((z - this.area.z) / FOOT_TEXEL_METRES);
    pressPrint(this.data, column, row, towardX, towardZ, Math.max(1, Math.round(share * 255)));
    this.pressed = { column, row };
  }

  /** Every step: follows the player, rebases the clock, and sends up what changed. */
  update(x: number, z: number, totalHours: number): void {
    if (this.shareNow(totalHours) > 0.5 || totalHours < this.epoch) {
      rebaseStamps(this.data, Math.max(0, Math.round(this.shareNow(totalHours) * 255)));
      this.epoch = totalHours;
      this.wholeMap = true;
    }
    this.follow(x, z);
    this.send();
  }

  /** Slides the map in whole texels, so prints do not shimmer as it follows. */
  private follow(x: number, z: number): void {
    const centreX = this.area.x + FOOT_SPAN / 2;
    const centreZ = this.area.z + FOOT_SPAN / 2;
    if (Math.hypot(x - centreX, z - centreZ) <= RECENTRE_METRES) return;
    const overColumns = Math.round((x - centreX) / FOOT_TEXEL_METRES);
    const overRows = Math.round((z - centreZ) / FOOT_TEXEL_METRES);
    slideStamps(this.data, this.scratch, overColumns, overRows);
    this.area.x += overColumns * FOOT_TEXEL_METRES;
    this.area.z += overRows * FOOT_TEXEL_METRES;
    this.wholeMap = true;
  }

  private send(): void {
    const print = this.pressed;
    this.pressed = null;
    if (this.wholeMap) {
      this.texture.update(this.data);
      this.wholeMap = false;
    } else if (print) {
      sendPrintBlock(this.scene, this.texture, this.data, this.room, print.column, print.row);
    }
  }
}
