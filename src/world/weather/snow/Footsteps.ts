import type { FootprintMap } from "./FootprintMap";

/** Metres between boot prints, and how far each foot falls either side of the walk. */
const STRIDE = 0.8;
const FOOT_APART = 0.12;
/** Longer than any step: past this the player was put somewhere, not walked. */
const A_LEAP = 3;

/** Turns the player's movement into boot prints: one a stride, left and right of the line walked. */
export class Footsteps {
  private lastX = Number.NaN;
  private lastZ = Number.NaN;
  private walked = 0;
  private rightFoot = false;

  constructor(private readonly prints: FootprintMap) {}

  /** Every step. `holdsPrint` says whether the snow here is deep enough to take one. */
  track(x: number, z: number, holdsPrint: boolean, totalHours: number): void {
    if (!Number.isFinite(this.lastX)) {
      this.lastX = x;
      this.lastZ = z;
      return;
    }
    const stepX = x - this.lastX;
    const stepZ = z - this.lastZ;
    const far = Math.hypot(stepX, stepZ);
    this.lastX = x;
    this.lastZ = z;
    if (far < 1e-4 || far > A_LEAP) return;
    this.walked += far;
    if (this.walked < STRIDE) return;
    this.walked = 0;
    if (!holdsPrint) return;
    const towardX = stepX / far;
    const towardZ = stepZ / far;
    this.rightFoot = !this.rightFoot;
    const side = this.rightFoot ? FOOT_APART : -FOOT_APART;
    this.prints.press(x + towardZ * side, z - towardX * side, towardX, towardZ, totalHours);
  }
}
