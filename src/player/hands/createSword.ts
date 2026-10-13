import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { swordMetals } from "./swordMetals";
import { bladeParts, hiltParts } from "./swordParts";

/**
 * An arming sword: a tapering ridged blade, a blued cross-guard with brass
 * finials, a leather grip bound in brass wire, and a brass wheel pommel.
 *
 * Everything is Babylon's own shapes, so there is no winding to get wrong,
 * merged with its four materials kept into one mesh hanging off the camera.
 * The grip is the origin, blade up, so it turns about the hand holding it.
 */
export function createSword(scene: Scene): Mesh {
  const metal = swordMetals(scene);
  const parts = [...bladeParts(scene, metal), ...hiltParts(scene, metal)];
  const sword = Mesh.MergeMeshes(parts, true, true, undefined, false, true);
  if (!sword) throw new Error("the sword would not merge");
  sword.name = "sword";
  // A merged mesh comes back frozen, and this one hangs off a moving camera.
  sword.unfreezeWorldMatrix();
  return sword;
}
