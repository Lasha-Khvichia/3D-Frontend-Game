import type { Footprint } from "./footprint";

/**
 * Something grass cannot grow through: a stone, a trunk, a wall.
 *
 * It says how much grass is left at a point, 0 for none to 1 for full height,
 * rather than yes or no. Real grass does not stop dead at a stone; it thins
 * and shortens into its foot. So each blocker clears exactly its own shape,
 * then lets the grass come back over `GRASS_FADE`.
 */
export type GrassBlocker = {
  /** The ground it touches, fade included, for sorting it into the grid. */
  readonly bounds: Footprint;
  grassLeftAt(x: number, z: number): number;
};

/** Metres over which grass grows back to full height beside an object. */
export const GRASS_FADE = 0.35;
/** Share of full height grass keeps right at an object's edge. */
const AT_THE_EDGE = 0.3;

/** Grass left at a distance from an object's edge: none inside, short at the edge, full past the fade. */
export function grassBeside(distanceOutside: number): number {
  if (distanceOutside <= 0) return 0;
  if (distanceOutside >= GRASS_FADE) return 1;
  const t = distanceOutside / GRASS_FADE;
  return AT_THE_EDGE + (1 - AT_THE_EDGE) * t * t * (3 - 2 * t);
}

/** A round object standing on the ground: a trunk, a post. */
export function circleBlocker(x: number, z: number, radius: number): GrassBlocker {
  const reach = radius + GRASS_FADE;
  return {
    bounds: { minX: x - reach, maxX: x + reach, minZ: z - reach, maxZ: z + reach },
    grassLeftAt: (px, pz) => grassBeside(Math.hypot(px - x, pz - z) - radius),
  };
}

/** A rectangle of ground, square to the map: a house. */
export function rectangleBlocker(area: Footprint): GrassBlocker {
  return {
    bounds: {
      minX: area.minX - GRASS_FADE,
      maxX: area.maxX + GRASS_FADE,
      minZ: area.minZ - GRASS_FADE,
      maxZ: area.maxZ + GRASS_FADE,
    },
    grassLeftAt: (x, z) => {
      const outsideX = Math.max(area.minX - x, x - area.maxX);
      const outsideZ = Math.max(area.minZ - z, z - area.maxZ);
      // Past a corner the distance is diagonal; alongside a wall it is straight out.
      const distance =
        outsideX > 0 && outsideZ > 0
          ? Math.hypot(outsideX, outsideZ)
          : Math.max(outsideX, outsideZ);
      return grassBeside(distance);
    },
  };
}
