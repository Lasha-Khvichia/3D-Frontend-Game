// Registers Mesh.thinInstance*. Nothing else pulls this in, and without it
// the whole thin-instance API is simply absent from Mesh at runtime.
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { BLADE_HEIGHT, createGrassBlade } from "./createGrassBlade";
import {
  BLADE_COUNT,
  CELL_SIZE,
  PATCH_CELLS,
  RECENTRE_STEP_CELLS,
  createBladeShape,
  shapeForCell,
} from "./grassLayout";

type Pusher = {
  readonly node: TransformNode;
  /** Distance from the node's position down to its underside. */
  readonly bottomOffset: number;
};

/** How close a pusher has to be before a blade starts leaning away. */
const PUSH_RADIUS = 1.15;
/** Lean of a blade at the very centre of a pusher, in radians. */
const MAX_LEAN = 1.2;
/** Seconds for a flattened blade to stand back up. */
const RECOVER_SECONDS = 0.5;
/**
 * A pusher stops touching the grass once its underside is this far above the
 * ground. Without it, jumping drags a flattened circle around under you.
 */
const LIFT_CLEARANCE = BLADE_HEIGHT;
const FLOATS_PER_MATRIX = 16;

/**
 * A patch of grass that follows the player.
 *
 * All 123,904 blades are thin instances of one mesh, so the field is a single
 * draw call. Their transforms live in one Float32Array; only the blades that
 * actually moved are re-uploaded each frame.
 *
 * The patch is a torus. A blade's slot in the buffer is its world cell modulo
 * the patch width, so sliding the patch only rewrites the rows and columns that
 * genuinely entered it. Rebuilding the whole field instead cost 6.7 ms at half
 * this density, which is a dropped frame every time you move a metre.
 *
 * Blades lean away from anything registered as a pusher. The ground is not one,
 * and nothing becomes one by accident: it has to be added by name.
 */
export class GrassField {
  readonly mesh: Mesh;

  private readonly matrices = new Float32Array(BLADE_COUNT * FLOATS_PER_MATRIX);
  private readonly lean = new Float32Array(BLADE_COUNT);
  private readonly leanX = new Float32Array(BLADE_COUNT);
  private readonly leanZ = new Float32Array(BLADE_COUNT);
  /** Blades that are bent or still standing back up. */
  private readonly moving = new Set<number>();
  private readonly pushers: Pusher[] = [];

  private originCellX = 0;
  private originCellZ = 0;

  private readonly shape = createBladeShape();
  private readonly scratchScale = new Vector3(1, 1, 1);
  private readonly scratchAxis = new Vector3(0, 0, 1);
  private readonly scratchPosition = new Vector3();
  private readonly scratchLeanTurn = new Quaternion();
  private readonly scratchYawTurn = new Quaternion();
  private readonly scratchTurn = new Quaternion();
  private readonly scratchMatrix = new Matrix();

  constructor(scene: Scene) {
    this.mesh = createGrassBlade(scene);
    for (let index = 0; index < BLADE_COUNT; index += 1) this.writeBlade(index);
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices, FLOATS_PER_MATRIX, false);
  }

  /**
   * Anything added here flattens the grass it walks through.
   *
   * `bottomOffset` is how far the object's underside sits below its own
   * position, so the grass knows when it has been lifted clear.
   */
  addPusher(node: TransformNode, bottomOffset = 0): void {
    this.pushers.push({ node, bottomOffset });
  }

  update(seconds: number, focus: Vector3): void {
    this.followFocus(focus);
    this.applyPushers();
    this.relaxAndUpload(seconds);
  }

  /** Slides the patch along with the player, in whole steps of several cells. */
  private followFocus(focus: Vector3): void {
    const half = PATCH_CELLS / 2;
    const step = RECENTRE_STEP_CELLS;
    const wantedX = Math.round(Math.floor(focus.x / CELL_SIZE) / step) * step - half;
    const wantedZ = Math.round(Math.floor(focus.z / CELL_SIZE) / step) * step - half;
    if (wantedX === this.originCellX && wantedZ === this.originCellZ) return;

    this.slideTo(wantedX, wantedZ);
    this.mesh.thinInstanceBufferUpdated("matrix");
  }

  /** Rewrites only the slots whose world cell changed. */
  private slideTo(nextX: number, nextZ: number): void {
    const shiftX = nextX - this.originCellX;
    const shiftZ = nextZ - this.originCellZ;
    const previousX = this.originCellX;
    const previousZ = this.originCellZ;
    this.originCellX = nextX;
    this.originCellZ = nextZ;

    // A jump longer than the patch replaces all of it anyway.
    if (Math.abs(shiftX) >= PATCH_CELLS || Math.abs(shiftZ) >= PATCH_CELLS) {
      for (let index = 0; index < BLADE_COUNT; index += 1) this.refreshSlot(index);
      return;
    }

    const firstColumn = shiftX > 0 ? previousX : nextX;
    for (let step = 0; step < Math.abs(shiftX); step += 1) {
      const column = wrapSlot(firstColumn + step);
      for (let row = 0; row < PATCH_CELLS; row += 1) {
        this.refreshSlot(row * PATCH_CELLS + column);
      }
    }

    const firstRow = shiftZ > 0 ? previousZ : nextZ;
    for (let step = 0; step < Math.abs(shiftZ); step += 1) {
      const rowStart = wrapSlot(firstRow + step) * PATCH_CELLS;
      for (let column = 0; column < PATCH_CELLS; column += 1) {
        this.refreshSlot(rowStart + column);
      }
    }
  }

  /** A slot that lands on new ground forgets whatever was standing on it. */
  private refreshSlot(index: number): void {
    this.lean[index] = 0;
    this.moving.delete(index);
    this.writeBlade(index);
  }

  private applyPushers(): void {
    for (const pusher of this.pushers) {
      const centre = pusher.node.position;

      // How much of the pusher is still down in the grass. Jump clear and it
      // stops touching anything, instead of dragging a flat circle with it.
      const lift = centre.y - pusher.bottomOffset;
      if (lift >= LIFT_CLEARANCE) continue;
      const groundedShare = 1 - Math.max(0, lift) / LIFT_CLEARANCE;

      const centreCellX = Math.floor(centre.x / CELL_SIZE);
      const centreCellZ = Math.floor(centre.z / CELL_SIZE);
      const reach = Math.ceil(PUSH_RADIUS / CELL_SIZE);

      for (let cellZ = centreCellZ - reach; cellZ <= centreCellZ + reach; cellZ += 1) {
        if (cellZ < this.originCellZ || cellZ >= this.originCellZ + PATCH_CELLS) continue;
        const rowStart = wrapSlot(cellZ) * PATCH_CELLS;
        for (let cellX = centreCellX - reach; cellX <= centreCellX + reach; cellX += 1) {
          if (cellX < this.originCellX || cellX >= this.originCellX + PATCH_CELLS) continue;
          this.pushBlade(rowStart + wrapSlot(cellX), centre, groundedShare);
        }
      }
    }
  }

  private pushBlade(index: number, centre: Vector3, groundedShare: number): void {
    const baseX = this.matrices[index * FLOATS_PER_MATRIX + 12] ?? 0;
    const baseZ = this.matrices[index * FLOATS_PER_MATRIX + 14] ?? 0;
    const awayX = baseX - centre.x;
    const awayZ = baseZ - centre.z;
    const distance = Math.hypot(awayX, awayZ);
    if (distance >= PUSH_RADIUS) return;

    // Fully flattened underfoot, easing off to nothing at the edge of reach.
    const strength = (1 - distance / PUSH_RADIUS) * groundedShare;
    if (strength <= (this.lean[index] ?? 0)) return;

    this.lean[index] = strength;
    const spread = distance > 1e-4 ? distance : 1;
    this.leanX[index] = awayX / spread;
    this.leanZ[index] = awayZ / spread;
    this.moving.add(index);
  }

  /** Stands bent blades back up and re-uploads only the span that changed. */
  private relaxAndUpload(seconds: number): void {
    if (this.moving.size === 0) return;

    const recovery = seconds / RECOVER_SECONDS;
    let lowest = BLADE_COUNT;
    let highest = -1;

    for (const index of this.moving) {
      const next = Math.max(0, (this.lean[index] ?? 0) - recovery);
      this.lean[index] = next;
      this.writeBlade(index);
      if (index < lowest) lowest = index;
      if (index > highest) highest = index;
      if (next <= 0) this.moving.delete(index);
    }

    const span = this.matrices.subarray(
      lowest * FLOATS_PER_MATRIX,
      (highest + 1) * FLOATS_PER_MATRIX,
    );
    this.mesh.thinInstancePartialBufferUpdate("matrix", span, lowest * FLOATS_PER_MATRIX);
  }

  private writeBlade(index: number): void {
    const column = index % PATCH_CELLS;
    const row = (index - column) / PATCH_CELLS;
    // The one world cell inside the patch whose slot is this one.
    const cellX = this.originCellX + wrapSlot(column - this.originCellX);
    const cellZ = this.originCellZ + wrapSlot(row - this.originCellZ);
    shapeForCell(cellX, cellZ, this.shape);

    this.scratchPosition.set(
      cellX * CELL_SIZE + this.shape.offsetX,
      0,
      cellZ * CELL_SIZE + this.shape.offsetZ,
    );
    this.scratchScale.set(1, this.shape.height, 1);

    const lean = this.lean[index] ?? 0;
    Quaternion.RotationYawPitchRollToRef(this.shape.yaw, 0, 0, this.scratchYawTurn);
    if (lean > 0) {
      // Tipping the blade towards a horizontal direction means turning about the
      // axis at right angles to it.
      this.scratchAxis.set(this.leanZ[index] ?? 0, 0, -(this.leanX[index] ?? 0));
      Quaternion.RotationAxisToRef(this.scratchAxis, lean * MAX_LEAN, this.scratchLeanTurn);
      // a.multiplyToRef(b) is the Hamilton product a * b, which applies b FIRST.
      // The lean axis is a world direction, so the blade's own yaw has to be
      // spent before it; the other order rotates the lean by each blade's yaw
      // and every blade falls a different way.
      this.scratchLeanTurn.multiplyToRef(this.scratchYawTurn, this.scratchTurn);
    } else {
      this.scratchTurn.copyFrom(this.scratchYawTurn);
    }

    Matrix.ComposeToRef(
      this.scratchScale,
      this.scratchTurn,
      this.scratchPosition,
      this.scratchMatrix,
    );
    this.scratchMatrix.copyToArray(this.matrices, index * FLOATS_PER_MATRIX);
  }
}

/** Maps a world cell onto its slot in the patch, for any sign. */
function wrapSlot(cell: number): number {
  return ((cell % PATCH_CELLS) + PATCH_CELLS) % PATCH_CELLS;
}
