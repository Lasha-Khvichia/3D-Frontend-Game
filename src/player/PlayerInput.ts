const FORWARD_KEYS = ["KeyW", "ArrowUp"] as const;
const BACK_KEYS = ["KeyS", "ArrowDown"] as const;
const LEFT_KEYS = ["KeyA", "ArrowLeft"] as const;
const RIGHT_KEYS = ["KeyD", "ArrowRight"] as const;
const RUN_KEYS = ["ShiftLeft", "ShiftRight"] as const;

/** Keys whose browser behaviour would fight the game. */
const BROWSER_DEFAULT_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/**
 * Keyboard and mouse for the player.
 *
 * Look movement is accumulated between simulation steps rather than applied on
 * arrival, so a fast mouse and a slow frame still turn by the same amount.
 */
export class PlayerInput {
  private readonly heldKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly look = { x: 0, y: 0 };
  private pendingLookX = 0;
  private pendingLookY = 0;
  private pointerLockWanted = true;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isTyping(event.target)) return;
    // Space scrolls the page and re-clicks whatever button has focus; arrows
    // scroll too. The game owns these keys.
    if (BROWSER_DEFAULT_KEYS.has(event.code)) event.preventDefault();
    if (!this.heldKeys.has(event.code)) this.pressedKeys.add(event.code);
    this.heldKeys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.heldKeys.delete(event.code);
  };

  private readonly handleBlur = (): void => {
    this.heldKeys.clear();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (document.pointerLockElement !== this.canvas) return;
    this.pendingLookX += event.movementX;
    this.pendingLookY += event.movementY;
  };

  private readonly handleCanvasClick = (): void => {
    this.requestPointerLock();
  };

  private readonly handlePointerLockChange = (): void => {
    this.onPointerLockChange?.(this.isPointerLocked);
  };

  /** Fires whenever the browser grabs or releases the mouse. */
  onPointerLockChange: ((locked: boolean) => void) | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("click", this.handleCanvasClick);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  get isPointerLocked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  /** Must be called inside a real click, or the browser refuses the lock. */
  requestPointerLock(): void {
    if (!this.pointerLockWanted) return;
    // Refused if asked too soon after Escape, or with no key or click behind
    // it. Harmless: the pause menu stays up and the next click asks again.
    const asked = this.canvas.requestPointerLock() as Promise<void> | undefined;
    asked?.catch(() => undefined);
  }

  /** 1 forward, -1 back. */
  get forward(): number {
    return this.axis(FORWARD_KEYS, BACK_KEYS);
  }

  /** 1 right, -1 left. */
  get strafe(): number {
    return this.axis(RIGHT_KEYS, LEFT_KEYS);
  }

  /** Mouse pixels since the last call. The same object every time, so no garbage. */
  takeLook(): { readonly x: number; readonly y: number } {
    this.look.x = this.pendingLookX;
    this.look.y = this.pendingLookY;
    this.pendingLookX = 0;
    this.pendingLookY = 0;
    return this.look;
  }

  /** True while either Shift is held. */
  get isRunning(): boolean {
    return RUN_KEYS.some((code) => this.heldKeys.has(code));
  }

  /** True for as long as the key is down. */
  isHeld(code: string): boolean {
    return this.heldKeys.has(code);
  }

  /** True once per physical key press, not once per step while it is held. */
  consumePress(code: string): boolean {
    return this.pressedKeys.delete(code);
  }

  /** Drops presses nothing consumed, so they cannot fire a step late. */
  endStep(): void {
    this.pressedKeys.clear();
  }

  setPointerLockWanted(wanted: boolean): void {
    this.pointerLockWanted = wanted;
    if (!wanted && document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("click", this.handleCanvasClick);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  private axis(positive: readonly string[], negative: readonly string[]): number {
    const forward = positive.some((code) => this.heldKeys.has(code)) ? 1 : 0;
    const back = negative.some((code) => this.heldKeys.has(code)) ? 1 : 0;
    return forward - back;
  }
}

/** Keeps the game's keys out of a text field, for when the UI grows one. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
