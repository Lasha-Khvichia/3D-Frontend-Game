/** One shaped burst of noise: a scuff, a click, a grain of crunch, a splash. */
export type Hit = {
  readonly filter: BiquadFilterType;
  readonly frequency: number;
  readonly q: number;
  /** Seconds after the foot comes down that it starts. */
  readonly delay: number;
  readonly attack: number;
  readonly decay: number;
  readonly gain: number;
  /** Where the filter has slid to by the end, for a splash that drops in pitch; 0 stays put. */
  readonly sweepTo: number;
};

/** A short pitched knock: the hollow of a wooden floor, the ring of ice, the thud of a landing. */
export type Tone = {
  readonly from: number;
  readonly to: number;
  readonly decay: number;
  readonly gain: number;
};

/** Plays one hit from a random place in `noise`, `pitch` times higher and `level` times louder. */
export function playHit(
  context: BaseAudioContext,
  into: AudioNode,
  noise: AudioBuffer,
  at: number,
  hit: Hit,
  pitch: number,
  level: number,
): void {
  const start = at + hit.delay;
  const end = start + hit.attack + hit.decay;
  const filter = context.createBiquadFilter();
  filter.type = hit.filter;
  filter.Q.value = hit.q;
  filter.frequency.setValueAtTime(hit.frequency * pitch, start);
  if (hit.sweepTo) filter.frequency.exponentialRampToValueAtTime(hit.sweepTo * pitch, end);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(hit.gain * level, start + hit.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  const source = context.createBufferSource();
  source.buffer = noise;
  source.connect(filter).connect(gain).connect(into);
  source.start(start, Math.random() * Math.max(0, noise.duration - 0.5));
  source.stop(end + 0.02);
}

/** Plays one tone, gliding from `from` to `to` as it dies away. */
export function playTone(
  context: BaseAudioContext,
  into: AudioNode,
  at: number,
  tone: Tone,
  pitch: number,
  level: number,
): void {
  const note = context.createOscillator();
  note.frequency.setValueAtTime(tone.from * pitch, at);
  note.frequency.exponentialRampToValueAtTime(tone.to * pitch, at + tone.decay);
  const gain = context.createGain();
  gain.gain.setValueAtTime(tone.gain * level, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.decay);
  note.connect(gain).connect(into);
  note.start(at);
  note.stop(at + tone.decay + 0.02);
}
