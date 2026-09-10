import { between, createSeededRandom, seedFromText } from "../houses/seededRandom";

/**
 * One smooth swell of rock. A boulder is one or two of these blended together.
 *
 * Its profile has zero slope at the middle and zero slope again where it dies
 * out, so a lobe has neither a point on top nor a crease where it meets the
 * ground. Blend two at an offset and the result is a lumpy stone with no edge
 * anywhere on it.
 */
export type Lobe = {
  /** Offset from the middle of the rock. */
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
};

export type RockShape = {
  readonly name: string;
  readonly x: number;
  readonly z: number;
  /** Height of the ground under the rock's middle; the rock is grown up from here. */
  readonly baseY: number;
  /** Nothing of this rock reaches further than this from its middle. */
  readonly reach: number;
  readonly lobes: readonly Lobe[];
  /** Drives the surface wobble, so no two rocks are the same shape. */
  readonly seed: number;
};

/** How wide a boulder spreads, how many swells it has, and how tall it stands. */
const REACH = [0.5, 1.7] as const;
const LOBES = [1, 2] as const;
const HEIGHT = [0.35, 1.15] as const;
/** How wide each lobe is, as a share of the whole rock. */
const SPREAD = [0.4, 0.8] as const;

/** Grows one boulder from its name, so the same name is the same stone every load. */
export function growRock(name: string, x: number, z: number, baseY: number): RockShape {
  const random = createSeededRandom(seedFromText(name));
  const reach = between(random, REACH[0], REACH[1]);
  const summit = between(random, HEIGHT[0], HEIGHT[1]);
  const count = Math.round(between(random, LOBES[0], LOBES[1]));

  const lobes: Lobe[] = [];
  for (let index = 0; index < count; index += 1) {
    // A lobe has to die out inside the rock's own reach, or the stone would be
    // cut off at its rim instead of settling into the ground.
    const radius = reach * between(random, SPREAD[0], SPREAD[1]);
    const drift = Math.max(0, reach - radius);
    const angle = random() * Math.PI * 2;
    const away = drift * Math.sqrt(random());
    lobes.push({
      x: Math.sin(angle) * away,
      z: Math.cos(angle) * away,
      radius,
      // The first lobe carries the top; a second one is a shoulder on it.
      height: index === 0 ? summit : summit * between(random, 0.35, 0.9),
    });
  }

  return { name, x, z, baseY, reach, lobes, seed: random() * 100 };
}
