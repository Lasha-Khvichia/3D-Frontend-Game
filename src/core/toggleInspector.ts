import type { Scene } from "@babylonjs/core/scene";

/**
 * The inspector is roughly 1MB. The `import.meta.env.DEV` guard is compiled to
 * `false` in a production build, so the dynamic imports below are removed
 * entirely rather than shipped as a lazy chunk nobody loads.
 */
export async function toggleInspector(scene: Scene): Promise<void> {
  if (import.meta.env.DEV) {
    await import("@babylonjs/core/Debug/debugLayer");
    await import("@babylonjs/inspector");

    if (scene.debugLayer.isVisible()) {
      scene.debugLayer.hide();
      return;
    }
    await scene.debugLayer.show({ embedMode: true, overlay: true });
  }
}
