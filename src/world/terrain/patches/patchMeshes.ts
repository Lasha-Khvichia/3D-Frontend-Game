import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TerrainPatch } from "./TerrainPatch";

/** Puts a built patch on screen. Cheap to call on one already there. */
export function showPatch(patch: TerrainPatch): void {
  if (patch.mesh && !patch.mesh.isEnabled(false)) patch.mesh.setEnabled(true);
}

export function dropPatchMesh(patch: TerrainPatch): void {
  patch.mesh?.dispose();
  patch.mesh = null;
}

/**
 * Throws away a patch's mesh and every mesh below it, leaving it whole.
 *
 * Only descends where something could be built, so calling it on every far
 * patch every step costs four checks rather than a walk of the whole tree.
 */
export function clearPatch(patch: TerrainPatch): void {
  dropPatchMesh(patch);
  if (patch.children && (patch.split || patch.children.some((child) => child.mesh))) {
    patch.children.forEach(clearPatch);
  }
  patch.split = false;
}

/** Every mesh at or below a patch, drawn or waiting to be swapped in. */
export function collectPatchMeshes(patch: TerrainPatch, into: Mesh[]): Mesh[] {
  if (patch.mesh) into.push(patch.mesh);
  for (const child of patch.children ?? []) collectPatchMeshes(child, into);
  return into;
}
