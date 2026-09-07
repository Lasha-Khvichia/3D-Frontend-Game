// Registers Mesh.thinInstance*. Without it the whole API is absent from Mesh.
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import { createLeafBlade } from "./createLeafBlade";
import { Leaf } from "./Leaf";
import type { LeafSpec } from "./scatterLeaves";

const FLOATS_PER_MATRIX = 16;
const UP = new Vector3(0, 1, 0);

/**
 * Every leaf on one tree, in a single mesh drawn once.
 *
 * Four thousand leaves, four thousand `Leaf` entities, one draw call. A leaf
 * that changes re-uploads its own sixteen floats and nothing else, which is how
 * the grass field carries two hundred thousand blades.
 */
export class TreeCanopy extends WorldEntity {
  readonly mesh: Mesh;
  private readonly matrices: Float32Array;
  private readonly leaves: Leaf[];
  private readonly visible: Float32Array;

  private readonly scratchScale = new Vector3();
  private readonly scratchAim = new Quaternion();
  private readonly scratchRoll = new Quaternion();
  private readonly scratchTurn = new Quaternion();
  private readonly scratchMatrix = new Matrix();

  constructor(
    scene: Scene,
    private readonly treeName: string,
    private readonly specs: readonly LeafSpec[],
    material: Material,
  ) {
    super();
    this.mesh = createLeafBlade(`${treeName}-leaves`, material, scene);

    this.matrices = new Float32Array(specs.length * FLOATS_PER_MATRIX);
    this.visible = new Float32Array(specs.length).fill(1);
    this.leaves = specs.map((spec, index) => new Leaf(this, index, spec));
    for (let index = 0; index < specs.length; index += 1) this.writeLeaf(index);
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices, FLOATS_PER_MATRIX, false);
  }

  get id(): string {
    return this.treeName;
  }

  get count(): number {
    return this.leaves.length;
  }

  leafAt(index: number): Leaf | undefined {
    return this.leaves[index];
  }

  /**
   * How many leaves are drawn, from the start of the buffer. The
   * level-of-detail lever: leaves were scattered in random order, so the first
   * half are spread through the canopy rather than piled on one limb.
   */
  setDrawnCount(count: number): void {
    this.mesh.thinInstanceCount = Math.max(0, Math.min(this.leaves.length, Math.round(count)));
  }

  setLeafScale(index: number, amount: number): void {
    if (index < 0 || index >= this.visible.length) return;
    this.visible[index] = amount;
    this.writeLeaf(index);
    const at = index * FLOATS_PER_MATRIX;
    this.mesh.thinInstancePartialBufferUpdate(
      "matrix",
      this.matrices.subarray(at, at + FLOATS_PER_MATRIX),
      at,
    );
  }

  override dispose(): void {
    this.mesh.dispose();
  }

  private writeLeaf(index: number): void {
    const spec = this.specs[index];
    if (!spec) return;
    const size = spec.size * (this.visible[index] ?? 1);

    Quaternion.FromUnitVectorsToRef(UP, spec.direction, this.scratchAim);
    Quaternion.RotationAxisToRef(UP, spec.roll, this.scratchRoll);
    // a.multiplyToRef(b) applies b first: spin about the stalk, then aim.
    this.scratchAim.multiplyToRef(this.scratchRoll, this.scratchTurn);
    this.scratchScale.set(size, size, size);
    Matrix.ComposeToRef(this.scratchScale, this.scratchTurn, spec.position, this.scratchMatrix);
    this.scratchMatrix.copyToArray(this.matrices, index * FLOATS_PER_MATRIX);
  }
}
