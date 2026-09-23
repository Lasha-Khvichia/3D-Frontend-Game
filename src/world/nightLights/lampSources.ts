import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { ShutteredWindow } from "../openings/ShutteredWindow";
import type { LampSource } from "./chooseLamps";
import type { LanternPlace } from "./lanternPlaces";
import { DOOR_LANTERN_OUT } from "./lanternSizes";

/** Metres a lantern's light reaches. */
const LANTERN_RANGE = 7;
/** A lit window's light on the ground and wall outside it: this far, from this far out of the wall. */
const WINDOW_RANGE = 3.5;
const WINDOW_SPILL_OUT = 0.5;
/** Metres a window's spill counts as further off than it is, when there are more lamps than slots. */
const WINDOW_GIVES_WAY = 4;

/** A lamp for every lantern, out until `NightLights` lights it. */
export function lanternLamps(places: readonly LanternPlace[]): LampSource[] {
  return places.map(({ x, y, z, wall }) => ({
    x,
    y,
    z,
    range: LANTERN_RANGE,
    outX: wall?.outX ?? 0,
    outZ: wall?.outZ ?? 0,
    gap: wall ? DOOR_LANTERN_OUT : 0,
    giveWay: 0,
    house: wall?.house ?? -1,
    glow: new Color3(),
  }));
}

/** A lamp just outside every window, for the light a lit room spills onto the ground and wall. */
export function windowLamps(
  windows: readonly ShutteredWindow[],
  houseOf: readonly number[],
): LampSource[] {
  return windows.map(({ opening: { centre, outward, wallThickness } }, index) => {
    const out = wallThickness / 2 + WINDOW_SPILL_OUT;
    return {
      x: centre.x + outward.x * out,
      y: centre.y,
      z: centre.z + outward.z * out,
      range: WINDOW_RANGE,
      outX: outward.x,
      outZ: outward.z,
      gap: WINDOW_SPILL_OUT,
      giveWay: WINDOW_GIVES_WAY,
      house: houseOf[index] ?? -1,
      glow: new Color3(),
    };
  });
}
