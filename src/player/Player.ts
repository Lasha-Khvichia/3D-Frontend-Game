import type { PlayerController } from "./PlayerController";
import type { ItemKeys } from "./itemKeys";

/** A player in the world: the bean, its camera, and the keys the world reads from it. */
export type Player = {
  readonly controller: PlayerController;
  /** True while the mini-map key is held. */
  wantsOverheadMap(): boolean;
  /**
   * The two interaction keys, each true once per press.
   *
   * Must be read before `update`, which drops any press nothing consumed so a
   * key cannot fire a step late.
   */
  takeOpeningKeys(): { readonly open: boolean; readonly lock: boolean };
  /** The number keys and the lantern key, each true once per press. */
  takeItemKeys(): ItemKeys;
  /** 1 while the player is asking to move, 0 while they stand still. */
  walkShare(): number;
  update(fixedDeltaSeconds: number): void;
  /** Once per drawn frame: smooths the view between steps. See `PlayerController.present`. */
  present(progress: number): void;
  dispose(): void;
};
