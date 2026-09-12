import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Material } from "@babylonjs/core/Materials/material";
import { WorldEntity } from "../../core/WorldEntity";
import { WindMaterialPlugin, type WindField, type WindStrength } from "./WindMaterialPlugin";
import type { WeatherState } from "../weather/weatherState";

/** Metres a second at which the tuned strengths below are what the trees show. */
const TUNED_FOR_WIND = 5;

/** Wood leans and sways but does not flutter. */
export const WOOD_WIND: WindStrength = { bend: 0.004, sway: 0.03, flutter: 0 };
/**
 * Leaves lean and sway by **exactly** as much as the wood, and add a flutter.
 *
 * The bend and sway must match or leaves slide off the twigs they grow on: they
 * are separate meshes, and nothing but these numbers keeps them together. Only
 * the flutter, which is a couple of centimetres, is theirs alone.
 */
export const LEAF_WIND: WindStrength = { ...WOOD_WIND, flutter: 0.022 };

/**
 * The wind, shared by every tree.
 *
 * One clock and one heading, handed to every tree material, so the whole wood
 * moves as one weather rather than as a dozen unrelated effects. Each tree
 * still has its own phase, taken in the shader from where it stands.
 *
 * **Nothing happens on WebGPU.** The shader code injected here is GLSL, and a
 * WebGPU engine needs WGSL. Rather than break every tree material on a machine
 * that picks WebGPU, the wind quietly stays off there and the trees stand still.
 */
export class TreeWind extends WorldEntity {
  private readonly field: WindField = { time: 0, directionX: 1, directionZ: 0, strength: 1 };
  readonly supported: boolean;

  constructor(engine: AbstractEngine) {
    super();
    this.supported = !engine.isWebGPU;
  }

  get id(): string {
    return "tree-wind";
  }

  applyTo(material: Material, strength: WindStrength): void {
    if (!this.supported) return;
    new WindMaterialPlugin(material, strength, this.field);
  }

  update(seconds: number): void {
    this.field.time += seconds;
  }

  /** The weather's wind: the same heading the clouds and the chimney smoke go. */
  setWeather(weather: Readonly<WeatherState>): void {
    this.field.strength = Math.min(3, Math.max(0.15, weather.wind / TUNED_FOR_WIND));
    this.field.directionX = Math.sin(weather.heading);
    this.field.directionZ = Math.cos(weather.heading);
  }
}
