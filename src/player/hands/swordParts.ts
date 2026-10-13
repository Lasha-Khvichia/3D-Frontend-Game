import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Metres: blade, grip, and the blade's width at the guard and near the point. */
const BLADE = 0.74;
export const GRIP = 0.15;
const WIDE = 0.056;
const NARROW = 0.032;
/** How flat the blade is: a diamond cross-section pressed to this share of its width. */
const FLAT = 0.2;

type Metals = Record<"steel" | "blued" | "brass" | "leather", StandardMaterial>;

function placed(mesh: Mesh, material: StandardMaterial, y: number, x = 0): Mesh {
  mesh.position.set(x, y, 0);
  mesh.material = material;
  return mesh;
}

/**
 * The blade: a four-sided cylinder — a diamond in section — pressed flat, so
 * its ridge catches the light along its length as a real blade's does, where
 * a box is one grey plank. It tapers toward a point of the same section.
 */
export function bladeParts(scene: Scene, metal: Metals): Mesh[] {
  const base = GRIP / 2 + 0.034;
  const body = { height: BLADE, diameterTop: NARROW, diameterBottom: WIDE, tessellation: 4 };
  const tip = { height: 0.11, diameterTop: 0, diameterBottom: NARROW, tessellation: 4 };
  const blade = placed(CreateCylinder("blade", body, scene), metal.steel, base + BLADE / 2);
  const point = placed(CreateCylinder("point", tip, scene), metal.steel, base + BLADE + 0.055);
  for (const edge of [blade, point]) {
    edge.rotation.y = Math.PI / 4;
    edge.scaling.z = FLAT;
  }
  const collar = { width: WIDE * 0.9, height: 0.03, depth: 0.014 };
  return [blade, point, placed(CreateBox("ricasso", collar, scene), metal.steel, base + 0.004)];
}

/**
 * The hilt: a slim blued guard swept a little toward the blade with a brass
 * ball at each end, a leather grip bound in brass wire, and a brass wheel
 * pommel standing in the blade's plane with a button on top.
 */
export function hiltParts(scene: Scene, metal: Metals): Mesh[] {
  const parts: Mesh[] = [];
  for (const side of [-1, 1]) {
    const bar = { width: 0.1, height: 0.016, depth: 0.02 };
    const arm = placed(
      CreateBox("quillon", bar, scene),
      metal.blued,
      GRIP / 2 + 0.014,
      side * 0.05,
    );
    arm.rotation.z = side * 0.14;
    const ball = CreateSphere("finial", { diameter: 0.026, segments: 8 }, scene);
    parts.push(arm, placed(ball, metal.brass, GRIP / 2 + 0.022, side * 0.1));
  }
  const grip = { height: GRIP, diameterTop: 0.03, diameterBottom: 0.034, tessellation: 12 };
  parts.push(placed(CreateCylinder("grip", grip, scene), metal.leather, 0));
  for (const at of [-0.045, 0, 0.045]) {
    const wire = { height: 0.007, diameter: 0.037, tessellation: 12 };
    parts.push(placed(CreateCylinder("wire", wire, scene), metal.brass, at));
  }
  const disc = { height: 0.024, diameter: 0.058, tessellation: 16 };
  const wheel = placed(CreateCylinder("pommel", disc, scene), metal.brass, -GRIP / 2 - 0.026);
  wheel.rotation.x = Math.PI / 2;
  const button = CreateSphere("button", { diameter: 0.016, segments: 6 }, scene);
  return [...parts, wheel, placed(button, metal.brass, -GRIP / 2 - 0.058)];
}
