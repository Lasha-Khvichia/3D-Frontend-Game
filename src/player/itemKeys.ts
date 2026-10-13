import { HOTBAR_SLOTS } from "../items/slots";
import type { PlayerInput } from "./PlayerInput";
import type { WheelSteps } from "./wheelSteps";

/** What the player asked of what they are carrying, this step. */
export type ItemKeys = {
  /** A slot on the bar, chosen by its number key, or null. */
  readonly chooseSlot: number | null;
  /** Mouse wheel notches: positive along the bar, negative back. */
  readonly scroll: number;
  /** L: move the lantern between the left hand and the belt. */
  readonly lantern: boolean;
};

/** Nothing asked for: the steps where the player is not in the world. */
export const NO_ITEM_KEYS: ItemKeys = { chooseSlot: null, scroll: 0, lantern: false };

/**
 * The keys that work the inventory, read once per step and consumed.
 *
 * Kept out of `PlayerInput`, which already knows enough: this is a reading of
 * its keys, not another thing for it to track. Tab is not here — the bag opens
 * on the React side, like the world map, because it has to work while the game
 * is paused and no step is running to hear it.
 */
export function takeItemKeys(input: PlayerInput, wheel: WheelSteps): ItemKeys {
  let chooseSlot: number | null = null;
  for (let slot = 0; slot < HOTBAR_SLOTS; slot += 1) {
    if (input.consumePress(`Digit${slot + 1}`)) chooseSlot = slot;
  }
  return {
    chooseSlot,
    scroll: wheel.take(),
    lantern: input.consumePress("KeyL"),
  };
}

/** The slot on the bar the keys ask for: a number key if pressed, else the wheel's notches on from `chosen`. */
export function slotAsked(chosen: number, keys: ItemKeys): number {
  if (keys.chooseSlot !== null) return keys.chooseSlot;
  return (chosen + (keys.scroll % HOTBAR_SLOTS) + HOTBAR_SLOTS) % HOTBAR_SLOTS;
}
