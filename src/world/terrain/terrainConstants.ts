/**
 * The numbers the whole landscape is built around.
 *
 * Settlements sit at exactly y = 0, which is why the sea is below it rather
 * than at it: every house, door and hearth was built assuming a floor at zero,
 * and flattening each settlement's ground to zero keeps all of that true.
 */

/** Height of the water surface. The village is 2.5 m above it. */
export const SEA_LEVEL = -2.5;

/** Distance between neighbouring height samples, and between full-detail vertices. */
export const GRID_SPACING = 4;
/** The grid runs this far from the middle of the map in every direction. */
export const GRID_HALF_EXTENT = 1536;

/** Deepest water a player can walk through. Past this it stops them. */
export const MAX_WADE_DEPTH = 1.2;
/**
 * How far the shallow shelf runs out from the beach before the seabed drops.
 * Shallow enough to wade the whole way, which is what lets the player reach
 * the edge of the world on foot and be turned round there.
 */
export const SHELF_WIDTH = 75;
/** Depth of the water at the outer edge of the shelf. Under the wading limit. */
export const SHELF_DEPTH = 1.05;
/** Where the seabed levels off once it has dropped off the shelf. */
export const DEEP_SEA_FLOOR = -24;
/** Width of the beach, from the waterline up to the level of the land. */
export const BEACH_WIDTH = 60;
