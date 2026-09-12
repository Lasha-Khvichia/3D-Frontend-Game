import type { WeatherKind } from "./weatherKinds";
import { hashed } from "./weatherNoise";
import { SHOWERY, THUNDERY } from "./weatherOdds";

/** Something falling from the sky, in hours from the day's midnight. May run past midnight. */
export type Spell = {
  readonly start: number;
  readonly end: number;
  readonly kind: WeatherKind;
  readonly hail: boolean;
};

/**
 * One or two spells. Summer rain comes as afternoon showers, sometimes a
 * storm; the rest of the year it is long, grey and steady.
 */
export function rainSpells(day: number, month: number, showery: boolean): Spell[] {
  const spells: Spell[] = [];
  const count = hashed(day, 8) < 0.7 ? 1 : 2;
  for (let i = 0; i < count; i += 1) {
    const draw = (salt: number): number => hashed(day, 10 + i * 5 + salt);
    if (showery) {
      const start = 12.5 + draw(0) * 6.5;
      const stormy = draw(2) < (THUNDERY[month] ?? 0) / Math.max(0.01, SHOWERY[month] ?? 0);
      const kind = stormy ? "thunderstorm" : draw(3) < 0.4 ? "downpour" : "rain";
      spells.push({ start, end: start + 0.6 + draw(1) * 2, kind, hail: stormy && draw(4) < 0.2 });
    } else {
      const start = draw(0) * 24;
      const kind = draw(2) < 0.45 ? "drizzle" : draw(2) < 0.9 ? "rain" : "downpour";
      spells.push({ start, end: start + 2 + draw(1) * 7, kind, hail: false });
    }
  }
  return spells;
}
