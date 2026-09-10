/** How big a river is, from spring to mouth. */

/** Channel depth: past wading in the river proper, shallow at the spring and at fords. */
export const CHANNEL_DEPTH = 2.3;
export const SPRING_DEPTH = 0.9;
export const FORD_DEPTH = 0.6;
/** How far either side of a ford's centre, along the river, it stays shallow. */
export const FORD_REACH = 10;
/** Half the channel's width where it leaves the spring, and where it is fully grown. */
export const SPRING_HALF_WIDTH = 4;
export const FULL_HALF_WIDTH = 10;
/** Metres of river over which a spring grows into a river, and its channel deepens. */
export const WIDEN_OVER = 500;
export const DEEPEN_OVER = 60;
/** How wide the valley grows either side, and over how far below the spring it opens. */
export const VALLEY = 26;
export const VALLEY_OPENS_OVER = 45;
/**
 * The most the water may fall per metre: about 7 degrees. Where the ground
 * drops faster, the channel is cut deeper instead, the way a stream wears a
 * gully, so no stretch of river is a ramp of water.
 */
export const MOST_FALL = 0.12;
/**
 * How far past the channel edge the banks are searched, both for the lowest
 * ground when setting the water level and for dry ground when drawing the
 * water's edge. The same distance for both, or a hollow just beyond one of
 * them stands lower than the water beside it and the edge hangs over it.
 */
export const BANK_SEARCH = 5;
/** The least the water falls per metre, so no stretch of river is dead level. */
export const LEAST_FALL = 0.002;
