import { HOURS_PER_DAY } from "../calendar/calendar";
import { halfDayHours, SOLAR_NOON_HOUR } from "../celestialPath";
import { planFor, type DayPlan } from "./dayPlans";
import type { Spell } from "./rainSpells";
import type { WeatherKind } from "./weatherKinds";
import { hashed } from "./weatherNoise";

export type WeatherMoment = { kind: WeatherKind; hail: boolean };

/**
 * What the sky is doing at an hour: rain first, then morning fog, then the
 * dry sky — clearer on summer mornings, cumulus by the afternoon, and
 * clouding over for two hours before rain and one after.
 */
export function kindAt(totalHours: number, out: WeatherMoment): WeatherMoment {
  const day = Math.floor(totalHours / HOURS_PER_DAY);
  const hour = totalHours - day * HOURS_PER_DAY;
  const today = planFor(day);
  out.hail = false;
  out.kind = "purple";
  if (today.purple) return out;
  const yesterday = day > 0 ? planFor(day - 1).spells : [];
  const spell = spellAt(today.spells, hour) ?? spellAt(yesterday, hour + HOURS_PER_DAY);
  if (spell) {
    out.kind = spell.kind;
    out.hail = spell.hail;
    return out;
  }
  out.kind = "fog";
  if (hour < today.fogUntil) return out;
  const afternoon = Math.max(0, 1 - ((hour - 15) / 5) ** 2);
  let cloud = today.cloudiness * (1 - 0.45 * today.convection * (1 - afternoon));
  if (rainNear(today, hour) || rainNear(planFor(day + 1), hour - HOURS_PER_DAY)) {
    cloud = Math.max(cloud, 0.85);
  }
  out.kind = cloud < 0.18 ? "clear" : cloud < 0.42 ? "fair" : cloud < 0.72 ? "cloudy" : "overcast";
  return out;
}

function spellAt(spells: readonly Spell[], hour: number): Spell | undefined {
  return spells.find((spell) => hour >= spell.start && hour < spell.end);
}

function rainNear(plan: DayPlan, hour: number): boolean {
  return plan.spells.some((spell) => hour >= spell.start - 2 && hour < spell.end + 1);
}

/** Ground mist: forms through the small hours of a misty day, thickest at dawn, burnt off after. */
export function mistAt(totalHours: number): number {
  const day = Math.floor(totalHours / HOURS_PER_DAY);
  if (!planFor(day).misty) return 0;
  const hour = totalHours - day * HOURS_PER_DAY;
  const sunrise = SOLAR_NOON_HOUR - halfDayHours(day * HOURS_PER_DAY + SOLAR_NOON_HOUR);
  const lifts = 1.5 + hashed(day, 30) * 1.5;
  if (hour < sunrise - 4 || hour > sunrise + lifts) return 0;
  const t = hour <= sunrise ? (hour - sunrise + 4) / 4 : 1 - (hour - sunrise) / lifts;
  return t * t * (3 - 2 * t);
}
