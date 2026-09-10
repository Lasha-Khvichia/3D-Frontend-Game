import { createNoise2D } from "../noise2d";
import type { RiverCourse } from "./riverCourses";

/** Distance between neighbouring points on a traced river. The grid's own spacing. */
export const TRACE_STEP = 4;
/** How far a river swings off its straight course, and over what distance. */
const MEANDER_METRES = 22;
const MEANDER_WAVELENGTH = 190;

const meander = createNoise2D(907);

/** One point on a river: where it is, and which way the water is flowing. */
export type RiverPoint = {
  readonly x: number;
  readonly z: number;
  /** Unit direction of flow. */
  readonly flowX: number;
  readonly flowZ: number;
  /** Share of the way from source to mouth, 0 to 1. */
  readonly along: number;
};

/**
 * Turns a course's handful of points into a river every four metres, curving
 * smoothly through them and swinging gently from side to side.
 *
 * The curve is Catmull-Rom, which passes through every point it is given — so
 * the course is exactly where it was drawn — and the swing fades out at both
 * ends, so the source stays on its mountain and the mouth stays in the sea.
 */
export function traceRiver(course: RiverCourse, seed: number): RiverPoint[] {
  const dense: [number, number][] = [];
  const points = course.points;
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const before = points[Math.max(0, segment - 1)]!;
    const from = points[segment]!;
    const to = points[segment + 1]!;
    const after = points[Math.min(points.length - 1, segment + 2)]!;
    const steps = Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / TRACE_STEP);
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      dense.push([
        catmullRom(before[0], from[0], to[0], after[0], t),
        catmullRom(before[1], from[1], to[1], after[1], t),
      ]);
    }
  }
  dense.push([points[points.length - 1]![0], points[points.length - 1]![1]]);

  const river: RiverPoint[] = [];
  for (let index = 0; index < dense.length; index += 1) {
    const [x, z] = dense[index]!;
    const [nextX, nextZ] = dense[Math.min(dense.length - 1, index + 1)]!;
    const [prevX, prevZ] = dense[Math.max(0, index - 1)]!;
    const length = Math.hypot(nextX - prevX, nextZ - prevZ) || 1;
    const flowX = (nextX - prevX) / length;
    const flowZ = (nextZ - prevZ) / length;
    const along = index / (dense.length - 1);
    const swing =
      meander((index * TRACE_STEP) / MEANDER_WAVELENGTH, seed) *
      MEANDER_METRES *
      Math.sin(Math.PI * along);
    // Sideways to the flow is (flowZ, -flowX).
    river.push({ x: x + flowZ * swing, z: z - flowX * swing, flowX, flowZ, along });
  }
  return river;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (p2 - p0) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (3 * p1 - p0 - 3 * p2 + p3) * t3)
  );
}
