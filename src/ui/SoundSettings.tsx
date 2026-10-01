import { SETTINGS_LIMITS } from "../settings/gameSettings";
import { updateSettings } from "../settings/settingsStore";
import { useGameSettings } from "./useGameSettings";
import { SliderRow } from "./SliderRow";

/** One row today. Every sound in the game runs through this one gain. */
export function SoundSettings() {
  const settings = useGameSettings();

  return (
    <>
      <SliderRow
        label="Sound volume"
        value={settings.soundVolume}
        {...SETTINGS_LIMITS.soundVolume}
        format={(value) => (value === 0 ? "Off" : `${Math.round(value * 100)}%`)}
        onChange={(soundVolume) => updateSettings({ soundVolume })}
      />
    </>
  );
}
