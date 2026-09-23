import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { fireFlicker } from "../fire/fireFlicker";
import type { Footprint } from "../footprint";
import type { House } from "../houses/buildHouse";
import type { ShutteredWindow } from "../openings/ShutteredWindow";
import type { WeatherListener, WeatherState } from "../weather/weatherState";
import type { Lanterns } from "./buildLanterns";
import { chooseLamps, type LampSource } from "./chooseLamps";
import { houseEvening, lanternsLit, windowsLit } from "./houseEvenings";
import { lanternLamps, windowLamps } from "./lampSources";
import type { WindowGlow } from "./WindowGlow";

const LANTERN_LIGHT = new Color3(1, 0.62, 0.3);
/** How strongly a lantern lights what is right under it, and a lit window what is outside it. */
const LANTERN_STRENGTH = 1.1;
const WINDOW_STRENGTH = 0.55;
/** Share of a window's light that gets out through the cracks of shut shutters. */
const THROUGH_SHUTTERS = 0.25;
/** The lantern glass when out: dark, but not black. */
const GLASS_OUT = 0.08;

/**
 * Lanterns and lit windows, each step: how lit the lanterns are, which
 * households are still up, and the nearest lamps handed to the shaders.
 */
export class NightLights implements WeatherListener {
  private darkness = 0;
  private seconds = 0;
  private readonly lanterns: LampSource[];
  private readonly spills: LampSource[];
  private readonly lamps: LampSource[];
  private readonly evenings;
  private readonly houseOf: number[];
  private readonly lit: boolean[];

  constructor(
    private readonly houses: readonly House[],
    private readonly windows: readonly ShutteredWindow[],
    private readonly glass: Lanterns["glass"],
    places: Lanterns["places"],
    private readonly glow: WindowGlow,
  ) {
    this.evenings = houses.map((house) => houseEvening(house.blueprint.name));
    this.lit = houses.map(() => false);
    const houseNamed = (name: string) => houses.findIndex((h) => h.blueprint.name === name);
    this.houseOf = windows.map((window) => houseNamed(window.opening.houseName));
    this.lanterns = lanternLamps(places);
    this.spills = windowLamps(windows, this.houseOf);
    this.lamps = [...this.lanterns, ...this.spills];
  }

  setWeather(state: Readonly<WeatherState>): void {
    this.darkness = state.darkness;
  }

  /** `home` is the house the player stands in, or -1. */
  update(seconds: number, hour: number, sunHeight: number, eye: Vector3, home: number): void {
    this.seconds += seconds;
    const lit = lanternsLit(sunHeight, this.darkness);
    const glass = GLASS_OUT + (1 - GLASS_OUT) * lit * lanternFlicker(this.seconds);
    this.glass.emissiveColor.copyFrom(LANTERN_LIGHT).scaleInPlace(glass);
    this.lanterns.forEach((lantern, index) => {
      const strength = LANTERN_STRENGTH * lit * lanternFlicker(this.seconds + index * 2.3);
      LANTERN_LIGHT.scaleToRef(strength, lantern.glow);
    });
    this.evenings.forEach((evening, house) => {
      this.lit[house] = windowsLit(evening, hour, sunHeight, this.darkness);
    });
    // Shut shutters do not hide the glow: it shows through the gaps between their planks.
    this.glow.show((index) =>
      this.lit[this.houseOf[index]!] ? this.evenings[this.houseOf[index]!]!.glow : null,
    );
    this.spills.forEach((spill, index) => {
      const open = this.windows[index]!.isOpen ? 1 : THROUGH_SHUTTERS;
      const strength = this.lit[spill.house] ? WINDOW_STRENGTH * open : 0;
      spill.glow.copyFrom(this.evenings[spill.house]!.glow).scaleInPlace(strength);
    });
    chooseLamps(this.lamps, eye, this.walls(home), home);
  }

  /** The outside of a house's walls, which the light from lamps elsewhere stops at. */
  private walls(home: number): Footprint | null {
    const house = this.houses[home];
    if (!house) return null;
    const { centreX: x, centreZ: z, blueprint: size } = house;
    const [halfX, halfZ] = [size.width / 2, size.depth / 2];
    return { minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ };
  }
}

/** A flame behind glass: the fire's flicker, gentler. */
function lanternFlicker(seconds: number): number {
  return 0.92 + 0.45 * (fireFlicker(seconds * 0.8) - 0.82);
}
