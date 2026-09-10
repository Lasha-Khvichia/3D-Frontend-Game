import { useEffect } from "react";
import { sendCommand } from "./bridge";
import { isMapOpen, setMapOpen } from "./worldMapOpen";

/**
 * M opens the world map while you are playing, and M or Escape closes it.
 *
 * Opening lets go of the mouse, which is what pauses the game — the same rule
 * as Escape — and closing takes it back. Taking the mouse back has to happen
 * inside the key press, or the browser refuses it; "resume" asks for it
 * there and then.
 */
export function useWorldMapKeys(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (isMapOpen() && (event.code === "KeyM" || event.code === "Escape")) {
        event.preventDefault();
        setMapOpen(false);
        sendCommand({ type: "resume" });
        return;
      }
      // Only from play: not from the pause menu, and not from the orbit view.
      if (event.code !== "KeyM" || document.pointerLockElement === null) return;
      sendCommand({ type: "open-map" });
      setMapOpen(true);
      document.exitPointerLock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
