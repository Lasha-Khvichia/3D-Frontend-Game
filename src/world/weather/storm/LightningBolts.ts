import { Constants } from "@babylonjs/core/Engines/constants";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { createBoltMesh } from "./createBoltMesh";
import { BOLT_SHAPES, type Strike } from "./lightningStrikes";

/** Further than this, rain and cloud hide the bolt: only the sky flashes. */
const SEEN_WITHIN = 6000;
/**
 * Metres out a bolt is drawn: inside the 1,300 m cloud veil so it shows in
 * front of the clouds, and scaled from there to look its true size — the same
 * trick that keeps the sun and moon inside the far plane.
 */
const DRAWN_AT = 1150;

/** The bolts themselves: one lit at a time, glowing, added to the picture. */
export class LightningBolts {
  readonly meshes: Mesh[];
  private readonly material: StandardMaterial;
  private lit: Mesh | null = null;

  constructor(scene: Scene) {
    const m = new StandardMaterial("lightning-material", scene);
    m.disableLighting = true;
    m.emissiveColor = new Color3(0.85, 0.9, 1);
    m.alphaMode = Constants.ALPHA_ADD;
    m.disableDepthWrite = true;
    m.backFaceCulling = false;
    m.fogEnabled = false;
    this.material = m;
    this.meshes = Array.from({ length: BOLT_SHAPES }, (_, shape) =>
      createBoltMesh(scene, shape, m),
    );
  }

  /** Puts up the bolt for a strike, if it is near enough to see. */
  show(strike: Readonly<Strike>, eye: Vector3): void {
    this.hide();
    if (strike.distance > SEEN_WITHIN) return;
    const drawn = Math.min(strike.distance, DRAWN_AT);
    const scale = drawn / strike.distance;
    const bolt = this.meshes[strike.shape]!;
    bolt.scaling.setAll(scale);
    // The foot of it just under the horizon, where the far ground meets the sky.
    bolt.position.set(
      eye.x + Math.sin(strike.bearing) * drawn,
      eye.y - 20 * scale,
      eye.z + Math.cos(strike.bearing) * drawn,
    );
    bolt.setEnabled(true);
    this.lit = bolt;
  }

  /** How bright the lit bolt is now; 0 puts it out. */
  light(amount: number): void {
    this.material.alpha = amount;
    if (amount <= 0) this.hide();
  }

  hide(): void {
    this.lit?.setEnabled(false);
    this.lit = null;
  }
}
