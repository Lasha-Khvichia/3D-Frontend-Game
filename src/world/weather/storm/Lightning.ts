import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { readPaused } from "../../../ui/bridge";
import type { SceneLighting } from "../../SceneLighting";
import type { WeatherMoment } from "../sampleWeather";
import type { WeatherKind } from "../weatherKinds";
import { LightningBolts } from "./LightningBolts";
import { createStrike, STRIKE_SLOT_HOURS, strikeInSlot, type Strike } from "./lightningStrikes";

/** Real seconds a bolt stays lit; the sky's flicker runs a little longer. */
const BOLT_SECONDS = 0.22;

export type StrikeListener = (strike: Readonly<Strike>) => void;

/**
 * Lightning: the strikes of a storm (`lightningStrikes.ts`), each lighting the
 * sky with a flicker and, if near enough, a bolt — and each told to anything
 * listening, which is how thunder follows at the speed of sound.
 */
export class Lightning {
  private readonly bolts: LightningBolts;
  private readonly strike = createStrike();
  private readonly moment: WeatherMoment = { kind: "clear", hail: false };
  private readonly listeners: StrikeListener[] = [];
  private slot = Number.NaN;
  private pending = false;
  private age = Number.POSITIVE_INFINITY;
  private power = 0;

  constructor(
    scene: Scene,
    private readonly eye: Vector3,
    private readonly weather: { readonly held: WeatherKind | null },
    private readonly light: SceneLighting,
    repaint: () => void,
  ) {
    this.bolts = new LightningBolts(scene);
    // Paused mid-flash, no step runs to end it, and the sky would stay lit.
    scene.onBeforeRenderObservable.add(() => {
      if (!readPaused() || this.power === 0) return;
      this.power = 0;
      this.bolts.hide();
      light.setFlash(0);
      repaint();
    });
  }

  /** For keeping out of the god-ray pass. */
  get meshes(): Mesh[] {
    return this.bolts.meshes;
  }

  onStrike(listener: StrikeListener): void {
    this.listeners.push(listener);
  }

  /** Every step. `seconds` is real time, which a flash runs on. */
  update(totalHours: number, seconds: number): void {
    const slot = Math.floor(totalHours / STRIKE_SLOT_HOURS);
    if (slot !== this.slot) {
      this.slot = slot;
      this.pending = strikeInSlot(slot, this.weather.held, this.moment, this.strike) !== null;
    }
    if (this.pending && totalHours >= this.strike.at) {
      this.pending = false;
      this.age = 0;
      this.power = this.strike.brightness;
      this.bolts.show(this.strike, this.eye);
      for (const listener of this.listeners) listener(this.strike);
    }
    this.age += seconds;
    const flash = flicker(this.age) * this.power;
    this.light.setFlash(flash);
    this.bolts.light(this.age < BOLT_SECONDS ? flash : 0);
  }
}

/** A real flash is not one pulse: bright, a dip, a second stroke, then fading. */
function flicker(age: number): number {
  if (age < 0.07) return 1;
  if (age < 0.13) return 0.25;
  if (age < 0.2) return 0.8;
  return Math.max(0, 0.8 * (1 - (age - 0.2) / 0.3));
}
