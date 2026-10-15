import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { clearSave, writeSave } from "../settings/saveStore";
import { subscribeToCommands } from "../ui/bridge";
import { tilledKeys } from "../world/farm/tilledField";
import type { Carrying } from "../items/Carrying";
import { boarDeaths } from "../world/creatures/boarReturn";
import type { Boars } from "../world/creatures/Boars";
import type { DayNightCycle } from "../world/DayNightCycle";
import type { Weather } from "../world/weather/Weather";

/** Real seconds between saves. A game day is twenty minutes, so this is about a game minute. */
const EVERY = 20;

/**
 * Keeps the browser's copy of the game up to date: the clock, a held weather,
 * where the player stands, what they are carrying, and every square of ground
 * they have broken.
 *
 * Only those, because everything else is a function of the clock — the
 * weather, the snow, the wet ground, the sky and every light in the village
 * come back by themselves from the hour. Tilled ground cannot: somebody did
 * it, so it has to be written down. Written every twenty seconds and
 * again when the tab is hidden or closed, which is the last moment a browser
 * allows.
 */
export class GameSave {
  private since = 0;
  private readonly facing = new Vector3();
  /** Set by a reset: nothing is written again before the page goes. */
  private forgotten = false;

  constructor(
    private readonly dayNight: DayNightCycle,
    private readonly weather: Weather,
    private readonly bean: AbstractMesh,
    private readonly camera: Camera,
    private readonly carrying: Carrying,
    private readonly boars: Boars,
  ) {
    const keep = (): void => this.keep();
    window.addEventListener("pagehide", keep);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") keep();
    });
    subscribeToCommands((command) => {
      if (command.type === "reset-game") this.startOver();
    });
  }

  /**
   * Wipes the saved game and loads the page again, so every system is built
   * fresh: the clock back to 1 March, the field unbroken, the starting kit.
   *
   * Writing is stopped first. The save is also written when the page goes
   * away, and a reload is the page going away — without the stop, the game
   * would write itself straight back over the empty save. The settings are
   * kept: they are how you like to play, not how far you have got.
   */
  private startOver(): void {
    this.forgotten = true;
    clearSave();
    window.location.reload();
  }

  /** Every step. Saving is cheap, but not sixty times a second cheap. */
  update(seconds: number): void {
    this.since += seconds;
    if (this.since < EVERY) return;
    this.since = 0;
    this.keep();
  }

  private keep(): void {
    if (this.forgotten) return;
    this.camera.getDirectionToRef(Vector3.Forward(), this.facing);
    writeSave({
      totalHours: this.dayNight.totalHours,
      held: this.weather.held ?? "auto",
      player: {
        x: this.bean.position.x,
        z: this.bean.position.z,
        yaw: Math.atan2(this.facing.x, this.facing.z),
      },
      tilled: tilledKeys(),
      carrying: this.carrying.saved,
      boarDeaths: boarDeaths(this.boars.all),
    });
  }
}
