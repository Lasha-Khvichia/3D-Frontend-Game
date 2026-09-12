import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { DayNightCycle } from "../../DayNightCycle";
import type { House } from "../../houses/buildHouse";
import type { SunGodRays } from "../../SunGodRays";
import type { Weather } from "../Weather";
import { CatchMap, type LandingGround } from "./CatchMap";
import type { NearRoofs } from "./NearRoofs";
import { Precipitation } from "./Precipitation";
import { Shelter } from "./Shelter";

export type FallingWeather = {
  /** Every step: keeps the map of where rain lands centred on the player. */
  update(eye: Vector3): void;
  /** Every roof, for asking whether a point is under cover. */
  readonly shelter: Shelter;
  /** The roofs nearest the player, for anything else drawing what they keep off. */
  readonly roofs: NearRoofs;
};

/**
 * Puts falling rain, sleet, hail and snow into the world: the roofs that keep
 * it off, the map of where it lands, and the drops themselves, following the
 * weather and kept out of the halo and god-ray passes they would spoil.
 */
export function attachPrecipitation(
  scene: Scene,
  world: {
    readonly ground: LandingGround;
    readonly houses: readonly House[];
    readonly dayNight: DayNightCycle;
    readonly godRays: SunGodRays;
    readonly weather: Weather;
  },
): FallingWeather {
  const shelter = Shelter.fromHouses(world.houses);
  const catchMap = new CatchMap(scene, world.ground, shelter);
  const precipitation = new Precipitation(scene, () => world.dayNight.palette, catchMap);
  for (const mesh of precipitation.meshes) {
    world.godRays.excludeFromOcclusion(mesh);
    world.dayNight.sunAndMoon.glow.exclude(mesh);
  }
  world.weather.addListener(precipitation);
  return { shelter, roofs: catchMap.roofs, update: (eye) => catchMap.update(eye) };
}
