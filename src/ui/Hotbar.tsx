import { sendCommand } from "./bridge";
import { HOTBAR_SLOTS } from "../items/slots";
import { useGameStats } from "./useGameStats";
import { useBagOpen } from "./bagOpen";
import { ItemSlot } from "./ItemSlot";

/**
 * The eight slots along the foot of the screen, and what the hands hold.
 *
 * Shown while you are playing and while the bag is open, so a thing dragged
 * into the bar can be seen landing there. Hidden behind the pause menu, which
 * has the screen to itself.
 */
export function Hotbar() {
  const { inventory, chosenSlot, paused, firstPerson } = useGameStats();
  const bagOpen = useBagOpen();
  if (!firstPerson || (paused && !bagOpen)) return null;

  return (
    <div className="hotbar">
      {Array.from({ length: HOTBAR_SLOTS }, (_, slot) => (
        <ItemSlot
          key={slot}
          slot={slot}
          stack={inventory[slot] ?? null}
          chosen={slot === chosenSlot}
          label={String(slot + 1)}
          onMove={bagOpen ? move : undefined}
          onChoose={bagOpen ? choose : undefined}
        />
      ))}
    </div>
  );
}

function move(from: number, to: number): void {
  sendCommand({ type: "move-item", from, to });
}

function choose(slot: number): void {
  sendCommand({ type: "choose-slot", slot });
}
