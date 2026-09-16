import type { Scene } from "@babylonjs/core/scene";
import type { House } from "../world/houses/buildHouse";
import { attachPrecipitation } from "../world/weather/precipitation/attachPrecipitation";
import { SnowGround } from "../world/weather/snow/SnowGround";
import { Lightning } from "../world/weather/storm/Lightning";
import { Weather } from "../world/weather/Weather";
import type { WeatherListener } from "../world/weather/weatherState";
import { WetGround } from "../world/weather/wet/WetGround";
import type { Land } from "./buildLand";

export type WorldWeather = ReturnType<typeof buildWeather>;

/**
 * The weather and everything it does. It is worked out from the date every
 * step and handed to its `followers` — the sky's colour and clouds, the fog,
 * the trees, the grass, the smoke — and it brings down rain and snow, wet
 * ground, lying snow and ice, and lightning.
 */
export function buildWeather(
  scene: Scene,
  land: Land,
  houses: readonly House[],
  followers: readonly WeatherListener[],
) {
  const { terrain, dayNight, godRays, sky, eye } = land;
  const weather = new Weather(eye);
  for (const listener of followers) weather.addListener(listener);

  // Rain, sleet, hail and snow falling, and kept out from under every roof.
  const falling = attachPrecipitation(scene, {
    ground: terrain,
    houses,
    dayNight,
    godRays,
    weather,
  });
  // And what the rain leaves behind: wet ground and puddles, dry under the roofs.
  const wet = new WetGround(eye, weather, dayNight, falling.roofs);
  weather.addListener(wet);
  // Snow that builds and melts, the trail through it, and ice on the rivers.
  const snow = new SnowGround(scene, eye, terrain, weather);
  weather.addListener(snow);
  land.winterGround.useWinter(snow);

  // Lightning in a storm, and thunder after it at the speed of sound.
  const lightning = new Lightning(scene, eye, weather, dayNight.light, () => {
    dayNight.refresh();
    sky.repaint();
  });
  for (const mesh of lightning.meshes) godRays.excludeFromOcclusion(mesh);

  return { weather, falling, wet, snow, lightning };
}
