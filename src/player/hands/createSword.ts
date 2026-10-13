import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Metres: an arming sword, the blade about three times the grip. */
const BLADE = 0.78;
const GRIP = 0.16;

/**
 * A plain arming sword: a steel blade with a point, a brass cross-guard and
 * pommel, and a leather-wrapped grip.
 *
 * The grip sits at the origin, blade up, so the sword turns about the hand
 * holding it. Built from Babylon's own boxes, cylinders and a sphere, so there
 * are no raw vertices to wind the wrong way, and merged with its three
 * materials kept, so it is one mesh hanging off the camera.
 */
export function createSword(scene: Scene): Mesh {
  const steel = material(scene, "sword-steel", new Color3(0.62, 0.65, 0.7), 0.55);
  const brass = material(scene, "sword-brass", new Color3(0.7, 0.52, 0.2), 0.4);
  const leather = material(scene, "sword-grip", new Color3(0.24, 0.14, 0.08), 0.05);

  const blade = CreateBox("blade", { width: 0.05, height: BLADE, depth: 0.011 }, scene);
  blade.position.y = GRIP / 2 + 0.02 + BLADE / 2;
  blade.material = steel;

  // The point: the blade's own cross-section, turned to a diamond and pinched.
  const point = CreateCylinder(
    "point",
    { height: 0.09, diameterTop: 0, diameterBottom: 0.05, tessellation: 4 },
    scene,
  );
  point.position.y = blade.position.y + BLADE / 2 + 0.045;
  point.rotation.y = Math.PI / 4;
  point.scaling.z = 0.25;
  point.material = steel;

  const guard = CreateBox("guard", { width: 0.2, height: 0.026, depth: 0.034 }, scene);
  guard.position.y = GRIP / 2 + 0.01;
  guard.material = brass;

  const grip = CreateCylinder("grip", { height: GRIP, diameter: 0.032, tessellation: 10 }, scene);
  grip.material = leather;

  const pommel = CreateSphere("pommel", { diameter: 0.048, segments: 6 }, scene);
  pommel.position.y = -GRIP / 2 - 0.018;
  pommel.material = brass;

  const parts = [blade, point, guard, grip, pommel];
  const sword = Mesh.MergeMeshes(parts, true, true, undefined, false, true);
  if (!sword) throw new Error("the sword would not merge");
  sword.name = "sword";
  // A merged mesh comes back frozen, and this one hangs off a moving camera.
  sword.unfreezeWorldMatrix();
  return sword;
}

function material(scene: Scene, name: string, colour: Color3, shine: number): StandardMaterial {
  const made = new StandardMaterial(name, scene);
  made.diffuseColor = colour;
  made.specularColor = new Color3(shine, shine, shine);
  return made;
}
