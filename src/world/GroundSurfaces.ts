import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { insideFootprint, type Footprint } from "./footprint";
import type { GrassSoil } from "./GrassField";
import type { Terrain } from "./terrain/Terrain";
import { terrainSoil } from "./terrain/terrainSoil";
import { HOLDS_A_PRINT } from "./weather/snow/snowCover";
import type { SnowGround } from "./weather/snow/SnowGround";
import type { WinterGround } from "./weather/snow/WinterGround";
import { wetField } from "./weather/wet/wetField";

export type Surface = "grass" | "dirt" | "sand" | "stone" | "wood" | "snow" | "ice" | "water";

/** What the feet stand on: the surface, whether rain has soaked it, and whether snow is trodden firm. */
export type Underfoot = { surface: Surface; wet: boolean; packed: boolean };

/** Feet this far above the ground stand on something built: a bridge, a stone, a roof. */
const ON_SOMETHING = 0.3;
/** Metres of water that splash rather than squelch. */
const WADING = 0.05;
/** Up to this far above the water the shore is sand, as the terrain paints it. */
const SHORE = 1;
/** Rise per metre past which the ground is bare rock. */
const ROCKY = 0.7;
/** How soaked the ground must be for a step to squelch. */
const SOAKED = 0.5;

const solid = (mesh: AbstractMesh): boolean => mesh.checkCollisions && mesh.isEnabled();

/**
 * What the ground under a point is made of, for footsteps: asked only when a
 * foot comes down. Built things are found with one short ray, since only they
 * are meshes to hit; the rest is read from the same numbers that paint and
 * shape the ground — house floors, rivers and their ice, snow, slope, shore.
 */
export class GroundSurfaces {
  private readonly soil: GrassSoil;
  private readonly ray = new Ray(new Vector3(), new Vector3(0, -1, 0), 1);
  private readonly slope = { x: 0, z: 0 };
  private readonly found: Underfoot = { surface: "grass", wet: false, packed: false };

  constructor(
    private readonly scene: Scene,
    private readonly terrain: Terrain,
    private readonly ground: WinterGround,
    private readonly snow: SnowGround,
    private readonly floors: readonly Footprint[],
  ) {
    this.soil = terrainSoil(terrain);
  }

  /** The surface under feet at this height. One object, rewritten each call. */
  at(x: number, z: number, feet: number): Readonly<Underfoot> {
    const { terrain } = this;
    const height = terrain.heightAt(x, z);
    const frozen = terrain.waterDepthAt(x, z) > 0 && this.ground.waterDepthAt(x, z) === 0;
    this.found.wet = wetField.wet > SOAKED;
    this.found.packed = false;
    if (feet - height > ON_SOMETHING && !frozen) {
      const built = this.builtUnder(x, z, feet);
      if (built) return this.is(built);
    }
    if (this.floors.some((floor) => insideFootprint(floor, x, z))) return this.is("wood");
    if (frozen) return this.is("ice");
    if (this.ground.waterDepthAt(x, z) > WADING) return this.is("water");
    if (this.snow.depthAt(x, z, height) >= HOLDS_A_PRINT) {
      this.found.packed = this.snow.packedAt(x, z) > 0.5;
      return this.is("snow");
    }
    terrain.slopeAt(x, z, this.slope);
    if (Math.hypot(this.slope.x, this.slope.z) > ROCKY) return this.is("stone");
    if (height - terrain.waterSurfaceAt(x, z) < SHORE) return this.is("sand");
    return this.is(this.soil.growsAt(x, z) ? "grass" : "dirt");
  }

  /** A stone, a hearth or a wall top is stone; a bridge, a roof, a door or a branch is wood. */
  private builtUnder(x: number, z: number, feet: number): Surface | null {
    this.ray.origin.set(x, feet + ON_SOMETHING, z);
    this.ray.length = ON_SOMETHING * 3;
    const name = this.scene.pickWithRay(this.ray, solid)?.pickedMesh?.name;
    if (!name) return null;
    return /stone|rock|hearth|walls/.test(name) ? "stone" : "wood";
  }

  private is(surface: Surface): Readonly<Underfoot> {
    this.found.surface = surface;
    return this.found;
  }
}
