import type { IParticleSystem } from "@babylonjs/core/Particles/IParticleSystem";
import type { Scene } from "@babylonjs/core/scene";

/**
 * Holds every particle system in the scene still while the game is paused.
 *
 * Babylon moves particles inside `scene.render()`, which keeps running behind
 * the menu, so flames and smoke would carry on with no step. An `updateSpeed`
 * of 0 stops them moving, ageing and emitting, and leaves them drawn where
 * they are. `scene.particlesEnabled = false` would hide them instead.
 */
export class ParticleFreeze {
  private readonly speeds = new Map<IParticleSystem, number>();

  /** Every paused frame, so a system made while paused is held too. */
  hold(scene: Scene): void {
    for (const system of scene.particleSystems) {
      if (this.speeds.has(system)) continue;
      this.speeds.set(system, system.updateSpeed);
      system.updateSpeed = 0;
    }
  }

  release(): void {
    if (this.speeds.size === 0) return;
    for (const [system, speed] of this.speeds) system.updateSpeed = speed;
    this.speeds.clear();
  }
}
