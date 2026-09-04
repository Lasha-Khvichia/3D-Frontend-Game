import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { GroundMesh } from "@babylonjs/core/Meshes/groundMesh";
import type { Scene } from "@babylonjs/core/scene";

/** One world unit is one metre. */
export const GROUND_SIZE_METRES = 200;

/**
 * A flat ground plane at y = 0. One draw call, two triangles.
 */
export function createGround(scene: Scene): GroundMesh {
  // Subdividing a flat plane costs vertices and buys nothing. Raise this only
  // when the ground needs real height.
  const ground = CreateGround(
    "ground",
    { width: GROUND_SIZE_METRES, height: GROUND_SIZE_METRES, subdivisions: 1 },
    scene,
  );

  const material = new StandardMaterial("ground-material", scene);
  // Light bounces off this colour. A near-black ground reads as unlit no
  // matter how strong the sun or moon is, so it has to start mid-bright.
  // Beyond the grass patch this colour is all you see, so it has to pass for
  // grass on its own.
  // Grass green, at the same brightness the grey had, so night stays readable.
  material.diffuseColor = new Color3(0.3, 0.44, 0.24);
  // Specular on a large flat plane under a hemispheric light reads as a smear.
  material.specularColor = Color3.Black();
  ground.material = material;

  // The ground never moves, so skip the per-frame matrix recalculation.
  // Call unfreezeWorldMatrix() before moving or resizing it, or nothing happens.
  ground.checkCollisions = true;
  ground.receiveShadows = true;
  ground.freezeWorldMatrix();

  // The material is deliberately NOT frozen. A frozen material skips the check
  // that rebuilds its shader when the scene's light count changes, so it would
  // stop receiving light the moment the sun and moon are added.

  return ground;
}
