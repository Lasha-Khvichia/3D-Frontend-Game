/** Seconds the sound takes to fade when the game pauses: cut dead, it clicks. */
const PAUSE_FADE = 0.1;

/**
 * Silence while the game is paused. The sound fades out, then the audio clock
 * is suspended, so every sound playing or scheduled — a crackle, a bird's
 * call, thunder on its way — waits where it is and carries on from there on
 * resume.
 */
export class AudioPause {
  /** Audio-clock time the fade ends and the clock can be stopped; null while playing. */
  private silentAt: number | null = null;

  constructor(
    private readonly context: AudioContext,
    private readonly master: GainNode,
  ) {}

  /**
   * Every paused frame. A click in the menu wakes the context, silently,
   * since the fade left the master at 0; the next frame suspends it again.
   */
  hold(): void {
    const { context } = this;
    if (context.state !== "running") return;
    const now = context.currentTime;
    if (this.silentAt === null) {
      this.silentAt = now + PAUSE_FADE;
      // A fifth of the fade at a time: under 1% is left when the clock stops.
      this.master.gain.setTargetAtTime(0, now, PAUSE_FADE / 5);
    } else if (now >= this.silentAt) {
      void context.suspend();
    }
  }

  /** Every playing frame: starts the clock again if a pause stopped it. */
  release(): void {
    if (this.silentAt === null) return;
    this.silentAt = null;
    void this.context.resume();
  }
}
