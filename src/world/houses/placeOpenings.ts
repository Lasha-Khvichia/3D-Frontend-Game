import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { OpeningKind } from "./buildWallSegments";
import type { PlannedWall } from "./houseBlueprint";
import { outerFaceOf } from "./wallSurface";

/** A doorway or window hole, located in the world, ready to hang something in. */
export type PlacedOpening = {
  readonly kind: OpeningKind;
  readonly houseName: string;
  /** The middle of the hole, on the wall's centre line. */
  readonly centre: Vector3;
  /** Unit vector pointing out of the house through the hole. */
  readonly outward: Vector3;
  /** Unit vector along the wall, pointing from one jamb to the other. */
  readonly along: Vector3;
  readonly width: number;
  readonly height: number;
  /** Height of the hole's bottom edge above the floor. Zero for a doorway. */
  readonly sill: number;
  readonly wallThickness: number;
};

/**
 * Works out where each hole in a wall actually is.
 *
 * Phase 0 and 1 only ever needed the wall left *around* the openings. Hanging a
 * door or a shutter needs the opposite: the hole itself, in world space, with
 * the two directions that matter — along the wall, to swing a leaf across, and
 * out of the house, to decide which way it swings.
 */
export function placeOpenings(wall: PlannedWall, houseName: string): PlacedOpening[] {
  const surface = outerFaceOf(wall, wall.side);
  const runsAlongX = wall.axis === "x";
  const along = runsAlongX ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1);
  const outward = runsAlongX
    ? new Vector3(0, 0, surface.outward)
    : new Vector3(surface.outward, 0, 0);

  return wall.openings.map((opening) => {
    const distance = wall.from + opening.start + opening.width / 2;
    return {
      kind: opening.kind,
      houseName,
      centre: new Vector3(
        runsAlongX ? distance : wall.offset,
        opening.sill + opening.height / 2,
        runsAlongX ? wall.offset : distance,
      ),
      outward,
      along,
      width: opening.width,
      height: opening.height,
      sill: opening.sill,
      wallThickness: wall.thickness,
    };
  });
}

/** True when a point is on the street side of an opening rather than indoors. */
export function isOutsideOf(opening: PlacedOpening, point: Vector3): boolean {
  return point.subtract(opening.centre).dot(opening.outward) > 0;
}
