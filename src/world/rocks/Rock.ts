import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { Ground } from "../terrain/Ground";
import { createRockCollider } from "./createRockCollider";
import { createRockMesh } from "./createRockMesh";
import { rockOutline } from "./rockOutline";
import type { RockShape } from "./rockShape";

/** How far below the ground the collider starts, so nothing can get under it. */
const FOOTING = 0.6;
/** The collider's top, as a share of the stone's height: stood on a little below its crown. */
const STANDING = 0.75;

/**
 * One boulder: a smooth mesh to look at, and an invisible upright prism to
 * bump into. Two meshes because the smooth one made a poor solid — see
 * `createRockCollider` for what went wrong with it.
 */
export class Rock extends WorldEntity {
  readonly mesh: Mesh;
  private readonly solid: Mesh;

  constructor(
    private readonly shape: RockShape,
    scene: Scene,
    material: Material,
    ground: Ground,
  ) {
    super();
    this.mesh = createRockMesh(shape, scene, (x, z) => ground.heightAt(x, z));
    this.mesh.material = material;

    const { points, summit } = rockOutline(shape);
    const lowest = Math.min(...points.map(([x, z]) => ground.heightAt(x, z)), shape.baseY);
    this.solid = createRockCollider(
      scene,
      `${shape.name}-solid`,
      points,
      [shape.x, shape.z],
      lowest - FOOTING,
      shape.baseY + summit * STANDING,
    );
  }

  get id(): string {
    return this.shape.name;
  }

  override dispose(): void {
    this.mesh.dispose();
    this.solid.dispose();
  }
}
