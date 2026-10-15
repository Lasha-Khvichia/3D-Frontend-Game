import { useEffect, useState } from "react";
import { sendCommand } from "./bridge";

/** Seconds the second click is waited for before the button settles again. */
const ARMED_FOR_MS = 4000;

/**
 * Starts the game again from nothing: the clock, the field, everything carried.
 *
 * Two clicks, because there is no undo. The first only asks; the second, within
 * four seconds, does it. Your settings are kept.
 */
export function StartOver() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), ARMED_FOR_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      className="menu__start-over"
      data-armed={armed}
      onClick={() => (armed ? sendCommand({ type: "reset-game" }) : setArmed(true))}
    >
      {armed
        ? "Click again to wipe the clock, your field and all you carry"
        : "Start over from the first day"}
    </button>
  );
}
