import { SETTINGS_LIMITS, type QualityPreset, type ShadowQuality } from "../settings/gameSettings";
import { applyQualityPreset, updateSettings } from "../settings/settingsStore";
import { useGameSettings } from "./useGameSettings";
import { SliderRow } from "./SliderRow";
import { ToggleRow } from "./ToggleRow";
import { ChoiceRow } from "./ChoiceRow";

const PRESETS: readonly { value: QualityPreset; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "custom", label: "Custom" },
];

/** Off, low and high: the same three steps for shadows and for clouds. */
const LEVELS: readonly { value: ShadowQuality; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];

export function GraphicsSettings() {
  const settings = useGameSettings();

  return (
    <section className="menu__section">
      <h3 className="menu__heading">Graphics</h3>
      <ChoiceRow
        label="Quality"
        value={settings.qualityPreset}
        choices={PRESETS}
        onChange={applyQualityPreset}
      />
      <SliderRow
        label="Render resolution"
        value={settings.renderScale}
        {...SETTINGS_LIMITS.renderScale}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(renderScale) => updateSettings({ renderScale })}
      />
      <ToggleRow
        label="Auto resolution"
        value={settings.autoResolution}
        onChange={(autoResolution) => updateSettings({ autoResolution })}
      />
      <ToggleRow
        label="Sun rays and glare"
        value={settings.sunEffects}
        onChange={(sunEffects) => updateSettings({ sunEffects })}
      />
      <ChoiceRow
        label="Shadows"
        value={settings.shadowQuality}
        choices={LEVELS}
        onChange={(shadowQuality) => updateSettings({ shadowQuality })}
      />
      <ChoiceRow
        label="Clouds"
        value={settings.clouds}
        choices={LEVELS}
        onChange={(clouds) => updateSettings({ clouds })}
      />
    </section>
  );
}
