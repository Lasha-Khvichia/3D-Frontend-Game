import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

export const PLAYER_HEIGHT = 1.8;
export const PLAYER_RADIUS = 0.4;
/** Eye height above the ground, a little below the top of the head. */
export const PLAYER_EYE_HEIGHT = 1.62;

/** A capsule standing on the ground, with a collider that matches it. */
export function createPlayerBean(scene: Scene): Mesh {
  const bean = CreateCapsule(
    "player-bean",
    { height: PLAYER_HEIGHT, radius: PLAYER_RADIUS, tessellation: 16, subdivisions: 2 },
    scene,
  );

  const material = new StandardMaterial("player-bean-material", scene);
  material.diffuseColor = new Color3(0.86, 0.63, 0.34);
  material.specularColor = new Color3(0.12, 0.12, 0.12);
  material.emissiveColor = Color3.Black();
  bean.material = material;

  // A capsule is centred on its own origin, so half of it sits below.
  bean.position.set(0, PLAYER_HEIGHT / 2, 0);
  bean.ellipsoid = new Vector3(PLAYER_RADIUS, PLAYER_HEIGHT / 2, PLAYER_RADIUS);
  bean.checkCollisions = true;
  bean.isPickable = false;

  return bean;
}
