/** Pixels of wheel travel per slot, and the most one event may count for. */
const PER_STEP = 100;

/**
 * The mouse wheel, counted in whole notches for stepping along the bar.
 *
 * Travel is added up and a step taken every hundred pixels, with no single
 * event counting for more than one: a mouse wheel's notch is about a hundred,
 * while a trackpad sends dozens of tiny events per swipe and would otherwise
 * race past every slot at once. Line-mode wheels (Firefox) are scaled to
 * pixels first.
 *
 * Only while the game has the mouse. In the pause menu or the bag the wheel
 * scrolls what is on screen, as it should.
 */
export class WheelSteps {
  private travel = 0;
  private steps = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("wheel", this.onWheel, { passive: true });
  }

  /** Notches since the last call: positive down the bar, negative back. */
  take(): number {
    const steps = this.steps;
    this.steps = 0;
    return steps;
  }

  dispose(): void {
    window.removeEventListener("wheel", this.onWheel);
  }

  private readonly onWheel = (event: WheelEvent): void => {
    if (document.pointerLockElement !== this.canvas) return;
    const pixels = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
    this.travel += Math.max(-PER_STEP, Math.min(PER_STEP, pixels));
    while (this.travel >= PER_STEP) {
      this.travel -= PER_STEP;
      this.steps += 1;
    }
    while (this.travel <= -PER_STEP) {
      this.travel += PER_STEP;
      this.steps -= 1;
    }
  };
}
