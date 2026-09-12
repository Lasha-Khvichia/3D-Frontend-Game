import { EAVE_OVERHANG, GABLE_OVERHANG } from "../../houses/createGableRoof";
import type { House } from "../../houses/buildHouse";

/** One roof, as the surface rain meets: its ridge, its slope, and how far it reaches. */
export type Roof = {
  readonly centreX: number;
  readonly centreZ: number;
  readonly ridgeAlongX: boolean;
  /** Half the roof's length along the ridge, gable overhang included. */
  readonly halfAlong: number;
  /** Half its width across the ridge, eaves included. */
  readonly halfAcross: number;
  readonly ridgeY: number;
  /** Metres the roof drops for each metre out from the ridge. */
  readonly fall: number;
};

/**
 * What keeps rain off: every roof in the world, as the exact gable it is
 * built as (`createGableRoof`), overhangs and all. Houses stand on level
 * ground at y = 0 and never move, so this is worked out once.
 *
 * The rain's shaders test the nearest of these exactly (`NearRoofs`); asked
 * here whether a point is under cover, for the cold and the wet later.
 */
export class Shelter {
  private constructor(readonly roofs: readonly Roof[]) {}

  static fromHouses(houses: readonly House[]): Shelter {
    return new Shelter(houses.map(roofOf));
  }

  /** The height of the highest roof over a point, or −Infinity where there is none. */
  roofOver(x: number, z: number): number {
    let highest = -Infinity;
    for (const roof of this.roofs) {
      const along = roof.ridgeAlongX ? x - roof.centreX : z - roof.centreZ;
      const across = roof.ridgeAlongX ? z - roof.centreZ : x - roof.centreX;
      if (Math.abs(along) > roof.halfAlong || Math.abs(across) > roof.halfAcross) continue;
      highest = Math.max(highest, roof.ridgeY - Math.abs(across) * roof.fall);
    }
    return highest;
  }

  /** Under a roof: nothing falling reaches a point here at this height. */
  covers(x: number, z: number, y: number): boolean {
    return this.roofOver(x, z) > y;
  }
}

function roofOf(house: House): Roof {
  const { width, depth, wallHeight, roofRise, ridgeAxis } = house.blueprint;
  const ridgeAlongX = ridgeAxis === "x";
  const toWall = (ridgeAlongX ? depth : width) / 2;
  return {
    centreX: house.centreX,
    centreZ: house.centreZ,
    ridgeAlongX,
    halfAlong: (ridgeAlongX ? width : depth) / 2 + GABLE_OVERHANG,
    halfAcross: toWall + EAVE_OVERHANG,
    ridgeY: wallHeight + roofRise,
    fall: roofRise / toWall,
  };
}
