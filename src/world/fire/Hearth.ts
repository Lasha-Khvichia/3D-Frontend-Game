import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { mergeBoxes } from "../houses/mergeBoxes";
import { createFireParticles } from "./createFireParticles";
import { createSmokeParticles } from "./createSmokeParticles";
import type { Hearthstone } from "./placeHearth";

/**
 * One fireplace: the stonework, the flames, and the smoke above the roof.
 *
 * The fire and the smoke are separate systems in separate places, because they
 * are: the flames are in a room and the smoke leaves a stack four metres above
 * it. Each is started and stopped on its own, so a fire you cannot see from
 * outside costs nothing while its smoke still marks the house.
 */
export class Hearth {
  readonly stonework: Mesh;
  readonly firePoint: Vector3;
  private readonly fire: ParticleSystem;
  private readonly smoke: ParticleSystem;
  private fireRunning = false;
  private smokeRunning = false;

  constructor(scene: Scene, stone: Hearthstone, material: Material, texture: Texture) {
    const stonework = mergeBoxes(scene, `${stone.houseName}-hearth`, stone.stonework);
    if (!stonework) throw new Error(`${stone.houseName} hearth produced no geometry`);
    stonework.material = material;
    stonework.receiveShadows = true;
    stonework.checkCollisions = true;
    this.stonework = stonework;

    // A separate invisible block, because the visible surround has to leave the
    // opening clear to see the fire through.
    const guard = CreateBox(
      `${stone.houseName}-hearth-guard`,
      { width: stone.guard.width, height: stone.guard.height, depth: stone.guard.depth },
      scene,
    );
    guard.position.set(stone.guard.x, stone.guard.y, stone.guard.z);
    guard.isVisible = false;
    guard.isPickable = false;
    guard.checkCollisions = true;
    guard.freezeWorldMatrix();

    this.firePoint = stone.firePoint;
    this.fire = createFireParticles(scene, stone.firePoint, texture);
    this.smoke = createSmokeParticles(scene, stone.smokePoint, texture);
  }

  /** Flames are only worth simulating close up. */
  setFireRunning(running: boolean): void {
    if (running === this.fireRunning) return;
    this.fireRunning = running;
    if (running) this.fire.start();
    else this.fire.stop();
  }

  /** Smoke carries much further, so it runs on its own, wider leash. */
  setSmokeRunning(running: boolean): void {
    if (running === this.smokeRunning) return;
    this.smokeRunning = running;
    if (running) this.smoke.start();
    else this.smoke.stop();
  }

  get isFireRunning(): boolean {
    return this.fireRunning;
  }

  get isSmokeRunning(): boolean {
    return this.smokeRunning;
  }
}
