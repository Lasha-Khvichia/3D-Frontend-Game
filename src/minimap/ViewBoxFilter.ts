import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Frustum } from "@babylonjs/core/Maths/math.frustum";
import { Plane } from "@babylonjs/core/Maths/math.plane";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/**
 * Which meshes a camera can see, for a render target to draw.
 *
 * A render target culls nothing by itself. Given the whole scene, the
 * mini-map's drew every mesh within the render distance — 144 to 263 draw
 * calls — where the camera it replaced, which culls, drew about 40.
 */
export class ViewBoxFilter {
  private readonly planes = [0, 1, 2, 3, 4, 5].map(() => new Plane(0, 0, 0, 0));

  constructor(private readonly camera: Camera) {}

  /** Takes the camera's view box as it stands now. */
  update(): void {
    this.camera.getViewMatrix(true);
    this.camera.getProjectionMatrix(true);
    Frustum.GetPlanesToRef(this.camera.getTransformationMatrix(), this.planes);
  }

  /** For `RenderTargetTexture.renderListPredicate`: shown, on the camera's layers, and in its box. */
  readonly accepts = (mesh: AbstractMesh): boolean =>
    mesh.isEnabled() &&
    mesh.isVisible &&
    (mesh.layerMask & this.camera.layerMask) !== 0 &&
    mesh.isInFrustum(this.planes);
}
