// Registers Mesh.thinInstance*. Nothing else pulls it in, and without it the
// whole thin-instance API is simply absent from Mesh at runtime.
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { BranchSpec } from "./branchSpec";
import { Branch } from "./Branch";
import { createBranchSegment } from "./createBranchSegment";

const FLOATS_PER_MATRIX = 16;
const UP = new Vector3(0, 1, 0);

/**
 * All the wood in one tree: a single mesh drawn once, however many branches.
 *
 * Every branch is a thin instance of one tapered segment, so the whole tree's
 * timber is one draw call. The transforms live in a single Float32Array and
 * only the branch that actually changed is re-uploaded, which is the same
 * arrangement the grass field uses for two hundred thousand blades.
 */
export class TreeBranches extends WorldEntity {
  readonly mesh: Mesh;
  private readonly matrices: Float32Array;
  private readonly handles: Branch[];
  private readonly visible: Float32Array;

  private readonly scratchScale = new Vector3();
  private readonly scratchTurn = new Quaternion();
  private readonly scratchMatrix = new Matrix();

  constructor(
    scene: Scene,
    private readonly treeName: string,
    private readonly specs: readonly BranchSpec[],
    material: Material,
  ) {
    super();
    this.mesh = createBranchSegment(`${treeName}-branches`, scene);
    this.mesh.material = material;
    this.mesh.receiveShadows = true;

    this.matrices = new Float32Array(specs.length * FLOATS_PER_MATRIX);
    this.visible = new Float32Array(specs.length).fill(1);
    this.handles = specs.map((spec, index) => new Branch(this, index, spec));
    for (let index = 0; index < specs.length; index += 1) this.writeBranch(index);
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices, FLOATS_PER_MATRIX, false);
  }

  get id(): string {
    return this.treeName;
  }

  get count(): number {
    return this.handles.length;
  }

  branchAt(index: number): Branch | undefined {
    return this.handles[index];
  }

  /** 1 is the branch as grown, 0 removes it. Anything between thins it. */
  setBranchScale(index: number, amount: number): void {
    if (index < 0 || index >= this.visible.length) return;
    this.visible[index] = amount;
    this.writeBranch(index);
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

  /** Composes one branch's transform: stand it up, point it, put it in place. */
  private writeBranch(index: number): void {
    const spec = this.specs[index];
    if (!spec) return;
    const amount = this.visible[index] ?? 1;
    const length = Vector3.Distance(spec.start, spec.end);
    const direction = spec.end.subtract(spec.start).normalize();

    Quaternion.FromUnitVectorsToRef(UP, direction, this.scratchTurn);
    this.scratchScale.set(spec.radius * amount, length * amount, spec.radius * amount);
    Matrix.ComposeToRef(this.scratchScale, this.scratchTurn, spec.start, this.scratchMatrix);
    this.scratchMatrix.copyToArray(this.matrices, index * FLOATS_PER_MATRIX);
  }
}
