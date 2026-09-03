import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** How far the discs orbit from the origin. Well beyond the ground and camera. */
export const CELESTIAL_DISTANCE = 800;

export type CelestialDiscOptions = {
  readonly name: string;
  readonly diameter: number;
};

export type CelestialDisc = {
  readonly mesh: Mesh;
  readonly material: StandardMaterial;
};

/**
 * A body in the sky: an unlit sphere that carries its own colour. The scene's
 * glow layer turns its emissive colour into a halo.
 */
export function createCelestialDisc(scene: Scene, options: CelestialDiscOptions): CelestialDisc {
  const mesh = CreateSphere(options.name, { diameter: options.diameter, segments: 16 }, scene);
  mesh.isPickable = false;
  mesh.applyFog = false;
  mesh.receiveShadows = false;

  const material = new StandardMaterial(`${options.name}-material`, scene);
  // The body is its own light. Shading it would make it a grey ball.
  material.disableLighting = true;
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();
  material.emissiveColor = new Color3(1, 1, 1);
  mesh.material = material;

  return { mesh, material };
}
