import { resetSettings } from "../settings/settingsStore";
import { sendCommand } from "./bridge";
import { useGameStats } from "./useGameStats";
import { ComfortSettings } from "./ComfortSettings";
import { GraphicsSettings } from "./GraphicsSettings";
import { WorldSettings } from "./WorldSettings";
import { useMapOpen } from "./worldMapOpen";

/**
 * Shown whenever the browser does not have the mouse, which is what Escape
 * does. The backdrop is deliberately click-through, so clicking the world
 * behind the panel resumes as well as the button does.
 */
export function PauseMenu() {
  const { paused, pointerLockRefused } = useGameStats();
  // The world map pauses the game too, and it is what should show.
  const mapOpen = useMapOpen();
  if (!paused || mapOpen) return null;

  return (
    <div className="menu">
      <div className="menu__panel">
        <h2 className="menu__title">Paused</h2>
        {/* Directly under the title on purpose. The panel scrolls, and a
            message at the foot of it is below the fold on most screens —
            which is no better than the silence it replaces. */}
        {pointerLockRefused ? (
          <p className="menu__refused">
            {pointerLockRefused} The game cannot start without it. Allow pointer lock for this page
            in your browser&rsquo;s site settings, then click the world again.
          </p>
        ) : null}
        <ComfortSettings />
        <WorldSettings />
        <GraphicsSettings />
        <div className="menu__actions">
          <button
            type="button"
            className="menu__button is-primary"
            onClick={() => sendCommand({ type: "resume" })}
          >
            Resume
          </button>
          <button type="button" className="menu__button" onClick={resetSettings}>
            Reset to defaults
          </button>
        </div>
        <p className="menu__hint">Escape pauses. Click the world or Resume to play.</p>
      </div>
    </div>
  );
}
