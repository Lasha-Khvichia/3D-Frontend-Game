import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Metres: the ash shaft, and the iron blade on the end of it. */
const SHAFT_LONG = 1.15;
const SHAFT_THICK = 0.028;

/**
 * A hoe: an ash shaft, an iron collar, and a blade set across the end of it.
 *
 * Built from Babylon's own boxes and cylinders rather than raw vertices, so
 * there is no winding to get wrong. Merged into two meshes, one per material,
 * because a held thing is drawn every frame and six meshes would be six draw
 * calls hanging in front of the camera.
 */
export function createHoe(scene: Scene): Mesh {
  const wood = new StandardMaterial("hoe-wood", scene);
  wood.diffuseColor = new Color3(0.42, 0.3, 0.18);
  wood.specularColor = new Color3(0.06, 0.05, 0.04);

  const iron = new StandardMaterial("hoe-iron", scene);
  iron.diffuseColor = new Color3(0.24, 0.24, 0.27);
  iron.specularColor = new Color3(0.3, 0.3, 0.32);

  const shaft = CreateCylinder(
    "shaft",
    {
      height: SHAFT_LONG,
      diameterTop: SHAFT_THICK * 0.86,
      diameterBottom: SHAFT_THICK,
      tessellation: 10,
    },
    scene,
  );
  shaft.material = wood;

  const collar = CreateCylinder(
    "collar",
    { height: 0.07, diameter: SHAFT_THICK * 1.5, tessellation: 10 },
    scene,
  );
  collar.position.y = -SHAFT_LONG / 2 + 0.05;
  collar.material = iron;

  const neck = CreateBox("neck", { width: 0.016, height: 0.1, depth: 0.016 }, scene);
  neck.position.set(0, -SHAFT_LONG / 2 - 0.02, 0.03);
  neck.rotation.x = -0.5;
  neck.material = iron;

  const blade = CreateBox("blade", { width: 0.16, height: 0.012, depth: 0.1 }, scene);
  blade.position.set(0, -SHAFT_LONG / 2 - 0.07, 0.085);
  blade.rotation.x = 0.28;
  blade.material = iron;

  const merged = Mesh.MergeMeshes([shaft, collar, neck, blade], true, true, undefined, false, true);
  if (!merged) throw new Error("the hoe would not merge");
  merged.name = "hoe";
  // A merged mesh comes back with its world matrix frozen, and this one is
  // hung off a camera that moves every frame.
  merged.unfreezeWorldMatrix();
  return merged;
}
