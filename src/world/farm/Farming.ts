import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { GrassBlockerGrid } from "../GrassBlockerGrid";
import type { Meadow } from "../Meadow";
import { rectangleBlocker } from "../grassBlockers";
import { lookAtGround } from "../../player/aim/lookAtGround";
import type { Ground } from "../terrain/Ground";
import { canTillAt, whyNotTillable } from "./canTillAt";
import { TilledGround } from "./TilledGround";
import { TillTarget } from "./TillTarget";
import { cellAt, middleOf, SOIL_CELL, till } from "./tilledField";

/** Metres along the ground the hoe reaches: one stride in front of you. */
export const HOE_REACH = 1.5;
/** Half a square: the ground one swing covers. */
const HALF = SOIL_CELL / 2;

/**
 * Breaking ground: the square you are aiming at, and the soil on every square
 * already broken.
 *
 * You break the ground you are looking at, not the ground you stand on, and
 * the square is marked before you swing so there is never a guess about which
 * one it will be. `E` does it, the same key that works a shutter — the
 * shutters are offered it first, so standing at a window still opens it.
 */
export class Farming {
  readonly soil: TilledGround;
  private readonly target: TillTarget;
  private readonly aimed = new Vector3();

  constructor(
    scene: Scene,
    private readonly ground: Ground,
    private readonly grass: Meadow,
    private readonly blockers: GrassBlockerGrid,
  ) {
    this.soil = new TilledGround(scene, ground);
    this.target = new TillTarget(scene);
  }

  /** Lays the soil as it stands, before the first step runs. */
  prime(eye: Vector3): void {
    this.soil.relay(eye);
  }

  /** Returns the line to show the player, or an empty string for nothing to say. */
  update(
    eye: Vector3,
    facing: Vector3,
    pressed: boolean,
    snowDepth: number,
    holdingHoe: boolean,
  ): string {
    this.soil.update(eye);
    const aim = holdingHoe ? lookAtGround(eye, facing, this.ground, HOE_REACH, this.aimed) : null;
    if (!aim) {
      this.target.clear();
      return "";
    }

    const cellX = cellAt(aim.x);
    const cellZ = cellAt(aim.z);
    const x = middleOf(cellX);
    const z = middleOf(cellZ);
    const canBreak = canTillAt(this.ground, x, z, snowDepth);
    this.target.show(this.ground, cellX, cellZ, canBreak);
    if (!canBreak) return whyNotTillable(this.ground, x, z, snowDepth);
    if (pressed) this.breakGround(cellX, cellZ, eye);
    return pressed ? "" : "E  break the ground";
  }

  private breakGround(cellX: number, cellZ: number, eye: Vector3): void {
    if (!till(cellX, cellZ)) return;
    const x = middleOf(cellX);
    const z = middleOf(cellZ);
    this.blockers.add(
      rectangleBlocker({ minX: x - HALF, maxX: x + HALF, minZ: z - HALF, maxZ: z + HALF }),
    );
    // Only the blades over this square, never all two hundred thousand.
    this.grass.refreshArea(x - 1, z - 1, x + 1, z + 1);
    this.soil.relay(eye);
  }
}
