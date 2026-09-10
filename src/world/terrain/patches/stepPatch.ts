import { clearPatch, dropPatchMesh, showPatch } from "./patchMeshes";
import { patchNeed } from "./patchNeed";
import { MERGE_BELOW } from "./patchSizes";
import type { TerrainPatch } from "./TerrainPatch";

export type PatchStepContext = {
  /** Past this, a patch is lost in the fog and nothing of it is kept. */
  readonly reach: number;
  readonly distanceTo: (patch: TerrainPatch) => number;
  /** Asks for a patch's mesh to be built. Nothing is built during the step itself. */
  readonly want: (patch: TerrainPatch, distance: number) => void;
};

/**
 * Moves a patch and everything below it one swap nearer what should be drawn.
 *
 * A drawn patch that wants detail asks for its four quarters, and stays on
 * screen until all of them are built; then it is swapped for them in one go.
 * Four drawn quarters whose parent wants less wait for the parent the same
 * way. So the drawn patches tile the ground exactly at every step — never a
 * hole, never two levels drawn over each other.
 *
 * Merging runs from the bottom up: a parent merges only once none of its
 * quarters is split, and `patchNeed` guarantees they will be wanting the same.
 */
export function stepPatch(patch: TerrainPatch, context: PatchStepContext): void {
  const distance = context.distanceTo(patch);
  if (distance > context.reach) return clearPatch(patch);
  const need = patchNeed(patch, distance);

  if (patch.split && patch.children) {
    for (const child of patch.children) stepPatch(child, context);
    if (need >= MERGE_BELOW || patch.children.some((child) => child.split)) return;
    if (!patch.empty && !patch.mesh) return context.want(patch, distance);
    patch.children.forEach(clearPatch);
    patch.split = false;
    return showPatch(patch);
  }

  if (!patch.children || need <= 1) {
    // Quarters built for a split that is no longer wanted.
    patch.children?.forEach(clearPatch);
    if (!patch.empty && !patch.mesh) return context.want(patch, distance);
    return showPatch(patch);
  }

  let ready = true;
  for (const child of patch.children) {
    const childDistance = context.distanceTo(child);
    if (child.empty || child.mesh || childDistance > context.reach) continue;
    ready = false;
    context.want(child, childDistance);
  }
  if (!ready) return showPatch(patch);
  dropPatchMesh(patch);
  patch.split = true;
  patch.children.forEach(showPatch);
}
