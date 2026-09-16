/** Share of crackles that are a log's deeper snap rather than a spark's tick. */
const SNAPS = 0.15;

/**
 * One crackle of a wood fire at `at`: most are a spark's tiny bright tick,
 * a few a log's louder, deeper snap. A burst of noise from a random place in
 * `noise`, shaped and gone in a few hundredths of a second.
 */
export function playCrackle(
  context: BaseAudioContext,
  into: AudioNode,
  noise: AudioBuffer,
  at: number,
): void {
  const snap = Math.random() < SNAPS;
  const tone = context.createBiquadFilter();
  tone.type = snap ? "bandpass" : "highpass";
  tone.frequency.value = snap ? 700 + Math.random() * 600 : 1800 + Math.random() * 2200;
  tone.Q.value = snap ? 1.5 : 0.7;
  const length = snap ? 0.05 + Math.random() * 0.05 : 0.008 + Math.random() * 0.03;
  const level = context.createGain();
  level.gain.setValueAtTime(0, at);
  level.gain.linearRampToValueAtTime(snap ? 0.9 : 0.35 + 0.5 * Math.random(), at + 0.001);
  level.gain.exponentialRampToValueAtTime(0.0001, at + length);
  const source = context.createBufferSource();
  source.buffer = noise;
  source.connect(tone).connect(level).connect(into);
  source.start(at, Math.random() * Math.max(0, noise.duration - 0.2));
  source.stop(at + length + 0.02);
}
