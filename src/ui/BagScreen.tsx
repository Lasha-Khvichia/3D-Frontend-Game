import { sendCommand } from "./bridge";
import { BAG_SLOTS, HOTBAR_SLOTS } from "../items/slots";
import { useGameStats } from "./useGameStats";
import { setBagOpen, useBagOpen } from "./bagOpen";
import { ItemSlot } from "./ItemSlot";
import { WornFigure } from "./WornFigure";
import "./bag.css";

/**
 * The bag, opened with Tab: you on one side with what you are wearing, and the
 * satchel on the other with everything you are carrying in it.
 *
 * Opening it lets go of the mouse, which is what makes dragging possible at
 * all. The bar stays on screen underneath, so a thing can be dragged straight
 * out of the satchel onto it.
 */
export function BagScreen() {
  const { inventory } = useGameStats();
  const open = useBagOpen();
  if (!open) return null;

  return (
    <div className="bag">
      <div className="bag__card">
        <h2 className="bag__title">Your things</h2>
        <div className="bag__body">
          <WornFigure inventory={inventory} onMove={move} />
          <div className="satchel">
            <div className="satchel__flap">
              <span className="satchel__buckle" />
            </div>
            <div className="satchel__pockets">
              {Array.from({ length: BAG_SLOTS }, (_, index) => {
                const slot = HOTBAR_SLOTS + index;
                return (
                  <ItemSlot key={slot} slot={slot} stack={inventory[slot] ?? null} onMove={move} />
                );
              })}
            </div>
          </div>
        </div>
        <p className="bag__hint">
          Drag a thing where you want it. L moves the lantern between your hand and your belt. Tab
          or Escape to close.
        </p>
        <button
          type="button"
          className="menu__button is-primary bag__close"
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
