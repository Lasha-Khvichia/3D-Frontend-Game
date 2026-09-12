import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Roofs the ground shader keeps dry under: the nearest few, as `NearRoofs`
 * packs them. Two vec4 each, and a negative size for an empty slot. Four is
 * enough — a missing dry strip under a fifth roof is metres away and unseen.
 */
export const SHELTER_SLOTS = 4;
const FLOATS_PER_ROOF = 8;

/** This step's wet ground, shared by every material showing it. `WetGround` sets it. */
export const wetField = {
  /** 0 dry, 1 soaked: how dark and glossy the ground and the grass are. */
  wet: 0,
  /** 0 none, 1 as much standing water as this ground ever holds. */
  puddles: 0,
  /** How hard it is falling now, which is what rings the puddles. */
  rain: 0,
  /** Real seconds, wrapped, so the rings keep their precision however long the game runs. */
  clock: 0,
  /** What the water reflects: the sky's own colour, and how bright it is. */
  sky: new Color3(0.5, 0.55, 0.6),
  skyStrength: 0,
  /** Towards the sun, and how strong its glint off the water is. */
  toSun: new Vector3(0, 1, 0),
  sunStrength: 0,
  roofs: emptyRoofs(),
};

/** Slots with nothing in them: a roof of negative size covers no ground. */
function emptyRoofs(): number[] {
  const roofs = new Array<number>(SHELTER_SLOTS * FLOATS_PER_ROOF).fill(0);
  for (let slot = 0; slot < SHELTER_SLOTS; slot += 1) {
    roofs[slot * FLOATS_PER_ROOF + 2] = -1;
    roofs[slot * FLOATS_PER_ROOF + 3] = -1;
  }
  return roofs;
}
