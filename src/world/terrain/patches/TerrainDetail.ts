import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { HeightGrid } from "../HeightGrid";
import { clearPatch, collectPatchMeshes, dropPatchMesh } from "./patchMeshes";
import { patchNeed } from "./patchNeed";
import { BUILD_BUDGET_MS, COARSEST_LEVEL, PATCH_CELLS } from "./patchSizes";
import { stepPatch } from "./stepPatch";
import { TerrainPatch } from "./TerrainPatch";

/**
 * The island's ground as a tree of patches: fine near the player, coarser
 * further off, and nothing at all past the render distance, where the fog has
 * already hidden it.
 *
 * Each step walks the tree once (`stepPatch`) and then builds the nearest of
 * whatever that asked for, within a time budget, so walking into new ground
 * costs a little every step rather than a stall every few seconds.
 */
export class TerrainDetail {
  private readonly roots: TerrainPatch[] = [];
  private readonly wanted: { patch: TerrainPatch; distance: number }[] = [];
  private reach = Infinity;
  private eye: Vector3 | null = null;

  constructor(
    grid: HeightGrid,
    private readonly build: (patch: TerrainPatch) => Mesh,
  ) {
    const span = PATCH_CELLS << COARSEST_LEVEL;
    for (let row = 0; row + span < grid.size; row += span) {
      for (let column = 0; column + span < grid.size; column += span) {
        this.roots.push(new TerrainPatch(grid, COARSEST_LEVEL, column, row));
      }
    }
  }

  setReach(metres: number): void {
    this.reach = metres;
  }

  /** Every patch mesh in existence, drawn or waiting to be swapped in. */
  get meshes(): Mesh[] {
    return this.roots.reduce<Mesh[]>((found, root) => collectPatchMeshes(root, found), []);
  }

  /** Builds everything this point needs, at once. For the first frame. */
  prime(eye: Vector3): void {
    this.eye = eye;
    const settle = (patch: TerrainPatch): void => {
      const distance = this.distance(patch);
      if (distance > this.reach) return clearPatch(patch);
      if (patch.children && patchNeed(patch, distance) > 1) {
        dropPatchMesh(patch);
        patch.split = true;
        return patch.children.forEach(settle);
      }
      clearPatch(patch);
      if (!patch.empty) patch.mesh = this.build(patch);
    };
    this.roots.forEach(settle);
  }

  /** One step: moves each patch one swap nearer what it should be, then builds the nearest few. */
  update(eye: Vector3): void {
    this.eye = eye;
    this.wanted.length = 0;
    const context = {
      reach: this.reach,
      distanceTo: (patch: TerrainPatch) => this.distance(patch),
      want: (patch: TerrainPatch, distance: number) => this.wanted.push({ patch, distance }),
    };
    for (const root of this.roots) stepPatch(root, context);
    this.wanted.sort((a, b) => a.distance - b.distance);
    const started = performance.now();
    for (const { patch } of this.wanted) {
      patch.mesh = this.build(patch);
      // Swapped in by a later step, never here: its neighbours may not be ready.
      patch.mesh.setEnabled(false);
      if (performance.now() - started > BUILD_BUDGET_MS) break;
    }
  }

  private distance(patch: TerrainPatch): number {
    const eye = this.eye!;
    return patch.distanceTo(eye.x, eye.y, eye.z);
  }
}
