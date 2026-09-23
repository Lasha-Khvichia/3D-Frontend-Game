import { cellOf, type RoadCountry } from "./roadCountry";
import type { RoadPoint } from "./routeOverLand";

/**
 * The square a place stands in, or the nearest one a road may use. A gate can
 * fall on the very square a house or a riverbank blocks, and a road that
 * cannot start is worse than one that starts a few metres over.
 */
export function freeCellNear(country: RoadCountry, place: RoadPoint): number {
  const column = cellOf(place.x);
  const row = cellOf(place.z);
  for (let ring = 0; ring <= 4; ring += 1) {
    for (let down = -ring; down <= ring; down += 1) {
      for (let across = -ring; across <= ring; across += 1) {
        if (Math.max(Math.abs(down), Math.abs(across)) !== ring) continue;
        const cell = cellAt(country, column + across, row + down);
        if (cell >= 0 && !country.blocked[cell]) return cell;
      }
    }
  }
  return -1;
}

export function cellAt(country: RoadCountry, column: number, row: number): number {
  const { cells } = country;
  if (column < 0 || row < 0 || column >= cells || row >= cells) return -1;
  return row * cells + column;
}
