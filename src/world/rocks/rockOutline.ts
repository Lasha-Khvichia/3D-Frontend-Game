import { rockHeightAt } from "./rockHeight";
import type { RockShape } from "./rockShape";

/** Directions round a stone its outline is measured along. */
const SPOKES = 12;
/** The outline runs where the stone is this share of its full height. */
const BODY = 0.3;
/** Nothing of an outline comes closer to the middle than this. */
const LEAST = 0.12;

/**
 * The outline of a stone's body, and how tall that body is — the shape its
 * collider is built to.
 *
 * Measured where the stone stands at least 30% of its height, not at its full
 * reach. The last of the reach is a skirt a few centimetres thick, half of it
 * buried; a collider out there would stop the player in thin air.
 */
export function rockOutline(shape: RockShape): { points: [number, number][]; summit: number } {
  let summit = 0;
  for (let spoke = 0; spoke < SPOKES; spoke += 1) {
    for (let reach = 0; reach < shape.reach; reach += 0.05) {
      const angle = (spoke / SPOKES) * Math.PI * 2;
      summit = Math.max(
        summit,
        rockHeightAt(shape, Math.sin(angle) * reach, Math.cos(angle) * reach),
      );
    }
  }

  const points: [number, number][] = [];
  for (let spoke = 0; spoke < SPOKES; spoke += 1) {
    const angle = (spoke / SPOKES) * Math.PI * 2;
    let body = LEAST;
    for (let reach = LEAST; reach < shape.reach; reach += 0.05) {
      if (rockHeightAt(shape, Math.sin(angle) * reach, Math.cos(angle) * reach) >= summit * BODY)
        body = reach;
    }
    points.push([shape.x + Math.sin(angle) * body, shape.z + Math.cos(angle) * body]);
  }
  return { points, summit };
}
