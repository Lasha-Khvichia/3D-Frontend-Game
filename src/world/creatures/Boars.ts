import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { createSeededRandom, seedFromText } from "../houses/seededRandom";
import type { Ground } from "../terrain/Ground";
import { Boar } from "./Boar";
import { thinkFor } from "./boarBrain";
import { boarDens, type Den } from "./boarDens";
import { BoarHerd } from "./BoarHerd";
import { returnsAt } from "./boarReturn";
import { walkBoar } from "./walkBoar";

/** Metres from the player within which boars move and are drawn; past it they wait. */
const AWAKE_WITHIN = 220;
/** A sword's reach from the eye, plus a boar's own bulk, and half the arc it cuts. */
const SWORD_REACH = 3.1;
const SWORD_ARC = 0.95;
const SWORD_DAMAGE = 25;
/** Metres at which a charge connects. */
const GORE_REACH = 1.3;
/** Seconds a dead boar lies before it is gone. */
export const LIES_FOR = 25;

export type Gore = { fromX: number; fromZ: number };

/**
 * Every wild boar on the island, living at its den.
 *
 * Only the boars within 220 m of the player move or are drawn; the rest wait
 * where they are, which is what keeps forty boars cheap. A sword cut and a
 * charge are both worked out here, by distance and bearing rather than by
 * picking meshes — nothing about a boar is pickable.
 */
export class Boars {
  readonly dens: readonly Den[];
  readonly herd: BoarHerd;
  readonly all: Boar[] = [];
  private readonly shown: Boar[] = [];
  private readonly gores: Gore[] = [];
  private readonly random = createSeededRandom(seedFromText("boar-moods"));

  constructor(
    scene: Scene,
    private readonly ground: Ground,
  ) {
    this.dens = boarDens(ground);
    this.herd = new BoarHerd(scene);
    const place = createSeededRandom(seedFromText("boar-places"));
    for (const den of this.dens) {
      for (let one = 0; one < den.boars; one += 1) {
        const [angle, far] = [place() * Math.PI * 2, 3 + place() * 10];
        const [x, z] = [den.x + Math.sin(angle) * far, den.z + Math.cos(angle) * far];
        const boar = new Boar(`${den.index}-${one}`, den, x, z, place() * Math.PI * 2);
        boar.y = ground.heightAt(x, z);
        this.all.push(boar);
      }
    }
  }

  /** Moves the boars near `player` on. Returns the charges that landed this step. */
  update(seconds: number, player: Vector3, hours: number): readonly Gore[] {
    this.gores.length = 0;
    this.shown.length = 0;
    for (const boar of this.all) {
      if (boar.diedAt !== null && hours >= returnsAt(boar.diedAt)) {
        boar.revive(boar.den.x + this.random() * 8 - 4, boar.den.z + this.random() * 8 - 4);
      }
      if (Math.hypot(boar.x - player.x, boar.z - player.z) > AWAKE_WITHIN) continue;
      thinkFor(boar, player.x, player.z, seconds, this.random);
      if (boar.alive) walkBoar(boar, this.ground, seconds);
      if (boar.mood === "charge" && Math.hypot(boar.x - player.x, boar.z - player.z) < GORE_REACH) {
        this.gores.push({ fromX: boar.x, fromZ: boar.z });
        boar.setMood("recover", 1.1);
      }
      if (boar.alive || boar.moodTime < LIES_FOR) this.shown.push(boar);
    }
    this.herd.draw(this.shown);
    return this.gores;
  }

  /** A sword swung from the eye along `facing`. Returns how many boars it cut. */
  strike(eye: Vector3, facing: Vector3, hours: number): number {
    const flat = Math.hypot(facing.x, facing.z) || 1;
    let cut = 0;
    for (const boar of this.all) {
      if (!boar.alive || Math.abs(boar.y + 0.6 - eye.y) > 2) continue;
      const [dx, dz] = [boar.x - eye.x, boar.z - eye.z];
      const far = Math.hypot(dx, dz);
      if (far > SWORD_REACH) continue;
      const along = (dx * facing.x + dz * facing.z) / flat / (far || 1);
      if (far > 0.5 && Math.acos(Math.max(-1, Math.min(1, along))) > SWORD_ARC) continue;
      boar.hit(SWORD_DAMAGE, eye.x, eye.z, hours);
      cut += 1;
    }
    return cut;
  }
}
