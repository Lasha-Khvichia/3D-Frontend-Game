import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { SoundScape } from "../audio/SoundScape";
import type { RustlingTree } from "../audio/LeafRustle";
import { PLAYER_HEIGHT } from "../player/createPlayerBean";
import { StrideTracker } from "../player/StrideTracker";
import { insideFootprint } from "../world/footprint";
import { GroundSurfaces } from "../world/GroundSurfaces";
import type { House } from "../world/houses/buildHouse";
import type { Land } from "./buildLand";
import type { WorldWeather } from "./buildWeather";

/** Feet this far off the ground are on a roof or a ladder, not inside the house below. */
const ON_THE_FLOOR = 1;

/**
 * Every sound, wired to what it follows: the weather, the trees, houses and fires
 * round the player, their footsteps on the ground under them, and thunder
 * after each strike. `strides` is stepped in `stepWorld`.
 */
export function buildSound(
  scene: Scene,
  land: Land,
  houses: readonly House[],
  trees: readonly RustlingTree[],
  hearths: readonly { readonly firePoint: Vector3 }[],
  weather: WorldWeather,
) {
  const { eye, player } = land;
  const { shelter } = weather.falling;
  const floors = houses.map((house) => house.footprint);
  const feet = (): number => eye.y - PLAYER_HEIGHT / 2;
  const sound = new SoundScape(scene, {
    weather: weather.weather.state,
    dayNight: land.dayNight,
    listener: { position: eye, rotation: player.controller.camera.rotation },
    trees,
    // Each hearth is in the house at the same place in the list.
    fires: hearths.map((hearth, i) => ({ point: hearth.firePoint, floor: floors[i]! })),
    indoors: () => shelter.covers(eye.x, eye.z, eye.y),
    insideHouse: () =>
      feet() < ON_THE_FLOOR && floors.some((floor) => insideFootprint(floor, eye.x, eye.z)),
  });
  weather.lightning.onStrike((strike) => sound.thunder(strike));

  const ground = new GroundSurfaces(scene, land.terrain, land.winterGround, weather.snow, floors);
  const strides = new StrideTracker(player.controller, (stride) => {
    if (sound.listening) sound.footstep(ground.at(eye.x, eye.z, feet()), stride);
  });
  return { sound, strides };
}
