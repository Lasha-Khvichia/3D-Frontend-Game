/** How loud one bird is, out in the open. */
const LOUDNESS = 0.11;

/**
 * Birdsong made in code: each call a few quick whistled notes, each note a
 * sine sweeping up or down, from somewhere left or right. Calls come faster
 * the busier the birds are (`activity`, 0 to 1) — thickest in the dawn chorus.
 */
export class BirdSong {
  private nextCall = 0;

  constructor(
    private readonly context: BaseAudioContext,
    private readonly into: AudioNode,
  ) {}

  update(activity: number, indoors: boolean): void {
    const now = this.context.currentTime;
    if (activity <= 0 || now < this.nextCall) return;
    this.call(now, activity, indoors);
    this.nextCall = now + (1.2 + Math.random() * 5) / (0.4 + activity);
  }

  private call(now: number, activity: number, indoors: boolean): void {
    const context = this.context;
    const place = context.createStereoPanner();
    place.pan.value = Math.random() * 2 - 1;
    const level = context.createGain();
    // A quiet time of year, or a grey day, has quieter birds as well as fewer.
    const busy = 0.4 + 0.6 * Math.min(1, activity * 3.3);
    level.gain.value = LOUDNESS * busy * (0.5 + 0.5 * Math.random()) * (indoors ? 0.25 : 1);
    level.connect(place).connect(this.into);
    const pitch = 2400 + Math.random() * 2600;
    const notes = 2 + Math.floor(Math.random() * 4);
    let at = now + 0.02;
    for (let note = 0; note < notes; note += 1) {
      const from = pitch * (0.85 + Math.random() * 0.3);
      const to = from * (Math.random() < 0.5 ? 1.25 : 0.8);
      const length = 0.05 + Math.random() * 0.1;
      const whistle = context.createOscillator();
      whistle.frequency.setValueAtTime(from, at);
      whistle.frequency.exponentialRampToValueAtTime(to, at + length);
      const shape = context.createGain();
      shape.gain.setValueAtTime(0, at);
      shape.gain.linearRampToValueAtTime(1, at + 0.01);
      shape.gain.linearRampToValueAtTime(0, at + length);
      whistle.connect(shape).connect(level);
      whistle.start(at);
      whistle.stop(at + length + 0.02);
      at += length + 0.03 + Math.random() * 0.08;
    }
  }
}
