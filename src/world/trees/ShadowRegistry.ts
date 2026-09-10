import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/** What the woodland needs from whoever owns the sun. */
export type ShadowRegistry = {
  addShadowCaster(mesh: AbstractMesh): void;
  removeShadowCaster(mesh: AbstractMesh): void;
};
