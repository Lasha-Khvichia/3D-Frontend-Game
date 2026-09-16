import { BirdSong } from "./BirdSong";
import { CricketChorus } from "./CricketChorus";
import { FireSound } from "./fire/FireSound";
import { HouseCreaks } from "./HouseCreaks";
import { LeafRustle } from "./LeafRustle";
import { birdActivity, cricketActivity } from "./natureActivity";
import { RainSound } from "./RainSound";
import type { SoundWorld } from "./soundWorld";
import { WindSound } from "./WindSound";

/**
 * The sounds that are always going, following the world every drawn frame:
 * rain, wind and leaves (on the weather bus, which dips under thunder), and
 * birds, crickets, a house's creaks and the nearest fire.
 */
export class AmbientSounds {
  private readonly rain: RainSound;
  private readonly wind: WindSound;
  private readonly leaves: LeafRustle;
  private readonly birds: BirdSong;
  private readonly crickets: CricketChorus;
  private readonly creaks: HouseCreaks;
  private readonly fire: FireSound;

  constructor(
    context: BaseAudioContext,
    weatherBus: AudioNode,
    into: AudioNode,
    noise: AudioBuffer,
  ) {
    this.rain = new RainSound(context, weatherBus);
    this.wind = new WindSound(context, weatherBus);
    this.leaves = new LeafRustle(context, weatherBus);
    this.birds = new BirdSong(context, into);
    this.crickets = new CricketChorus(context, into);
    this.creaks = new HouseCreaks(context, into, noise);
    this.fire = new FireSound(context, into, noise);
  }

  update(world: SoundWorld): void {
    const { weather, dayNight, listener } = world;
    const indoors = world.indoors();
    this.rain.update(weather, indoors);
    this.wind.update(weather, indoors);
    this.leaves.update(world.trees, listener.position, listener.rotation.y, weather.wind, indoors);
    const { sunHeight } = dayNight.sunAndMoon;
    const dayOfYear = dayNight.dayNumber % 365;
    this.birds.update(birdActivity(dayOfYear, dayNight.currentHour, sunHeight, weather), indoors);
    this.crickets.update(cricketActivity(sunHeight, weather), indoors);
    this.creaks.update(world.insideHouse(), weather);
    this.fire.update(world.fires, listener.position, listener.rotation.y);
  }

  /** A strike near enough to shake the house, heard at `at`. */
  shake(at: number): void {
    this.creaks.shake(at);
  }
}
