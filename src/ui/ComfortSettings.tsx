import { SETTINGS_LIMITS } from "../settings/gameSettings";
import { updateSettings } from "../settings/settingsStore";
import { useGameSettings } from "./useGameSettings";
import { SliderRow } from "./SliderRow";
import { ToggleRow } from "./ToggleRow";

export function ComfortSettings() {
  const settings = useGameSettings();

  return (
    <section className="menu__section">
      <h3 className="menu__heading">Comfort</h3>
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
      <SliderRow
        label="Head bob"
        value={settings.headBobStrength}
        {...SETTINGS_LIMITS.headBobStrength}
        format={(value) => (value === 0 ? "Off" : `${Math.round(value * 100)}%`)}
        onChange={(headBobStrength) => updateSettings({ headBobStrength })}
      />
      <ToggleRow
        label="Invert vertical look"
        value={settings.invertLook}
        onChange={(invertLook) => updateSettings({ invertLook })}
      />
    </section>
  );
}
