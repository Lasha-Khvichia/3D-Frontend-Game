import { itemKind } from "./itemKinds";

/** Slots on the bar, and slots in the bag behind it. */
export const HOTBAR_SLOTS = 8;
export const BAG_SLOTS = 24;
/** The off hand and the belt, counted after the bag so one number names any slot. */
export const OFF_HAND = HOTBAR_SLOTS + BAG_SLOTS;
export const BELT = OFF_HAND + 1;
export const ALL_SLOTS = BELT + 1;

export type Stack = { readonly id: string; readonly count: number } | null;

/**
 * Whether a slot will take this stack. Empty always will, and so does any
 * ordinary slot; the off hand and the belt take only what is carried in the
 * left hand, which today means the lantern.
 */
export function slotAccepts(slot: number, stack: Stack): boolean {
  if (!stack) return true;
  if (slot !== OFF_HAND && slot !== BELT) return true;
  return itemKind(stack.id)?.hand === "off";
}
