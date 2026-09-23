import { DAYS_PER_YEAR } from "../calendar/calendar";

/** A day of the year and the value on that day. */
export type Keyframe = readonly [day: number, value: number];

/**
 * Reads a value off a ring of keyframes, eased between them.
 *
 * The frames must be in order and go all the way round: the last leads back
 * to the first across New Year. Every seasonal change is written this way
 * rather than as a step at a month's end, because a wood does not come into
 * leaf overnight — and because the player can jump the clock to any date and
 * must never see the world snap.
 */
export function yearCurve(frames: readonly Keyframe[], dayOfYear: number): number {
  for (let index = 0; index < frames.length; index += 1) {
    const [from, before] = frames[index]!;
    const [to, after] = frames[(index + 1) % frames.length]!;
    const span = wrapDays(to - from);
    const along = wrapDays(dayOfYear - from);
    if (along > span) continue;
    const t = span === 0 ? 1 : along / span;
    return before + (after - before) * t * t * (3 - 2 * t);
  }
  return frames[0]?.[1] ?? 0;
}

/** Days counted forward round the year, 0 to 364. */
export function wrapDays(days: number): number {
  return ((days % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR;
}
