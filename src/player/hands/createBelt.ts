import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Metres round the front of the waist, and the strap's own size. */
const ACROSS = 0.17;
const FORWARD = 0.15;
const LINKS = 13;

/**
 * A leather belt round the front of the waist, with a brass buckle.
 *
 * Only the front half: nobody sees their own back. Built from Babylon's own
 * boxes, a short length at a time round the curve and overlapping, so there are
 * no raw vertices to wind the wrong way. Two meshes, one per material.
 */
export function createBelt(scene: Scene): Mesh[] {
  const leather = new StandardMaterial("belt-leather", scene);
  leather.diffuseColor = new Color3(0.3, 0.18, 0.1);
  leather.specularColor = new Color3(0.08, 0.06, 0.04);

  const brass = new StandardMaterial("belt-brass", scene);
  brass.diffuseColor = new Color3(0.72, 0.53, 0.2);
  brass.specularColor = new Color3(0.45, 0.38, 0.22);

  const strap: Mesh[] = [];
  for (let link = 0; link < LINKS; link += 1) {
    const angle = -Math.PI * 0.62 + (Math.PI * 1.24 * link) / (LINKS - 1);
    const piece = CreateBox("belt", { width: 0.046, height: 0.048, depth: 0.012 }, scene);
    piece.position.set(Math.sin(angle) * ACROSS, 0, Math.cos(angle) * FORWARD);
    piece.rotation.y = angle;
    strap.push(piece);
  }
  const belt = Mesh.MergeMeshes(strap, true, true, undefined, false, false);
  if (!belt) throw new Error("the belt would not merge");
  belt.name = "belt";
  belt.material = leather;

  const buckle = CreateBox("buckle", { width: 0.05, height: 0.056, depth: 0.012 }, scene);
  buckle.position.set(0, 0, FORWARD + 0.006);
  buckle.material = brass;

  for (const mesh of [belt, buckle]) mesh.unfreezeWorldMatrix();
  return [belt, buckle];
}
