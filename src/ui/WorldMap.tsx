import { useEffect, useRef, useState } from "react";
import type { WorldMapPicture } from "../world/map/paintWorldMap";
import { readWorldMap } from "./bridge";
import { useGameStats } from "./useGameStats";
import { useMapView } from "./useMapView";
import { useWorldMapKeys } from "./useWorldMapKeys";
import { useMapOpen } from "./worldMapOpen";

/**
 * The world map, opened with M. A flat painted map of the whole island with
 * an arrow for you, which zooms and drags. The game is paused behind it.
 */
export function WorldMap() {
  useWorldMapKeys();
  const open = useMapOpen();
  const picture = open ? readWorldMap() : null;
  // Mounted fresh on every open, so it always opens centred on you.
  return picture ? <OpenWorldMap picture={picture} /> : null;
}

function OpenWorldMap({ picture }: { picture: WorldMapPicture }) {
  const { playerPose } = useGameStats();
  const size = picture.canvas.width;
  const perPixel = (picture.halfExtent * 2) / size;
  const toPixel = (x: number, z: number) => ({
    px: (x + picture.halfExtent) / perPixel,
    py: (picture.halfExtent - z) / perPixel,
  });
  const you = playerPose ? toPixel(playerPose.x, playerPose.z) : { px: size / 2, py: size / 2 };
  const [fit] = useState(() => (Math.min(window.innerWidth, window.innerHeight) * 0.94) / size);
  const { view, scale, handlers } = useMapView(size, you.px, you.py, fit);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = picture.canvas;
    canvas.className = "world-map__picture";
    holder.current?.appendChild(canvas);
    return () => canvas.remove();
  }, [picture]);

  const left = window.innerWidth / 2 - view.centreX * scale;
  const top = window.innerHeight / 2 - view.centreY * scale;
  // Names and the arrow stay the same size on screen however far you zoom.
  const upright = `translate(-50%, -50%) scale(${1 / scale})`;
  return (
    <div className="world-map" {...handlers}>
      <div
        className="world-map__sheet"
        style={{ transform: `translate(${left}px, ${top}px) scale(${scale})` }}
      >
        <div ref={holder} />
        {picture.labels.map((label) => {
          const at = toPixel(label.x, label.z);
          const lift = label.kind === "settlement" ? " translateY(-1.5em)" : "";
          return (
            <span
              key={label.text}
              className={`world-map__label is-${label.kind}`}
              style={{ left: at.px, top: at.py, transform: upright + lift }}
            >
              {label.text}
            </span>
          );
        })}
        {playerPose && (
          <svg
            className="world-map__you"
            viewBox="-12 -12 24 24"
            style={{
              left: you.px,
              top: you.py,
              transform: `${upright} rotate(${playerPose.yaw}rad)`,
            }}
          >
            <path d="M0 -10 L7 8 L0 4 L-7 8 Z" />
          </svg>
        )}
      </div>
      <p className="world-map__hint">M or Esc to close · Scroll to zoom · Drag to move</p>
    </div>
  );
}
