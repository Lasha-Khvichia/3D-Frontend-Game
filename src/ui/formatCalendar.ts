import {
  dateAt,
  HOURS_PER_DAY,
  MONTHS,
  type CalendarDate,
  type Season,
} from "../world/calendar/calendar";

/** 13.5 becomes "13:30". */
export function formatClock(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.floor((hours - whole) * 60);
  return `${pad(whole)}:${pad(minutes)}`;
}

/** "14 March, Year 1". */
export function formatDate(date: CalendarDate): string {
  return `${date.dayOfMonth} ${MONTHS[date.month]?.name ?? ""}, Year ${date.year}`;
}

/** Day 171 of the year becomes "21 June". */
export function formatDayOfYear(dayOfYear: number): string {
  const date = dateAt(dayOfYear * HOURS_PER_DAY);
  return `${date.dayOfMonth} ${MONTHS[date.month]?.name ?? ""}`;
}

/** Day 171 of the year becomes "21 Jun", for narrow places such as the menu. */
export function formatDayOfYearShort(dayOfYear: number): string {
  const date = dateAt(dayOfYear * HOURS_PER_DAY);
  return `${date.dayOfMonth} ${MONTHS[date.month]?.name.slice(0, 3) ?? ""}`;
}

/** "Spring". */
export function formatSeason(season: Season): string {
  return `${season.charAt(0).toUpperCase()}${season.slice(1)}`;
}

/** Whole degrees, with a real minus sign: "−4 °C". */
export function formatTemperature(celsius: number): string {
  const rounded = Math.round(celsius);
  return `${rounded < 0 ? "−" : ""}${Math.abs(rounded)} °C`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
