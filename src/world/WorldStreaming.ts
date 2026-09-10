import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { applyDistanceFog, MAX_RENDER_DISTANCE } from "./distanceFog";
import { HOUSE_DETAIL_RANGE, HOUSE_FITTINGS_RANGE } from "./houses/houseDistanceGroups";
import type { Boulders } from "./rocks/Boulders";
import { ShownByDistance, type DistanceGroup } from "./ShownByDistance";
import type { Terrain } from "./terrain/Terrain";

export type StreamedWorld = {
  readonly terrain: Terrain;
  readonly boulders: Boulders;
  readonly trees: readonly DistanceGroup[];
  readonly houses: {
    readonly bodies: DistanceGroup[];
    readonly details: DistanceGroup[];
    readonly fittings: DistanceGroup[];
  };
};

/**
 * Everything that depends on how far the player can see, kept in step.
 *
 * The render distance moves the fog, and the fog is what hides everything
 * past it — so past it nothing is kept: no ground, no stones, and trees and
 * houses switched off. Inside it, detail still falls away with distance: the
 * ground coarsens, stones stop at 250 m, houses lose their trim at 150 m and
 * their bolts and bars at 40 m.
 *
 * What remembers something is hidden, never thrown away: a door you left
 * open is still open when you walk back. What remembers nothing — ground,
 * stones — is rebuilt from the same numbers and comes back identical.
 */
export class WorldStreaming {
  private renderDistance = MAX_RENDER_DISTANCE;
  private readonly trees: ShownByDistance;
  private readonly houses: ShownByDistance;
  private readonly houseDetail: ShownByDistance;
  private readonly houseFittings: ShownByDistance;

  constructor(
    private readonly scene: Scene,
    private readonly world: StreamedWorld,
  ) {
    this.trees = new ShownByDistance(world.trees);
    this.houses = new ShownByDistance(world.houses.bodies);
    this.houseDetail = new ShownByDistance(world.houses.details);
    this.houseFittings = new ShownByDistance(world.houses.fittings);
  }

  setRenderDistance(metres: number): void {
    this.renderDistance = Math.min(metres, MAX_RENDER_DISTANCE);
    applyDistanceFog(this.scene, this.renderDistance);
    this.world.terrain.detail.setReach(this.renderDistance);
  }

  /** Builds everything around a point at once. Before the first frame, so it opens complete. */
  prime(eye: Vector3): void {
    this.world.terrain.detail.prime(eye);
    this.world.boulders.update(eye, this.renderDistance, Infinity);
    this.showAndHide(eye);
  }

  /** One step: a little building, and switching on and off whatever crossed a line. */
  update(eye: Vector3): void {
    this.world.terrain.detail.update(eye);
    this.world.boulders.update(eye, this.renderDistance);
    this.showAndHide(eye);
  }

  private showAndHide(eye: Vector3): void {
    this.trees.update(eye, this.renderDistance);
    this.houses.update(eye, this.renderDistance);
    this.houseDetail.update(eye, Math.min(HOUSE_DETAIL_RANGE, this.renderDistance));
    this.houseFittings.update(eye, Math.min(HOUSE_FITTINGS_RANGE, this.renderDistance));
  }
}
