const VOICES = 3;
/** How loud one cricket is. */
const LOUDNESS = 0.045;
/** Seconds of chirps put on the clock ahead, so none are late at a slow frame. */
const AHEAD = 0.25;

type Cricket = { readonly level: GainNode; next: number };

/**
 * Crickets on a warm night: three of them, each a high note chopped into
 * quick pulses — three or four a chirp, about thirty a second, the way a
 * cricket's wing file works — chirping out of step with each other.
 */
export class CricketChorus {
  private readonly crickets: Cricket[] = [];

  constructor(
    private readonly context: BaseAudioContext,
    into: AudioNode,
  ) {
    for (let voice = 0; voice < VOICES; voice += 1) {
      const note = context.createOscillator();
      note.frequency.value = 4200 + Math.random() * 600;
      const level = context.createGain();
      level.gain.value = 0;
      const place = context.createStereoPanner();
      place.pan.value = (voice / (VOICES - 1)) * 1.6 - 0.8;
      note.connect(level).connect(place).connect(into);
      note.start();
      this.crickets.push({ level, next: 0 });
    }
  }

  update(activity: number, indoors: boolean): void {
    const now = this.context.currentTime;
    const loud = LOUDNESS * activity * (indoors ? 0.3 : 1);
    for (const cricket of this.crickets) {
      if (activity <= 0) {
        cricket.next = now;
        continue;
      }
      cricket.next = Math.max(cricket.next, now);
      while (cricket.next < now + AHEAD) {
        const pulses = 3 + Math.floor(Math.random() * 2);
        for (let pulse = 0; pulse < pulses; pulse += 1) {
          const at = cricket.next + pulse * 0.033;
          cricket.level.gain.setValueAtTime(loud, at);
          cricket.level.gain.setValueAtTime(0, at + 0.018);
        }
        cricket.next += 0.45 + Math.random() * 0.5;
      }
    }
  }
}
