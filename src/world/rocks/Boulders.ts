import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Footprint } from "../footprint";
import type { Ground } from "../terrain/Ground";
import { scatterBoulders } from "./boulderLayout";
import { Rock } from "./Rock";
import { createRockMaterial } from "./rockMaterial";

/**
 * Every loose stone on the island.
 *
 * Nothing to update: a stone never moves, so once built the only things
 * anyone wants from it are its mesh and the ground it covers.
 */
export class Boulders {
  private readonly rocks: Rock[];

  constructor(scene: Scene, ground: Ground) {
    const material = createRockMaterial(scene);
    this.rocks = scatterBoulders(ground).map((shape) => new Rock(shape, scene, material, ground));
  }

  get meshes(): Mesh[] {
    return this.rocks.map((rock) => rock.mesh);
  }

  /** Where grass must not grow. */
  get footprints(): Footprint[] {
    return this.rocks.map((rock) => rock.footprint);
  }

  dispose(): void {
    for (const rock of this.rocks) rock.dispose();
  }
}
