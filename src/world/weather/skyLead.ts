import { blendLooks } from "./blendLooks";
import { kindAt, type WeatherMoment } from "./sampleWeather";
import { KIND_LOOKS, type WeatherKind, type WeatherLook } from "./weatherKinds";

/** Game hours ahead the sky shows what is coming: three, so it is black before the first drop. */
const LEAD_HOURS = 3;

/**
 * Clouds gather before the rain. The sky's cover and darkness are the heavier
 * of now and three hours on, so black cloud builds up before the first drop,
 * and clears only once the rain has gone — never before it stops.
 */
export class SkyLead {
  private readonly moment: WeatherMoment = { kind: "clear", hail: false };
  private readonly looks: WeatherLook[] = [0, 1, 2, 3].map(() => KIND_LOOKS.clear);
  private readonly ahead: WeatherLook = { ...KIND_LOOKS.clear };

  /** Raises `state`'s cover and darkness to the sky's three hours on, where that is heavier. */
  apply(totalHours: number, held: WeatherKind | null, state: WeatherLook): void {
    const later = totalHours + LEAD_HOURS;
    const hour = Math.floor(later);
    for (let i = 0; i < 4; i += 1) {
      this.looks[i] = KIND_LOOKS[held ?? kindAt(hour - 1 + i, this.moment).kind];
    }
    blendLooks(this.looks, later - hour, this.ahead);
    state.cover = Math.max(state.cover, this.ahead.cover);
    state.darkness = Math.max(state.darkness, this.ahead.darkness);
  }
}
