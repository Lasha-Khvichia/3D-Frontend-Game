import type { Material } from "@babylonjs/core/Materials/material";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import { SEA_LEVEL } from "../terrainConstants";
import type { RiverProfile } from "./riverProfile";
import type { HeightGrid } from "../HeightGrid";
import type { RiverPoint } from "./traceRiver";
import { BANK_SEARCH } from "./riverSizes";

/**
 * The river's water: a ribbon laid along the channel, tilting downhill with
 * it, two vertices across at every point of the river.
 *
 * It stops where the river's water has fallen to the sea's. Carried on under
 * the sea it would show through the see-through sea as a second, brighter
 * layer of water.
 */
export function createRiverWater(
  scene: Scene,
  name: string,
  river: readonly RiverPoint[],
  profile: RiverProfile,
  grid: HeightGrid,
  material: Material,
): Mesh | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index < river.length; index += 1) {
    const surface = profile.surface[index] ?? SEA_LEVEL;
    if (surface <= SEA_LEVEL + 0.05) break;
    const point = river[index]!;
    const width = profile.halfWidth[index] ?? 0;
    // Sideways to the flow is (flowZ, -flowX). Each edge is found separately:
    // the banks are rarely the same height either side.
    const left = reachDryGround(grid, point, width, surface, 1);
    const right = reachDryGround(grid, point, width, surface, -1);
    positions.push(point.x + point.flowZ * left, surface, point.z - point.flowX * left);
    positions.push(point.x - point.flowZ * right, surface, point.z + point.flowX * right);
    normals.push(0, 1, 0, 0, 1, 0);
  }

  const rows = positions.length / 6;
  if (rows < 2) return null;
  for (let row = 0; row < rows - 1; row += 1) {
    const left = row * 2;
    indices.push(left, left + 1, left + 3, left, left + 3, left + 2);
  }

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.indices = indices;
  data.applyToMesh(mesh);
  mesh.material = material;
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.freezeWorldMatrix();
  return mesh;
}

/**
 * How far out from the middle the water's edge goes on one side: from the
 * channel's edge, outwards, until the ground is higher than the water.
 *
 * The channel edge alone is not enough. The ground is sampled every 4 m, and
 * the triangle joining a deep sample in the bed to a high one on the bank dips
 * below the water just beyond the edge — up to 70 cm, measured. A sheet that
 * ends there hangs in the air. One that runs on until it meets dry ground
 * tucks its edge under the bank, wherever the bank really is.
 */
function reachDryGround(
  grid: HeightGrid,
  point: RiverPoint,
  width: number,
  surface: number,
  side: number,
): number {
  for (let reach = width; reach < width + BANK_SEARCH; reach += 0.5) {
    const x = point.x + point.flowZ * reach * side;
    const z = point.z - point.flowX * reach * side;
    if (grid.heightAt(x, z) > surface + 0.05) return reach + 0.3;
  }
  return width + BANK_SEARCH;
}
