/** A straight run of road between two points on the map. */
export type RoadSegment = {
  readonly ax: number;
  readonly az: number;
  readonly bx: number;
  readonly bz: number;
  /** Metres from the middle to the edge. The village street is far wider than a country road. */
  readonly halfWidth?: number;
};

/** Metres: half the width of a road, and the band it fades to grass over. */
export const ROAD_HALF_WIDTH = 2.3;
export const ROAD_EDGE = 1.4;
/** Metres a side of one square of the index. A road segment is registered in every square it touches. */
const CELL = 24;

const squares = new Map<number, RoadSegment[]>();
let laid: readonly RoadSegment[] = [];

/**
 * Where the roads are, for everything that has to know: the ground's colour,
 * the grass that must keep off them, and the cobbles laid along the village
 * street.
 *
 * A module-level field, like the snow's, because the ground is built patch by
 * patch as the player walks and each patch asks this for every vertex —
 * threading a road through that would mean plumbing it through the terrain,
 * the detail tree and the patch builder for nothing.
 */
export const roadField = {
  get segments(): readonly RoadSegment[] {
    return laid;
  },
};

/** Puts a network of roads down, replacing whatever was there. */
export function layRoads(segments: readonly RoadSegment[]): void {
  laid = segments;
  squares.clear();
  for (const segment of segments) {
    const reach = (segment.halfWidth ?? ROAD_HALF_WIDTH) + ROAD_EDGE;
    const fromX = Math.floor((Math.min(segment.ax, segment.bx) - reach) / CELL);
    const toX = Math.floor((Math.max(segment.ax, segment.bx) + reach) / CELL);
    const fromZ = Math.floor((Math.min(segment.az, segment.bz) - reach) / CELL);
    const toZ = Math.floor((Math.max(segment.az, segment.bz) + reach) / CELL);
    for (let x = fromX; x <= toX; x += 1) {
      for (let z = fromZ; z <= toZ; z += 1) {
        const key = x * 65536 + z;
        const here = squares.get(key);
        if (here) here.push(segment);
        else squares.set(key, [segment]);
      }
    }
  }
}

/**
 * How much of a road is under this spot: 1 on the worn middle, fading to 0
 * over its edge, and 0 everywhere else.
 */
export function roadShareAt(x: number, z: number): number {
  const near = squares.get(Math.floor(x / CELL) * 65536 + Math.floor(z / CELL));
  if (!near) return 0;
  let most = 0;
  for (const segment of near) {
    const half = segment.halfWidth ?? ROAD_HALF_WIDTH;
    const away = awayFrom(segment, x, z);
    if (away >= half + ROAD_EDGE) continue;
    const share = away <= half ? 1 : 1 - (away - half) / ROAD_EDGE;
    if (share > most) most = share;
    if (most >= 1) return 1;
  }
  return most;
}

/** Metres from a point to the nearest part of a segment. */
export function awayFrom(segment: RoadSegment, x: number, z: number): number {
  const alongX = segment.bx - segment.ax;
  const alongZ = segment.bz - segment.az;
  const length = alongX * alongX + alongZ * alongZ;
  const toX = x - segment.ax;
  const toZ = z - segment.az;
  const along = length > 0 ? Math.min(1, Math.max(0, (toX * alongX + toZ * alongZ) / length)) : 0;
  return Math.hypot(toX - alongX * along, toZ - alongZ * along);
}
