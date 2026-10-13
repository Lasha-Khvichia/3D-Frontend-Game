import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { lanternBail } from "./lanternBail";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Metres: the glass house, and the six uprights round it. */
export const BODY_HIGH = 0.17;
export const BODY_WIDE = 0.105;
const POSTS = 6;

/** The ironwork: base, cap, finial, corner posts and the ring they hang from. */
export function lanternIron(scene: Scene): Mesh[] {
  const parts: Mesh[] = [];

  const foot = CreateCylinder(
    "foot",
    {
      height: 0.022,
      diameterTop: BODY_WIDE * 1.15,
      diameterBottom: BODY_WIDE * 1.4,
      tessellation: POSTS,
    },
    scene,
  );
  foot.position.y = -BODY_HIGH / 2 - 0.011;
  parts.push(foot);

  const rim = CreateCylinder(
    "rim",
    { height: 0.012, diameter: BODY_WIDE * 1.22, tessellation: POSTS },
    scene,
  );
  rim.position.y = -BODY_HIGH / 2 + 0.006;
  parts.push(rim);

  const cap = CreateCylinder(
    "cap",
    {
      height: 0.045,
      diameterTop: BODY_WIDE * 0.3,
      diameterBottom: BODY_WIDE * 1.45,
      tessellation: POSTS,
    },
    scene,
  );
  cap.position.y = BODY_HIGH / 2 + 0.022;
  parts.push(cap);

  const finial = CreateSphere("finial", { diameter: 0.02, segments: 6 }, scene);
  finial.position.y = BODY_HIGH / 2 + 0.05;
  parts.push(finial);

  // Six uprights, and a scroll bracket at the foot of each: the decoration.
  for (let side = 0; side < POSTS; side += 1) {
    const angle = (side / POSTS) * Math.PI * 2;
    const x = (Math.cos(angle) * BODY_WIDE) / 2;
    const z = (Math.sin(angle) * BODY_WIDE) / 2;

    const post = CreateBox("post", { width: 0.009, height: BODY_HIGH, depth: 0.009 }, scene);
    post.position.set(x, 0, z);
    post.rotation.y = -angle;
    parts.push(post);

    const scroll = CreateBox("scroll", { width: 0.02, height: 0.008, depth: 0.008 }, scene);
    scroll.position.set(x * 1.15, -BODY_HIGH / 2 + 0.03, z * 1.15);
    scroll.rotation.set(0, -angle, 0.5);
    parts.push(scroll);
  }

  parts.push(...lanternBail(scene, BODY_HIGH, BODY_WIDE));
  return parts;
}

/** The glass itself: a six-sided house the flame sits in. */
export function lanternGlass(scene: Scene): Mesh {
  return CreateCylinder(
    "lantern-glass",
    { height: BODY_HIGH * 0.92, diameter: BODY_WIDE * 0.92, tessellation: POSTS },
    scene,
  );
}
