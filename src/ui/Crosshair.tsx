import { useGameStats } from "./useGameStats";
import { useBagOpen } from "./bagOpen";
import { useMapOpen } from "./worldMapOpen";

/**
 * The mark in the middle of the screen: what you are looking at is what you
 * act on.
 *
 * Only while you are actually playing. With the mouse let go — paused, in the
 * bag, on the map, or out at the orbit camera — you are pointing with a cursor
 * and a second mark in the middle would be a lie.
 */
export function Crosshair() {
  const { paused, firstPerson } = useGameStats();
  const bagOpen = useBagOpen();
  const mapOpen = useMapOpen();
  if (paused || !firstPerson || bagOpen || mapOpen) return null;

  return <div className="crosshair" aria-hidden="true" />;
}
