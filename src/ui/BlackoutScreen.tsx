import { useGameStats } from "./useGameStats";

/**
 * The screen going black when a boar puts you down, and coming back in the
 * village the next morning.
 *
 * Always mounted, so the fade can run both ways: the game only says when it
 * starts and when you wake, and the stylesheet does the rest.
 */
export function BlackoutScreen() {
  const { blackout } = useGameStats();
  return (
    <div className="blackout" data-dark={blackout} aria-hidden={!blackout}>
      <p className="blackout__words">Everything goes dark…</p>
    </div>
  );
}
