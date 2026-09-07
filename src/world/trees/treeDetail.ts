/** How much of a tree is drawn, by how far away it is. */
export type DetailTier = "near" | "mid" | "far";

/**
 * Where the tiers change, in metres, and the slack around each edge.
 *
 * The slack is what stops a tree flickering between two tiers when the player
 * stands exactly on a boundary and sways. A tree has to cross a threshold by
 * this much before it changes, and by this much back before it changes again.
 */
const NEAR_TO_MID = 32;
const MID_TO_FAR = 72;
const SLACK = 5;

/**
 * The share of a canopy's leaves drawn at each tier.
 *
 * Leaves were scattered in random order, so drawing the first part of the
 * buffer thins the canopy evenly through the whole tree rather than stripping
 * one limb bare.
 */
export const LEAF_SHARE: Record<DetailTier, number> = { near: 1, mid: 0.45, far: 0.18 };

/**
 * How much bigger the leaves that remain are drawn.
 *
 * Thinning a canopy without this makes distant trees look **bare**, which is
 * worse than the cost it saves: a tree in the distance should read as more
 * solid, not less. Area covered goes as the square of size, so keeping coverage
 * while drawing a share `s` of the leaves means scaling them by 1 over the root
 * of `s`.
 */
export const LEAF_SIZE: Record<DetailTier, number> = {
  near: 1,
  mid: 1 / Math.sqrt(LEAF_SHARE.mid),
  far: 1 / Math.sqrt(LEAF_SHARE.far),
};

/**
 * Which tier a tree belongs in, given where it was.
 *
 * Takes the current tier so the thresholds can sit further out when moving away
 * than when coming closer.
 */
export function tierFor(distance: number, current: DetailTier): DetailTier {
  const nearEdge = current === "near" ? NEAR_TO_MID + SLACK : NEAR_TO_MID;
  const farEdge = current === "far" ? MID_TO_FAR - SLACK : MID_TO_FAR;
  if (distance < nearEdge) return "near";
  if (distance < farEdge) return "mid";
  return "far";
}

/**
 * How close a tree has to be to be worth putting in the shadow map.
 *
 * The shadow box is a fixed 48 m centred on the player, so its half-extent is
 * 24 m. A little past that covers trees whose canopy reaches into the box while
 * their trunk does not.
 */
export const SHADOW_RANGE = 32;
