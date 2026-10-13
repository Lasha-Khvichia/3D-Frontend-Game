import { useGameStats } from "./useGameStats";
import { useBagOpen } from "./bagOpen";

/**
 * Your health, as a strip above the bar: red where it is left, the empty part
 * of the strip showing what has gone.
 *
 * Only while you are out in the world, like the bar itself. It turns a darker
 * red when you are close to going down.
 */
export function HealthBar() {
  const { health, paused, firstPerson } = useGameStats();
  const bagOpen = useBagOpen();
  if (!firstPerson || (paused && !bagOpen)) return null;

  return (
    <div className="health" data-low={health <= 25} title={`Health ${health}`}>
      <div className="health__left" style={{ width: `${Math.max(0, health)}%` }} />
    </div>
  );
}
