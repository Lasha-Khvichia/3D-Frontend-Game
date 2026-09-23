import { grassBeside, type GrassBlocker } from "../grassBlockers";
import { awayFrom, ROAD_HALF_WIDTH, type RoadSegment } from "./roadField";

/**
 * Metres of road one blocker covers. A road is chopped into short pieces
 * because a blocker is found by its box: one box round a kilometre of
 * diagonal road would be asked about by half the grass on the island.
 */
const PIECE = 20;

/** Keeps the grass off the roads, thinning at their edges as it does beside a wall. */
export function roadGrassBlockers(segments: readonly RoadSegment[]): GrassBlocker[] {
  const blockers: GrassBlocker[] = [];
  for (const segment of segments) {
    const half = segment.halfWidth ?? ROAD_HALF_WIDTH;
    const length = Math.hypot(segment.bx - segment.ax, segment.bz - segment.az);
    const pieces = Math.max(1, Math.ceil(length / PIECE));
    for (let piece = 0; piece < pieces; piece += 1) {
      const from = piece / pieces;
      const to = (piece + 1) / pieces;
      const part: RoadSegment = {
        ax: segment.ax + (segment.bx - segment.ax) * from,
        az: segment.az + (segment.bz - segment.az) * from,
        bx: segment.ax + (segment.bx - segment.ax) * to,
        bz: segment.az + (segment.bz - segment.az) * to,
      };
      blockers.push(blockerFor(part, half));
    }
  }
  return blockers;
}

function blockerFor(part: RoadSegment, half: number): GrassBlocker {
  const reach = half + 0.5;
  return {
    bounds: {
      minX: Math.min(part.ax, part.bx) - reach,
      maxX: Math.max(part.ax, part.bx) + reach,
      minZ: Math.min(part.az, part.bz) - reach,
      maxZ: Math.max(part.az, part.bz) + reach,
    },
    grassLeftAt: (x, z) => grassBeside(awayFrom(part, x, z) - half),
  };
}
