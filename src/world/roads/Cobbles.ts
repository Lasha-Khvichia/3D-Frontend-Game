import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";
import { snowSurface } from "../weather/snow/SnowGroundPlugin";
import { frostSurface } from "../seasons/FrostPlugin";
import { wetSurface } from "../weather/wet/WetGroundPlugin";
import { layCobbles } from "./cobblePlaces";
import { createCobbleMesh } from "./createCobbleMesh";

/** Room for every stone the street can hold. */
const MOST = 8000;

/**
 * The cobbled street through the village: thousands of small stones bedded
 * into the ground, drawn as thin instances of one box in a single call.
 *
 * Their colour is per stone, which is what stops a paved street reading as
 * one grey slab. Nothing collides with them: they stand five centimetres
 * proud, and the player already walks on the ground they are bedded in.
 */
export class Cobbles {
  readonly mesh: Mesh;

  constructor(scene: Scene, heightAt: (x: number, z: number) => number) {
    const matrices = new Float32Array(MOST * 16);
    const colours = new Float32Array(MOST * 4);
    const count = layCobbles(heightAt, matrices, colours);

    this.mesh = createCobbleMesh(scene);
    this.mesh.material = cobbleMaterial(scene);
    this.mesh.isPickable = false;
    this.mesh.checkCollisions = false;
    this.mesh.receiveShadows = true;
    this.mesh.thinInstanceSetBuffer("matrix", matrices.subarray(0, count * 16), 16, true);
    this.mesh.thinInstanceSetBuffer("color", colours.subarray(0, count * 4), 4, true);
    this.mesh.thinInstanceRefreshBoundingInfo(false);
  }

  /** How many stones are laid. */
  get count(): number {
    return this.mesh.thinInstanceCount;
  }
}

/** Stone the rain darkens, the frost whitens and the snow covers, like every other stone here. */
function cobbleMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("cobble", scene);
  material.diffuseColor = Color3.White();
  material.specularColor = new Color3(0.05, 0.05, 0.05);
  wetSurface(material, false);
  frostSurface(material);
  snowSurface(material);
  return material;
}
