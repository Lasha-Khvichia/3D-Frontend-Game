import { useEffect } from "react";
import { sendCommand } from "./bridge";
import { isBagOpen, setBagOpen } from "./bagOpen";

/**
 * Tab opens the bag while you are playing, and Tab or Escape closes it.
 *
 * Opening lets go of the mouse, which is what pauses the game and is also what
 * lets you drag things between slots. Taking the mouse back has to happen
 * inside the key press, or the browser refuses it.
 */
export function useBagKeys(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (isBagOpen() && (event.code === "Tab" || event.code === "Escape")) {
        event.preventDefault();
        setBagOpen(false);
        sendCommand({ type: "resume" });
        return;
      }
      // Only from play: not from the pause menu, and not from the orbit view.
      if (event.code !== "Tab" || document.pointerLockElement === null) return;
      event.preventDefault();
      setBagOpen(true);
      document.exitPointerLock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
