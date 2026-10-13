import type { Ground } from "../terrain/Ground";
import type { Boar } from "./Boar";

/** Radians a second a boar turns, and metres a second squared it speeds up and slows by. */
const TURN = 3.4;
const ACCELERATE = 9;
/** Water this deep and ground this steep turn a boar back. */
const TOO_DEEP = 0.2;
const TOO_STEEP = 0.45;
/** How fast a shove from a blow dies away. */
const SHOVE_FADE = 6;
/** Leg strides per metre walked. */
const STRIDES = 4.2;

const slope = { x: 0, z: 0 };

/**
 * Moves a boar one step toward where it means to go, on the ground.
 *
 * It turns before it runs, eases into its pace, and keeps its feet on the
 * height grid. Water and slopes it will not take stop it short and make it
 * think again — so a boar never wades out to sea after you, and never climbs a
 * cliff to reach you.
 */
export function walkBoar(boar: Boar, ground: Ground, seconds: number): void {
  const toX = boar.targetX - boar.x;
  const toZ = boar.targetZ - boar.z;
  if (boar.pace > 0 && Math.hypot(toX, toZ) > 0.2) {
    const wanted = Math.atan2(toX, toZ);
    const turn = Math.atan2(Math.sin(wanted - boar.heading), Math.cos(wanted - boar.heading));
    boar.heading += Math.max(-TURN * seconds, Math.min(TURN * seconds, turn));
  }
  const change = boar.pace - boar.speed;
  boar.speed += Math.max(-ACCELERATE * seconds, Math.min(ACCELERATE * seconds, change));

  const fade = Math.max(0, 1 - SHOVE_FADE * seconds);
  const nextX = boar.x + (Math.sin(boar.heading) * boar.speed + boar.knockX) * seconds;
  const nextZ = boar.z + (Math.cos(boar.heading) * boar.speed + boar.knockZ) * seconds;
  boar.knockX *= fade;
  boar.knockZ *= fade;

  ground.slopeAt(nextX, nextZ, slope);
  if (ground.waterDepthAt(nextX, nextZ) > TOO_DEEP || Math.hypot(slope.x, slope.z) > TOO_STEEP) {
    boar.speed = 0;
    boar.moodTime = boar.moodLength;
    return;
  }
  boar.gait += Math.hypot(nextX - boar.x, nextZ - boar.z) * STRIDES;
  boar.x = nextX;
  boar.z = nextZ;
  boar.y = ground.heightAt(nextX, nextZ);
}
