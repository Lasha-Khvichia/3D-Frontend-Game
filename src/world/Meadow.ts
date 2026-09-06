import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../core/WorldEntity";
import type { Footprint } from "./footprint";
import { swayGrassBlade } from "./createGrassBlade";
import { GrassField } from "./GrassField";
import { FAR_GRASS, NEAR_GRASS } from "./grassLayout";

/**
 * All the grass: a dense patch underfoot and a sparse one reaching to the
 * horizon.
 *
 * One patch alone cannot do both jobs. Dense grass has to stay small or it
 * costs everything, and a small patch ends in a hard edge with bare ground
 * beyond it, which is the first thing the eye finds when you look up.
 *
 * So there are two, both following the player. The near one is 40 m across at
 * 123 blades per square metre. The far one spreads the same order of blades
 * over 107 m, so it is thirteen per square metre — sparse standing in it, and
 * solid from any distance, because looking at the horizon you see grass at a
 * grazing angle and blades that stand well apart still overlap completely from
 * there. Its blades are drawn half as tall again, which also softens the join.
 */
export class Meadow extends WorldEntity {
  private readonly near: GrassField;
  private readonly far: GrassField;

  constructor(scene: Scene) {
    super();
    this.near = new GrassField(scene, NEAR_GRASS);
    this.far = new GrassField(scene, FAR_GRASS);
  }

  get id(): string {
    return "meadow";
  }

  /** Anything added here flattens the grass it walks through. */
  addPusher(node: TransformNode, bottomOffset = 0): void {
    this.near.addPusher(node, bottomOffset);
    // The far patch too: its blades are taller, so an unbent one standing where
    // the player is would poke up through them.
    this.far.addPusher(node, bottomOffset);
  }

  /** Ground where no grass grows, such as under a house or out of a trunk. */
  setExclusions(footprints: readonly Footprint[]): void {
    this.near.setExclusions(footprints);
    this.far.setExclusions(footprints);
  }

  update(seconds: number, focus: Vector3): void {
    this.near.update(seconds, focus);
    this.far.update(seconds, focus);
    // The breeze lives in the shared blade mesh, not in the transforms: five
    // vertices move and every blade in both patches follows, on the GPU, for
    // nothing. Both meshes go in one call because the clock advances inside it.
    swayGrassBlade([this.near.mesh, this.far.mesh], seconds);
  }

  override dispose(): void {
    this.near.mesh.dispose();
    this.far.mesh.dispose();
  }
}
