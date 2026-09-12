import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { TimeOfDayLighting } from "../../timeOfDayPalette";
import type { PrecipitationForm, WeatherListener, WeatherState } from "../weatherState";
import type { CatchMap } from "./CatchMap";
import { DropLayer, type DropFrame } from "./DropLayer";
import { flakesFor, splashesFor, streaksFor } from "./fallingLooks";
import { SplashLayer } from "./SplashLayer";

/** Enough streaks for a downpour, and flakes for a blizzard, in boxes this many metres across. */
const STREAKS = { name: "falling-streaks", count: 16000, box: 30, flakes: false };
const FLAKES = { name: "falling-flakes", count: 24000, box: 24, flakes: true };
/** Kept small so a flake's sway never loses precision, however long the game runs. */
const CLOCK_WRAP = 600;

/**
 * Rain, sleet, hail and snow falling round the player, and the splashes
 * where rain lands: whatever the weather says falls, as hard as it says.
 *
 * Moved on real seconds, every drawn frame, like the clouds — drops falling
 * on the game clock would fall seventy times too fast. Coloured by the sky's
 * own light, so rain glints grey by day and all but vanishes at night.
 */
export class Precipitation implements WeatherListener {
  private readonly streaks: DropLayer;
  private readonly flakes: DropLayer;
  private readonly splashes: SplashLayer;
  private form: PrecipitationForm = "none";
  private rate = 0;
  private readonly frame: DropFrame = { seconds: 0, clock: 0, wind: new Vector3(), pixel: 0 };
  private readonly water = new Color3();
  private readonly ice = new Color3();

  constructor(
    scene: Scene,
    private readonly palette: () => TimeOfDayLighting,
    catchMap: CatchMap,
  ) {
    this.streaks = new DropLayer(scene, STREAKS, catchMap);
    this.flakes = new DropLayer(scene, FLAKES, catchMap);
    this.splashes = new SplashLayer(scene, catchMap);
    scene.onBeforeRenderObservable.add(() => {
      const engine = scene.getEngine();
      const view = scene.activeCameras?.[0] ?? scene.activeCamera;
      // Metres a pixel covers a metre from the eye: no drop is drawn thinner than that.
      this.frame.pixel = view ? (2 * Math.tan(view.fov / 2)) / engine.getRenderHeight() : 0;
      this.draw(Math.min(0.1, engine.getDeltaTime() / 1000));
    });
  }

  /** For keeping out of the halo and god-ray passes. */
  get meshes(): Mesh[] {
    return [this.streaks.mesh, this.flakes.mesh, this.splashes.mesh];
  }

  setWeather(weather: Readonly<WeatherState>): void {
    this.form = weather.form;
    this.rate = weather.precipitation;
    this.frame.wind.set(
      Math.sin(weather.heading) * weather.wind,
      0,
      Math.cos(weather.heading) * weather.wind,
    );
  }

  private draw(seconds: number): void {
    const frame = this.frame;
    frame.seconds = seconds;
    frame.clock = (frame.clock + seconds) % CLOCK_WRAP;
    this.lightDrops();
    const streaks = streaksFor(this.form, this.rate);
    this.streaks.draw(streaks, frame, streaks?.white ? this.ice : this.water);
    this.flakes.draw(flakesFor(this.form, this.rate), frame, this.ice);
    this.splashes.draw(splashesFor(this.form, this.rate), frame.clock, this.water);
  }

  /** Water shows the sky it catches; ice is white, as bright as the daylight. */
  private lightDrops(): void {
    const { background: sky, lightColor, lightIntensity } = this.palette();
    const sun = lightIntensity * 0.2;
    this.water.set(
      sky.r * 1.5 + lightColor.r * sun,
      sky.g * 1.5 + lightColor.g * sun,
      sky.b * 1.5 + lightColor.b * sun,
    );
    const bright = Math.min(
      1.1,
      (sky.r * 0.3 + sky.g * 0.59 + sky.b * 0.11) * 1.6 + lightIntensity * 0.35,
    );
    this.ice.set(bright * 0.95, bright * 0.97, bright);
  }
}
