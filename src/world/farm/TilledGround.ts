import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { frostSurface } from "../seasons/FrostPlugin";
import { snowSurface } from "../weather/snow/SnowGroundPlugin";
import { wetSurface } from "../weather/wet/WetGroundPlugin";
import type { Ground } from "../terrain/Ground";
import { createSoilTile } from "./createSoilTile";
import { laySoil } from "./soilTiles";
import { tilledKeys } from "./tilledField";

/** Squares of soil that can be drawn at once, and how far from the eye they are laid. */
const MOST = 4000;
const REACH = 140;
/** Metres the player moves before the laid squares are worked out again. */
const RELAY_AFTER = 12;

/**
 * Every broken square near the player, drawn as thin instances of one tile in
 * a single call.
 *
 * Soil takes the rain like the ground does, whitens with frost and disappears
 * under snow, because it is given the same three surface plugins the ground
 * and the cobbles have. Nothing collides with it: it stands four centimetres
 * proud and the player already walks on the ground beneath.
 */
export class TilledGround {
  readonly mesh: Mesh;

  private readonly matrices = new Float32Array(MOST * 16);
  private readonly colours = new Float32Array(MOST * 4);
  private laidX = Infinity;
  private laidZ = Infinity;

  constructor(
    scene: Scene,
    private readonly ground: Ground,
  ) {
    this.mesh = createSoilTile(scene);
    this.mesh.material = soilMaterial(scene);
    this.mesh.isPickable = false;
    this.mesh.checkCollisions = false;
    this.mesh.receiveShadows = true;
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices.subarray(0, 0), 16, true);
    this.mesh.thinInstanceSetBuffer("color", this.colours.subarray(0, 0), 4, true);
  }

  /** How many squares are drawn. */
  get count(): number {
    return this.mesh.thinInstanceCount;
  }

  /** Lays the squares again now, however little the player has moved. */
  relay(eye: Vector3): void {
    this.laidX = eye.x;
    this.laidZ = eye.z;
    const count = laySoil(
      tilledKeys(),
      this.ground,
      eye.x,
      eye.z,
      REACH,
      this.matrices,
      this.colours,
    );
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices.subarray(0, count * 16), 16, true);
    this.mesh.thinInstanceSetBuffer("color", this.colours.subarray(0, count * 4), 4, true);
    this.mesh.thinInstanceRefreshBoundingInfo(false);
  }

  update(eye: Vector3): void {
    if (Math.hypot(eye.x - this.laidX, eye.z - this.laidZ) < RELAY_AFTER) return;
    this.relay(eye);
  }
}

/** Dark worked earth, which the rain darkens further and the snow buries. */
function soilMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("soil", scene);
  material.diffuseColor = new Color3(0.26, 0.18, 0.11);
  material.specularColor = Color3.Black();
  wetSurface(material, false);
  frostSurface(material);
  snowSurface(material);
  return material;
}
