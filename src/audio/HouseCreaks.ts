import type { WeatherState } from "../world/weather/weatherState";
import { weatherBadness } from "./natureActivity";

/** The loudest a creak gets: a house settling, never a crash. */
const LOUDEST = 0.28;
/** Seconds between creaks in the worst weather, and in merely bad weather. */
const SOONEST = 4;
const LATEST = 25;
/** Share of the sounds that are a timber's knock rather than a long creak. */
const KNOCKS = 0.3;

/**
 * A house's timbers creaking in bad weather, heard only inside it: at random
 * times, sooner the worse the weather, each at a random strength and never
 * loud. A near strike shakes the house, and a creak soon follows its thunder.
 */
export class HouseCreaks {
  private next = 0;

  constructor(
    private readonly context: BaseAudioContext,
    private readonly into: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  update(inside: boolean, weather: Readonly<WeatherState>): void {
    const now = this.context.currentTime;
    const bad = weatherBadness(weather);
    if (!inside || bad <= 0) {
      // Stepping inside, the first creak comes a little later, not at the door.
      this.next = now + SOONEST * (0.5 + Math.random());
      return;
    }
    if (now < this.next) return;
    const strength = bad * (0.3 + 0.7 * Math.random());
    const place = this.context.createStereoPanner();
    place.pan.value = Math.random() * 1.4 - 0.7;
    place.connect(this.into);
    if (Math.random() < KNOCKS) this.knock(now, strength, place);
    else this.creak(now, strength, place);
    this.next = now + (LATEST - (LATEST - SOONEST) * bad) * (0.5 + Math.random());
  }

  /** A strike close by: a creak shortly after `at`, when its thunder arrives. */
  shake(at: number): void {
    this.next = Math.min(this.next, at + 0.3 + Math.random() * 0.8);
  }

  /** Wood rubbing on wood: a low buzz gliding through the timber's two resonances. */
  private creak(now: number, strength: number, into: AudioNode): void {
    const { context } = this;
    const length = 0.3 + Math.random() * 0.9;
    const rub = context.createOscillator();
    rub.type = "sawtooth";
    const from = 25 + Math.random() * 30;
    rub.frequency.setValueAtTime(from, now);
    rub.frequency.linearRampToValueAtTime(from * (0.7 + Math.random() * 0.6), now + length);
    const level = context.createGain();
    level.gain.setValueAtTime(0, now);
    level.gain.linearRampToValueAtTime(LOUDEST * strength, now + 0.08);
    level.gain.linearRampToValueAtTime(0, now + length);
    for (const [centre, q] of [
      [380, 6],
      [820, 5],
    ] as const) {
      const body = context.createBiquadFilter();
      body.type = "bandpass";
      body.frequency.value = centre * (0.8 + Math.random() * 0.4);
      body.Q.value = q;
      rub.connect(body).connect(level);
    }
    level.connect(into);
    rub.start(now);
    rub.stop(now + length + 0.05);
  }

  /** A beam settling: one dull knock. */
  private knock(now: number, strength: number, into: AudioNode): void {
    const { context } = this;
    const body = context.createBiquadFilter();
    body.type = "bandpass";
    body.frequency.value = 450 + Math.random() * 200;
    body.Q.value = 3;
    const level = context.createGain();
    level.gain.setValueAtTime(LOUDEST * strength * 3, now);
    level.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.connect(body).connect(level).connect(into);
    source.start(now, Math.random() * Math.max(0, this.noise.duration - 0.2));
    source.stop(now + 0.1);
  }
}
