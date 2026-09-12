import { SETTINGS_LIMITS } from "../settings/gameSettings";
import { updateSettings } from "../settings/settingsStore";
import { dateAt, DAYS_PER_YEAR, HOURS_PER_DAY } from "../world/calendar/calendar";
import { sendCommand } from "./bridge";
import { useGameSettings } from "./useGameSettings";
import { useGameStats } from "./useGameStats";
import { SliderRow } from "./SliderRow";
import { ToggleRow } from "./ToggleRow";
import { formatClock, formatDayOfYearShort } from "./formatCalendar";
import { WeatherHoldRow } from "./WeatherHoldRow";

import { SeasonDot } from "./SeasonDot";

/** "21 Jun" after a dot in the season's colour. */
function formatDateSetting(dayOfYear: number) {
  return (
    <>
      <SeasonDot season={dateAt(dayOfYear * HOURS_PER_DAY).season} />
      {formatDayOfYearShort(dayOfYear)}
    </>
  );
}

export function WorldSettings() {
  const settings = useGameSettings();
  const { timeOfDayHours, date, weatherHeld } = useGameStats();

  return (
    <section className="menu__section">
      <h3 className="menu__heading">World</h3>
      <SliderRow
        label="Date"
        value={date.dayOfYear}
        min={0}
        max={DAYS_PER_YEAR - 1}
        step={1}
        format={formatDateSetting}
        onChange={(dayOfYear) => sendCommand({ type: "set-date", dayOfYear })}
      />
      <SliderRow
        label="Time of day"
        value={timeOfDayHours}
        min={0}
        max={24}
        step={0.25}
        format={formatClock}
        onChange={(hour) => sendCommand({ type: "set-time-of-day", hour })}
      />
      <WeatherHoldRow held={weatherHeld} />
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
      <SliderRow
        label="Render distance"
        value={settings.renderDistance}
        {...SETTINGS_LIMITS.renderDistance}
        format={(value) => `${value} m`}
        onChange={(renderDistance) => updateSettings({ renderDistance })}
      />
    </section>
  );
}
