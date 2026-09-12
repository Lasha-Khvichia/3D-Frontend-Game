import type { AutoResolution } from "../core/AutoResolution";
import type { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import type { PlayerController } from "../player/PlayerController";
import type { DayNightCycle } from "../world/DayNightCycle";
import type { SunGodRays } from "../world/SunGodRays";
import type { WorldStreaming } from "../world/WorldStreaming";
import type { Sky } from "../world/sky/Sky";
import type { WetGround } from "../world/weather/wet/WetGround";
import type { Weather } from "../world/weather/Weather";
import { MAX_PIXEL_RATIO } from "../core/createEngine";
import { publishStats, subscribeToCommands } from "../ui/bridge";
import { readSettings, subscribeToSettings } from "./settingsStore";
import type { GameSettings } from "./gameSettings";

export type SettingsTargets = {
  readonly resolution: AutoResolution;
  readonly camera: TargetCamera;
  readonly controller: PlayerController;
  readonly dayNight: DayNightCycle;
  readonly godRays: SunGodRays;
  readonly streaming: WorldStreaming;
  readonly sky: Sky;
  readonly weather: Weather;
  readonly wet: WetGround;
};

/**
 * Pushes the settings store into the running game, and handles the live
 * controls the menu sends that are not settings, such as jumping the clock or
 * the date.
 *
 * Everything here is one-way: the menu writes, the game reads. Nothing in the
 * game writes back into settings.
 */
export class SettingsBinder {
  private readonly unsubscribeSettings: () => void;
  private readonly unsubscribeCommands: () => void;

  constructor(private readonly targets: SettingsTargets) {
    this.unsubscribeSettings = subscribeToSettings(() => this.apply(readSettings()));
    this.unsubscribeCommands = subscribeToCommands((command) => {
      if (command.type === "set-time-of-day") targets.dayNight.setTimeOfDay(command.hour);
      else if (command.type === "set-date") targets.dayNight.setDayOfYear(command.dayOfYear);
      else if (command.type === "set-weather") {
        targets.weather.force(command.kind === "auto" ? null : command.kind);
        publishStats({ weatherHeld: command.kind });
      } else return;
      // The menu is open, so the game is paused: the weather and the sky must
      // follow now, not on resume.
      targets.weather.update(targets.dayNight.totalHours);
      targets.wet.update(targets.dayNight.totalHours, 0);
      targets.dayNight.refresh();
      targets.sky.repaint();
    });
    this.apply(readSettings());
  }

  dispose(): void {
    this.unsubscribeSettings();
    this.unsubscribeCommands();
  }

  private apply(settings: GameSettings): void {
    const { resolution, camera, controller, dayNight, godRays, streaming, sky } = this.targets;

    // Babylon's fov is vertical and in radians.
    camera.fov = (settings.fieldOfView * Math.PI) / 180;
    controller.setLookSensitivity(settings.mouseSensitivity);
    controller.setInvertLook(settings.invertLook);
    controller.setHeadBobStrength(settings.headBobStrength);
    controller.setMoveSpeedScale(settings.travelSpeed);
    streaming.setRenderDistance(settings.renderDistance);

    // Hardware scaling is the inverse of resolution, and it sits on top of the
    // device pixel ratio cap rather than replacing it.
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) * settings.renderScale;
    resolution.configure(ratio, settings.autoResolution);

    godRays.setEnabled(settings.sunEffects);
    dayNight.setSunEffectsVisible(settings.sunEffects);
    dayNight.setShadowQuality(settings.shadowQuality);
    sky.setQuality(settings.clouds);
    dayNight.setClockFrozen(settings.clockFrozen);
  }
}
