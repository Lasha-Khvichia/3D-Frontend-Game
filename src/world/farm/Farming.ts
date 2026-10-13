import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { GrassBlockerGrid } from "../GrassBlockerGrid";
import type { Meadow } from "../Meadow";
import { rectangleBlocker } from "../grassBlockers";
import type { Ground } from "../terrain/Ground";
import { canTillAt, whyNotTillable } from "./canTillAt";
import { TilledGround } from "./TilledGround";
import { cellAt, middleOf, SOIL_CELL, till } from "./tilledField";

/** Half a square plus a little: the ground within arm's reach of your boots. */
const HALF = SOIL_CELL / 2;

/**
 * Breaking ground: the square under the player's feet, and the soil drawn on
 * every square already broken.
 *
 * The hoe is the player's own two hands for now — `E` on open ground, the same
 * key that works a shutter. The shutters are offered the key first, so
 * standing at a window still opens it rather than ploughing the doorstep.
 */
export class Farming {
  readonly soil: TilledGround;

  constructor(
    scene: Scene,
    private readonly ground: Ground,
    private readonly grass: Meadow,
    private readonly blockers: GrassBlockerGrid,
  ) {
    this.soil = new TilledGround(scene, ground);
  }

  /** Lays the soil as it stands, before the first step runs. */
  prime(eye: Vector3): void {
    this.soil.relay(eye);
  }

  /** Returns the line to show the player, or an empty string for nothing to say. */
  update(eye: Vector3, pressed: boolean, snowDepth: number): string {
    this.soil.update(eye);
    const x = eye.x;
    const z = eye.z;
    if (canTillAt(this.ground, x, z, snowDepth)) {
      if (pressed) this.breakGround(eye);
      return pressed ? "" : "E  break the ground";
    }
    return whyNotTillable(this.ground, x, z, snowDepth);
  }

  private breakGround(eye: Vector3): void {
    const cellX = cellAt(eye.x);
    const cellZ = cellAt(eye.z);
    if (!till(cellX, cellZ)) return;

    const middleX = middleOf(cellX);
    const middleZ = middleOf(cellZ);
    this.blockers.add(
      rectangleBlocker({
        minX: middleX - HALF,
        maxX: middleX + HALF,
        minZ: middleZ - HALF,
        maxZ: middleZ + HALF,
      }),
    );
    // Only the blades over this square, never all two hundred thousand.
    this.grass.refreshArea(middleX - 1, middleZ - 1, middleX + 1, middleZ + 1);
    this.soil.relay(eye);
  }
}
