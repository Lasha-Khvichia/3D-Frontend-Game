import type { Inventory } from "./Inventory";

export type Kit = readonly { readonly id: string; readonly slot: number }[];

/**
 * Gives each thing in the kit that is not already carried: into its own slot
 * if that is free, otherwise the first free one.
 *
 * For a fresh game this places the whole kit. For a save written before a
 * thing was added to the kit — the sword came after the hoe — it hands over
 * only what is missing, and moves nothing the player has arranged.
 */
export function topUpKit(inventory: Inventory, kit: Kit): void {
  for (const thing of kit) {
    if (inventory.toArray().some((held) => held?.id === thing.id)) continue;
    if (inventory.at(thing.slot)) inventory.add(thing.id);
    else inventory.put(thing.slot, thing.id);
  }
}
