/** Metres of ground covered per footstep. Sets how fast the cycle runs. */
const STEP_LENGTH = 2.4;

/**
 * Amplitudes per metre per second of speed. Tying them to speed rather than to
 * a walk/run switch means running bobs harder as well as faster, and the change
 * between the two is a slide rather than a jump.
 */
const VERTICAL_PER_SPEED = 0.0095;
const LATERAL_PER_SPEED = 0.006;
const ROLL_PER_SPEED = 0.0022;

/** Seconds to settle when you stop, so the camera does not snap back level. */
const SPEED_SETTLE_SECONDS = 0.12;
/** Seconds to fade the bob away in the air and back on landing. */
const GROUND_FADE_SECONDS = 0.15;

/** Two full footsteps. The sway runs at half rate, so it needs the longer wrap. */
const PHASE_WRAP = Math.PI * 4;

/**
 * The rise, sway and tilt of a head on a moving body.
 *
 * Phase advances with distance actually covered, not with time, so it stays in
 * step with your feet and stops dead when you walk into a wall.
 */
export class HeadBob {
  private phase = 0;
  private speed = 0;
  private groundFade = 0;
  private strength = 1;

  /** 0 removes the bounce entirely, 1 is full strength. */
  setStrength(strength: number): void {
    this.strength = Math.min(1, Math.max(0, strength));
  }

  advance(seconds: number, distanceMoved: number, grounded: boolean): void {
    if (seconds <= 0) return;

    this.phase = (this.phase + (distanceMoved / STEP_LENGTH) * Math.PI * 2) % PHASE_WRAP;

    const instantSpeed = distanceMoved / seconds;
    this.speed += (instantSpeed - this.speed) * Math.min(1, seconds / SPEED_SETTLE_SECONDS);

    const target = grounded ? 1 : 0;
    const step = seconds / GROUND_FADE_SECONDS;
    this.groundFade =
      target > this.groundFade
        ? Math.min(target, this.groundFade + step)
        : Math.max(target, this.groundFade - step);
  }

  /** Rises and falls once per footstep. */
  get verticalOffset(): number {
    return Math.sin(this.phase) * this.amplitude(VERTICAL_PER_SPEED);
  }

  /** Drifts side to side once per stride, so at half the footstep rate. */
  get lateralOffset(): number {
    return Math.sin(this.phase * 0.5) * this.amplitude(LATERAL_PER_SPEED);
  }

  /** Tilts with the sway. This is the part that reads as a body, not a box. */
  get roll(): number {
    return Math.sin(this.phase * 0.5) * this.amplitude(ROLL_PER_SPEED);
  }

  private amplitude(perSpeed: number): number {
    return this.speed * perSpeed * this.groundFade * this.strength;
  }
}
