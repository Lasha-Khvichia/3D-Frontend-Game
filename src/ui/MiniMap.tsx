import { useCallback } from "react";
import { setMiniMapCanvas } from "./bridge";
import { useGameStats } from "./useGameStats";
import { MINI_MAP_SIZE_CSS } from "../minimap/MiniMap";

/**
 * Holds the mini-map's decoration canvas. React owns the element and nothing
 * else: the render loop paints it directly, so this never re-renders while you
 * move. It re-renders only when the camera mode changes.
 */
export function MiniMap() {
  const { firstPerson } = useGameStats();

  const attach = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = MINI_MAP_SIZE_CSS * ratio;
      canvas.height = MINI_MAP_SIZE_CSS * ratio;
    }
    setMiniMapCanvas(canvas);
  }, []);

  if (!firstPerson) return null;

  return (
    <canvas
      ref={attach}
      className="overlay__minimap"
      style={{ width: MINI_MAP_SIZE_CSS, height: MINI_MAP_SIZE_CSS }}
    />
  );
}
