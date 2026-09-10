import type { Side } from "./houseBlueprint";
import { seedFromText } from "./seededRandom";

/**
 * The chimney climbs a gable end, which is how these houses were really built:
 * the stack goes up the wall the roof slopes down to, not through the middle
 * of the roof. Which end is the same for a given house on every load, and
 * differs between houses, so no street reads as one house repeated.
 */
export function chimneyWallFor(name: string, ridgeAxis: "x" | "z", doorWall: Side): Side {
  const [first, second]: readonly [Side, Side] =
    ridgeAxis === "x" ? ["east", "west"] : ["north", "south"];
  if (first === doorWall) return second;
  if (second === doorWall) return first;
  // Neither end is the door wall, so either will do. Picked from the name so
  // the stacks do not all end up on the same side of the street.
  return seedFromText(name) % 2 === 0 ? first : second;
}
