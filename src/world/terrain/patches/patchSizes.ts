/**
 * Every patch is a mesh this many cells square, whatever its level. A level-0
 * patch spans 32 grid cells of 4 m; each level up spans twice as far with
 * cells twice as wide, so every patch costs the same to build and to draw.
 */
export const PATCH_CELLS = 32;

/** Level 3 patches are 1024 m square with 32 m cells, and nine cover the grid. */
export const COARSEST_LEVEL = 3;

/**
 * Full detail is kept at least this far round the player, and each coarser
 * level at least twice as far as the one before.
 *
 * Height error alone would let flat ground go coarse right under your feet,
 * because coarse is exact where the ground is flat. But the colour would not
 * be: the sand line and the speckle are painted per vertex, and 32 m apart
 * they smear into a blur the player is standing on.
 */
export const FULL_DETAIL_RADIUS = 160;

/**
 * How far a patch may stray from the true ground, as a share of its distance
 * from the eye. 0.0015 is about one and a half pixels on a 1080-line screen at
 * the default field of view — small enough that a patch changing level is not
 * seen to move.
 */
export const PIXEL_ERROR = 0.0015;

/**
 * A split patch merges again only when it needs detail this much less than it
 * did when it split. Without the gap, a patch whose need sits right at the
 * threshold swaps back and forth every step as the player sways.
 */
export const MERGE_BELOW = 0.75;

/**
 * Time per simulation step that building patches may take. At least one is
 * always built, so the world never stalls for a slow machine; more wait for
 * the next step, nearest first.
 */
export const BUILD_BUDGET_MS = 2.5;
