import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";

/** Swaps between the player's eyes and the orbit camera that inspects the sky. */
export class CameraSwitcher {
  private firstPerson = true;

  constructor(
    private readonly scene: Scene,
    private readonly playerCamera: Camera,
    private readonly orbitCamera: ArcRotateCamera,
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
      this.scene.activeCamera = this.playerCamera;
      return;
    }
    this.scene.activeCamera = this.orbitCamera;
    this.orbitCamera.attachControl(true);
  }
}
