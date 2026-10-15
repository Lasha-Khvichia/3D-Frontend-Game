import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Ground } from "../terrain/Ground";
import { middleOf, SOIL_CELL } from "./tilledField";

/** How far the mark floats above the ground, so it is never buried by it. */
const PROUD = 0.02;
/** White where the hoe will bite, and a dim grey where it will not. */
const WILL_BREAK = 0.42;
const WILL_NOT = 0.16;
/**
 * Drawn after the world with the depth cleared, so it shows over the grass.
 * A mark lying on the ground is otherwise buried by blades half a metre tall —
 * which is exactly the ground anybody would want to break.
 */
export const OVER_THE_WORLD = 1;

const slope = { x: 0, z: 0 };

/**
 * The square the hoe is aimed at, drawn as a pale sheet over the ground.
 *
 * One flat mesh moved to wherever the player is looking, not one per square:
 * there is only ever one target. It is unlit and drawn over the world, so it
 * reads as a mark on the ground rather than a slab lying under the grass.
 */
export class TillTarget {
  private readonly mesh: Mesh;
  private readonly paint: StandardMaterial;

  constructor(scene: Scene) {
    this.paint = new StandardMaterial("till-target", scene);
    this.paint.diffuseColor = Color3.Black();
    this.paint.specularColor = Color3.Black();
    this.paint.emissiveColor = Color3.White();
    this.paint.alpha = WILL_BREAK;
    this.paint.disableLighting = true;
    this.paint.backFaceCulling = false;

    this.mesh = CreateGround("till-target", { width: SOIL_CELL, height: SOIL_CELL }, scene);
    this.mesh.material = this.paint;
    this.mesh.isPickable = false;
    this.mesh.checkCollisions = false;
    this.mesh.receiveShadows = false;
    this.mesh.renderingGroupId = OVER_THE_WORLD;
    this.mesh.setEnabled(false);
  }

  /** Hides the mark: nothing is aimed at. */
  clear(): void {
    this.mesh.setEnabled(false);
  }

  /** Lays the mark over one square, bright when the hoe can break it. */
  show(ground: Ground, cellX: number, cellZ: number, canBreak: boolean): void {
    const x = middleOf(cellX);
    const z = middleOf(cellZ);
    ground.slopeAt(x, z, slope);
    this.mesh.position.set(x, ground.heightAt(x, z) + PROUD, z);
    this.mesh.rotation.set(Math.atan(slope.z), 0, -Math.atan(slope.x));
    this.paint.alpha = canBreak ? WILL_BREAK : WILL_NOT;
    this.mesh.setEnabled(true);
  }

  dispose(): void {
    this.mesh.dispose();
    this.paint.dispose();
  }
}
