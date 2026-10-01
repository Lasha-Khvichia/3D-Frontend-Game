import { resetSettings } from "../settings/settingsStore";
import { sendCommand } from "./bridge";
import { useGameStats } from "./useGameStats";
import { MENU_SECTIONS } from "./menuSections";
import { OpenSection } from "./OpenSection";
import { SectionButton } from "./SectionButton";
import { useSectionDrill } from "./useSectionDrill";
import { useMapOpen } from "./worldMapOpen";

/**
 * Shown whenever the browser does not have the mouse, which is what Escape
 * does. The backdrop is deliberately click-through, so clicking the world
 * beside the drawer resumes as well as the button does.
 *
 * The drawer is an upright box that hides what runs past its sides. The
 * leaning band behind it is wider than the drawer, so only its slanted ends
 * show, at the top and the bottom.
 *
 * Two levels: the four names, and one section's settings. Nothing is on screen
 * but the level you are on.
 */
export function PauseMenu() {
  const { paused, pointerLockRefused } = useGameStats();
  // The world map pauses the game too, and it is what should show.
  const mapOpen = useMapOpen();
  const drill = useSectionDrill<string>();
  if (!paused || mapOpen) return null;

  const opened = MENU_SECTIONS.find((section) => section.name === drill.open);

  return (
    <div className="menu">
      <div className="menu__drawer">
        <div className="menu__band" aria-hidden="true" />
        <div className="menu__top">
          <h2 className="menu__title">Paused</h2>
          {pointerLockRefused ? (
            <p className="menu__refused">
              {pointerLockRefused} The game cannot start without it. Allow pointer lock for this
              page in your browser&rsquo;s site settings, then click the world again.
            </p>
          ) : null}
        </div>
        <div className="menu__scroll">
          {opened ? (
            <OpenSection
              key={opened.name}
              name={opened.name}
              Rows={opened.Rows}
              onBack={drill.back}
            />
          ) : (
            <div className="menu__list" data-leaving={drill.leaving !== null}>
              {MENU_SECTIONS.map((section) => (
                <SectionButton
                  key={section.name}
                  name={section.name}
                  onClick={() => drill.enter(section.name)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="menu__foot">
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
    </div>
  );
}
