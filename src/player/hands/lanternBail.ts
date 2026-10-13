import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/**
 * The carrying handle: a bail bent over the top, in short straight lengths.
 *
 * Its ends must sit down on the cap and its span stay inside the lantern's own
 * width, or it reads as a broken crown hanging over the thing rather than a
 * handle fixed to it. The links overlap, which is what makes a line of boxes
 * look like one bent rod.
 */
export function lanternBail(scene: Scene, bodyHigh: number, bodyWide: number): Mesh[] {
  const links: Mesh[] = [];
  const [steps, radius] = [11, bodyWide * 0.45];
  const foot = bodyHigh / 2 + 0.03;
  const size = { width: 0.0065, height: 0.021, depth: 0.0065 };
  for (let step = 0; step < steps; step += 1) {
    const angle = Math.PI * (step / (steps - 1));
    const link = CreateBox("bail", size, scene);
    link.position.set(-Math.cos(angle) * radius, foot + Math.sin(angle) * radius, 0);
    link.rotation.z = angle + Math.PI / 2;
    links.push(link);
  }
  return links;
}
