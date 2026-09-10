import { PLAYER_HEIGHT } from "./createPlayerBean";

/** How far past the player's own shoulders a wall counts as within reach. */
export const REACH = 0.55;
/** The grabbable band, measured from the feet: knee to 20 cm over the head. */
export const MIN_RISE = 0.5;
export const MAX_RISE = PLAYER_HEIGHT + 0.2;
/**
 * How high above the feet to look for the wall's face.
 *
 * Below the lowest grabbable ledge on purpose. Cast from the chest, the ray
 * sails clean over a knee-high wall and finds nothing to climb.
 */
export const FACE_HEIGHT = 0.3;
/** How far past the wall face to look down for its top. */
export const TOP_PROBE = 0.25;
/** How far past the face to look for somewhere to put your feet. */
export const LANDING_PROBE = 1.1;
/** A top within this of the ledge is a platform; anything lower is a thin wall. */
export const PLATFORM_DROP = 0.35;
/** To stand on a ledge the player needs room to stand. */
export const HEADROOM = PLAYER_HEIGHT + 0.05;
/**
 * To go *over* something you only need room to pass, not to stand.
 *
 * This is what makes a window climbable. The wall under a window is a thin wall
 * with a gap above it, which is exactly the case the move is for; demanding
 * standing room there would refuse every window in the village.
 */
export const VAULT_CLEARANCE = 0.9;
/** No landing found within this far below the ledge means nowhere to go. */
export const MAX_DROP = 6;
