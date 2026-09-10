import type { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Where the eye was at the last two simulation steps, so every drawn frame
 * can place the camera between them.
 *
 * The world moves 60 times a second; screens draw 60, 120 or 144. Drawn at
 * the last step's position, the view stood still for some frames and jumped
 * for others — the judder that reads as an unsteady frame rate even when the
 * counter says 144, and that even a 60 Hz screen shows whenever a frame
 * arrives a millisecond early or late. Drawn between the last two steps, by
 * how far the clock has got towards the next one, it glides. The price is
 * that the view is up to one step, 17 ms, behind the world: the standard
 * trade from Glenn Fiedler's "Fix Your Timestep!".
 */
export class SmoothedEye {
  private readonly previous = new Vector3();
  private readonly current = new Vector3();
  private previousSway = 0;
  private currentSway = 0;
  private previousRoll = 0;
  private currentRoll = 0;

  /** Records where this step left the eye: its centre, its sideways sway, its roll. */
  record(centre: Vector3, sway: number, roll: number): void {
    this.previous.copyFrom(this.current);
    this.previousSway = this.currentSway;
    this.previousRoll = this.currentRoll;
    this.current.copyFrom(centre);
    this.currentSway = sway;
    this.currentRoll = roll;
  }

  /** Forgets the last step, after a teleport: the view must not glide across the map. */
  settle(): void {
    this.previous.copyFrom(this.current);
    this.previousSway = this.currentSway;
    this.previousRoll = this.currentRoll;
  }

  /**
   * Puts the camera `progress` of the way from the last step to this one, 0 to
   * 1, facing the given way. Sway is sideways in the body's own frame, so it
   * rides the right vector of the yaw being shown, not the yaw of the step.
   */
  place(camera: TargetCamera, progress: number, yaw: number, pitch: number): void {
    const sway = this.previousSway + (this.currentSway - this.previousSway) * progress;
    camera.position.set(
      this.previous.x + (this.current.x - this.previous.x) * progress + Math.cos(yaw) * sway,
      this.previous.y + (this.current.y - this.previous.y) * progress,
      this.previous.z + (this.current.z - this.previous.z) * progress - Math.sin(yaw) * sway,
    );
    const roll = this.previousRoll + (this.currentRoll - this.previousRoll) * progress;
    camera.rotation.set(pitch, yaw, roll);
  }
}
