import type { Ground } from "../../terrain/Ground";
import type { Terrain } from "../../terrain/Terrain";
import { SEA_LEVEL } from "../../terrain/terrainConstants";

/** Ice this thick holds a person: the usual rule for walking out on it. */
export const ICE_HOLDS_A_PERSON = 0.1;
/** Snow this deep slows walking as much as it ever will, down to this share of normal. */
const DEEPEST_SLOWING = 0.4;
const SLOWEST_IN_SNOW = 0.6;
/** A river this far above the sea is a river; below it, it has joined the sea, which never freezes. */
const ABOVE_THE_SEA = 0.05;

/** What the winter answers about a spot: how deep the snow, how thick the ice, how trodden. */
export type WinterSource = {
  depthAt(x: number, z: number, height: number): number;
  iceAt(height: number): number;
  packedAt(x: number, z: number): number;
};

/**
 * The ground as the winter leaves it, for anything that walks on it.
 *
 * A river frozen thick enough is ground at its own surface: no wading, no
 * deep-water stop, and it lies level. Deep snow slows walking, but not along
 * the player's own trail, which is packed firm. Everything else is the
 * terrain's answer. Until the winter is wired in (`useWinter`), it is the
 * terrain exactly — the player is built before the snow, which follows them.
 */
export class WinterGround implements Ground {
  private winter: WinterSource | null = null;

  constructor(private readonly terrain: Terrain) {}

  useWinter(winter: WinterSource): void {
    this.winter = winter;
  }

  heightAt(x: number, z: number): number {
    return Math.max(this.terrain.heightAt(x, z), this.iceSurfaceAt(x, z));
  }

  slopeAt(x: number, z: number, out: { x: number; z: number }): void {
    if (this.iceSurfaceAt(x, z) > this.terrain.heightAt(x, z)) {
      out.x = 0;
      out.z = 0;
      return;
    }
    this.terrain.slopeAt(x, z, out);
  }

  waterSurfaceAt(x: number, z: number): number {
    return this.terrain.waterSurfaceAt(x, z);
  }

  waterDepthAt(x: number, z: number): number {
    return this.iceSurfaceAt(x, z) > -Infinity ? 0 : this.terrain.waterDepthAt(x, z);
  }

  inlandAt(x: number, z: number): number {
    return this.terrain.inlandAt(x, z);
  }

  paceAt(x: number, z: number): number {
    if (!this.winter) return 1;
    const deep = this.winter.depthAt(x, z, this.heightAt(x, z));
    const trodden = this.winter.packedAt(x, z);
    return 1 - (1 - SLOWEST_IN_SNOW) * Math.min(1, deep / DEEPEST_SLOWING) * (1 - trodden);
  }

  /** The height of ice that holds a person here, or −Infinity where the water runs open. */
  private iceSurfaceAt(x: number, z: number): number {
    if (!this.winter || this.terrain.waterDepthAt(x, z) <= 0) return -Infinity;
    const river = this.terrain.rivers.surfaceAt(x, z);
    if (!(river > SEA_LEVEL + ABOVE_THE_SEA)) return -Infinity;
    return this.winter.iceAt(river) >= ICE_HOLDS_A_PERSON ? river : -Infinity;
  }
}
