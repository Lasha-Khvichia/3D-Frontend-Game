import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Boar } from "./Boar";
import { createBoarParts, HIPS } from "./createBoarParts";

/** Room for every boar on the island. */
const MOST = 40;
/** How far a leg swings at a trot, and how far a rooting boar dips its head. */
const STRIDE = 0.55;
const ROOTING = 0.16;
/** A dead boar lies on its side. */
const FALLEN = 1.45;

const one = Vector3.One();
const turn = new Quaternion();
const at = new Vector3();
const root = new Matrix();
const hip = new Matrix();
const leg = new Matrix();

/**
 * Every boar on the island, drawn as thin instances of three parts.
 *
 * Rewritten whole each step: forty boars is a few kilobytes, nothing like the
 * grass, and every one of them may have moved. They are always drawn when
 * shown rather than culled by a box, since they wander far from where the
 * template stands and the box would have to be worked out again every step.
 */
export class BoarHerd {
  readonly meshes: readonly Mesh[];
  private readonly body: Mesh;
  private readonly leg: Mesh;
  private readonly tusks: Mesh;
  private readonly bodies = new Float32Array(MOST * 16);
  private readonly legs = new Float32Array(MOST * 4 * 16);
  private readonly tuskPairs = new Float32Array(MOST * 16);

  constructor(scene: Scene) {
    const parts = createBoarParts(scene);
    [this.body, this.leg, this.tusks] = [parts.body, parts.leg, parts.tusks];
    this.meshes = [this.body, this.leg, this.tusks];
    for (const mesh of this.meshes) {
      mesh.isPickable = false;
      mesh.checkCollisions = false;
      mesh.receiveShadows = true;
      mesh.alwaysSelectAsActiveMesh = true;
    }
    // Made once at full size and updated in place: a new buffer every step
    // would be a new GPU buffer every step.
    this.body.thinInstanceSetBuffer("matrix", this.bodies, 16, false);
    this.tusks.thinInstanceSetBuffer("matrix", this.tuskPairs, 16, false);
    this.leg.thinInstanceSetBuffer("matrix", this.legs, 16, false);
    for (const mesh of this.meshes) mesh.thinInstanceCount = 0;
  }

  /** Draws the boars given, and nothing else. */
  draw(boars: readonly Boar[]): void {
    const count = Math.min(boars.length, MOST);
    for (let index = 0; index < count; index += 1) {
      const boar = boars[index]!;
      const rooting = boar.mood === "root" ? ROOTING : 0;
      const fallen = boar.alive ? 0 : FALLEN;
      Quaternion.RotationYawPitchRollToRef(boar.heading, rooting, fallen, turn);
      at.set(boar.x, boar.y + (boar.alive ? Math.abs(Math.sin(boar.gait)) * 0.03 : 0.25), boar.z);
      Matrix.ComposeToRef(one, turn, at, root);
      root.copyToArray(this.bodies, index * 16);
      root.copyToArray(this.tuskPairs, index * 16);
      HIPS.forEach(([x, y, z], foot) => {
        const swing = boar.alive
          ? Math.sin(boar.gait + (foot === 0 || foot === 3 ? 0 : Math.PI)) * STRIDE
          : 0;
        Matrix.RotationXToRef(swing * Math.min(1, boar.speed / 2), hip);
        hip.setTranslationFromFloats(x, y, z);
        hip.multiplyToRef(root, leg);
        leg.copyToArray(this.legs, (index * 4 + foot) * 16);
      });
    }
    this.body.thinInstanceCount = count;
    this.tusks.thinInstanceCount = count;
    this.leg.thinInstanceCount = count * 4;
    for (const mesh of this.meshes) mesh.thinInstanceBufferUpdated("matrix");
  }
}
