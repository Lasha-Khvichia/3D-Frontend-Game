import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { loopNoise, whiteNoise } from "./noiseBuffers";

/** A tree the leaves are heard from: where it stands, and whether it is a pine. */
export type RustlingTree = {
  readonly centreX: number;
  readonly centreZ: number;
  readonly species: string;
};

/** Metres: trees further than this are not heard over everything else. */
const REACH = 30;
/** How loud a stand of trees close by is in a strong wind. */
const LOUDEST = 0.14;
/** How much of that a still day's leaves still whisper. */
const STILL = 0.15;
/** Metres a second of wind at which the leaves are as loud as they get. */
const FULL_WIND = 12;
/** Needles hiss softer than leaves rustle. */
const NEEDLES = 0.6;

/**
 * Leaves rubbing in the wind, from the trees round the player: noise in the
 * leaves' high band, fluttering at random, louder with the wind and the
 * nearer the trees, from the side they stand on. Pines are softer and hiss
 * higher; under a roof it is a muffled murmur.
 */
export class LeafRustle {
  private readonly level: GainNode;
  private readonly tone: BiquadFilterNode;
  private readonly side: StereoPannerNode;
  private flutter = 1;
  private nextFlutter = 0;

  constructor(
    private readonly context: BaseAudioContext,
    into: AudioNode,
  ) {
    this.tone = context.createBiquadFilter();
    this.tone.type = "bandpass";
    this.tone.Q.value = 0.6;
    this.tone.frequency.value = 3000;
    this.level = context.createGain();
    this.level.gain.value = 0;
    this.side = context.createStereoPanner();
    this.tone.connect(this.level).connect(this.side).connect(into);
    loopNoise(context, whiteNoise(context, 3), this.tone);
  }

  /** `facing` is the camera's yaw: which way is left and right. */
  update(
    trees: readonly RustlingTree[],
    ear: Vector3,
    facing: number,
    wind: number,
    indoors: boolean,
  ): void {
    let leaves = 0;
    let needles = 0;
    let rightward = 0;
    for (const tree of trees) {
      const dx = tree.centreX - ear.x;
      const dz = tree.centreZ - ear.z;
      const away = Math.hypot(dx, dz);
      if (away >= REACH) continue;
      const near = (1 - away / REACH) ** 2;
      if (tree.species === "pine") needles += near;
      else leaves += near;
      // Right of the way the player faces is (cos, −sin) of the yaw.
      rightward += ((dx * Math.cos(facing) - dz * Math.sin(facing)) / Math.max(away, 1)) * near;
    }
    const now = this.context.currentTime;
    if (now >= this.nextFlutter) {
      this.flutter = 0.55 + 0.45 * Math.random();
      this.nextFlutter = now + 0.25 + Math.random() * 0.9;
    }
    const heard = Math.min(1, leaves + needles);
    const breeze = STILL + (1 - STILL) * Math.min(1, wind / FULL_WIND);
    const piney = needles / Math.max(0.001, leaves + needles);
    const soft = 1 - (1 - NEEDLES) * piney;
    const loud = LOUDEST * heard * soft * breeze * this.flutter * (indoors ? 0.3 : 1);
    this.level.gain.setTargetAtTime(loud, now, 0.25);
    this.tone.frequency.setTargetAtTime(indoors ? 900 : 2600 + 2400 * piney, now, 0.5);
    const pan = rightward / Math.max(0.001, leaves + needles);
    this.side.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, pan)), now, 0.3);
  }
}
