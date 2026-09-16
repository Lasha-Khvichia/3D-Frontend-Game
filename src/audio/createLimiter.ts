/** Output level where the soft ceiling starts to bend, and the room left above it. */
const BEND = 0.8;
const ROOM = 0.2;

/**
 * The last stage before the speakers, connected into `into`; returns the node
 * to feed. It leaves everything alone until the mix nears full scale, then
 * holds it there. A strike close by in a downpour adds a crack to rain and
 * wind that together would pass it and clip, which a browser does hard, as a
 * harsh crackle.
 *
 * Two parts: a compressor with the brakes on, and after it a soft ceiling for
 * the first milliseconds of a crack, which arrive faster than any compressor
 * reacts — measured, 11 samples got past the compressor alone.
 */
export function createLimiter(context: BaseAudioContext, into: AudioNode): AudioNode {
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.25;
  const ceiling = context.createWaveShaper();
  ceiling.curve = softCeiling();
  limiter.connect(ceiling).connect(into);
  return limiter;
}

/** Straight up to `BEND`, then easing into full scale, which nothing can pass. */
function softCeiling(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(2049);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    const size = Math.abs(x);
    const shaped = size <= BEND ? size : BEND + ROOM * Math.tanh((size - BEND) / ROOM);
    curve[i] = Math.sign(x) * shaped;
  }
  return curve;
}
