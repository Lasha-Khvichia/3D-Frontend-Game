import type { Season } from "../world/calendar/calendar";

/** A small dot in the season's colour: green spring, gold summer, amber autumn, ice-blue winter. */
export function SeasonDot({ season }: { season: Season }) {
  return <span className={`season-dot season-dot--${season}`} aria-hidden="true" />;
}
