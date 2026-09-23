/** How many lamps the shaders light a pixel by. The nearest are chosen each step (`chooseLamps`). */
export const LAMP_SLOTS = 32;

/**
 * The lamps lighting the world this step, as the shaders read them. Written
 * by `NightLights`, read by `LampLightPlugin` for every standard material.
 */
export const lampField = {
  /** How many of the slots below are in use; the rest are ignored. */
  count: 0,
  /** Per lamp: x, y, z, and the metres its light reaches. */
  places: new Array<number>(LAMP_SLOTS * 4).fill(0),
  /** Per lamp: the colour and strength of its light, and nothing in the last. */
  glows: new Array<number>(LAMP_SLOTS * 4).fill(0),
  /**
   * Per lamp hung on a wall: the way out of the wall (x, z), metres from the
   * lamp back to the wall's face, and 1. All zero for a lamp standing free.
   * Light stops at that face, so a lamp by a door does not light the room.
   */
  walls: new Array<number>(LAMP_SLOTS * 4).fill(0),
};
