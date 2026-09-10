import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import type { PlayerController } from "../player/PlayerController";
import type { DayNightCycle } from "../world/DayNightCycle";
import type { SunGodRays } from "../world/SunGodRays";
import { MAX_PIXEL_RATIO } from "../core/createEngine";
import { subscribeToCommands } from "../ui/bridge";
import { readSettings, subscribeToSettings } from "./settingsStore";
import type { GameSettings } from "./gameSettings";

export type SettingsTargets = {
  readonly engine: AbstractEngine;
  readonly camera: TargetCamera;
  readonly controller: PlayerController;
  readonly dayNight: DayNightCycle;
  readonly godRays: SunGodRays;
};

/**
 * Pushes the settings store into the running game, and handles the live
 * controls the menu sends that are not settings, such as jumping the clock.
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
    });
    this.apply(readSettings());
  }

  dispose(): void {
    this.unsubscribeSettings();
    this.unsubscribeCommands();
  }

  private apply(settings: GameSettings): void {
    const { engine, camera, controller, dayNight, godRays } = this.targets;

    // Babylon's fov is vertical and in radians.
    camera.fov = (settings.fieldOfView * Math.PI) / 180;
    controller.setLookSensitivity(settings.mouseSensitivity);
    controller.setInvertLook(settings.invertLook);
    controller.setHeadBobStrength(settings.headBobStrength);
    controller.setMoveSpeedScale(settings.travelSpeed);

    // Hardware scaling is the inverse of resolution, and it sits on top of the
    // device pixel ratio cap rather than replacing it.
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) * settings.renderScale;
    engine.setHardwareScalingLevel(1 / ratio);

    godRays.setEnabled(settings.sunEffects);
    dayNight.setSunEffectsVisible(settings.sunEffects);
    dayNight.setShadowQuality(settings.shadowQuality);
    dayNight.setClockFrozen(settings.clockFrozen);
  }
}
