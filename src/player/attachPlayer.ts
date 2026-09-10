import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import { ORBIT_CAMERA_NAME } from "../scenes/createEmptyScene";
import { publishPaused, subscribeToCommands } from "../ui/bridge";
import { CameraSwitcher } from "./CameraSwitcher";
import { PlayerController } from "./PlayerController";
import { PlayerInput } from "./PlayerInput";
import type { Ground } from "../world/terrain/Ground";

/** Key that pops out to the orbit camera and back. */
const TOGGLE_VIEW_KEY = "KeyC";
/** Held to lift the mini-map camera from behind you to straight overhead. */
const OVERHEAD_MAP_KEY = "KeyT";
/** Opens and closes shutters. */
const OPEN_KEY = "KeyE";
/** Bars a door from inside, bolts a window. */
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
  update(fixedDeltaSeconds: number): void;
  dispose(): void;
};

/**
 * Puts a player in the scene: the bean, its camera, the controls, and the key
 * that swaps to the orbit camera.
 */
export function attachPlayer(
  scene: Scene,
  canvas: HTMLCanvasElement,
  miniMapCamera: Camera,
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
    miniMapCamera,
  );

  // Paused whenever the browser does not have the mouse, which is exactly what
  // Escape does. In the orbit view the mouse is free by design, so it is never
  // paused there.
  const publishPauseState = (): void => {
    publishPaused(switcher.isFirstPerson && !input.isPointerLocked);
  };
  input.onPointerLockChange = publishPauseState;
  publishPauseState();

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
    dispose(): void {
      unsubscribeCommands();
      input.dispose();
    },
  };
}
