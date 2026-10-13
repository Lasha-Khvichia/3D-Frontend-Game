import type { Footprint } from "../footprint";
import type { House } from "../houses/buildHouse";

/**
 * The outside of a house's walls, which the light from lamps elsewhere stops
 * at. Null when the player is not in a house, and nothing stops anything.
 */
export function wallsOf(houses: readonly House[], home: number): Footprint | null {
  const house = houses[home];
  if (!house) return null;
  const { centreX: x, centreZ: z, blueprint: size } = house;
  const [halfX, halfZ] = [size.width / 2, size.depth / 2];
  return { minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ };
}
