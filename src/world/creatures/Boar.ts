import type { Den } from "./boarDens";

/** What a boar is doing. Only `charge` is dangerous. */
export type BoarMood = "root" | "wander" | "wary" | "charge" | "recover" | "flee" | "dead";

/** A boar's full health: three cuts of a sword. */
export const BOAR_HEALTH = 60;
/** Below this share of its health a hurt boar stops fighting and runs. */
const BREAKS_AT = 0.3;
/** Seconds a boar stays angry after a cut, unless cut again. */
const TEMPER = 15;
/** Metres per second a cut throws it back by. */
const THROWN = 5;

/**
 * One wild boar: where it is, which way it faces, and what it is doing.
 *
 * Plain state, nothing drawn: `BoarHerd` draws every boar in one call, and
 * `thinkFor` and `walkBoar` move it on each step.
 */
export class Boar {
  y = 0;
  /** Radians; 0 faces +z, as the player's yaw does. */
  heading: number;
  /** Metres per second it is moving at, and the pace it is trying for. */
  speed = 0;
  pace = 0;
  mood: BoarMood = "root";
  moodTime = 0;
  moodLength = 2;
  targetX: number;
  targetZ: number;
  health = BOAR_HEALTH;
  /** Seconds of temper left; while any remains, it will come for you. */
  anger = 0;
  /** A shove from a blow, dying away. */
  knockX = 0;
  knockZ = 0;
  /** The legs' phase, carried on by the ground covered. */
  gait = 0;
  /** The clock's hours when it was killed, or null while it lives. */
  diedAt: number | null = null;

  constructor(
    readonly id: string,
    readonly den: Den,
    public x: number,
    public z: number,
    heading: number,
  ) {
    this.heading = heading;
    this.targetX = x;
    this.targetZ = z;
  }

  get alive(): boolean {
    return this.mood !== "dead";
  }

  setMood(mood: BoarMood, seconds: number): void {
    this.mood = mood;
    this.moodTime = 0;
    this.moodLength = seconds;
  }

  /** A cut from someone standing at (fromX, fromZ). True if it was the last. */
  hit(damage: number, fromX: number, fromZ: number, hours: number): boolean {
    if (!this.alive) return false;
    this.health -= damage;
    const away = Math.hypot(this.x - fromX, this.z - fromZ) || 1;
    this.knockX = ((this.x - fromX) / away) * THROWN;
    this.knockZ = ((this.z - fromZ) / away) * THROWN;
    this.anger = TEMPER;
    if (this.health <= 0) {
      this.setMood("dead", 0);
      this.diedAt = hours;
      this.pace = 0;
      return true;
    }
    this.setMood(this.health < BOAR_HEALTH * BREAKS_AT ? "flee" : "charge", 6);
    return false;
  }

  /** Back at its den, whole and calm: the next morning after it was killed. */
  revive(x: number, z: number): void {
    [this.x, this.z, this.targetX, this.targetZ] = [x, z, x, z];
    this.health = BOAR_HEALTH;
    this.anger = 0;
    this.diedAt = null;
    this.speed = 0;
    this.pace = 0;
    this.setMood("root", 2);
  }
}
