import { dateAt, HOURS_PER_DAY, MONTHS } from "../calendar/calendar";
import { hashed } from "./weatherNoise";
import {
  FOG_DAYS,
  MISTY,
  SHOWERY,
  SUNSHINE,
  WET_AFTER_WET,
  WET_DAYS,
  wetAfterDry,
} from "./weatherOdds";
import { rainSpells, type Spell } from "./rainSpells";
import { isPurpleDay } from "./purpleDays";

/** What one day brings, decided the same way every time. */
export type DayPlan = {
  /** The dry sky's cloud, 0 to 1, around the month's usual. */
  readonly cloudiness: number;
  /** How much a warm afternoon builds cloud: summer's cumulus, 0 in winter. */
  readonly convection: number;
  readonly spells: readonly Spell[];
  /** Hour the morning fog lifts: 0 for none, 24 for fog all day. */
  readonly fogUntil: number;
  /** A clear, calm night that ends in ground mist. */
  readonly misty: boolean;
  readonly purple: boolean;
};

const plans: DayPlan[] = [];
const wetChain: boolean[] = [];

/** The plan for a day, counted from 1 January of Year 1. */
export function planFor(day: number): DayPlan {
  const index = Math.max(0, Math.floor(day));
  return (plans[index] ??= makePlan(index));
}

/**
 * Wet or dry, one day after another. Each day depends on the one before, so
 * the chain is walked from the first day; it is kept, and walking a year of
 * it takes well under a millisecond.
 */
function isWetDay(day: number): boolean {
  for (let d = wetChain.length; d <= day; d += 1) {
    const { month } = dateAt(d * HOURS_PER_DAY);
    const chance = wetChain[d - 1] ? WET_AFTER_WET : wetAfterDry(month, MONTHS[month]?.days ?? 30);
    wetChain.push(hashed(d, 1) < chance);
  }
  return wetChain[day] ?? false;
}

function makePlan(day: number): DayPlan {
  const { month } = dateAt(day * HOURS_PER_DAY);
  const days = MONTHS[month]?.days ?? 30;
  const purple = isPurpleDay(day);
  const wet = isWetDay(day) && !purple;
  const showery = hashed(day, 2) < (SHOWERY[month] ?? 0);
  // Cloud is mostly one thing or the other: bright days or grey ones. Dry
  // days are bright often enough that, with the wet days grey, the month's
  // sunshine comes out as Kyiv's.
  const wetShare = (WET_DAYS[month] ?? 12) / days;
  const brightChance = Math.min(0.95, (SUNSHINE[month] ?? 0.4) / Math.max(0.05, 1 - wetShare));
  const bright = hashed(day, 3) < brightChance;
  let cloudiness = bright ? hashed(day, 9) * 0.4 : 0.55 + hashed(day, 9) * 0.45;
  if (wet) cloudiness = Math.max(cloudiness, showery ? 0.45 : 0.75);
  const foggy = !purple && hashed(day, 4) < (FOG_DAYS[month] ?? 2) / days;
  const allDay = hashed(day, 5) < 0.3 && (month >= 10 || month <= 1);
  return {
    cloudiness,
    convection: SHOWERY[month] ?? 0,
    spells: wet ? rainSpells(day, month, showery) : [],
    fogUntil: foggy ? (allDay ? 24 : 8.5 + hashed(day, 6) * 3.5) : 0,
    misty: !foggy && !wet && cloudiness < 0.5 && hashed(day, 7) < (MISTY[month] ?? 0.2),
    purple,
  };
}
