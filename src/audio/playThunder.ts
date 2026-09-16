/** Metres a second: sound in air. Thunder arrives this long after its flash. */
export const SPEED_OF_SOUND = 343;
/** Nearer than this a strike cracks before it rumbles. */
const CRACKS_WITHIN = 1500;
/** How much the middle of the rumble is lifted, so a laptop's small speakers can play it. */
const MIDDLE_LIFT = 10;

/** When a peal is heard, on the context's clock: from its first sound to its last. */
export type Peal = { readonly start: number; readonly end: number };

/**
 * One peal of thunder for a strike this far away, starting when its sound
 * would arrive.
 *
 * Near thunder is a sharp crack and a bright, heavy roll; far thunder is a
 * darker, longer rumble, because the air takes the high notes off and the
 * sound arrives from the whole length of the bolt at once. The roll swells
 * and falls at random, as thunder does. Much of a real rumble is too low for
 * small speakers, so a band in its middle is lifted: thunder must be heard.
 */
export function playThunder(
  context: BaseAudioContext,
  into: AudioNode,
  rumble: AudioBuffer,
  hiss: AudioBuffer,
  distance: number,
  indoors: boolean,
): Peal {
  const start = context.currentTime + distance / SPEED_OF_SOUND;
  const near = Math.min(1, Math.max(0, 1 - distance / 3000));
  const loud = 0.95 * Math.min(1, 3100 / (distance + 1000)) * (indoors ? 0.7 : 1);
  const length = 2.5 + (3 * distance) / 4000 + Math.random() * 1.5;

  const level = context.createGain();
  level.gain.setValueAtTime(0, start);
  level.gain.linearRampToValueAtTime(loud, start + (near > 0.3 ? 0.03 : 0.4));
  for (let at = start + 0.4; at < start + length; at += 0.15 + Math.random() * 0.35) {
    level.gain.linearRampToValueAtTime(loud * (0.3 + 0.7 * Math.random()), at);
  }
  level.gain.linearRampToValueAtTime(0, start + length + 0.8);
  level.connect(into);

  const low = context.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = indoors ? 300 : 350 + 1500 * near;
  const middle = context.createBiquadFilter();
  middle.type = "bandpass";
  middle.frequency.value = indoors ? 350 : 500;
  middle.Q.value = 0.8;
  const lift = context.createGain();
  lift.gain.value = MIDDLE_LIFT;
  const source = context.createBufferSource();
  source.buffer = rumble;
  source.connect(low).connect(level);
  source.connect(middle).connect(lift).connect(level);
  source.start(start, Math.random() * Math.max(0, rumble.duration - length - 1));
  source.stop(start + length + 1);

  if (distance < CRACKS_WITHIN && !indoors) crack(context, into, hiss, start, loud * near);
  return { start, end: start + length + 0.8 };
}

/** The split-second tearing crack of a strike close by, before its roll. */
function crack(
  context: BaseAudioContext,
  into: AudioNode,
  hiss: AudioBuffer,
  start: number,
  loud: number,
): void {
  const bright = context.createBiquadFilter();
  bright.type = "highpass";
  bright.frequency.value = 1500;
  const level = context.createGain();
  level.gain.setValueAtTime(0, start);
  level.gain.linearRampToValueAtTime(loud, start + 0.005);
  level.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
  const source = context.createBufferSource();
  source.buffer = hiss;
  source.connect(bright).connect(level).connect(into);
  source.start(start);
  source.stop(start + 0.35);
}
