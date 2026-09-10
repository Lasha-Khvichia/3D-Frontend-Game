import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { Footprint } from "../footprint";
import type { Ground } from "../terrain/Ground";
import { createRockCollider } from "./createRockCollider";
import { createRockMesh } from "./createRockMesh";
import { rockOutline } from "./rockOutline";
import type { RockShape } from "./rockShape";

/**
 * Grass is kept off the stone's body, and allowed to grow over its low skirt.
 *
 * It was once cleared from the whole reach, because the skirt was solid and a
 * solid hidden in grass is an invisible wall. The skirt carries no collision
 * now — only the body does — and clearing the whole reach left a bare square
 * round every stone, far more noticeable than the grass it kept away.
 */
const GRASS_MARGIN = 0.15;
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
  /** Furthest the stone's body reaches from its middle. */
  private readonly body: number;

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
    this.body = Math.max(...points.map(([x, z]) => Math.hypot(x - shape.x, z - shape.z)));
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

  /** The ground it covers, so grass is not grown through it. */
  get footprint(): Footprint {
    const reach = this.body + GRASS_MARGIN;
    return {
      minX: this.shape.x - reach,
      maxX: this.shape.x + reach,
      minZ: this.shape.z - reach,
      maxZ: this.shape.z + reach,
    };
  }

  override dispose(): void {
    this.mesh.dispose();
    this.solid.dispose();
  }
}
