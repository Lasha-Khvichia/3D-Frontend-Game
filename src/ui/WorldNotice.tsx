import { useGameStats } from "./useGameStats";

/**
 * A message from the world, shown large across the middle of the screen —
 * the edge-of-the-world warning is the first. Separate from the interaction
 * prompt, which is rewritten every step by whatever the player stands next to
 * and would wipe this out the moment it appeared.
 */
export function WorldNotice() {
  const { notice, paused, firstPerson } = useGameStats();
  if (!notice || paused || !firstPerson) return null;

  return <p className="overlay__notice">{notice}</p>;
}
