import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { House } from "../houses/buildHouse";
import type { ShutteredWindow } from "../openings/ShutteredWindow";
import type { WeatherListener, WeatherState } from "../weather/weatherState";
import type { Lanterns } from "./buildLanterns";
import { chooseLamps, type LampSource } from "./chooseLamps";
import { burnCarried, heldLamp, lanternFlicker } from "./heldLamp";
import { wallsOf } from "./houseWalls";
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
  /** The player's own lantern. Always in the list, black until one is carried. */
  private readonly held = heldLamp();
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
    this.lamps = [...this.lanterns, ...this.spills, this.held];
  }

  setWeather(state: Readonly<WeatherState>): void {
    this.darkness = state.darkness;
  }

  /**
   * `home` is the house the player stands in, or -1. `carried` is where the
   * player's own lantern hangs, or null when none is out.
   */
  update(
    seconds: number,
    hour: number,
    sunHeight: number,
    eye: Vector3,
    home: number,
    carried: Vector3 | null = null,
    flame: { emissiveColor: Color3 } | null = null,
  ): void {
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
    // A carried lantern burns like any other, and lights from where it hangs.
    const strength = LANTERN_STRENGTH * lit * lanternFlicker(this.seconds + 1.7);
    burnCarried(this.held, carried, LANTERN_LIGHT, strength);
    if (flame) LANTERN_LIGHT.scaleToRef(glass, flame.emissiveColor);
    chooseLamps(this.lamps, eye, wallsOf(this.houses, home), home);
  }
}
