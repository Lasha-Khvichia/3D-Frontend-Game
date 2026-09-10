/**
 * The render layer the sky and the clouds are drawn on.
 *
 * Both are domes that follow whichever camera is drawing, and the cloud pass
 * is traced for the player's camera only. The mini-map camera looks straight
 * down from 90 m and must not draw either, so it leaves this bit out of its
 * mask. See `fineDetailLayer.ts` for how Babylon's layer masks work.
 */
export const SKY_LAYER = 0x00000002;
