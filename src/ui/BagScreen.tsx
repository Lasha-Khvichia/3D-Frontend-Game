import { sendCommand } from "./bridge";
import { BAG_SLOTS, BELT, HOTBAR_SLOTS, OFF_HAND } from "../items/slots";
import { useGameStats } from "./useGameStats";
import { setBagOpen, useBagOpen } from "./bagOpen";
import { ItemSlot } from "./ItemSlot";

/**
 * The bag, opened with Tab: everything not on the bar, and the two places a
 * thing is worn rather than held.
 *
 * Opening it lets go of the mouse, which is what makes dragging possible at
 * all. The bar stays on screen underneath, so a thing can be dragged straight
 * out of the bag onto it.
 */
export function BagScreen() {
  const { inventory } = useGameStats();
  const open = useBagOpen();
  if (!open) return null;

  return (
    <div className="bag">
      <div className="bag__panel">
        <h2 className="bag__title">Carrying</h2>
        <div className="bag__worn">
          <ItemSlot
            slot={OFF_HAND}
            stack={inventory[OFF_HAND] ?? null}
            label="Left hand"
            onMove={move}
          />
          <ItemSlot slot={BELT} stack={inventory[BELT] ?? null} label="Belt" onMove={move} />
        </div>
        <div className="bag__grid">
          {Array.from({ length: BAG_SLOTS }, (_, index) => {
            const slot = HOTBAR_SLOTS + index;
            return (
              <ItemSlot key={slot} slot={slot} stack={inventory[slot] ?? null} onMove={move} />
            );
          })}
        </div>
        <p className="bag__hint">
          Drag a thing where you want it. Tab or Escape to close. L moves the lantern between your
          hand and your belt.
        </p>
        <button
          type="button"
          className="menu__button is-primary"
          onClick={() => {
            setBagOpen(false);
            sendCommand({ type: "resume" });
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function move(from: number, to: number): void {
  sendCommand({ type: "move-item", from, to });
}
