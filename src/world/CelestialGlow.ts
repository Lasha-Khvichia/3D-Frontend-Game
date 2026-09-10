import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { createGlowLayer } from "./createGlowLayer";
import { isNearView } from "./isNearView";

/** A halo reaches about 10 degrees from its disc; this keeps it drawn while any of it shows. */
const HALO_MARGIN = (15 * Math.PI) / 180;
/** Below this height a disc is behind the sea, and gives the halo pass nothing to blur. */
const BELOW_HORIZON = -0.02;

/**
 * The halos round the sun and the moon, dimmed by the cloud in front of them.
 *
 * A halo is a blur added over the finished picture, so a cloud drawn in front
 * of the sun does nothing to it: left alone, the sun would shine through
 * overcast. Every other glowing mesh gets exactly what Babylon would have
 * given it — its emissive colour times its emissive texture's level.
 *
 * Only the sun, the moon and the sun's glare glow. So the pass — which redraws
 * the whole world into its own texture to find what hides them — runs only
 * for the view, never the mini-map, and only while one of them is up and on
 * or near the screen. Anything that glows later (lit windows) must be added
 * to that test, or it will glow only when the sun is in sight.
 */
export class CelestialGlow {
  private readonly glow: GlowLayer;
  /** Share of each body's light getting through the clouds, 1 in a clear sky. */
  private readonly through = { sun: 1, moon: 1 };
  private readonly towards = new Vector3();

  constructor(scene: Scene, sun: AbstractMesh, moon: AbstractMesh) {
    this.glow = createGlowLayer(scene);
    this.glow.customEmissiveColorSelector = (mesh, _subMesh, material, result) => {
      const standard = material as StandardMaterial;
      const colour = standard.emissiveColor;
      if (!colour) return result.set(0, 0, 0, 1);
      const share = mesh === sun ? this.through.sun : mesh === moon ? this.through.moon : 1;
      const level = (standard.emissiveTexture?.level ?? 1) * share;
      result.set(colour.r * level, colour.g * level, colour.b * level, material.alpha);
    };
    // The first camera drawn is the view: the player's, or the orbit camera.
    scene.onBeforeCameraRenderObservable.add((camera) => {
      const view = scene.activeCameras?.[0] ?? scene.activeCamera;
      this.glow.isEnabled =
        camera === view && (this.inSight(sun, camera) || this.inSight(moon, camera));
    });
  }

  private inSight(body: AbstractMesh, camera: Camera): boolean {
    this.towards.copyFrom(body.position).subtractInPlace(camera.globalPosition).normalize();
    return this.towards.y > BELOW_HORIZON && isNearView(camera, this.towards, HALO_MARGIN);
  }

  setCloudCover(sun: number, moon: number): void {
    this.through.sun = sun;
    this.through.moon = moon;
  }

  /** Keeps a mesh out of the halo pass: the sky domes would black the halos out. */
  exclude(mesh: AbstractMesh): void {
    this.glow.addExcludedMesh(mesh as Mesh);
  }
}
