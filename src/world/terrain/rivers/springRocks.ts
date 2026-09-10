import { between, createSeededRandom, seedFromText } from "../../houses/seededRandom";

/** One rock of a cave mouth, in the mouth's own frame: across the river, along it, and up. */
export type SpringRock = {
  readonly across: number;
  readonly back: number;
  /** Height of the rock's middle above the water. */
  readonly up: number;
  readonly radii: { x: number; y: number; z: number };
  readonly seed: number;
};

/**
 * The rocks that make a cave mouth: a pillar either side of the water, a slab
 * across them, and a scatter of smaller stones at their feet.
 *
 * The pillars are wider than they are tall and set well back into the hill, so
 * they read as the edges of a rock face rather than two eggs holding up a
 * slab. The scatter breaks the symmetry; no two springs get the same one.
 */
export function springRocks(name: string, halfOpening: number, headroom: number): SpringRock[] {
  const random = createSeededRandom(seedFromText(name));
  const rocks: SpringRock[] = [];
  for (const side of [-1, 1]) {
    rocks.push({
      across: side * (halfOpening + 2.2),
      back: 1.4,
      up: 2.6,
      radii: { x: 3, y: 3.8, z: 4.6 },
      seed: between(random, 0, 50),
    });
    const stones = 2 + Math.floor(random() * 2);
    for (let stone = 0; stone < stones; stone += 1) {
      const size = between(random, 0.7, 1.5);
      rocks.push({
        across: side * (halfOpening + between(random, 0.6, 3.6)),
        back: between(random, -2.6, -0.4),
        // Sunk a third of the way in, so none of them sits on the grass like a ball.
        up: size * 0.35,
        radii: {
          x: size * between(random, 0.9, 1.4),
          y: size,
          z: size * between(random, 0.9, 1.3),
        },
        seed: between(random, 50, 100),
      });
    }
  }
  rocks.push({
    across: between(random, -0.6, 0.6),
    back: 1.5,
    up: headroom + 2,
    radii: { x: halfOpening + 4, y: 2.3, z: 4.4 },
    seed: between(random, 100, 150),
  });
  return rocks;
}
