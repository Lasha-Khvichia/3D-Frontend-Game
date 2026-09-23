import type { House } from "../houses/buildHouse";
import { doorLantern } from "./doorLantern";
import { greenPosts, streetPosts } from "./postPlaces";

/** Where one lantern's glass is, and what holds it up. */
export type LanternPlace = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Which settlement in `SETTLEMENTS` it belongs to. */
  readonly settlement: number;
  /** Out of the wall it hangs on, and the house; null for a lantern on a post. */
  readonly wall: { readonly outX: number; readonly outZ: number; readonly house: number } | null;
};

/** Every lantern in the world: one by each door, posts along the village street, three round each green. */
export function lanternPlaces(houses: readonly House[]): LanternPlace[] {
  const doors: LanternPlace[] = [];
  houses.forEach((house, index) => {
    const door = house.openings.find((opening) => opening.kind === "door");
    if (door) doors.push(doorLantern(house, index, door));
  });
  const doorways = houses.flatMap((house) => house.openings.filter((o) => o.kind === "door"));
  return [...doors, ...streetPosts(doorways), ...greenPosts()];
}
