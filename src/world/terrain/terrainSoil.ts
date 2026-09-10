import type { GrassSoil } from "../GrassField";
import type { Ground } from "./Ground";

/** Grass stops this far above the water, leaving beaches and riverbanks bare. */
const ABOVE_WATER = 1.2;
/** Rise per metre past which the ground is rock, not turf: about 35 degrees. */
const TOO_STEEP = 0.7;
/** Above this the land is upland scree and then snow. */
const TREE_LINE = 75;

const slope = { x: 0, z: 0 };

/**
 * Where grass grows on the island: on dry land, below the upland, and only
 * where the ground is gentle enough to hold soil.
 *
 * The same three bands the terrain is coloured by, so a blade never stands on
 * sand, rock or snow. Get them out of step and the island grows grass on the
 * seabed and bare patches in the middle of meadows.
 */
export function terrainSoil(ground: Ground): GrassSoil {
  return {
    heightAt: (x, z) => ground.heightAt(x, z),
    growsAt: (x, z) => {
      const height = ground.heightAt(x, z);
      if (height - ground.waterSurfaceAt(x, z) < ABOVE_WATER || height > TREE_LINE) return false;
      ground.slopeAt(x, z, slope);
      return Math.hypot(slope.x, slope.z) < TOO_STEEP;
    },
  };
}
