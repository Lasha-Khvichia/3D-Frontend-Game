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
  world.forecast.update(hours);
  world.wet.update(hours, seconds);
  world.snow.update(hours);
  const sunUp = dayNight.sunAndMoon.sunHeight;
  world.seasons.update(seconds, hours, eye, world.snow.depthUnderFoot, sunUp);
  grass.setSnowDepth(world.snow.depthUnderFoot);
  world.lightning.update(hours, seconds);
  // Before the player's own update, which clears any key press nothing took.
  // A shutter within reach is offered the key first, so standing at a window
  // opens it rather than ploughing the doorstep.
  const keys = player.takeOpeningKeys();
  world.carrying.update(seconds, player.takeItemKeys(), player.walkShare());
  const atAnOpening = world.openings.update(seconds, eye, keys);
  publishPrompt(
    atAnOpening ||
      world.farming.update(eye, keys.open, world.snow.depthUnderFoot, world.carrying.holdingHoe),
  );
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
  lightTheNight(world, seconds);
  world.wind.update(seconds);
  world.woodland.update(eye);
  grass.update(seconds, eye);
}

/** Lanterns, lit windows and the one the player is carrying. */
function lightTheNight(world: World, seconds: number): void {
  const { dayNight, eye, carrying } = world;
  const { sunHeight } = dayNight.sunAndMoon;
  const hour = dayNight.currentHour;
  const home = world.fires.houseInside;
  world.nightLights.update(seconds, hour, sunHeight, eye, home, carrying.lanternAt, carrying.flame);
}

/**
 * The world as it stands at the opening moment, shown before any step runs:
 * the game opens paused. Call it after the settings, which carry the render
 * distance, so the first frame is a finished world rather than one filling in
 * round the player.
 */
export function showOpeningWorld(world: World): void {
  world.streaming.prime(world.eye);
  world.farming.prime(world.eye);
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
  world.forecast.update(hours);
  world.wet.update(hours, 0);
  world.snow.update(hours);
  world.seasons.update(0, hours, eye, world.snow.depthUnderFoot, dayNight.sunAndMoon.sunHeight);
  world.grass.setSnowDepth(world.snow.depthUnderFoot);
  world.terrainShade.update(dayNight.sunAndMoon.sunDirection);
  lightTheNight(world, 0);
  dayNight.refresh();
  world.sky.repaint();
}
