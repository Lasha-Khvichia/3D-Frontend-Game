import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { createSeededRandom } from "../houses/seededRandom";
import { DAYS_PER_YEAR, HOURS_PER_DAY, SUMMER_SOLSTICE_DAY } from "../calendar/calendar";
import { SOLAR_NOON_HOUR } from "../celestialPath";
import { launchMeteor, type Meteor } from "./launchMeteor";

/**
 * The stars come round about 4 minutes sooner each day than the sun: one
 * extra turn a year, so each date has its own night sky, the same every year.
 */
const SIDEREAL_DAY_HOURS = (HOURS_PER_DAY * DAYS_PER_YEAR) / (DAYS_PER_YEAR + 1);
/** The sky's turn that puts the Milky Way's bright core due south, as `starsGlsl.ts` places it. */
const CORE_DUE_SOUTH = 4.65;
/** Midsummer's solar midnight: the core is due south then, as on Earth. */
const CORE_DUE_SOUTH_HOURS = SUMMER_SOLSTICE_DAY * HOURS_PER_DAY + SOLAR_NOON_HOUR - 12;
/** The island's latitude, as the sun's path uses: the celestial pole stands 45 degrees up in the north. */
const LATITUDE = (45 * Math.PI) / 180;

/**
 * The night sky's clockwork: which way the stars face, how many can be seen,
 * and when a shooting star crosses.
 *
 * The stars turn about the celestial pole once a sidereal day, the same way
 * the sun and moon move, so the sky a player knows at midnight has moved on a
 * season later. They come out through twilight and a bright moon drowns the
 * faint ones.
 */
export class StarSky {
  readonly axisX = new Vector3(1, 0, 0);
  readonly axisY = new Vector3(0, 1, 0);
  readonly axisZ = new Vector3(0, 0, 1);
  /** How visible the stars are, seconds for the twinkling, radians per screen pixel, and moonlight. */
  readonly state = new Vector4(0, 0, 0.0013, 0);
  /** Where a shooting star's head is, and how bright; its tail follows. */
  readonly meteorHead = new Vector4(0, 1, 0, 0);
  readonly meteorTail = new Vector3(0, 1, 0);
  private readonly random = createSeededRandom(1987);
  private untilMeteor = 30;
  private meteor: Meteor | null = null;

  update(seconds: number, totalHours: number, sunY: number, moonUp: number, moonLit: number): void {
    const turns = (totalHours - CORE_DUE_SOUTH_HOURS) / SIDEREAL_DAY_HOURS;
    const turn = CORE_DUE_SOUTH + (turns - Math.floor(turns)) * Math.PI * 2;
    // The sky's own axes, turned: the equator's southern point and west, spun
    // about the pole. The sun's path is built on the same three directions.
    const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
    this.axisX.set(-sin, cos * Math.cos(LATITUDE), -cos * Math.sin(LATITUDE));
    this.axisY.set(cos, sin * Math.cos(LATITUDE), -sin * Math.sin(LATITUDE));
    this.axisZ.set(0, Math.sin(LATITUDE), Math.cos(LATITUDE));

    // Out from civil dusk, all out once the sun is 14 degrees down.
    const dark = Math.min(1, Math.max(0, (-0.02 - sunY) / 0.23));
    const moonlight = moonUp * moonLit;
    const shown = dark * dark * (3 - 2 * dark) * (1 - 0.3 * moonlight);
    this.state.x = shown;
    // Twilight and a full moon brighten the sky itself: the faint stars stay
    // under it, and come out one magnitude after another as it darkens.
    this.state.w = moonlight * 0.12 + (1 - dark) * 0.25;
    this.state.y += seconds;
    this.fly(seconds, shown);
  }

  /** How big one screen pixel is, so a star is a point on any screen. */
  setPixelAngle(radians: number): void {
    this.state.z = radians;
  }

  private fly(seconds: number, shown: number): void {
    if (!this.meteor) {
      this.untilMeteor -= shown > 0.4 ? seconds : 0;
      if (this.untilMeteor > 0) return;
      this.untilMeteor = 25 + this.random() * 65;
      this.meteor = launchMeteor(this.random);
    }
    const meteor = this.meteor;
    meteor.age += seconds;
    const progress = Math.min(1, meteor.age / meteor.life);
    const head = Vector3.Lerp(meteor.from, meteor.to, progress).normalize();
    const tail = Vector3.Lerp(meteor.from, meteor.to, Math.max(0, progress - 0.35)).normalize();
    this.meteorHead.set(head.x, head.y, head.z, meteor.bright * Math.sin(progress * Math.PI));
    this.meteorTail.copyFrom(tail);
    if (progress >= 1) {
      this.meteor = null;
      this.meteorHead.w = 0;
    }
  }
}
