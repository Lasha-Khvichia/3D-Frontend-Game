import { publishPaused, publishStats } from "../ui/bridge";
import type { PlayerInput } from "./PlayerInput";

/**
 * Tells React whether the game is paused, and why it will not start when the
 * browser refuses the mouse.
 *
 * Paused is exactly "the browser does not have the mouse", which is what
 * Escape does. In the orbit view the mouse is free by design, so it is never
 * paused there.
 *
 * The refusal used to be swallowed. The menu then stayed up with nothing on
 * screen to say why, which reads as a game that will not start at all. The
 * reason is published only when the words change, or React re-renders on
 * every click.
 */
export function reportPause(input: PlayerInput, isFirstPerson: () => boolean): () => void {
  const publishPauseState = (): void => {
    publishPaused(isFirstPerson() && !input.isPointerLocked);
  };

  let refused = "";
  const sayRefusal = (reason: string): void => {
    if (refused === reason) return;
    refused = reason;
    publishStats({ pointerLockRefused: reason });
  };

  input.onPointerLockRefused = sayRefusal;
  input.onPointerLockChange = (locked: boolean): void => {
    if (locked) sayRefusal("");
    publishPauseState();
  };
  publishPauseState();
  return publishPauseState;
}
