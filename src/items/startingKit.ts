import { BELT } from "./slots";

/**
 * What the player begins with, and where it starts out.
 *
 * There is nowhere to buy or make anything yet, so a hoe and a lantern are
 * simply there. The lantern starts on the belt rather than in the bag: it
 * lights the way from the first night without anybody having to find it.
 */
export const STARTING_KIT = [
  { id: "hoe", slot: 0 },
  { id: "lantern", slot: BELT },
] as const;
