import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { World } from "./buildWorld";

/** The camera's own forward, asked for once rather than built every step. */
const FORWARD = Vector3.Forward();

/**
 * What the player's hands are doing: the bar, a shutter within reach, and the
 * ground they are aiming at.
 *
 * A shutter is offered the key first, so standing at a window opens it rather
 * than ploughing the doorstep. Runs before the player's own update, which
 * clears any key press nothing took.
 */
export function workTheGround(world: World, seconds: number): string {
  const { player, eye } = world;
  const keys = player.takeOpeningKeys();
  world.carrying.update(seconds, player.takeItemKeys(), player.walkShare());
  const atAnOpening = world.openings.update(seconds, eye, keys);
  if (atAnOpening) return atAnOpening;
  const facing = player.controller.camera.getDirection(FORWARD);
  const snow = world.snow.depthUnderFoot;
  return world.farming.update(eye, facing, keys.open, snow, world.carrying.holdingHoe);
}
