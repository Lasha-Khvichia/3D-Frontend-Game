import type { Scene } from "@babylonjs/core/scene";
import type { Stride } from "../player/StrideTracker";
import { readPaused } from "../ui/bridge";
import type { Underfoot } from "../world/GroundSurfaces";
import type { Strike } from "../world/weather/storm/lightningStrikes";
import { AmbientSounds } from "./AmbientSounds";
import { AudioPause } from "./AudioPause";
import { createLimiter } from "./createLimiter";
import { FootstepSound } from "./footsteps/FootstepSound";
import { brownNoise, whiteNoise } from "./noiseBuffers";
import { playThunder } from "./playThunder";
import type { SoundWorld } from "./soundWorld";

/** How far rain, wind and leaves dip while thunder rolls, so it is heard over them. */
const UNDER_THUNDER = 0.5;
/** Metres: a strike nearer than this shakes the house the player is in. */
const SHAKES_WITHIN = 1500;

/**
 * Every sound in the game, made in code with Web Audio — no sound files:
 * rain, wind, leaves, thunder, birds, crickets, a house's creaks, footsteps.
 *
 * Run on real time every drawn frame, not in the simulation step, and
 * silent while paused (`AudioPause`). Browsers keep sound off until the
 * player clicks or presses a key, so it starts at the first of either.
 */
export class SoundScape {
  private readonly context = new AudioContext();
  private readonly master = this.context.createGain();
  /** Rain, wind and leaves: one level, so thunder can lower them together. */
  private readonly weatherBus = this.context.createGain();
  private readonly ambient: AmbientSounds;
  private readonly steps: FootstepSound;
  private readonly rumble: AudioBuffer;
  private readonly hiss: AudioBuffer;
  private readonly pause: AudioPause;
  private volume = 0.7;

  constructor(
    scene: Scene,
    private readonly world: SoundWorld,
  ) {
    const context = this.context;
    this.master.gain.value = 0;
    this.master.connect(createLimiter(context, context.destination));
    this.weatherBus.connect(this.master);
    this.rumble = brownNoise(context, 12);
    this.hiss = whiteNoise(context, 2);
    this.ambient = new AmbientSounds(context, this.weatherBus, this.master, this.hiss);
    this.steps = new FootstepSound(context, this.master, this.hiss);
    this.pause = new AudioPause(context, this.master);
    const wake = (): void => void context.resume();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    scene.onBeforeRenderObservable.add(() => this.update());
  }

  /** Whether sound is playing yet: the browser holds it until a click or key. */
  get listening(): boolean {
    return this.context.state === "running";
  }

  /** 0 silent to 1 full, from the settings. */
  setVolume(volume: number): void {
    this.volume = volume;
  }

  /** Thunder for a strike, arriving when its sound would, with the rain dipping under it. */
  thunder(strike: Readonly<Strike>): void {
    if (!this.listening) return;
    const indoors = this.world.indoors();
    const peal = playThunder(
      this.context,
      this.master,
      this.rumble,
      this.hiss,
      strike.distance,
      indoors,
    );
    const level = this.weatherBus.gain;
    level.setTargetAtTime(UNDER_THUNDER, peal.start, 0.15);
    level.setTargetAtTime(1, peal.end, 0.8);
    if (strike.distance < SHAKES_WITHIN) this.ambient.shake(peal.start);
  }

  /** A footstep, a jump or a landing on this ground. */
  footstep(underfoot: Readonly<Underfoot>, stride: Stride): void {
    if (this.listening) this.steps.play(underfoot, stride);
  }

  private update(): void {
    if (readPaused()) return this.pause.hold();
    this.pause.release();
    if (!this.listening) return;
    this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.2);
    this.ambient.update(this.world);
  }
}
