import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import type { HeightGrid } from "../HeightGrid";
import { terrainColour } from "../terrainColour";
import { GRID_SPACING } from "../terrainConstants";
import { addPatchSkirts } from "./addPatchSkirts";
import { PATCH_CELLS } from "./patchSizes";
import type { TerrainPatch } from "./TerrainPatch";

/**
 * One patch of the terrain as a mesh, read straight off the height grid at
 * the patch's own spacing.
 *
 * Normals come from the grid by central difference across one cell of this
 * patch, so a coarse patch is lit like the coarse surface it draws. Taken from
 * the fine grid instead, a vertex 32 m from its neighbours would carry the
 * tilt of the 4 m around it, and distant hills would come out blotched.
 *
 * Colour is the other way round: the steepness that turns grass to rock is
 * always read from the fine grid, so a vertex is painted the same at every
 * level and a patch changing level does not change colour.
 *
 * It carries no collision. The player reads the height grid directly, which is
 * the whole reason there are no creases, lips or invisible walls in the ground.
 */
export function createPatchMesh(
  scene: Scene,
  grid: HeightGrid,
  patch: TerrainPatch,
  waterAt: (column: number, row: number) => number,
): Mesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];
  const { column: firstColumn, row: firstRow, step } = patch;
  const rise = (from: number, to: number, cells: number): number =>
    (to - from) / (2 * cells * GRID_SPACING);

  for (let row = 0; row <= PATCH_CELLS; row += 1) {
    for (let column = 0; column <= PATCH_CELLS; column += 1) {
      const c = firstColumn + column * step;
      const r = firstRow + row * step;
      const height = grid.sample(c, r);
      positions.push(grid.xOf(c), height, grid.zOf(r));

      const riseX = rise(grid.sample(c - step, r), grid.sample(c + step, r), step);
      const riseZ = rise(grid.sample(c, r - step), grid.sample(c, r + step), step);
      const length = Math.hypot(riseX, 1, riseZ);
      normals.push(-riseX / length, 1 / length, -riseZ / length);

      const steepness = Math.hypot(
        rise(grid.sample(c - 1, r), grid.sample(c + 1, r), 1),
        rise(grid.sample(c, r - 1), grid.sample(c, r + 1), 1),
      );
      // A cheap, fixed speckle from the position, so the sand line wanders.
      const speckle = Math.sin(c * 12.9898 + r * 78.233) * 0.5 + Math.sin(c * 3.1 - r * 2.3) * 0.5;
      terrainColour(height, waterAt(c, r), steepness, speckle, colours);
    }
  }

  // Split corner to diagonal, the same way HeightGrid.heightAt measures it —
  // otherwise the player stands on one triangle and sees the other.
  const stride = PATCH_CELLS + 1;
  for (let row = 0; row < PATCH_CELLS; row += 1) {
    for (let column = 0; column < PATCH_CELLS; column += 1) {
      const corner = row * stride + column;
      const side = corner + 1;
      const diagonal = corner + stride + 1;
      const above = corner + stride;
      indices.push(corner, side, diagonal, corner, diagonal, above);
    }
  }
  addPatchSkirts({ positions, normals, colours, indices }, patch.skirt);

  const mesh = new Mesh(`terrain-${patch.level}-${firstColumn}-${firstRow}`, scene);
  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.colors = colours;
  data.indices = indices;
  data.applyToMesh(mesh);
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.receiveShadows = true;
  mesh.freezeWorldMatrix();
  return mesh;
}
