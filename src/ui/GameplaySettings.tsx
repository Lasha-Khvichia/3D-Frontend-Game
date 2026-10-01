import { SETTINGS_LIMITS } from "../settings/gameSettings";
import { updateSettings } from "../settings/settingsStore";
import { useGameSettings } from "./useGameSettings";
import { SliderRow } from "./SliderRow";
import { ToggleRow } from "./ToggleRow";

/** How the game feels to play: the view, the mouse, the walk. */
export function GameplaySettings() {
  const settings = useGameSettings();

  return (
    <>
      <SliderRow
        label="Field of view"
        value={settings.fieldOfView}
        {...SETTINGS_LIMITS.fieldOfView}
        format={(value) => `${value.toFixed(0)}°`}
        onChange={(fieldOfView) => updateSettings({ fieldOfView })}
      />
      <SliderRow
        label="Mouse sensitivity"
        value={settings.mouseSensitivity}
        {...SETTINGS_LIMITS.mouseSensitivity}
        format={(value) => `${value.toFixed(2)}x`}
        onChange={(mouseSensitivity) => updateSettings({ mouseSensitivity })}
      />
      <ToggleRow
        label="Invert vertical look"
        value={settings.invertLook}
        onChange={(invertLook) => updateSettings({ invertLook })}
      />
      <SliderRow
        label="Head bob"
        value={settings.headBobStrength}
        {...SETTINGS_LIMITS.headBobStrength}
        format={(value) => (value === 0 ? "Off" : `${Math.round(value * 100)}%`)}
        onChange={(headBobStrength) => updateSettings({ headBobStrength })}
      />
      <SliderRow
        label="Travel speed"
        value={settings.travelSpeed}
        {...SETTINGS_LIMITS.travelSpeed}
        format={(value) => `${value.toFixed(1)}x`}
        onChange={(travelSpeed) => updateSettings({ travelSpeed })}
      />
    </>
  );
}
