import type { Material } from "@babylonjs/core/Materials/material";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { GrassBlocker } from "../grassBlockers";
import type { Ground } from "../terrain/Ground";
import { scatterBoulders } from "./boulderLayout";
import { Rock } from "./Rock";
import { rockGrassBlocker } from "./rockGrassBlocker";
import { createRockMaterial } from "./rockMaterial";
import type { RockShape } from "./rockShape";

/**
 * Stones are built this close and no further. A metre-high stone 250 m off is
 * a few pixels in the haze; building the island's four hundred for the view
 * cost four hundred draw calls to add those few pixels.
 */
const STONE_RANGE = 250;
/** Taken down only this much further out, so a stone on the line is not rebuilt at every sway. */
const DROP_SLACK = 30;
/** A stone takes about 0.15 ms to build. Eight a step keeps far ahead of the fastest travel. */
const BUILDS_PER_STEP = 8;

/** Whatever keeps stones out of the god-ray pass, told as they come and go. */
export type OcclusionSkips = {
  excludeFromOcclusion(mesh: AbstractMesh): void;
  forgetExcluded(mesh: AbstractMesh): void;
};

/**
 * Every loose stone on the island, built only near the player.
 *
 * A stone never moves and remembers nothing, so it can be thrown away when
 * the player leaves and grown again, identical, from its shape when they come
 * back. The shapes are all known from the start; only the meshes come and go.
 */
export class Boulders {
  private readonly shapes: readonly RockShape[];
  private readonly built = new Map<RockShape, Rock>();
  private readonly material: Material;

  constructor(
    private readonly scene: Scene,
    private readonly ground: Ground,
    private readonly occlusion: OcclusionSkips,
  ) {
    this.material = createRockMaterial(scene);
    this.shapes = scatterBoulders(ground);
  }

  /** Where grass must not grow — every stone's, built or not. */
  get grassBlockers(): GrassBlocker[] {
    return this.shapes.map(rockGrassBlocker);
  }

  /** How many stones are built right now. */
  get builtCount(): number {
    return this.built.size;
  }

  /** Takes down stones left behind and builds the nearest missing ones. */
  update(eye: Vector3, renderDistance: number, most = BUILDS_PER_STEP): void {
    const reach = Math.min(STONE_RANGE, renderDistance);
    const missing: { shape: RockShape; distance: number }[] = [];
    for (const shape of this.shapes) {
      const distance = Math.hypot(shape.x - eye.x, shape.z - eye.z);
      const rock = this.built.get(shape);
      if (rock && distance > reach + DROP_SLACK) this.takeDown(shape, rock);
      else if (!rock && distance < reach) missing.push({ shape, distance });
    }
    missing.sort((a, b) => a.distance - b.distance);
    for (const { shape } of missing.slice(0, most)) this.build(shape);
  }

  dispose(): void {
    for (const [shape, rock] of this.built) this.takeDown(shape, rock);
  }

  private build(shape: RockShape): void {
    const rock = new Rock(shape, this.scene, this.material, this.ground);
    // Too low to cut a shaft of sun anyone would notice.
    this.occlusion.excludeFromOcclusion(rock.mesh);
    this.built.set(shape, rock);
  }

  private takeDown(shape: RockShape, rock: Rock): void {
    this.occlusion.forgetExcluded(rock.mesh);
    rock.dispose();
    this.built.delete(shape);
  }
}
