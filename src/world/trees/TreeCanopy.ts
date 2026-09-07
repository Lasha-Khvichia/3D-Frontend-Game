// Registers Mesh.thinInstance*. Without it the whole API is absent from Mesh.
import "@babylonjs/core/Meshes/thinInstanceMesh";

import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import { createLeafBlade } from "./createLeafBlade";
import { Leaf } from "./Leaf";
import { composeLeafMatrix, createLeafScratch } from "./leafMatrix";
import type { LeafSpec } from "./scatterLeaves";

const FLOATS_PER_MATRIX = 16;

/**
 * Every leaf on one tree, in a single mesh drawn once.
 *
 * Four thousand leaves, four thousand `Leaf` entities, one draw call. A leaf
 * that changes re-uploads its own sixteen floats and nothing else.
 */
export class TreeCanopy extends WorldEntity {
  readonly mesh: Mesh;
  private readonly matrices: Float32Array;
  private readonly leaves: Leaf[];
  private readonly visible: Float32Array;
  private sizeScale = 1;

  private readonly scratch = createLeafScratch();

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
   * How many leaves are drawn, from the start of the buffer, and how big they
   * are. Leaves were scattered in random order, so the first half are spread
   * through the canopy rather than piled on one limb.
   */
  setDrawnCount(count: number, sizeScale: number): void {
    this.mesh.thinInstanceCount = Math.max(0, Math.min(this.leaves.length, Math.round(count)));
    if (sizeScale === this.sizeScale) return;
    this.sizeScale = sizeScale;
    // Every leaf: the whole canopy resizes together. The one expensive thing a
    // tree does at runtime, so only one tree may change tier per step.
    for (let index = 0; index < this.leaves.length; index += 1) this.writeLeaf(index);
    this.mesh.thinInstanceBufferUpdated("matrix");
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
    const size = spec.size * (this.visible[index] ?? 1) * this.sizeScale;
    composeLeafMatrix(spec, size, this.scratch).copyToArray(
      this.matrices,
      index * FLOATS_PER_MATRIX,
    );
  }
}
