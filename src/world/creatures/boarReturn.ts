import type { Boar } from "./Boar";

/** The hour a killed boar is back at its den: six in the morning, the next day. */
const BACK_AT_HOUR = 6;

/** The clock's hours when a boar killed at `diedAt` is back. */
export function returnsAt(diedAt: number): number {
  return (Math.floor(diedAt / 24) + 1) * 24 + BACK_AT_HOUR;
}

/**
 * Which boars are dead and not yet back, by id, with the hour each was killed.
 *
 * The one thing about the boars the save keeps: where a living boar wanders
 * is not worth remembering, but a den you cleared should still be empty when
 * you come back to the game the same evening.
 */
export function boarDeaths(boars: readonly Boar[]): Record<string, number> {
  const deaths: Record<string, number> = {};
  for (const boar of boars) if (boar.diedAt !== null) deaths[boar.id] = boar.diedAt;
  return deaths;
}

/** Lays the boars a save says are dead back down, out of sight, until their morning. */
export function restoreBoarDeaths(
  boars: readonly Boar[],
  deaths: Readonly<Record<string, number>>,
  hours: number,
  liesFor: number,
): void {
  for (const boar of boars) {
    const died = deaths[boar.id];
    if (died === undefined || hours >= returnsAt(died)) continue;
    boar.setMood("dead", 0);
    boar.moodTime = liesFor;
    boar.health = 0;
    boar.diedAt = died;
  }
}
