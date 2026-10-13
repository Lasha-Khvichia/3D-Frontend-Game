import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { HeldItems } from "../player/hands/HeldItems";
import { slotAsked, type ItemKeys } from "../player/itemKeys";
import { publishStats, subscribeToCommands } from "../ui/bridge";
import type { SunGodRays } from "../world/SunGodRays";
import { Inventory } from "./Inventory";
import type { Stack } from "./slots";
import { toggleLantern } from "./toggleLantern";
import { topUpKit, type Kit } from "./topUpKit";

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

  /** Gives the kit, skipping what is already carried (`topUpKit`), and tells the overlay. */
  topUp(kit: Kit): void {
    topUpKit(this.inventory, kit);
    this.publish();
  }

  /** Nobody breaks ground with their hands. */
  get holdingHoe(): boolean {
    return this.inventory.mainHand?.id === "hoe";
  }

  /**
   * Where the carried lantern hangs, or null when none is out.
   *
   * The same three places `restPlaces` draws it in: the left hand, the bar, or
   * the belt. Light and lantern must agree, or one shows without the other.
   */
  get lanternAt(): Vector3 | null {
    const { offHand, mainHand, belt } = this.inventory;
    return [offHand, mainHand, belt].some((held) => held?.id === "lantern")
      ? this.held.lampPlace
      : null;
  }

  get flame() {
    return this.held.flame;
  }

  /** True on the one step a swung sword bites. */
  update(seconds: number, keys: ItemKeys, walkShare: number): boolean {
    const next = slotAsked(this.inventory.chosenSlot, keys);
    if (next !== this.inventory.chosenSlot) {
      this.inventory.choose(next);
      this.publish();
    }
    if (keys.lantern && toggleLantern(this.inventory)) this.publish();
    return this.held.update(seconds, this.inventory, walkShare, keys.attack);
  }

  /** Once per drawn frame: what hangs from the waist stays level as you look about. */
  present(): void {
    this.held.present();
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
