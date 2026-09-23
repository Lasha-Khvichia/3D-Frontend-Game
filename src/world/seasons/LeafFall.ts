import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";
import { createLeafBlade } from "../trees/createLeafBlade";
import type { Tree } from "../trees/Tree";
import { createFalling, dropLeaf, giveToTree, type Falling } from "./fallingLeaf";
import { leafColourAt } from "./leafColours";
import type { SeasonLook } from "./seasonLook";

/** Leaves in the air at the height of the fall, and how far off they are still drawn. */
const MOST = 220;
const REACH = 45;
/** How fast a falling leaf turns over, and how big it is: the size of one on a twig. */
const TURNS = 1.6;
const SIZE = 0.32;
/** The list of trees near the player is gathered again after this many metres. */
const WALKED = 6;

/**
 * Leaves coming down in autumn, from the trees they come off.
 *
 * Each falls out of a real canopy and is given back to another tree when it
 * lands, so nothing is remembered and the wood can be walked away from. They
 * move on the step's seconds, which are real seconds, so they hold still with
 * everything else while the game is paused.
 */
export class LeafFall {
  private readonly mesh: Mesh;
  private readonly material: StandardMaterial;
  private readonly colour = new Color3();
  private readonly matrices = new Float32Array(MOST * 16);
  private readonly leaves = Array.from({ length: MOST }, createFalling);
  private readonly turn = new Quaternion();
  private readonly size = new Vector3(SIZE, SIZE, SIZE);
  private readonly placed = new Matrix();
  private readonly gathered = new Vector3(Infinity, 0, Infinity);
  private near: Tree[] = [];
  private clock = 0;

  constructor(
    scene: Scene,
    private readonly trees: readonly Tree[],
  ) {
    this.material = new StandardMaterial("falling-leaf", scene);
    this.material.specularColor = Color3.Black();
    this.material.backFaceCulling = false;
    this.mesh = createLeafBlade("falling-leaf", this.material, scene);
    this.mesh.layerMask = FINE_DETAIL_LAYER;
    this.mesh.alwaysSelectAsActiveMesh = true;
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices, 16, false);
    this.mesh.setEnabled(false);
  }

  /** How many leaves are in the air. */
  get count(): number {
    return this.mesh.thinInstanceCount;
  }

  update(seconds: number, eye: Vector3, look: SeasonLook): void {
    const falling = Math.round(MOST * look.fall);
    this.mesh.setEnabled(falling > 0);
    this.mesh.thinInstanceCount = falling;
    if (falling === 0) return;
    this.clock += seconds;
    this.gather(eye);
    leafColourAt("birch", look, this.colour);
    this.material.diffuseColor.copyFrom(this.colour);
    for (let index = 0; index < falling; index += 1)
      this.place(this.leaves[index]!, index, seconds);
    this.mesh.thinInstanceBufferUpdated("matrix");
  }

  private place(leaf: Falling, index: number, seconds: number): void {
    if (leaf.at.y < leaf.ground) giveToTree(leaf, this.near);
    else dropLeaf(leaf, seconds, this.clock);
    const spin = this.clock * TURNS + leaf.spin;
    Quaternion.RotationYawPitchRollToRef(spin, Math.sin(spin) * 0.9, spin * 0.6, this.turn);
    const placed = Matrix.ComposeToRef(this.size, this.turn, leaf.at, this.placed);
    placed.copyToArray(this.matrices, index * 16);
  }

  /** The trees a leaf may come off: those near enough for one to be seen falling. */
  private gather(eye: Vector3): void {
    if (Math.hypot(eye.x - this.gathered.x, eye.z - this.gathered.z) < WALKED) return;
    this.gathered.copyFrom(eye);
    this.near = this.trees.filter(
      (tree) => Math.hypot(tree.centreX - eye.x, tree.centreZ - eye.z) < REACH,
    );
  }
}
