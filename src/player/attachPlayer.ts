import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import { ORBIT_CAMERA_NAME } from "../scenes/createEmptyScene";
import { CameraSwitcher } from "./CameraSwitcher";
import { PlayerController } from "./PlayerController";
import { PlayerInput } from "./PlayerInput";

/** Key that pops out to the orbit camera and back. */
const TOGGLE_VIEW_KEY = "KeyC";
/** Held to lift the mini-map camera from behind you to straight overhead. */
const OVERHEAD_MAP_KEY = "KeyT";

export type Player = {
  readonly controller: PlayerController;
  /** True while the mini-map key is held. */
  wantsOverheadMap(): boolean;
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
): Player {
  const orbitCamera = scene.getCameraByName(ORBIT_CAMERA_NAME);
  if (!orbitCamera) {
    throw new Error(`attachPlayer needs a camera named "${ORBIT_CAMERA_NAME}" in the scene`);
  }

  const input = new PlayerInput(canvas);
  const controller = new PlayerController(scene, input);
  const switcher = new CameraSwitcher(
    scene,
    controller.camera,
    orbitCamera as ArcRotateCamera,
    miniMapCamera,
  );

  return {
    controller,
    wantsOverheadMap: () => input.isHeld(OVERHEAD_MAP_KEY),
    update(fixedDeltaSeconds: number): void {
      if (input.consumePress(TOGGLE_VIEW_KEY)) {
        switcher.toggle();
        input.setPointerLockWanted(switcher.isFirstPerson);
      }
      // Walking while looking through the orbit camera would be disorienting.
      if (switcher.isFirstPerson) controller.update(fixedDeltaSeconds);
      input.endStep();
    },
    dispose(): void {
      input.dispose();
    },
  };
}
