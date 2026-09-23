import { publishPrompt } from "../ui/bridge";
import { cloudShadowField } from "../world/sky/cloudShadowField";
import type { World } from "./buildWorld";

/**
 * One simulation step of the whole world, every system in its order.
 *
 * `GameRuntime.setSimulationStep` takes a single function, so every system's
 * per-step update is called from here. A new system means a new line here.
 */
export function stepWorld(world: World, seconds: number): void {
  const { dayNight, player, eye, sky, godRays, grass } = world;
  dayNight.advance(seconds);
  const hours = dayNight.totalHours;
  world.weather.update(hours);
  world.wet.update(hours, seconds);
  world.snow.update(hours);
  const sunUp = dayNight.sunAndMoon.sunHeight;
  world.seasons.update(seconds, hours, eye, world.snow.depthUnderFoot, sunUp);
  grass.setSnowDepth(world.snow.depthUnderFoot);
  world.lightning.update(hours, seconds);
  // Before the player's own update, which clears any key press nothing took.
  publishPrompt(world.openings.update(seconds, eye, player.takeOpeningKeys()));
  player.update(seconds);
  world.worldEdge.update(seconds, player.controller);
  world.strides.update(seconds);
  world.streaming.update(eye);
  world.falling.update(eye);
  sky.update(seconds, eye);
  godRays.setCloudCover(sky.sunlightThrough);
  world.terrainShade.update(cloudShadowField.toward);
  world.miniMap.update(
    seconds,
    player.controller.bean,
    player.wantsOverheadMap(),
    dayNight.sunAndMoon,
  );
  godRays.update(dayNight.sunAndMoon.sunDirection);
  world.fires.update(seconds, eye);
  world.fireShadows.update(world.fires.houseInside);
  const { sunHeight } = dayNight.sunAndMoon;
  world.nightLights.update(seconds, dayNight.currentHour, sunHeight, eye, world.fires.houseInside);
  world.wind.update(seconds);
  world.woodland.update(eye);
  grass.update(seconds, eye);
}

/**
 * The world as it stands at the opening moment, shown before any step runs:
 * the game opens paused. Call it after the settings, which carry the render
 * distance, so the first frame is a finished world rather than one filling in
 * round the player.
 */
export function showOpeningWorld(world: World): void {
  world.streaming.prime(world.eye);
  world.falling.update(world.eye);
  showWorldNow(world);
}

/**
 * Everything the clock decides, brought up to date at once: at the opening,
 * and when the menu moves the time, the date or the weather while paused.
 */
export function showWorldNow(world: World): void {
  const { dayNight, eye } = world;
  const hours = dayNight.totalHours;
  world.weather.update(hours);
  world.wet.update(hours, 0);
  world.snow.update(hours);
  world.seasons.update(0, hours, eye, world.snow.depthUnderFoot, dayNight.sunAndMoon.sunHeight);
  world.grass.setSnowDepth(world.snow.depthUnderFoot);
  world.terrainShade.update(dayNight.sunAndMoon.sunDirection);
  const { sunHeight } = dayNight.sunAndMoon;
  world.nightLights.update(0, dayNight.currentHour, sunHeight, eye, world.fires.houseInside);
  dayNight.refresh();
  world.sky.repaint();
}
