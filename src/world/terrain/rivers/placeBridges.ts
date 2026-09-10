import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { HeightGrid } from "../HeightGrid";
import { createBridge } from "./createBridge";
import type { RiverCourse } from "./riverCourses";
import type { RiverProfile } from "./riverProfile";
import type { RiverPoint } from "./traceRiver";

/** How far each bridge reaches onto the bank past the channel edge. */
const ABUTMENT = 4;
/** Deck always at least this far above the water. */
const CLEARANCE = 0.7;

/**
 * Builds a river's bridges where its course says they go.
 *
 * Each deck sits just above the higher of its two banks, and never less than
 * 0.7 m over the water, so neither end is a step too tall to walk up.
 */
export function placeBridges(
  scene: Scene,
  course: RiverCourse,
  river: readonly RiverPoint[],
  profile: RiverProfile,
  grid: HeightGrid,
  timber: Material,
): Mesh[] {
  const bridges: Mesh[] = [];
  for (const crossing of course.crossings) {
    if (crossing.kind !== "bridge") continue;
    const index = crossingIndex(profile, crossing.at);
    const point = river[index]!;
    const reach = (profile.halfWidth[index] ?? 0) + ABUTMENT;
    const endA = grid.heightAt(point.x + point.flowZ * reach, point.z - point.flowX * reach);
    const endB = grid.heightAt(point.x - point.flowZ * reach, point.z + point.flowX * reach);
    const deckTop = Math.max(endA, endB, (profile.surface[index] ?? 0) + CLEARANCE) + 0.2;
    const place = { x: point.x, z: point.z, yaw: Math.atan2(point.flowX, point.flowZ) };
    const bridge = createBridge(scene, `${course.name}-bridge`, place, reach * 2, deckTop, timber);
    if (bridge) bridges.push(bridge);
  }
  return bridges;
}

/** The point on a river where a crossing at `at`, a share of its length on land, falls. */
export function crossingIndex(profile: RiverProfile, at: number): number {
  return profile.mouth + Math.round(at * (profile.landEnd - profile.mouth));
}
