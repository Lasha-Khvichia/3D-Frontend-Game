import type { Roof } from "./Shelter";

/**
 * Roofs the rain's shaders test. Measured over every spot in every
 * settlement: at most six roofs reach into the 30 m box of rain round the
 * player, and at most eight into a 40 m one.
 */
export const ROOF_SLOTS = 8;
/** Two vec4 a roof. */
const FLOATS_PER_ROOF = 8;

/**
 * The roofs nearest the player, packed for the drop and splash shaders, which
 * test each one exactly. A map of roof heights cannot do this: at half a
 * metre a texel, a 37-degree roof is up to 19 cm out, so splashes sank under
 * it and showed on the ceiling, and drops fell through it into the room.
 */
export class NearRoofs {
  /**
   * Per roof: centre x, centre z, half along the ridge, half across it; then
   * ridge height, fall per metre, 1 if the ridge runs along x, 0. A slot with
   * no roof has a negative size and covers nothing.
   */
  readonly packed = new Array<number>(ROOF_SLOTS * FLOATS_PER_ROOF).fill(0);
  private readonly nearest: Roof[] = [];
  private readonly distances: number[] = [];

  constructor(private readonly roofs: readonly Roof[]) {}

  /** Every step: a few dozen roofs are nothing to sort, so it does not wait for the player to move. */
  update(x: number, z: number): void {
    let count = 0;
    for (const roof of this.roofs) {
      const distance = distanceTo(roof, x, z);
      if (count === ROOF_SLOTS && distance >= this.distances[count - 1]!) continue;
      let at = count < ROOF_SLOTS ? count++ : ROOF_SLOTS - 1;
      while (at > 0 && this.distances[at - 1]! > distance) {
        this.distances[at] = this.distances[at - 1]!;
        this.nearest[at] = this.nearest[at - 1]!;
        at -= 1;
      }
      this.distances[at] = distance;
      this.nearest[at] = roof;
    }
    for (let slot = 0; slot < ROOF_SLOTS; slot += 1)
      this.pack(slot, slot < count ? this.nearest[slot]! : null);
  }

  private pack(slot: number, roof: Roof | null): void {
    const at = slot * FLOATS_PER_ROOF;
    const p = this.packed;
    p[at] = roof?.centreX ?? 0;
    p[at + 1] = roof?.centreZ ?? 0;
    p[at + 2] = roof?.halfAlong ?? -1;
    p[at + 3] = roof?.halfAcross ?? -1;
    p[at + 4] = roof?.ridgeY ?? 0;
    p[at + 5] = roof?.fall ?? 0;
    p[at + 6] = roof?.ridgeAlongX ? 1 : 0;
    p[at + 7] = 0;
  }
}

/** Metres, squared, from a point to the nearest edge of a roof seen from above. */
function distanceTo(roof: Roof, x: number, z: number): number {
  const halfX = roof.ridgeAlongX ? roof.halfAlong : roof.halfAcross;
  const halfZ = roof.ridgeAlongX ? roof.halfAcross : roof.halfAlong;
  const outX = Math.max(0, Math.abs(x - roof.centreX) - halfX);
  const outZ = Math.max(0, Math.abs(z - roof.centreZ) - halfZ);
  return outX * outX + outZ * outZ;
}
