import { ROUTE_CELL, type RoadCountry } from "./roadCountry";

/** The grade a road is happy with, and how hard it is charged for anything steeper. */
const COMFORTABLE = 0.09;
const STEEP_COST = 9;
/** Past this grade a road all but refuses to climb. */
const A_CLIFF = 0.32;
const CLIFF_COST = 12;
/** What a road pays to run along a riverbank rather than back from it. */
const SHORE_COST = 2.5;
/** Metres of height above which a road starts preferring the low ground, and by how much. */
const HIGH_GROUND = 45;
const HIGH_COST = 2.5;

/** What one step costs: its length, what it climbs, and how high it leaves you. */
export function stepCost(country: RoadCountry, from: number, to: number, corner: boolean): number {
  const run = corner ? ROUTE_CELL * Math.SQRT2 : ROUTE_CELL;
  const rise = Math.abs((country.height[to] ?? 0) - (country.height[from] ?? 0));
  const grade = rise / run;
  let cost = run * (1 + STEEP_COST * (grade / COMFORTABLE) ** 2);
  if (grade > A_CLIFF) cost *= CLIFF_COST;
  if (country.shore[to] && !country.bridged[to]) cost *= SHORE_COST;
  const high = Math.max(0, country.height[to] ?? 0) / HIGH_GROUND;
  return cost * (1 + HIGH_COST * high * high);
}
