import type { WeatherState } from "../world/weather/weatherState";
import { brownNoise, loopNoise } from "./noiseBuffers";

/** Metres a second below which the wind makes no sound worth hearing. */
const STILL = 2.5;
/** Wind this strong is as loud as it gets. */
const GALE = 18;
const LOUDEST = 0.6;
/** Seconds between gusts, at most. */
const GUST_EVERY = 5;

/**
 * Wind: low noise whose loudness and brightness rise with its speed, with
 * gusts that swell and die away rather than a steady hiss. Indoors it is a
 * muffled roar round the walls.
 */
export class WindSound {
  private readonly level: GainNode;
  private readonly tone: BiquadFilterNode;
  private gust = 0;
  private nextGust = 0;

  constructor(
    private readonly context: BaseAudioContext,
    into: AudioNode,
  ) {
    this.tone = context.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = 400;
    this.level = context.createGain();
    this.level.gain.value = 0;
    this.tone.connect(this.level).connect(into);
    loopNoise(context, brownNoise(context, 8), this.tone);
  }

  update(weather: Readonly<WeatherState>, indoors: boolean): void {
    const now = this.context.currentTime;
    if (now >= this.nextGust) {
      this.gust = Math.random();
      this.nextGust = now + 1.5 + Math.random() * GUST_EVERY;
    }
    const strength = Math.min(1, Math.max(0, (weather.wind - STILL) / (GALE - STILL)));
    const gusting = strength * (0.65 + 0.35 * this.gust);
    const loud = LOUDEST * gusting ** 1.3 * (indoors ? 0.35 : 1);
    this.level.gain.setTargetAtTime(loud, now, 1.2);
    const bright = (indoors ? 250 : 350) + (indoors ? 300 : 1100) * gusting;
    this.tone.frequency.setTargetAtTime(bright, now, 1.2);
  }
}
