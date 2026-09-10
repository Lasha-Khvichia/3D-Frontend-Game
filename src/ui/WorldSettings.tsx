import { SETTINGS_LIMITS } from "../settings/gameSettings";
import { updateSettings } from "../settings/settingsStore";
import { sendCommand } from "./bridge";
import { useGameSettings } from "./useGameSettings";
import { useGameStats } from "./useGameStats";
import { SliderRow } from "./SliderRow";
import { ToggleRow } from "./ToggleRow";

function formatClock(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.floor((hours - whole) * 60);
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function WorldSettings() {
  const settings = useGameSettings();
  const { timeOfDayHours } = useGameStats();

  return (
    <section className="menu__section">
      <h3 className="menu__heading">World</h3>
      <SliderRow
        label="Time of day"
        value={timeOfDayHours}
        min={0}
        max={24}
        step={0.25}
        format={formatClock}
        onChange={(hour) => sendCommand({ type: "set-time-of-day", hour })}
      />
      <ToggleRow
        label="Clock"
        value={settings.clockFrozen}
        onLabel="Frozen"
        offLabel="Running"
        onChange={(clockFrozen) => updateSettings({ clockFrozen })}
      />
      <SliderRow
        label="Travel speed"
        value={settings.travelSpeed}
        {...SETTINGS_LIMITS.travelSpeed}
        format={(value) => `${value.toFixed(1)}x`}
        onChange={(travelSpeed) => updateSettings({ travelSpeed })}
      />
    </section>
  );
}
