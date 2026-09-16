import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { insideFootprint, type Footprint } from "../../world/footprint";
import { brownNoise, loopNoise } from "../noiseBuffers";
import { playCrackle } from "./playCrackle";

/** A fire that can be heard: where it burns, and the floor of the house it burns in. */
export type HeardFire = { readonly point: Vector3; readonly floor: Footprint };

/** Metres: heard faintly this far off, and at its loudest this close. */
const REACH = 10;
const CLOSE = 1.5;
/** How loud a fire is from right beside it. */
const LOUDEST = 0.35;
/** From outside the house, through a wall: this much of it, and only its low notes. */
const THROUGH_WALL = 0.35;
const WALL_TOP = 700;
const OPEN_TOP = 9000;
/** Seconds of crackles put on the clock ahead, so none are late at a slow frame. */
const AHEAD = 0.25;
/** Mean seconds between crackles; they come at random, so some bunch and some pause. */
const CRACKLE_EVERY = 0.14;

/**
 * The fire nearest the player, heard as a wood fire burns: a low roar of the
 * flames, a soft hiss, and crackles at random. Louder the nearer, from the
 * side it is on, and muffled through the wall from outside its house. One
 * fire is heard at a time, as one firelight is lit at a time (`VillageFires`).
 */
export class FireSound {
  private readonly level: GainNode;
  private readonly wall: BiquadFilterNode;
  private readonly side: StereoPannerNode;
  private readonly roar: GainNode;
  private nextCrackle = 0;
  private nextFlutter = 0;

  constructor(
    private readonly context: BaseAudioContext,
    into: AudioNode,
    private readonly noise: AudioBuffer,
  ) {
    this.level = context.createGain();
    this.level.gain.value = 0;
    this.wall = context.createBiquadFilter();
    this.wall.type = "lowpass";
    this.wall.frequency.value = OPEN_TOP;
    this.side = context.createStereoPanner();
    this.level.connect(this.wall).connect(this.side).connect(into);
    const low = context.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 400;
    this.roar = context.createGain();
    this.roar.gain.value = 0.5;
    low.connect(this.roar).connect(this.level);
    loopNoise(context, brownNoise(context, 6), low);
    const hiss = context.createBiquadFilter();
    hiss.type = "bandpass";
    hiss.frequency.value = 2200;
    hiss.Q.value = 0.6;
    const soft = context.createGain();
    soft.gain.value = 0.12;
    hiss.connect(soft).connect(this.level);
    loopNoise(context, noise, hiss);
  }

  /** `facing` is the camera's yaw: which way is left and right. */
  update(fires: readonly HeardFire[], ear: Vector3, facing: number): void {
    let nearest: HeardFire | null = null;
    let away = Infinity;
    for (const fire of fires) {
      const distance = Math.hypot(fire.point.x - ear.x, fire.point.y - ear.y, fire.point.z - ear.z);
      if (distance < away) [nearest, away] = [fire, distance];
    }
    const now = this.context.currentTime;
    const near = Math.min(1, Math.max(0, 1 - (away - CLOSE) / (REACH - CLOSE)));
    if (!nearest || near <= 0) {
      this.level.gain.setTargetAtTime(0, now, 0.3);
      this.nextCrackle = now;
      return;
    }
    const inside = insideFootprint(nearest.floor, ear.x, ear.z);
    this.level.gain.setTargetAtTime(LOUDEST * near * near * (inside ? 1 : THROUGH_WALL), now, 0.3);
    this.wall.frequency.setTargetAtTime(inside ? OPEN_TOP : WALL_TOP, now, 0.3);
    // Right of the way the player faces is (cos, −sin) of the yaw.
    const dx = nearest.point.x - ear.x;
    const dz = nearest.point.z - ear.z;
    const right = (dx * Math.cos(facing) - dz * Math.sin(facing)) / Math.max(1, Math.hypot(dx, dz));
    this.side.pan.setTargetAtTime(right * 0.7, now, 0.2);
    if (now >= this.nextFlutter) {
      this.roar.gain.setTargetAtTime(0.35 + 0.3 * Math.random(), now, 0.15);
      this.nextFlutter = now + 0.1 + Math.random() * 0.3;
    }
    this.nextCrackle = Math.max(this.nextCrackle, now);
    while (this.nextCrackle < now + AHEAD) {
      playCrackle(this.context, this.level, this.noise, this.nextCrackle);
      this.nextCrackle += Math.max(0.01, -Math.log(1 - Math.random()) * CRACKLE_EVERY);
    }
  }
}
