import type { RoadPoint } from "./routeOverLand";

/** Metres a corner may be cut by when the staircase is straightened out. */
const STRAIGHTEN = 7;
/** Metres between the points a smoothed road is drawn from. */
const EVERY = 14;

/**
 * Turns the route finder's staircase of squares into a road somebody would
 * walk: the needless corners taken out, and what is left rounded through a
 * curve rather than left as a set of turns.
 *
 * The curve is a Catmull-Rom spline, which passes through every point it is
 * given rather than near it — a road that misses the bridge it was routed to
 * is worse than a straight one.
 */
export function smoothRoad(path: readonly RoadPoint[]): RoadPoint[] {
  const corners = straighten(path, STRAIGHTEN);
  if (corners.length < 3) return [...corners];
  const smooth: RoadPoint[] = [];
  for (let index = 0; index + 1 < corners.length; index += 1) {
    const before = corners[Math.max(0, index - 1)]!;
    const from = corners[index]!;
    const to = corners[index + 1]!;
    const after = corners[Math.min(corners.length - 1, index + 2)]!;
    const steps = Math.max(1, Math.round(Math.hypot(to.x - from.x, to.z - from.z) / EVERY));
    for (let step = 0; step < steps; step += 1) {
      smooth.push(curveAt(before, from, to, after, step / steps));
    }
  }
  smooth.push(corners[corners.length - 1]!);
  return smooth;
}

/** Douglas-Peucker: drops every point that is within `slack` of the line it lies on. */
function straighten(path: readonly RoadPoint[], slack: number): RoadPoint[] {
  if (path.length < 3) return [...path];
  const first = path[0]!;
  const last = path[path.length - 1]!;
  let furthest = 0;
  let away = 0;
  for (let index = 1; index < path.length - 1; index += 1) {
    const gap = offLine(path[index]!, first, last);
    if (gap > away) [furthest, away] = [index, gap];
  }
  if (away <= slack) return [first, last];
  return [
    ...straighten(path.slice(0, furthest + 1), slack).slice(0, -1),
    ...straighten(path.slice(furthest), slack),
  ];
}

function offLine(point: RoadPoint, from: RoadPoint, to: RoadPoint): number {
  const alongX = to.x - from.x;
  const alongZ = to.z - from.z;
  const length = Math.hypot(alongX, alongZ);
  if (length < 1e-6) return Math.hypot(point.x - from.x, point.z - from.z);
  return Math.abs(alongZ * (point.x - from.x) - alongX * (point.z - from.z)) / length;
}

/** One point along the curve through four corners, `along` of the way from the second to the third. */
function curveAt(
  before: RoadPoint,
  from: RoadPoint,
  to: RoadPoint,
  after: RoadPoint,
  along: number,
): RoadPoint {
  const spline = (a: number, b: number, c: number, d: number): number => {
    const t = along;
    return (
      0.5 *
      (2 * b +
        (c - a) * t +
        (2 * a - 5 * b + 4 * c - d) * t * t +
        (3 * b - a - 3 * c + d) * t * t * t)
    );
  };
  return { x: spline(before.x, from.x, to.x, after.x), z: spline(before.z, from.z, to.z, after.z) };
}
