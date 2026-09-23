/**
 * How bright a fire is at a moment, around 0.82 of its full strength.
 *
 * Two waves at unrelated speeds. One would read as a pulse; two never repeat
 * often enough for the eye to catch the pattern.
 */
export function fireFlicker(seconds: number): number {
  return 0.82 + 0.1 * Math.sin(seconds * 11.3) + 0.08 * Math.sin(seconds * 4.1);
}
