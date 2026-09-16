/**
 * Noise, made in code rather than loaded: every weather sound here starts as
 * one of these and is shaped by filters. White noise is the hiss of rain;
 * brown noise — each sample a small step from the last — is the low roar of
 * wind and thunder.
 */
export function whiteNoise(context: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    Math.floor(context.sampleRate * seconds),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  return buffer;
}

export function brownNoise(context: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    Math.floor(context.sampleRate * seconds),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  let level = 0;
  let loudest = 0;
  for (let i = 0; i < samples.length; i += 1) {
    // A leak back towards zero, so it wanders but never drifts off.
    level = (level + (Math.random() * 2 - 1) * 0.02) * 0.998;
    samples[i] = level;
    loudest = Math.max(loudest, Math.abs(level));
  }
  for (let i = 0; i < samples.length; i += 1) samples[i]! /= loudest || 1;
  return buffer;
}

/** A buffer played on a loop, started now, into `into`. */
export function loopNoise(
  context: BaseAudioContext,
  buffer: AudioBuffer,
  into: AudioNode,
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(into);
  source.start();
  return source;
}
