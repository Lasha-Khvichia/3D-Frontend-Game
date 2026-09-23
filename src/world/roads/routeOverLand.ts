import { CostQueue } from "./costQueue";
import { placeOf, ROUTE_CELL, type RoadCountry } from "./roadCountry";
import { cellAt, freeCellNear } from "./nearestFreeCell";
import { stepCost } from "./roadStepCost";

/** A place a road passes through. */
export type RoadPoint = { readonly x: number; readonly z: number };

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

/**
 * The way a road takes over the island: the cheapest walk from one place to
 * another, where cheap means level and low.
 *
 * Climbing is charged by the square of the grade, so a road takes a long way
 * round a hill rather than a short way over it, and high ground costs more
 * whatever its slope, which keeps roads in the valleys where people put them.
 * Deep water is closed to it except on a bridge.
 */
export function routeOverLand(
  country: RoadCountry,
  from: RoadPoint,
  to: RoadPoint,
): RoadPoint[] | null {
  const { cells } = country;
  const start = freeCellNear(country, from);
  const goal = freeCellNear(country, to);
  if (start < 0 || goal < 0) return null;

  const spent = new Float32Array(cells * cells).fill(Infinity);
  const cameFrom = new Int32Array(cells * cells).fill(-1);
  const done = new Uint8Array(cells * cells);
  const queue = new CostQueue();
  spent[start] = 0;
  queue.push(start, 0);

  while (!queue.isEmpty) {
    const here = queue.take();
    if (here === goal) return pathTo(country, cameFrom, goal);
    if (done[here]) continue;
    done[here] = 1;
    const column = here % cells;
    const row = (here - column) / cells;
    for (const [alongX, alongZ] of STEPS) {
      const next = cellAt(country, column + alongX, row + alongZ);
      if (next < 0 || country.blocked[next] || done[next]) continue;
      const total =
        (spent[here] ?? Infinity) + stepCost(country, here, next, alongX !== 0 && alongZ !== 0);
      if (total >= (spent[next] ?? Infinity)) continue;
      spent[next] = total;
      cameFrom[next] = here;
      queue.push(next, total + straightTo(country, next, goal));
    }
  }
  return null;
}

/** The cheapest a walk to the goal could possibly be: its plain length. */
function straightTo(country: RoadCountry, from: number, goal: number): number {
  const { cells } = country;
  const fromColumn = from % cells;
  const goalColumn = goal % cells;
  const fromRow = (from - fromColumn) / cells;
  const goalRow = (goal - goalColumn) / cells;
  return Math.hypot(fromColumn - goalColumn, fromRow - goalRow) * ROUTE_CELL;
}

function pathTo(country: RoadCountry, cameFrom: Int32Array, goal: number): RoadPoint[] {
  const { cells } = country;
  const back: RoadPoint[] = [];
  for (let step = goal; step >= 0; step = cameFrom[step] ?? -1) {
    const column = step % cells;
    back.push({ x: placeOf(column), z: placeOf((step - column) / cells) });
  }
  return back.reverse();
}
