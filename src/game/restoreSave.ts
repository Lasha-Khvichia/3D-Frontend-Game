import { publishStats } from "../ui/bridge";
import { readSave } from "../settings/saveStore";
import { restoreTilled } from "../world/farm/tilledField";
import { STARTING_KIT } from "../items/startingKit";
import { LIES_FOR } from "../world/creatures/Boars";
import { restoreBoarDeaths } from "../world/creatures/boarReturn";
import type { World } from "./buildWorld";

/**
 * Puts a saved game back: where the player stood, the ground they broke, and
 * any weather the menu was holding. The clock itself is restored earlier, when the day and night
 * are built, because everything that is a function of the hour is worked out
 * from it as the world is made.
 *
 * Call it before `showOpeningWorld`, so the first frame is the world the
 * player left rather than the one they started in.
 */
export function restoreSave(world: World): void {
  const save = readSave();
  if (!save) return;
  world.player.controller.teleportTo(save.player.x, save.player.z, save.player.yaw);
  // Before the soil is first laid, which happens in `showOpeningWorld`.
  restoreTilled(save.tilled ?? []);
  // A save written before there was anything to carry keeps its starting kit.
  if (save.carrying) world.carrying.restore(save.carrying.slots, save.carrying.chosen);
  // A save from before a thing was in the kit still gets it.
  world.carrying.topUp(STARTING_KIT);
  const hours = world.dayNight.totalHours;
  restoreBoarDeaths(world.boars.all, save.boarDeaths ?? {}, hours, LIES_FOR);
  if (save.held !== "auto") {
    world.weather.force(save.held);
    publishStats({ weatherHeld: save.held });
  }
}
