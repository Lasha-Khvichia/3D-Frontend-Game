import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { publishNotice } from "../ui/bridge";
import type { Ground } from "./terrain/Ground";
import { SHELF_WIDTH } from "./terrain/terrainConstants";

/**
 * How far out to sea the player may wade before being turned round.
 *
 * Short of the edge of the shelf on purpose: past the shelf the seabed drops
 * away too deep to wade, and a player stopped by deep water would be standing
 * in the sea with nothing to tell them why.
 */
const TURN_BACK_AT = -(SHELF_WIDTH - 15);
/** How far up the beach they are put back. */
const SET_DOWN_INLAND = 12;
const NOTICE = "You are too far from Land";
const NOTICE_SECONDS = 3.5;

type Traveller = {
  readonly bean: { readonly position: Vector3 };
  teleportTo(x: number, z: number, yaw: number): void;
};

/**
 * The edge of the world: wade far enough out to sea and you are put back on
 * the beach, facing the land, and told why.
 *
 * Measured in distance from the coast rather than from the middle of the map,
 * so the edge follows the island's shape — the same distance out from every
 * beach, bays and headlands included.
 */
export class WorldEdge {
  private noticeLeft = 0;

  constructor(private readonly ground: Ground) {}

  update(seconds: number, traveller: Traveller): void {
    if (this.noticeLeft > 0) {
      this.noticeLeft -= seconds;
      if (this.noticeLeft <= 0) publishNotice("");
    }

    const { x, z } = traveller.bean.position;
    if (this.ground.inlandAt(x, z) > TURN_BACK_AT) return;

    // Back along the line they came out on, towards the middle of the island,
    // until the ground is a beach worth standing on.
    const bearing = Math.atan2(x, z);
    let reach = Math.hypot(x, z);
    while (
      reach > 0 &&
      this.ground.inlandAt(Math.sin(bearing) * reach, Math.cos(bearing) * reach) < SET_DOWN_INLAND
    ) {
      reach -= 4;
    }
    // Facing inland: forward is (sin yaw, cos yaw), so the opposite bearing.
    traveller.teleportTo(Math.sin(bearing) * reach, Math.cos(bearing) * reach, bearing + Math.PI);
    publishNotice(NOTICE);
    this.noticeLeft = NOTICE_SECONDS;
  }
}
