import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/** Each of the six faces; a room is small, so this is a centimetre a texel at the far wall. */
const MAP_SIZE = 512;
/** Metres: nothing casts nearer the flame than this, and the firelight ends before the far one. */
const NEAREST = 0.05;
const FURTHEST = 9;
const DEPTH_BIAS = 0.002;
const NORMAL_BIAS = 0.02;

/**
 * Shadows thrown by the firelight, only while the player is inside the house
 * whose fire holds it.
 *
 * A point light needs six shadow pictures, one each way. That is a price
 * worth paying for the room you stand in, where the fire is the only light
 * and your own shadow on the wall is plain to see, and nowhere else: from
 * outside the walls hide it all. So the pass is off outside, and inside it
 * draws only that house — walls, roof, door, shutters, hearth — and the
 * player. Every frame while on.
 */
export class FireShadows {
  private readonly shadows: ShadowGenerator;
  private shown = -1;

  /** `casters` holds each house's list, in the same order as the houses. */
  constructor(
    private readonly light: PointLight,
    private readonly casters: readonly (readonly AbstractMesh[])[],
  ) {
    light.shadowMinZ = NEAREST;
    light.shadowMaxZ = FURTHEST;
    // No camera, as for the sun: one keyed by the player's camera casts nothing in any other view.
    this.shadows = new ShadowGenerator(MAP_SIZE, light, false);
    // The only soft filter a cube map has; asking for PCF falls back to this anyway.
    this.shadows.usePoissonSampling = true;
    this.shadows.bias = DEPTH_BIAS;
    this.shadows.normalBias = NORMAL_BIAS;
    light.shadowEnabled = false;
  }

  /** Whether the pass runs this frame. */
  get isOn(): boolean {
    return this.light.shadowEnabled;
  }

  /** `house` is the one the player stands in, or -1 outside every house. */
  update(house: number): void {
    const on = house >= 0 && this.light.intensity > 0;
    if (this.light.shadowEnabled !== on) this.light.shadowEnabled = on;
    if (!on || house === this.shown) return;
    this.shown = house;
    const map = this.shadows.getShadowMap();
    if (map) map.renderList = [...(this.casters[house] ?? [])];
  }

  dispose(): void {
    this.shadows.dispose();
  }
}
