import { publishStats } from "../ui/bridge";
import { readSave } from "../settings/saveStore";
import { restoreTilled } from "../world/farm/tilledField";
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
  if (save.held !== "auto") {
    world.weather.force(save.held);
    publishStats({ weatherHeld: save.held });
  }
}
