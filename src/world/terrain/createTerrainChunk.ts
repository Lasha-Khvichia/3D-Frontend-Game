import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import type { HeightGrid } from "./HeightGrid";
import { terrainColour } from "./terrainColour";
import { DEEP_SEA_FLOOR, GRID_SPACING } from "./terrainConstants";

/**
 * One square of the terrain as a mesh, read straight off the height grid.
 *
 * Normals come from the grid by central difference rather than from the
 * triangles. A chunk's edge vertices therefore get the same normal as its
 * neighbour's, because both read the same samples either side — build them
 * from the triangles instead and every chunk border shows as a lighting seam.
 *
 * It carries no collision. The player reads the height grid directly, which is
 * the whole reason there are no creases, lips or invisible walls in the ground.
 */
export function createTerrainChunk(
  scene: Scene,
  grid: HeightGrid,
  firstColumn: number,
  firstRow: number,
  cells: number,
  waterAt: (column: number, row: number) => number,
): Mesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= cells; row += 1) {
    for (let column = 0; column <= cells; column += 1) {
      const c = firstColumn + column;
      const r = firstRow + row;
      const height = grid.sample(c, r);
      positions.push(grid.xOf(c), height, grid.zOf(r));

      const riseX = (grid.sample(c + 1, r) - grid.sample(c - 1, r)) / (2 * GRID_SPACING);
      const riseZ = (grid.sample(c, r + 1) - grid.sample(c, r - 1)) / (2 * GRID_SPACING);
      const length = Math.hypot(riseX, 1, riseZ);
      normals.push(-riseX / length, 1 / length, -riseZ / length);

      // A cheap, fixed speckle from the position, so the sand line wanders.
      const speckle = Math.sin(c * 12.9898 + r * 78.233) * 0.5 + Math.sin(c * 3.1 - r * 2.3) * 0.5;
      terrainColour(height, waterAt(c, r), Math.hypot(riseX, riseZ), speckle, colours);
    }
  }

  // Split corner to diagonal, the same way HeightGrid.heightAt measures it —
  // otherwise the player stands on one triangle and sees the other.
  const stride = cells + 1;
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const corner = row * stride + column;
      const side = corner + 1;
      const diagonal = corner + stride + 1;
      const above = corner + stride;
      indices.push(corner, side, diagonal, corner, diagonal, above);
    }
  }

  const mesh = new Mesh(`terrain-${firstColumn}-${firstRow}`, scene);
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

/**
 * Whether a square of ground lies wholly on the deep sea floor. Those are never
 * built: under that much water they would be drawn and never seen.
 */
export function isAllDeepSea(
  grid: HeightGrid,
  firstColumn: number,
  firstRow: number,
  cells: number,
): boolean {
  for (let row = firstRow; row <= firstRow + cells; row += 1) {
    for (let column = firstColumn; column <= firstColumn + cells; column += 1) {
      if (grid.sample(column, row) > DEEP_SEA_FLOOR + 1) return false;
    }
  }
  return true;
}
