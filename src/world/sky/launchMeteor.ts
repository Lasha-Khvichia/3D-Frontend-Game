import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type Meteor = { from: Vector3; to: Vector3; age: number; life: number; bright: number };

/**
 * A new shooting star: starting 23 to 69 degrees up at any bearing, a short
 * straight streak of 8 to 20 degrees, gone in half a second to a second.
 */
export function launchMeteor(random: () => number): Meteor {
  const up = 0.4 + random() * 0.8;
  const bearing = random() * Math.PI * 2;
  const from = new Vector3(
    Math.sin(bearing) * Math.cos(up),
    Math.sin(up),
    Math.cos(bearing) * Math.cos(up),
  );
  const across = Vector3.Cross(
    from,
    new Vector3(random() - 0.5, random() - 0.5, random() - 0.5),
  ).normalize();
  const length = 0.14 + random() * 0.2;
  const to = from.scale(Math.cos(length)).addInPlace(across.scale(Math.sin(length)));
  return { from, to, age: 0, life: 0.5 + random() * 0.6, bright: 0.8 + random() * 1.4 };
}
