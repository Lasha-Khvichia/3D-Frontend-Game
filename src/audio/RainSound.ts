import type { WeatherState } from "../world/weather/weatherState";
import { loopNoise, whiteNoise } from "./noiseBuffers";

/** Seconds a change of rain takes to be heard, so a shower fades in rather than switching on. */
const EASE = 0.6;
/** How loud the heaviest rain is, out in the open. */
const LOUDEST = 0.5;
/** Under a roof the rain is on the tiles: duller, and a little quieter. */
const OUTDOOR_TOP = 7500;
const INDOOR_TOP = 900;
const INDOOR_SHARE = 0.6;

/**
 * Rain as it sounds: noise, cut below 400 Hz so it hisses rather than roars,
 * and rounded off above. Hail is harder and brighter, sleet softer, snow
 * silent. Indoors the top is taken off, the way a roof does.
 */
export class RainSound {
  private readonly level: GainNode;
  private readonly top: BiquadFilterNode;

  constructor(
    private readonly context: BaseAudioContext,
    into: AudioNode,
  ) {
    const bottom = context.createBiquadFilter();
    bottom.type = "highpass";
    bottom.frequency.value = 400;
    this.top = context.createBiquadFilter();
    this.top.type = "lowpass";
    this.top.frequency.value = OUTDOOR_TOP;
    this.level = context.createGain();
    this.level.gain.value = 0;
    bottom.connect(this.top).connect(this.level).connect(into);
    loopNoise(context, whiteNoise(context, 4), bottom);
  }

  update(weather: Readonly<WeatherState>, indoors: boolean): void {
    const now = this.context.currentTime;
    const hardness = weather.form === "hail" ? 1.4 : weather.form === "sleet" ? 0.6 : 1;
    const falling = weather.form === "snow" || weather.form === "none" ? 0 : weather.precipitation;
    const loud = LOUDEST * falling ** 0.7 * hardness * (indoors ? INDOOR_SHARE : 1);
    this.level.gain.setTargetAtTime(loud, now, EASE);
    const top = indoors ? INDOOR_TOP : OUTDOOR_TOP * (weather.form === "hail" ? 1.3 : 1);
    this.top.frequency.setTargetAtTime(top, now, EASE);
  }
}
