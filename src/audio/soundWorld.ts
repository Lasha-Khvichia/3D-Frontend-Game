import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { WeatherState } from "../world/weather/weatherState";
import type { HeardFire } from "./fire/FireSound";
import type { RustlingTree } from "./LeafRustle";

/** What the sounds follow: the weather, the time and season, where the player is and faces. */
export type SoundWorld = {
  readonly weather: Readonly<WeatherState>;
  readonly dayNight: {
    readonly dayNumber: number;
    readonly currentHour: number;
    readonly sunAndMoon: { readonly sunHeight: number };
  };
  /** The player's ears: where they are, and the camera's turn, whose `y` is which way they face. */
  readonly listener: { readonly position: Vector3; readonly rotation: Vector3 };
  readonly trees: readonly RustlingTree[];
  readonly fires: readonly HeardFire[];
  /** Under a roof: rain on the tiles, and everything outside muffled. */
  indoors(): boolean;
  /** Within a house's walls, where its timbers are heard. */
  insideHouse(): boolean;
};
