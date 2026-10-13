import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { HeldItems } from "../player/hands/HeldItems";
import type { ItemKeys } from "../player/itemKeys";
import { publishStats, subscribeToCommands } from "../ui/bridge";
import type { SunGodRays } from "../world/SunGodRays";
import { Inventory } from "./Inventory";
import { BELT, OFF_HAND, type Stack } from "./slots";

/**
 * What the player is carrying, and what is drawn in their hands.
 *
 * One owner for both, because every change to the slots is a change to what is
 * on screen. React is told only when something actually moves, never every
 * step: the bar and the bag are state, and state written at frame rate is the
 * one thing the bridge exists to prevent.
 */
export class Carrying {
  readonly inventory = new Inventory();
  private readonly held: HeldItems;
  private readonly stop: () => void;

  constructor(scene: Scene, camera: Camera, godRays: SunGodRays) {
    this.held = new HeldItems(scene, camera, godRays);
    this.stop = subscribeToCommands((command) => {
      if (command.type === "choose-slot") this.inventory.choose(command.slot);
      else if (command.type === "move-item") this.inventory.move(command.from, command.to);
      else return;
      this.publish();
    });
  }

  /** Puts a kit where it belongs and tells the overlay. */
  start(kit: readonly { readonly id: string; readonly slot: number }[]): void {
    for (const thing of kit) this.inventory.put(thing.slot, thing.id);
    this.publish();
  }

  /** Nobody breaks ground with their hands. */
  get holdingHoe(): boolean {
    return this.inventory.mainHand?.id === "hoe";
  }

  /** Where the carried lantern hangs, or null when none is out. */
  get lanternAt(): Vector3 | null {
    const out = this.inventory.offHand?.id === "lantern" || this.inventory.belt?.id === "lantern";
    return out ? this.held.lampPlace : null;
  }

  get flame() {
    return this.held.flame;
  }

  update(seconds: number, keys: ItemKeys, walkShare: number): void {
    if (keys.chooseSlot !== null && keys.chooseSlot !== this.inventory.chosenSlot) {
      this.inventory.choose(keys.chooseSlot);
      this.publish();
    }
    if (keys.lantern && this.inventory.move(OFF_HAND, BELT)) this.publish();
    this.held.update(seconds, this.inventory, walkShare);
  }

  /** Every slot and which one is chosen, for the save. */
  get saved(): { slots: readonly Stack[]; chosen: number } {
    return { slots: this.inventory.toArray(), chosen: this.inventory.chosenSlot };
  }

  restore(slots: readonly Stack[], chosen: number): void {
    this.inventory.restore(slots, chosen);
    this.publish();
  }

  dispose(): void {
    this.stop();
  }

  private publish(): void {
    publishStats({
      inventory: this.inventory.toArray(),
      chosenSlot: this.inventory.chosenSlot,
    });
  }
}
