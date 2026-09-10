/**
 * Where the rivers run, as a few points each, source first.
 *
 * Each spring sits at the foot of its mountain, not up its side. A spring high
 * on a steep flank sends its first hundred metres down the slope as a tilted
 * sheet of water — a water slide, 43 degrees on the first try — and the cave
 * and the hill behind it are what make it read as coming out of the mountain.
 *
 * Laid out by hand rather than found by rolling water downhill. The island is
 * the same every load, and a river that wanders into a hamlet or strands
 * half the map is a far worse outcome than one that is merely placed. Each
 * course starts high on a mountain flank, keeps well clear of every
 * settlement, and runs off the coast into the sea — the last point is always
 * out past the beach, and the river stops where its water meets the sea's.
 *
 * `crossings` says where along the course, as a share of its length, the
 * river can be got across: a bridge, or a ford shallow enough to wade.
 */
export type RiverCourse = {
  readonly name: string;
  readonly points: readonly (readonly [number, number])[];
  readonly crossings: readonly { readonly at: number; readonly kind: "bridge" | "ford" }[];
};

export const RIVER_COURSES: readonly RiverCourse[] = [
  {
    name: "westwater",
    points: [
      [-294, 538],
      [-330, 470],
      [-430, 300],
      [-560, 180],
      [-760, 110],
      [-1150, 60],
    ],
    crossings: [
      { at: 0.3, kind: "ford" },
      { at: 0.55, kind: "bridge" },
      { at: 0.8, kind: "ford" },
    ],
  },
  {
    name: "northbrook",
    points: [
      [365, 610],
      [470, 640],
      [620, 610],
      [770, 650],
      [1150, 720],
    ],
    crossings: [
      { at: 0.35, kind: "bridge" },
      { at: 0.7, kind: "ford" },
    ],
  },
  {
    name: "southrun",
    points: [
      [-114, -553],
      [-200, -500],
      [-400, -430],
      [-640, -440],
      [-850, -470],
      [-1200, -480],
    ],
    crossings: [
      { at: 0.3, kind: "ford" },
      { at: 0.5, kind: "bridge" },
      { at: 0.78, kind: "ford" },
    ],
  },
];
