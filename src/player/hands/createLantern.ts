import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { lanternGlass, lanternIron } from "./lanternParts";

/** The flame's colour, the same warm one every lantern in the village burns. */
export const LANTERN_FLAME = new Color3(1, 0.62, 0.3);

export type HeldLantern = {
  readonly root: TransformNode;
  /** Drive this to make it burn: black when out. */
  readonly flame: StandardMaterial;
};

/**
 * An old lantern: six panes of glass in an iron frame, a scrolled bracket at
 * the foot of every upright, a tapered cap with a finial, and a bail bent over
 * the top to carry it by.
 *
 * The ironwork merges into one mesh; the glass stays its own, because its
 * glow is turned up and down as the flame burns and a merged mesh has one
 * material for the lot.
 */
export function createLantern(scene: Scene): HeldLantern {
  const root = new TransformNode("lantern", scene);

  const iron = new StandardMaterial("lantern-iron", scene);
  iron.diffuseColor = new Color3(0.17, 0.14, 0.11);
  iron.specularColor = new Color3(0.26, 0.24, 0.2);

  const frame = Mesh.MergeMeshes(lanternIron(scene), true, true, undefined, false, false);
  if (!frame) throw new Error("the lantern would not merge");
  frame.name = "lantern-frame";
  frame.material = iron;
  // A merged mesh comes back frozen, and this one hangs off a moving camera.
  frame.unfreezeWorldMatrix();
  frame.parent = root;

  const flame = new StandardMaterial("lantern-flame", scene);
  flame.diffuseColor = new Color3(0.5, 0.4, 0.28);
  flame.specularColor = Color3.Black();
  flame.emissiveColor = Color3.Black();
  flame.alpha = 0.72;

  const glass = lanternGlass(scene);
  glass.material = flame;
  glass.parent = root;

  return { root, flame };
}
