/** Full health, and the seconds unhurt before healing starts and how fast it then goes. */
export const FULL_HEALTH = 100;
const HEAL_AFTER = 5;
const HEAL_PER_SECOND = 4;

/**
 * How much more the player can take.
 *
 * It comes back by itself once you have been left alone for a few seconds,
 * so a fight is a matter of not being caught twice in a row rather than of
 * finding food. At nothing you black out (`Blackout`) and wake in the
 * village, keeping everything.
 */
export class Health {
  private value = FULL_HEALTH;
  private unhurt = HEAL_AFTER;

  get current(): number {
    return this.value;
  }

  /** Takes a blow. True if it is the one that puts you down. */
  hurt(amount: number): boolean {
    if (this.value <= 0) return false;
    this.value = Math.max(0, this.value - amount);
    this.unhurt = 0;
    return this.value === 0;
  }

  update(seconds: number): void {
    this.unhurt += seconds;
    if (this.value > 0 && this.unhurt >= HEAL_AFTER) {
      this.value = Math.min(FULL_HEALTH, this.value + HEAL_PER_SECOND * seconds);
    }
  }

  refill(): void {
    this.value = FULL_HEALTH;
    this.unhurt = HEAL_AFTER;
  }
}
