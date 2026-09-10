import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { publishStats } from "../ui/bridge";

/** Slower than 60 a second, with room so a frame on the line is not slow; and well inside it. */
const SLOW_FRAME_MS = 18;
const EASY_FRAME_MS = 13.5;
/** Shares of the chosen resolution it steps through. Never below 70%: half the pixels. */
const SCALES = [1, 0.9, 0.8, 0.7] as const;
// A second at a time; the second after a change is skipped (its resize is slow), so changes are 2 s apart.
const MEASURE_MS = 1000;
/** Climbing back waits longer than stepping down, so it does not see-saw. */
const EASY_WINDOWS_TO_CLIMB = 3;
/** A step down that bought less than this was not waiting on pixels. Each such try doubles the wait. */
const WORTHWHILE_GAIN = 0.05;
const FIRST_WAIT_MS = 15000;
const LONGEST_WAIT_MS = 300000;

/**
 * Holds 60 frames a second by rendering fewer pixels while frames run slow,
 * climbing back to the chosen resolution once there is room. It steps slowly,
 * a second's average at a time, because every change reallocates the
 * screen-sized targets. A slow frame is not always the GPU's: if a step down
 * buys no speed, the time is going on the CPU and fewer pixels only blur the
 * picture, so it steps back up and leaves the resolution alone for a while.
 */
export class AutoResolution {
  private base = 1;
  private enabled = true;
  private step = 0;
  private windowMs = 0;
  private frames = 0;
  private easyWindows = 0;
  private beforeLastDrop = 0;
  private heldUntil = 0;
  private waitMs = FIRST_WAIT_MS;
  private settling = 0;

  constructor(private readonly engine: AbstractEngine) {}

  /** The menu's choices. Its resolution, in device pixels per CSS pixel, is never exceeded. */
  configure(pixelRatio: number, enabled: boolean): void {
    this.base = pixelRatio;
    this.enabled = enabled;
    if (!enabled) this.step = 0;
    this.apply();
  }

  /** Once per drawn frame while playing, with the time since the last one. */
  frame(deltaMs: number): void {
    // A tab switch or a breakpoint is not a slow frame.
    if (!this.enabled || deltaMs > 250) return;
    this.windowMs += deltaMs;
    this.frames += 1;
    if (this.windowMs < MEASURE_MS) return;
    const average = this.windowMs / this.frames;
    this.windowMs = 0;
    this.frames = 0;
    if (this.settling > 0) this.settling -= 1;
    else this.judge(average);
  }

  private judge(average: number): void {
    const now = performance.now();
    if (this.beforeLastDrop > 0) {
      const gain = 1 - average / this.beforeLastDrop;
      this.beforeLastDrop = 0;
      if (gain < WORTHWHILE_GAIN) {
        this.heldUntil = now + this.waitMs;
        this.waitMs = Math.min(LONGEST_WAIT_MS, this.waitMs * 2);
        return this.change(-1);
      }
      this.waitMs = FIRST_WAIT_MS;
    }
    this.easyWindows = average < EASY_FRAME_MS ? this.easyWindows + 1 : 0;
    if (average > SLOW_FRAME_MS && this.step < SCALES.length - 1 && now >= this.heldUntil) {
      this.beforeLastDrop = average;
      this.change(1);
    } else if (this.easyWindows >= EASY_WINDOWS_TO_CLIMB && this.step > 0) {
      this.change(-1);
    }
  }

  private change(direction: 1 | -1): void {
    this.step = Math.min(SCALES.length - 1, Math.max(0, this.step + direction));
    this.easyWindows = 0;
    this.settling = 1;
    this.apply();
  }

  private apply(): void {
    const scale = SCALES[this.step] ?? 1;
    // Hardware scaling is the inverse of resolution. Setting it resizes
    // everything, so only when it actually changes.
    const level = 1 / (this.base * scale);
    if (Math.abs(this.engine.getHardwareScalingLevel() - level) > 1e-6) {
      this.engine.setHardwareScalingLevel(level);
    }
    publishStats({ resolutionShare: scale });
  }
}
