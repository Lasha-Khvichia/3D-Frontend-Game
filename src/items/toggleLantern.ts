import type { Inventory } from "./Inventory";
import { ALL_SLOTS, BELT, OFF_HAND } from "./slots";

/**
 * L: the lantern onto the belt, or off the belt into the left hand.
 *
 * It finds the lantern wherever it is — in the left hand, chosen on the bar,
 * or down in the satchel — and hangs it on the belt; pressed again, it comes up
 * into the hand. Only swapping the hand with the belt did nothing at all once
 * the lantern had been put on the bar, because then both of those were empty.
 */
export function toggleLantern(inventory: Inventory): boolean {
  if (inventory.belt?.id === "lantern") return inventory.move(BELT, OFF_HAND);
  for (let slot = 0; slot < ALL_SLOTS; slot += 1) {
    if (slot !== BELT && inventory.at(slot)?.id === "lantern") return inventory.move(slot, BELT);
  }
  return false;
}
