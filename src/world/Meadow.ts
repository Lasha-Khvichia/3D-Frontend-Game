import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../core/WorldEntity";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { FINE_DETAIL_LAYER } from "./fineDetailLayer";
import type { GrassBlockerGrid } from "./GrassBlockerGrid";
import { swayGrassBlade } from "./createGrassBlade";
import { GrassField, type GrassSoil } from "./GrassField";
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
  private windStrength = 1;

  constructor(scene: Scene, soil: GrassSoil) {
    super();
    this.near = new GrassField(scene, NEAR_GRASS, soil);
    this.far = new GrassField(scene, FAR_GRASS, soil);
    // Kept off the mini-map. Together these two meshes are over a million
    // triangles, and the map was drawing every one of them into a 220 pixel
    // square, over a ground plane that is already green.
    for (const mesh of this.meshes) mesh.layerMask = FINE_DETAIL_LAYER;
  }

  get id(): string {
    return "meadow";
  }

  /** Both blade meshes, for the caller to keep out of passes that do not need them. */
  get meshes(): Mesh[] {
    return [this.near.mesh, this.far.mesh];
  }

  /** Anything added here flattens the grass it walks through. */
  addPusher(node: TransformNode, bottomOffset = 0): void {
    this.near.addPusher(node, bottomOffset);
    // The far patch too: its blades are taller, so an unbent one standing where
    // the player is would poke up through them.
    this.far.addPusher(node, bottomOffset);
  }

  /** Ground where no grass grows, such as under a house or out of a trunk. */
  setBlockers(blockers: GrassBlockerGrid): void {
    this.near.setBlockers(blockers);
    this.far.setBlockers(blockers);
  }

  update(seconds: number, focus: Vector3): void {
    this.near.update(seconds, focus);
    this.far.update(seconds, focus);
    // The breeze lives in the shared blade mesh, not in the transforms: five
    // vertices move and every blade in both patches follows, on the GPU, for
    // nothing. Both meshes go in one call because the clock advances inside it.
    swayGrassBlade([this.near.mesh, this.far.mesh], seconds, this.windStrength);
  }

  /** The weather's wind: 1 is the breeze the sway was tuned in, 4.5 m/s. */
  setWeather(weather: Readonly<{ wind: number }>): void {
    this.windStrength = Math.min(2.5, Math.max(0.25, weather.wind / 4.5));
  }

  override dispose(): void {
    this.near.mesh.dispose();
    this.far.mesh.dispose();
  }
}
