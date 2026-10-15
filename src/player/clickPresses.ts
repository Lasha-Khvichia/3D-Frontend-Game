/**
 * The left mouse button, counted as presses for swinging what is in hand.
 *
 * Only while the game has the mouse. The click that takes the mouse in the
 * first place happens before the lock, so it is never mistaken for a swing,
 * and clicks in the menu or the bag are clicks on the page, as they should be.
 */
export class ClickPresses {
  private pressed = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("mousedown", this.onDown);
  }

  /** True once per press, then false until the next. */
  take(): boolean {
    const pressed = this.pressed;
    this.pressed = false;
    return pressed;
  }

  dispose(): void {
    window.removeEventListener("mousedown", this.onDown);
  }

  private readonly onDown = (event: MouseEvent): void => {
    if (event.button === 0 && document.pointerLockElement === this.canvas) this.pressed = true;
  };
}
