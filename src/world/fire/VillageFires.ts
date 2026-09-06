import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { House } from "../houses/buildHouse";
import { createSoftDotTexture } from "./createSoftDotTexture";
import { Hearth } from "./Hearth";
import { placeHearth } from "./placeHearth";

/**
 * Flames are small and indoors, so they are only simulated close up.
 *
 * The village is about 70 m end to end, so a generous radius would have every
 * fire in it running at once from anywhere on the street. At 20 m only the two
 * or three houses you could actually see into are burning.
 */
const FIRE_RADIUS = 20;
/** Smoke is the village's silhouette, so it runs from much further off. */
const SMOKE_RADIUS = 150;
/** How far the firelight reaches. Short, so it does not leak between houses. */
const LIGHT_RANGE = 8;
const LIGHT_INTENSITY = 0.85;

/**
 * Every fireplace in the village.
 *
 * There is exactly **one** firelight for the whole village, moved to whichever
 * fire the player is nearest. Ten point lights would blow past the four a
 * standard material will consider at once, and the player can only ever be in
 * one room, so nine of them would light nothing anybody could see.
 */
export class VillageFires {
  readonly hearths: Hearth[];
  private readonly light: PointLight;
  private flickerTime = 0;

  constructor(scene: Scene, houses: readonly House[]) {
    const material = new StandardMaterial("hearthstone", scene);
    material.diffuseColor = new Color3(0.44, 0.42, 0.39);
    material.specularColor = Color3.Black();
    const texture = createSoftDotTexture(scene, "ember");

    this.hearths = houses.map(
      (house) =>
        new Hearth(
          scene,
          placeHearth(house.blueprint, house.centreX, house.centreZ),
          material,
          texture,
        ),
    );

    this.light = new PointLight("firelight", new Vector3(0, -50, 0), scene);
    this.light.diffuse = new Color3(1, 0.6, 0.28);
    this.light.specular = Color3.Black();
    this.light.range = LIGHT_RANGE;
    this.light.intensity = 0;
  }

  /** Chimney stacks are tall and worth a shadow. */
  get shadowCasters(): AbstractMesh[] {
    return this.hearths.map((hearth) => hearth.stonework);
  }

  update(seconds: number, player: Vector3): void {
    this.flickerTime += seconds;
    let nearest: Hearth | null = null;
    let nearestDistance = Infinity;

    for (const hearth of this.hearths) {
      const distance = Vector3.Distance(player, hearth.firePoint);
      hearth.setFireRunning(distance < FIRE_RADIUS);
      hearth.setSmokeRunning(distance < SMOKE_RADIUS);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = hearth;
      }
    }

    if (!nearest || nearestDistance > LIGHT_RANGE) {
      this.light.intensity = 0;
      return;
    }
    this.light.position.copyFrom(nearest.firePoint);
    this.light.position.y += 0.35;
    this.light.intensity = LIGHT_INTENSITY * this.flicker();
  }

  /**
   * Two waves at unrelated speeds. One would read as a pulse; two never repeat
   * often enough for the eye to catch the pattern.
   */
  private flicker(): number {
    return 0.82 + 0.1 * Math.sin(this.flickerTime * 11.3) + 0.08 * Math.sin(this.flickerTime * 4.1);
  }
}
