import { smoothStep } from "../blend";
import { coastDistance } from "./islandShape";
import { coastProfile } from "./coastProfile";
import { hillsAt, mountainsAt, reliefAllowedAt } from "./landRelief";

/**
 * How far inland the hills take to reach full height. Without the ramp they
 * would start at the waterline and every beach would end in a bank.
 */
const INLAND_RAMP = 140;

/**
 * The height of the ground anywhere in the world. One function for all of it:
 * sea floor, beach, hills, mountains, and the flat ground under every
 * settlement.
 *
 * Nothing reads this at run time. It is sampled once into the height grid,
 * and everything after that — the mesh, the player's feet, the grass — reads
 * the grid, so that what you see and what you stand on are the same numbers.
 */
export function terrainHeightAt(x: number, z: number): number {
  const inside = coastDistance(x, z);
  const ground = coastProfile(inside);
  if (inside <= 0) return ground;

  const relief = smoothStep(0, INLAND_RAMP, inside) * reliefAllowedAt(x, z);
  if (relief <= 0) return ground;
  return ground + (hillsAt(x, z) + mountainsAt(x, z)) * relief;
}
