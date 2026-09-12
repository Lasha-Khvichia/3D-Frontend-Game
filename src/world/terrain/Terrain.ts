import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import { createSea } from "./createSea";
import type { Ground } from "./Ground";
import { HeightGrid } from "./HeightGrid";
import { smoothHighGround } from "./smoothHighGround";
import { Rivers } from "./rivers/Rivers";
import { coastDistance } from "./islandShape";
import { terrainHeightAt } from "./terrainHeight";
import { wetSurface } from "../weather/wet/WetGroundPlugin";
import { SEA_LEVEL } from "./terrainConstants";
import { createPatchMesh } from "./patches/createPatchMesh";
import { TerrainDetail } from "./patches/TerrainDetail";

/**
 * The island: the ground, the sea around it, and the answers to "how high is
 * the ground here" and "how deep is the water".
 *
 * The answers come from the height grid, which always holds the whole island.
 * The ground you see is built from it a patch at a time around the player —
 * see `TerrainDetail` — so nothing that asks a height ever depends on what
 * happens to be drawn.
 */
export class Terrain extends WorldEntity implements Ground {
  readonly grid: HeightGrid;
  readonly rivers: Rivers;
  /** The drawn ground: built around the player, and refined as they move. */
  readonly detail: TerrainDetail;
  private readonly sea: Mesh[];

  constructor(scene: Scene) {
    super();
    this.grid = new HeightGrid(terrainHeightAt);
    smoothHighGround(this.grid);
    // Before any mesh: the rivers cut the ground everything else is built on.
    this.rivers = new Rivers(scene, this.grid);

    const material = new StandardMaterial("terrain", scene);
    // Rain darkens the ground and stands in puddles on the flat of it.
    wetSurface(material, true);
    // White, because the colour is all in the vertices and this multiplies it.
    material.diffuseColor = Color3.White();
    material.specularColor = Color3.Black();

    const waterAt = (column: number, row: number): number =>
      Math.max(SEA_LEVEL, this.rivers.water.atSample(column, row));
    this.detail = new TerrainDetail(this.grid, (patch) => {
      const mesh = createPatchMesh(scene, this.grid, patch, waterAt);
      mesh.material = material;
      return mesh;
    });
    this.sea = createSea(scene);
  }

  get id(): string {
    return "terrain";
  }

  /** All the water, sea and rivers, for passes that should see straight through it. */
  get waterMeshes(): Mesh[] {
    return [...this.sea, ...this.rivers.waterMeshes];
  }

  heightAt(x: number, z: number): number {
    return this.grid.heightAt(x, z);
  }

  slopeAt(x: number, z: number, out: { x: number; z: number }): void {
    this.grid.slopeAt(x, z, out);
  }

  waterSurfaceAt(x: number, z: number): number {
    return Math.max(SEA_LEVEL, this.rivers.surfaceAt(x, z));
  }

  waterDepthAt(x: number, z: number): number {
    return Math.max(0, this.waterSurfaceAt(x, z) - this.grid.heightAt(x, z));
  }

  inlandAt(x: number, z: number): number {
    return coastDistance(x, z);
  }

  override dispose(): void {
    for (const mesh of [...this.detail.meshes, ...this.sea]) mesh.dispose();
    this.rivers.dispose();
  }
}
