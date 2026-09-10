import { SETTLEMENTS } from "../houses/settlements";
import { MOUNTAIN_RANGES } from "../terrain/landRelief";
import { RIVER_COURSES } from "../terrain/rivers/riverCourses";

export type MapLabel = {
  readonly text: string;
  readonly x: number;
  readonly z: number;
  readonly kind: "settlement" | "river" | "mountain";
};

/**
 * The mountains have no names anywhere else in the game; these are the map's,
 * in the same order as the ranges in `landRelief.ts`. Rename them here.
 */
const MOUNTAIN_NAMES = ["North Peaks", "South Peaks", "East Hills"];

/**
 * Every name written on the map, where it is written. Settlements and rivers
 * carry their names already; a river's is written half way along its course.
 */
export function mapLabels(): MapLabel[] {
  const title = (name: string): string =>
    name === "village" ? "The Village" : name.charAt(0).toUpperCase() + name.slice(1);
  return [
    ...SETTLEMENTS.map((place) => ({
      text: title(place.name),
      x: place.centreX,
      z: place.centreZ,
      kind: "settlement" as const,
    })),
    ...RIVER_COURSES.map((course) => {
      const [x, z] = course.points[Math.floor(course.points.length / 2)]!;
      return { text: title(course.name), x, z, kind: "river" as const };
    }),
    ...MOUNTAIN_RANGES.map((range, index) => ({
      text: MOUNTAIN_NAMES[index] ?? "Hills",
      x: range.x,
      z: range.z,
      kind: "mountain" as const,
    })),
  ];
}
