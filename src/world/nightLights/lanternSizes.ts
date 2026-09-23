/** Metres from a door lantern's glass back to the wall's face. */
export const DOOR_LANTERN_OUT = 0.22;
/** A post lantern's glass above the ground. */
export const POST_LANTERN_HEIGHT = 2.43;
/** The glass: square across, and tall. */
const GLASS = 0.15;
const GLASS_TALL = 0.2;
const POST_THICK = 0.13;
const ROD = 0.025;
const ARM = 0.03;

type Box = { x: number; y: number; z: number; width: number; height: number; depth: number };
const box = (
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth = width,
): Box => ({
  x,
  y,
  z,
  width,
  height,
  depth,
});

/** The glowing glass of a lantern whose glass is centred here. */
export function glassBox(x: number, y: number, z: number): Box {
  return box(x, y, z, GLASS, GLASS_TALL);
}

/** The iron round the glass: a cap and a knob on top, a base, and a rod at each corner. */
export function cageBoxes(x: number, y: number, z: number): Box[] {
  const corner = (GLASS + ROD) / 2;
  return [
    box(x, y + 0.12, z, 0.24, 0.04),
    box(x, y + 0.165, z, 0.08, 0.05),
    box(x, y - 0.115, z, 0.2, 0.03),
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => box(x + sx * corner, y, z + sz * corner, ROD, GLASS_TALL)),
    ),
  ];
}

/** The iron arm from the wall to the top of a door lantern, and the plate it is fixed by. */
export function bracketBoxes(x: number, y: number, z: number, outX: number, outZ: number): Box[] {
  const reach = DOOR_LANTERN_OUT;
  const midX = x - (outX * reach) / 2;
  const midZ = z - (outZ * reach) / 2;
  const across = (along: number, thin: number) => Math.abs(outX) * along + Math.abs(outZ) * thin;
  const deep = (along: number, thin: number) => Math.abs(outZ) * along + Math.abs(outX) * thin;
  const faceX = x - outX * reach;
  const faceZ = z - outZ * reach;
  return [
    box(midX, y + 0.205, midZ, across(reach, ARM), ARM, deep(reach, ARM)),
    box(faceX, y + 0.16, faceZ, across(0.02, 0.07), 0.16, deep(0.02, 0.07)),
  ];
}

/** The wooden post under a post lantern, from the ground to the lantern's base. */
export function postBox(x: number, z: number): Box {
  const top = POST_LANTERN_HEIGHT - 0.13;
  return box(x, top / 2, z, POST_THICK, top);
}

/** Half the post's thickness, for the grass kept off it. */
export const POST_RADIUS = POST_THICK / 2;
