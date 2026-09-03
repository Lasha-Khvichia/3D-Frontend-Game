import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import { publishStats } from "../ui/bridge";

/** Swaps between the player's eyes and the orbit camera that inspects the sky. */
export class CameraSwitcher {
  private firstPerson = true;

  constructor(
    private readonly scene: Scene,
    private readonly playerCamera: Camera,
    private readonly orbitCamera: ArcRotateCamera,
    private readonly miniMapCamera: Camera,
  ) {
    this.apply();
  }

  get isFirstPerson(): boolean {
    return this.firstPerson;
  }

  toggle(): void {
    this.firstPerson = !this.firstPerson;
    this.apply();
  }

  private apply(): void {
    if (this.firstPerson) {
      this.orbitCamera.detachControl();
      // Order matters: the last camera in the list draws on top.
      this.scene.activeCameras = [this.playerCamera, this.miniMapCamera];
      this.scene.activeCamera = this.playerCamera;
    } else {
      this.scene.activeCameras = [this.orbitCamera];
      this.scene.activeCamera = this.orbitCamera;
      this.orbitCamera.attachControl(true);
    }
    // Changes only on a key press, so a React render here costs nothing.
    publishStats({ firstPerson: this.firstPerson });
  }
}
