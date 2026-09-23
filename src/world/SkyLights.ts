import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { SunShadows } from "./SunShadows";
import type { TimeOfDayLighting } from "./timeOfDayPalette";

/** Multiplies the palette intensity to get the sun's directional strength. */
const SUN_SHARE = 1.1;
const MOON_LIGHT_MAX = 0.42;
const MOON_LIGHT_COLOUR: readonly [number, number, number] = [0.55, 0.65, 0.95];

/**
 * The sun's and the moon's directional lights, and the shadows they cast: the
 * sun's by day, the moon's once the sun is down. Without the moon's, moonlight
 * passed through every roof and lit the rooms inside a pale blue.
 */
export class SkyLights {
  private readonly sunLight: DirectionalLight;
  private readonly moonLight: DirectionalLight;
  readonly shadows: SunShadows;

  constructor(scene: Scene) {
    this.sunLight = new DirectionalLight("sun-light", new Vector3(0, -1, 0), scene);
    this.sunLight.specular = Color3.Black();

    this.moonLight = new DirectionalLight("moon-light", new Vector3(0, -1, 0), scene);
    this.moonLight.diffuse = new Color3(...MOON_LIGHT_COLOUR);
    this.moonLight.specular = Color3.Black();

    this.shadows = new SunShadows(this.sunLight, this.moonLight);
  }

  /** Lights the world from where the bodies stand; `sunUp` and `moonUp` are how much of each is up. */
  shine(
    lighting: TimeOfDayLighting,
    towardSun: Vector3,
    towardMoon: Vector3,
    sunUp: number,
    moonUp: number,
  ): void {
    // A directional light points the way light travels, which is from the body
    // toward the world. That is the opposite of where the body sits.
    this.sunLight.direction.copyFrom(towardSun).scaleInPlace(-1);
    this.moonLight.direction.copyFrom(towardMoon).scaleInPlace(-1);

    this.sunLight.diffuse.copyFrom(lighting.lightColor);
    this.sunLight.intensity = lighting.lightIntensity * SUN_SHARE * sunUp;
    // Moonlight is real but invisible next to daylight.
    this.moonLight.intensity = MOON_LIGHT_MAX * moonUp * (1 - sunUp);

    this.shadows.update(sunUp, this.moonLight.intensity);
  }
}
