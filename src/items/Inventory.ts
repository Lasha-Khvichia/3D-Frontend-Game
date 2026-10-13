import { itemKind } from "./itemKinds";
import {
  ALL_SLOTS,
  BAG_SLOTS,
  BELT,
  HOTBAR_SLOTS,
  OFF_HAND,
  slotAccepts,
  type Stack,
} from "./slots";

/**
 * What the player is carrying: a bar of eight, a bag behind it, and two places
 * a thing can be worn — the off hand and the belt.
 *
 * One flat array, because every rule about moving a thing is then the same
 * rule wherever it is moving from and to. The bar, the bag, the hand and the
 * belt are ranges of it, not separate stores.
 */
export class Inventory {
  private readonly slots: Stack[] = new Array<Stack>(ALL_SLOTS).fill(null);
  /** Which of the eight the main hand holds. */
  private chosen = 0;

  get chosenSlot(): number {
    return this.chosen;
  }

  choose(slot: number): void {
    if (slot >= 0 && slot < HOTBAR_SLOTS) this.chosen = slot;
  }

  at(slot: number): Stack {
    return this.slots[slot] ?? null;
  }

  /** What the right hand holds, or null. */
  get mainHand(): Stack {
    return this.at(this.chosen);
  }

  /** What the left hand holds, or null. */
  get offHand(): Stack {
    return this.at(OFF_HAND);
  }

  /** What hangs at the hip, or null. */
  get belt(): Stack {
    return this.at(BELT);
  }

  /** Puts a thing in the first slot that will take it. False if there is no room. */
  add(id: string, count = 1): boolean {
    const kind = itemKind(id);
    if (!kind) return false;
    for (let slot = 0; slot < HOTBAR_SLOTS + BAG_SLOTS; slot += 1) {
      const held = this.slots[slot];
      if (held && held.id === id && held.count < kind.maxStack) {
        this.slots[slot] = { id, count: held.count + count };
        return true;
      }
      if (!held) {
        this.slots[slot] = { id, count };
        return true;
      }
    }
    return false;
  }

  /** Puts one thing straight into a named slot, for a starting kit. */
  put(slot: number, id: string, count = 1): void {
    if (itemKind(id) && slotAccepts(slot, { id, count })) this.slots[slot] = { id, count };
  }

  /**
   * Swaps two slots, refusing anything the hand or belt will not hold: only a
   * lantern goes in the off hand or on the belt, and only a tool in the bar's
   * main hand.
   */
  move(from: number, to: number): boolean {
    if (from === to || from < 0 || to < 0 || from >= ALL_SLOTS || to >= ALL_SLOTS) return false;
    if (!slotAccepts(to, this.at(from)) || !slotAccepts(from, this.at(to))) return false;
    [this.slots[from], this.slots[to]] = [this.at(to), this.at(from)];
    return true;
  }

  /** Every slot, for the overlay and the save. */
  toArray(): readonly Stack[] {
    return [...this.slots];
  }

  restore(slots: readonly Stack[], chosen: number): void {
    for (let slot = 0; slot < ALL_SLOTS; slot += 1) {
      const held = slots[slot];
      this.slots[slot] = held && itemKind(held.id) ? held : null;
    }
    this.choose(chosen);
  }
}
