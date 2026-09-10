import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import { publishStats } from "../ui/bridge";

/** The mini-map, which shows in first person only. */
export type MiniMapView = { setShown(shown: boolean): void };

/** Swaps between the player's eyes and the orbit camera that inspects the sky. */
export class CameraSwitcher {
  private firstPerson = true;

  constructor(
    private readonly scene: Scene,
    private readonly playerCamera: Camera,
    private readonly orbitCamera: ArcRotateCamera,
    private readonly miniMap: MiniMapView,
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
      // The mini-map is not a camera on this list: it draws into its own
      // picture, 20 times a second, laid into the corner of every frame.
      this.scene.activeCameras = [this.playerCamera];
      this.scene.activeCamera = this.playerCamera;
    } else {
      this.scene.activeCameras = [this.orbitCamera];
      this.scene.activeCamera = this.orbitCamera;
      this.orbitCamera.attachControl(true);
    }
    this.miniMap.setShown(this.firstPerson);
    // Changes only on a key press, so a React render here costs nothing.
    publishStats({ firstPerson: this.firstPerson });
  }
}
