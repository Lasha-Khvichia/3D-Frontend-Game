import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { writeSave } from "../settings/saveStore";
import type { DayNightCycle } from "../world/DayNightCycle";
import type { Weather } from "../world/weather/Weather";

/** Real seconds between saves. A game day is twenty minutes, so this is about a game minute. */
const EVERY = 20;

/**
 * Keeps the browser's copy of the game up to date: the clock, a held weather
 * and where the player stands.
 *
 * Only those, because everything else is a function of the clock — the
 * weather, the snow, the wet ground, the sky and every light in the village
 * come back by themselves from the hour. Written every twenty seconds and
 * again when the tab is hidden or closed, which is the last moment a browser
 * allows.
 */
export class GameSave {
  private since = 0;
  private readonly facing = new Vector3();

  constructor(
    private readonly dayNight: DayNightCycle,
    private readonly weather: Weather,
    private readonly bean: AbstractMesh,
    private readonly camera: Camera,
  ) {
    const keep = (): void => this.keep();
    window.addEventListener("pagehide", keep);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") keep();
    });
  }

  /** Every step. Saving is cheap, but not sixty times a second cheap. */
  update(seconds: number): void {
    this.since += seconds;
    if (this.since < EVERY) return;
    this.since = 0;
    this.keep();
  }

  private keep(): void {
    this.camera.getDirectionToRef(Vector3.Forward(), this.facing);
    writeSave({
      totalHours: this.dayNight.totalHours,
      held: this.weather.held ?? "auto",
      player: {
        x: this.bean.position.x,
        z: this.bean.position.z,
        yaw: Math.atan2(this.facing.x, this.facing.z),
      },
    });
  }
}
