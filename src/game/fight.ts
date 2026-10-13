import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { publishStats } from "../ui/bridge";
import type { World } from "./buildWorld";

/** Health a charge takes, and how hard and high it throws you. */
const GORE = 25;
const THROWN = 7;
const LIFTED = 3.2;
/** Where you come to: the village street, the next morning. */
const HOME = { x: 0, z: 0, hour: 8 };

const FORWARD = Vector3.Forward();
let shownHealth = -1;

/**
 * One step of the fighting: your sword against the boars, theirs against you.
 *
 * Nothing lands while you are knocked out — the screen is going black and a
 * boar has nothing left to take. Health is told to the overlay in whole
 * points, and only when the number changes, never every step.
 */
export function fight(world: World, seconds: number, struck: boolean): void {
  const { boars, health, blackout, player, dayNight } = world;
  const hours = dayNight.totalHours;
  const body = player.controller.bean.position;
  if (struck && !blackout.out) {
    boars.strike(world.eye, player.controller.camera.getDirection(FORWARD), hours);
  }
  for (const gore of boars.update(seconds, body, hours)) {
    if (blackout.out) break;
    player.controller.knockBack(body.x - gore.fromX, body.z - gore.fromZ, THROWN, LIFTED);
    if (health.hurt(GORE)) blackout.start();
  }
  health.update(seconds);
  const whole = Math.ceil(health.current);
  if (whole !== shownHealth) {
    shownHealth = whole;
    publishStats({ health: whole });
  }
  blackout.update(seconds, () => wakeInTheVillage(world));
}

/** In the dark: back to the village street, the clock on to the morning, healed. */
function wakeInTheVillage(world: World): void {
  world.player.controller.teleportTo(HOME.x, HOME.z, 0);
  world.dayNight.wakeAt(HOME.hour);
  world.health.refill();
  // A teleport must build what is round the new place before it is seen.
  world.streaming.prime(world.player.controller.bean.position);
}
