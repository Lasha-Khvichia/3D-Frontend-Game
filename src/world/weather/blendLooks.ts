import type { WeatherLook } from "./weatherKinds";

const LOOK_KEYS = ["cover", "darkness", "visibility", "precipitation", "purple", "wind"] as const;

/**
 * A cubic B-spline through four hour marks' looks — the hour before, this
 * one, the next and the one after — `t` of the way from this to the next.
 * It never overshoots, and spreads a change over about three hours: a clear
 * sky takes two real minutes to cloud over, not one. Writes into `out`.
 */
export function blendLooks(looks: readonly WeatherLook[], t: number, out: WeatherLook): void {
  const a = looks[0];
  const b = looks[1];
  const c = looks[2];
  const d = looks[3];
  if (!a || !b || !c || !d) return;
  const wa = (1 - t) ** 3;
  const wb = 3 * t ** 3 - 6 * t * t + 4;
  const wc = -3 * t ** 3 + 3 * t * t + 3 * t + 1;
  const wd = t ** 3;
  for (const key of LOOK_KEYS)
    out[key] = (wa * a[key] + wb * b[key] + wc * c[key] + wd * d[key]) / 6;
}
