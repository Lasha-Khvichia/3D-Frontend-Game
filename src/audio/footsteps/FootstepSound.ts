import type { Underfoot } from "../../world/GroundSurfaces";
import type { Stride } from "../../player/StrideTracker";
import { playHit, playTone } from "./playHit";
import { CRUNCH_GRAIN, SQUELCH, STEP_RECIPES, THUD } from "./stepRecipes";

/** How loud the hardest ordinary step is. */
const LOUDEST = 0.4;
/** Seconds the grains of a crunch are spread over. */
const CRUNCH_SECONDS = 0.12;

/**
 * Footsteps, made in code: each step the recipe for the ground underfoot
 * (`stepRecipes.ts`), never twice alike — a little higher or lower, louder or
 * softer, and from the left foot then the right.
 */
export class FootstepSound {
  private rightFoot = false;

  constructor(
    private readonly context: BaseAudioContext,
    private readonly into: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  play(underfoot: Readonly<Underfoot>, stride: Stride): void {
    const { context, noise } = this;
    const at = context.currentTime + 0.005;
    const recipe = STEP_RECIPES[underfoot.surface];
    const landing = stride.kind === "land";
    this.rightFoot = !this.rightFoot;
    const side = context.createStereoPanner();
    side.pan.value = this.rightFoot ? 0.12 : -0.12;
    side.connect(this.into);
    const firm = underfoot.packed ? 0.85 : 1;
    const level =
      LOUDEST * stride.strength * firm * (landing ? 1.5 : 1) * (0.8 + Math.random() * 0.4);
    const pitch = (0.85 + Math.random() * 0.3) * (landing ? 0.8 : 1);
    for (const hit of recipe.hits) playHit(context, side, noise, at, hit, pitch, level);
    for (const tone of recipe.tones) playTone(context, side, at, tone, pitch, level);
    const grains = underfoot.packed ? Math.ceil(recipe.grains / 2) : recipe.grains;
    for (let grain = 0; grain < grains; grain += 1) {
      const when = at + Math.random() * CRUNCH_SECONDS;
      playHit(
        context,
        side,
        noise,
        when,
        CRUNCH_GRAIN,
        pitch * (0.8 + Math.random() * 0.4),
        level * Math.random(),
      );
    }
    const soft = underfoot.surface === "grass" || underfoot.surface === "dirt";
    if (underfoot.wet && soft) playHit(context, side, noise, at, SQUELCH, pitch, level);
    if (landing) playTone(context, side, at, THUD, 1, level);
  }
}
