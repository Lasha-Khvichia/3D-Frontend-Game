import type { Ground } from "../terrain/Ground";
import { awayFromRoad } from "../roads/offTheRoad";
import { SETTLEMENTS } from "../houses/settlements";
import { isTilled } from "./tilledField";

/** Rise per metre past which the ground is too steep to work: about eight degrees. */
const TOO_STEEP = 0.15;
/** A hoe will not break ground this close to the water, nor out on the sand. */
const ABOVE_WATER = 1.2;
const INLAND = 40;
/** Metres kept clear of a road's edge, so nobody ploughs the highway. */
const OFF_THE_ROAD = 1;
/** Snow this deep and the ground beneath it is frozen hard. */
const FROZEN_UNDER = 0.08;

const slope = { x: 0, z: 0 };

/** Why this square cannot be broken, or "" when it can. */
export function whyNotTillable(ground: Ground, x: number, z: number, snowDepth: number): string {
  if (isTilled(x, z)) return "";
  if (snowDepth > FROZEN_UNDER) return "The ground is frozen hard";
  if (ground.waterDepthAt(x, z) > 0) return "You cannot plough water";
  if (ground.heightAt(x, z) - ground.waterSurfaceAt(x, z) < ABOVE_WATER)
    return "Too close to the water";
  if (ground.inlandAt(x, z) < INLAND) return "Nothing grows in beach sand";
  ground.slopeAt(x, z, slope);
  if (Math.hypot(slope.x, slope.z) > TOO_STEEP) return "Too steep to work";
  if (awayFromRoad(x, z) < OFF_THE_ROAD) return "That is the road";
  for (const settlement of SETTLEMENTS) {
    if (Math.hypot(settlement.centreX - x, settlement.centreZ - z) < settlement.clearance) {
      return "Somebody else's ground";
    }
  }
  return "";
}

/** Whether a hoe can break this square at all. */
export function canTillAt(ground: Ground, x: number, z: number, snowDepth: number): boolean {
  return (
    !isTilled(x, z) &&
    whyNotTillable(ground, x, z, snowDepth) === "" &&
    ground.waterDepthAt(x, z) <= 0
  );
}
