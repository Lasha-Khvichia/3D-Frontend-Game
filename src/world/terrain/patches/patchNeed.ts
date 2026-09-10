import { FULL_DETAIL_RADIUS, PIXEL_ERROR } from "./patchSizes";
import type { TerrainPatch } from "./TerrainPatch";

/**
 * How much finer a patch should be drawn, from how far away it is.
 *
 * Above 1 it should split into its quarters; below it, it is fine as it is.
 * Two reasons can ask for detail, and the stronger wins: being inside the
 * ring kept at full detail round the player, or straying from the true ground
 * by more than a pixel and a half at this distance.
 *
 * A parent always needs at least as much as each of its children — it is
 * nearer, its ring is twice as wide and its error includes theirs — so a
 * patch never merges while a quarter of it still wants to split.
 */
export function patchNeed(patch: TerrainPatch, distance: number): number {
  if (patch.level === 0) return 0;
  const near = Math.max(distance, 1);
  const ring = (FULL_DETAIL_RADIUS * 2 ** (patch.level - 1)) / near;
  return Math.max(ring, patch.error / (PIXEL_ERROR * near));
}
