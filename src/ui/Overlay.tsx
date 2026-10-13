import { StatsPanel } from "./StatsPanel";
import { InteractionPrompt } from "./InteractionPrompt";
import { WorldNotice } from "./WorldNotice";
import { MiniMap } from "./MiniMap";
import { BagScreen } from "./BagScreen";
import { Crosshair } from "./Crosshair";
import { Hotbar } from "./Hotbar";
import { PauseMenu } from "./PauseMenu";
import { StartFailure } from "./StartFailure";
import { WorldMap } from "./WorldMap";
import { sendCommand } from "./bridge";
import { useBagKeys } from "./useBagKeys";
import "./overlay.css";

/**
 * DOM layer above the canvas. It is pointer-transparent by default so clicks
 * reach the game; each interactive panel opts back in with pointer-events.
 */
export function Overlay() {
  useBagKeys();
  return (
    <div className="overlay">
      <div className="overlay__panel">
        <StatsPanel />
        {import.meta.env.DEV && (
          <button
            type="button"
            className="overlay__button"
            onClick={(event) => {
              sendCommand({ type: "toggle-inspector" });
              // Leaving focus here would let Space press it again.
              event.currentTarget.blur();
            }}
          >
            Inspector
          </button>
        )}
      </div>
      <InteractionPrompt />
      <WorldNotice />
      <MiniMap />
      <Crosshair />
      <Hotbar />
      <BagScreen />
      <PauseMenu />
      <WorldMap />
      <StartFailure />
    </div>
  );
}
