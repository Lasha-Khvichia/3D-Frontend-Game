/**
 * Every key the game listens for, and what it does.
 *
 * Written out by hand rather than read from the code: the keys live in five
 * different files, and a list that went looking for them would be a worse lie
 * than one somebody keeps up to date. If you add a key, add it here.
 */
export const CONTROLS: readonly { readonly keys: string; readonly does: string }[] = [
  { keys: "W A S D", does: "Walk. The arrow keys do the same" },
  { keys: "Shift", does: "Run" },
  { keys: "Space", does: "Jump" },
  { keys: "Mouse", does: "Look around" },
  { keys: "1 – 8", does: "Choose a slot on the bar" },
  { keys: "Tab", does: "Open the bag, and close it" },
  { keys: "L", does: "Move the lantern between your hand and your belt" },
  { keys: "E", does: "Open and close shutters. Break the ground with a hoe" },
  { keys: "F", does: "Bar a door from inside, bolt a window" },
  { keys: "C", does: "Step out to the orbit camera, and back" },
  { keys: "T", does: "Hold to lift the mini-map to straight overhead" },
  { keys: "M", does: "Open the world map" },
  { keys: "Escape", does: "Pause. Walking into a door opens it; no key needed" },
];
