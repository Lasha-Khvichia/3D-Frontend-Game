import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { GrassSoil } from "../GrassField";
import { createFlowerMesh } from "./createFlowerMesh";
import { fillFlowers, FLOWER_CELL } from "./flowerPlaces";

/** Room for every flower that can stand within reach at the height of summer. */
const MOST = 900;
/** Rebuilt when the player has walked this far, or the season has moved this much. */
const WALKED = FLOWER_CELL / 2;
const OPENED = 0.03;

/**
 * Wildflowers through the spring and summer: one mesh, one draw call, drawn
 * only within a few dozen metres of the player.
 *
 * Nothing is remembered. Which square of ground carries a flower, what colour
 * it is and which way it faces are all hashed from the square itself, exactly
 * as a grass blade is, so the meadow is the same every time you walk back and
 * costs nothing to leave behind.
 */
export class Wildflowers {
  private readonly mesh: Mesh;
  private readonly matrices = new Float32Array(MOST * 16);
  private readonly colours = new Float32Array(MOST * 4);
  private readonly grown = new Vector3(Infinity, 0, Infinity);
  private shownOpen = -1;
  private shown = 0;

  constructor(
    scene: Scene,
    private readonly soil: GrassSoil,
    private readonly grassLeftAt: (x: number, z: number) => number,
  ) {
    this.mesh = createFlowerMesh(scene);
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices, 16, false);
    this.mesh.thinInstanceSetBuffer("color", this.colours, 4, false);
    this.mesh.setEnabled(false);
  }

  /** How many are drawn right now. */
  get count(): number {
    return this.shown;
  }

  /** `open` is the season's share of flowers out, 0 to 1. */
  update(eye: Vector3, open: number): void {
    const walked = Math.hypot(eye.x - this.grown.x, eye.z - this.grown.z);
    if (walked < WALKED && Math.abs(open - this.shownOpen) < OPENED) return;
    this.grown.copyFrom(eye);
    this.shownOpen = open;
    const { soil, matrices, colours } = this;
    const grown =
      open <= 0.01 ? 0 : fillFlowers(eye, open, soil, this.grassLeftAt, matrices, colours);
    this.shown = grown;
    this.mesh.setEnabled(grown > 0);
    this.mesh.thinInstanceCount = grown;
    this.mesh.thinInstanceBufferUpdated("matrix");
    this.mesh.thinInstanceBufferUpdated("color");
  }
}
