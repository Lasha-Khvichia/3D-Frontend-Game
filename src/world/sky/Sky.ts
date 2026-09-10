import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { DayNightCycle } from "../DayNightCycle";
import type { CloudLighting } from "./bindCloudUniforms";
import type { CloudPass } from "./CloudPass";
import type { CloudQuality } from "./cloudQuality";
import { shareWithShadows } from "./cloudShadowField";
import { CloudWeather } from "./CloudWeather";
import { loadCloudPass } from "./loadCloudPass";
import { createCloudLighting, createSkyPaint, paintSky } from "./paintSky";
import { SkyDome, type SkyPaint } from "./SkyDome";

/**
 * The sky: its colour, the clouds in it, their weather, their shadows, and
 * how much of the sun and moon they let through.
 *
 * The clouds arrive a moment after the game starts, once the worker has built
 * their noise; until then the sky is drawn clear.
 */
export class Sky {
  readonly weather = new CloudWeather();
  private readonly dome: SkyDome;
  private pass: CloudPass | null = null;
  private quality: CloudQuality = "high";
  private readonly paint: SkyPaint = createSkyPaint();
  private readonly lighting: CloudLighting = createCloudLighting(this.paint);
  private sunThrough = 1;
  private moonThrough = 1;

  constructor(
    scene: Scene,
    private readonly dayNight: DayNightCycle,
  ) {
    this.dome = new SkyDome(scene, this.paint);
    for (const mesh of this.meshes) dayNight.sunAndMoon.glow.exclude(mesh);
    // The first camera drawn is the view: the player's, or the orbit camera.
    const view = (): Camera => scene.activeCameras?.[0] ?? scene.activeCamera!;
    void loadCloudPass(scene, view, this.weather, this.lighting).then((pass) => {
      this.pass = pass;
      pass?.setQuality(this.quality);
    });
    scene.onBeforeRenderObservable.add(() => {
      // A star is a point on any screen: sized to one pixel of whatever is drawing.
      const height = scene.getEngine().getRenderHeight();
      this.paint.stars.setPixelAngle((2 * Math.tan(view().fov / 2)) / height);
      if (!this.pass) return;
      this.pass.render();
      this.dome.showClouds(this.pass.output, this.pass.view);
    });
    // Now, not on the first step: the game opens paused, behind the menu.
    this.repaint();
  }

  /** Paints the sky from the clock at once, for when the menu moves the time or date. */
  repaint(): void {
    paintSky(this.dayNight, this.paint, this.lighting, 0);
  }

  /** The two domes, for passes they must stay out of. */
  get meshes(): Mesh[] {
    return [this.dome.sky, this.dome.veil];
  }

  /** Share of sunlight getting through the clouds to the player, for the god rays. */
  get sunlightThrough(): number {
    return this.sunThrough;
  }

  setQuality(quality: CloudQuality): void {
    this.quality = quality;
    this.pass?.setQuality(quality);
  }

  update(seconds: number, eye: Vector3): void {
    const clouds = this.quality !== "off";
    this.weather.advance(seconds);
    paintSky(this.dayNight, this.paint, this.lighting, seconds);

    shareWithShadows(this.weather, this.lighting.direction, clouds);

    // Eased, so the halo fades as a cloud edge crosses the sun rather than blinking.
    const ease = Math.min(1, seconds * 3);
    const sun = clouds
      ? 1 - this.weather.coverToward(eye, this.dayNight.sunAndMoon.sunDirection)
      : 1;
    const moon = clouds
      ? 1 - this.weather.coverToward(eye, this.dayNight.sunAndMoon.moonDirection)
      : 1;
    this.sunThrough += (sun - this.sunThrough) * ease;
    this.moonThrough += (moon - this.moonThrough) * ease;
    this.dayNight.sunAndMoon.setCloudCover(this.sunThrough, this.moonThrough);
    this.dayNight.setOvercast(clouds ? this.weather.cover : 0);
  }
}
