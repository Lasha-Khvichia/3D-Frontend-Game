import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import { ORBIT_CAMERA_NAME } from "../scenes/createEmptyScene";
import { subscribeToCommands } from "../ui/bridge";
import { CameraSwitcher, type MiniMapView } from "./CameraSwitcher";
import { PlayerController } from "./PlayerController";
import { PlayerInput } from "./PlayerInput";
import { NO_ITEM_KEYS, takeItemKeys, type ItemKeys } from "./itemKeys";
import { reportPause } from "./reportPause";
import type { Ground } from "../world/terrain/Ground";

/** Key that pops out to the orbit camera and back. */
const TOGGLE_VIEW_KEY = "KeyC";
/** Held to lift the mini-map camera from behind you to straight overhead. */
const OVERHEAD_MAP_KEY = "KeyT";
/** Opens shutters and breaks ground; bars a door from inside, bolts a window. */
const OPEN_KEY = "KeyE";
const LOCK_KEY = "KeyF";

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

/**
 * Puts a player in the scene: the bean, its camera, the controls, and the key
 * that swaps to the orbit camera.
 */
export function attachPlayer(
  scene: Scene,
  canvas: HTMLCanvasElement,
  miniMap: MiniMapView,
  ground: Ground,
): Player {
  const orbitCamera = scene.getCameraByName(ORBIT_CAMERA_NAME);
  if (!orbitCamera) {
    throw new Error(`attachPlayer needs a camera named "${ORBIT_CAMERA_NAME}" in the scene`);
  }

  const input = new PlayerInput(canvas);
  const controller = new PlayerController(scene, input, ground);
  const switcher = new CameraSwitcher(
    scene,
    controller.camera,
    orbitCamera as ArcRotateCamera,
    miniMap,
  );

  const publishPauseState = reportPause(input, () => switcher.isFirstPerson);

  const unsubscribeCommands = subscribeToCommands((command) => {
    // Must run inside the click that sent it, or the browser refuses the lock.
    if (command.type === "resume") input.requestPointerLock();
  });

  return {
    controller,
    wantsOverheadMap: () => input.isHeld(OVERHEAD_MAP_KEY),
    takeOpeningKeys: () => ({
      // Nothing is within arm's reach from the orbit camera.
      open: switcher.isFirstPerson && input.consumePress(OPEN_KEY),
      lock: switcher.isFirstPerson && input.consumePress(LOCK_KEY),
    }),
    takeItemKeys: () => (switcher.isFirstPerson ? takeItemKeys(input) : NO_ITEM_KEYS),
    walkShare: () => (input.forward !== 0 || input.strafe !== 0 ? 1 : 0),
    update(fixedDeltaSeconds: number): void {
      if (input.consumePress(TOGGLE_VIEW_KEY)) {
        switcher.toggle();
        input.setPointerLockWanted(switcher.isFirstPerson);
        publishPauseState();
      }
      // Walking while looking through the orbit camera would be disorienting.
      if (switcher.isFirstPerson) controller.update(fixedDeltaSeconds);
      input.endStep();
    },
    present(progress: number): void {
      if (switcher.isFirstPerson) controller.present(progress);
    },
    dispose(): void {
      unsubscribeCommands();
      input.dispose();
    },
  };
}
