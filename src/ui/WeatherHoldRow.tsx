import { WEATHER_KINDS, type WeatherKind } from "../world/weather/weatherKinds";
import { sendCommand } from "./bridge";
import { SliderRow } from "./SliderRow";

/** Auto, or any kind held for testing. Short names: the value column is narrow. */
const WEATHER_CHOICES = ["auto", ...WEATHER_KINDS] as const;
const WEATHER_LABELS: Record<(typeof WEATHER_CHOICES)[number], string> = {
  auto: "Auto",
  clear: "Clear",
  fair: "Fair",
  cloudy: "Cloudy",
  overcast: "Overcast",
  fog: "Fog",
  drizzle: "Drizzle",
  rain: "Rain",
  downpour: "Downpour",
  thunderstorm: "Storm",
  purple: "Purple",
};

/** For testing: hold any kind of weather, or leave it to the calendar. */
export function WeatherHoldRow({ held }: { held: WeatherKind | "auto" }) {
  return (
    <SliderRow
      label="Weather"
      value={WEATHER_CHOICES.indexOf(held)}
      min={0}
      max={WEATHER_CHOICES.length - 1}
      step={1}
      format={(index) => WEATHER_LABELS[WEATHER_CHOICES[index] ?? "auto"]}
      onChange={(index) =>
        sendCommand({ type: "set-weather", kind: WEATHER_CHOICES[index] ?? "auto" })
      }
    />
  );
}
