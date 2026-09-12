import {
  dateAt,
  DAYS_PER_YEAR,
  FIRST_DAY_OF_GAME,
  HOURS_PER_DAY,
  type Season,
} from "../calendar/calendar";
import { hashed } from "./weatherNoise";

/**
 * Purple days: eight or nine a year, when the clouds turn pink and deep
 * purple and the whole day takes the colour. Mostly in spring and summer —
 * four in five of them — never two days running, and different days each
 * year. Never the game's opening day: a rare sky is a surprise, not a
 * first impression.
 */
const SEASON_WEIGHT: Readonly<Record<Season, number>> = {
  spring: 3,
  summer: 3,
  autumn: 1,
  winter: 0.5,
};

const byYear = new Map<number, ReadonlySet<number>>();
let cumulative: number[] | null = null;

export function isPurpleDay(day: number): boolean {
  const year = Math.floor(day / DAYS_PER_YEAR);
  let chosen = byYear.get(year);
  if (!chosen) {
    chosen = chooseDays(year);
    byYear.set(year, chosen);
  }
  return chosen.has(day - year * DAYS_PER_YEAR);
}

function chooseDays(year: number): ReadonlySet<number> {
  const weights = (cumulative ??= runningWeights());
  const total = weights[weights.length - 1] ?? 1;
  const count = hashed(year, 90) < 0.5 ? 8 : 9;
  const chosen = new Set<number>();
  for (let attempt = 0; chosen.size < count && attempt < 500; attempt += 1) {
    const target = hashed(year, 91, attempt) * total;
    const day = weights.findIndex((upTo) => upTo > target);
    if (day < 0 || chosen.has(day) || chosen.has(day - 1) || chosen.has(day + 1)) continue;
    if (year === 0 && day === FIRST_DAY_OF_GAME) continue;
    chosen.add(day);
  }
  return chosen;
}

/** Each day of the year's weight, added up as it goes, for drawing days in proportion. */
function runningWeights(): number[] {
  const sums: number[] = [];
  let sum = 0;
  for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
    sum += SEASON_WEIGHT[dateAt(day * HOURS_PER_DAY).season];
    sums.push(sum);
  }
  return sums;
}
