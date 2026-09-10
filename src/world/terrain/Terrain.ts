import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import { createSea } from "./createSea";
import { createTerrainChunk, isAllDeepSea } from "./createTerrainChunk";
import type { Ground } from "./Ground";
import { HeightGrid } from "./HeightGrid";
import { smoothHighGround } from "./smoothHighGround";
import { Rivers } from "./rivers/Rivers";
import { coastDistance } from "./islandShape";
import { terrainHeightAt } from "./terrainHeight";
import { CHUNK_METRES, GRID_SPACING, SEA_LEVEL } from "./terrainConstants";

/**
 * The island: the ground, the sea around it, and the answers to "how high is
 * the ground here" and "how deep is the water".
 *
 * The ground is cut into squares so Babylon can drop the ones behind you
 * before drawing. Squares lying wholly on the deep sea floor are never built
 * at all — they would be drawn under opaque-looking water and never seen.
 */
export class Terrain extends WorldEntity implements Ground {
  readonly grid: HeightGrid;
  readonly chunks: Mesh[] = [];
  readonly rivers: Rivers;
  private readonly sea: Mesh[];

  constructor(scene: Scene) {
    super();
    this.grid = new HeightGrid(terrainHeightAt);
    smoothHighGround(this.grid);
    // Before any mesh: the rivers cut the ground everything else is built on.
    this.rivers = new Rivers(scene, this.grid);

    const material = new StandardMaterial("terrain", scene);
    // White, because the colour is all in the vertices and this multiplies it.
    material.diffuseColor = Color3.White();
    material.specularColor = Color3.Black();

    const cells = CHUNK_METRES / GRID_SPACING;
    const squares = (this.grid.size - 1) / cells;
    for (let row = 0; row < squares; row += 1) {
      for (let column = 0; column < squares; column += 1) {
        if (isAllDeepSea(this.grid, column * cells, row * cells, cells)) continue;
        const chunk = createTerrainChunk(
          scene,
          this.grid,
          column * cells,
          row * cells,
          cells,
          (c, r) => Math.max(SEA_LEVEL, this.rivers.water.atSample(c, r)),
        );
        chunk.material = material;
        this.chunks.push(chunk);
      }
    }
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
    for (const mesh of [...this.chunks, ...this.sea]) mesh.dispose();
    this.rivers.dispose();
  }
}
