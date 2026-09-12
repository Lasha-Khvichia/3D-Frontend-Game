import type { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector4, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { NearRoofs } from "./NearRoofs";
import type { Shelter } from "./Shelter";

/** Texels a side, and metres a texel: a 64 m square round the player. */
const TEXELS = 128;
const TEXEL_METRES = 0.5;
export const CATCH_SPAN = TEXELS * TEXEL_METRES;
/** Heights go into 16 bits over this range: 6 mm steps from 10 m under the sea to 390 m up. */
export const CATCH_LOWEST = -10;
export const CATCH_RANGE = 400;
/** Rebuilt once the player is this far from the middle, well before rain could fall off its edge. */
const RECENTRE_METRES = 12;

/** The ground and its water: the sea, and the rivers' surface over their beds. */
export type LandingGround = {
  heightAt(x: number, z: number): number;
  waterSurfaceAt(x: number, z: number): number;
};

/**
 * Where falling rain and snow land round the player: the ground, a river or
 * the sea, as a map of heights, and the nearest roofs, which the shaders test exactly
 * (`NearRoofs`). Drops below it are hidden, which is what keeps rain out of
 * houses and from under the eaves, and splashes are laid on it.
 *
 * The usual way is a depth render from above every frame. The island never
 * moves, so the ground is worked out on the CPU instead, and only after the
 * player has walked twelve metres.
 *
 * Heights are packed into two 8-bit channels rather than a float texture:
 * every GPU on both backends can read that from a vertex shader, where float
 * textures need extensions to be sampled at all on some of them.
 */
export class CatchMap {
  readonly texture: RawTexture;
  /** The map's corner and its size in metres, for the shaders. */
  readonly area = { x: 0, z: 0, size: CATCH_SPAN };
  readonly roofs: NearRoofs;
  private readonly areaUniform = new Vector4();
  private readonly data = new Uint8Array(TEXELS * TEXELS * 4);
  private centreX = Number.NaN;
  private centreZ = Number.NaN;

  constructor(
    scene: Scene,
    private readonly ground: LandingGround,
    shelter: Shelter,
  ) {
    this.roofs = new NearRoofs(shelter.roofs);
    this.texture = RawTexture.CreateRGBATexture(
      this.data,
      TEXELS,
      TEXELS,
      scene,
      false,
      false,
      Texture.NEAREST_SAMPLINGMODE,
    );
    this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
  }

  /** Hands the map and the nearest roofs to a drop or splash material, every frame. */
  bindTo(material: ShaderMaterial): void {
    const { x, z, size } = this.area;
    material.setVector4("catchArea", this.areaUniform.set(x, z, size, 0));
    material.setArray4("roofs", this.roofs.packed);
  }

  /** Every step; the ground is rebuilt only once the player has walked away from the middle. */
  update(eye: Vector3): void {
    this.roofs.update(eye.x, eye.z);
    if (Math.hypot(eye.x - this.centreX, eye.z - this.centreZ) < RECENTRE_METRES) return;
    // Snapped to whole texels, so the map does not shimmer as it follows.
    this.centreX = Math.round(eye.x / TEXEL_METRES) * TEXEL_METRES;
    this.centreZ = Math.round(eye.z / TEXEL_METRES) * TEXEL_METRES;
    this.area.x = this.centreX - CATCH_SPAN / 2;
    this.area.z = this.centreZ - CATCH_SPAN / 2;
    const { x: left, z: near } = this.area;
    for (let row = 0; row < TEXELS; row += 1) {
      const z = near + (row + 0.5) * TEXEL_METRES;
      for (let column = 0; column < TEXELS; column += 1) {
        const x = left + (column + 0.5) * TEXEL_METRES;
        const landed = Math.max(this.ground.heightAt(x, z), this.ground.waterSurfaceAt(x, z));
        const share = Math.min(1, Math.max(0, (landed - CATCH_LOWEST) / CATCH_RANGE));
        const packed = Math.round(share * 65535);
        const at = (row * TEXELS + column) * 4;
        this.data[at] = packed >> 8;
        this.data[at + 1] = packed & 255;
        this.data[at + 3] = 255;
      }
    }
    this.texture.update(this.data);
  }
}
