import { useCallback, useRef, useState, type PointerEvent, type WheelEvent } from "react";

const CLOSEST = 6;
const OPENS_AT = 2.5;

export type MapView = { readonly zoom: number; readonly centreX: number; readonly centreY: number };

/**
 * Where the map is looking and how close: zoom 1 fits the whole island on
 * screen. The wheel zooms about the cursor, so what is under it stays under
 * it; dragging slides the paper. Centres are in picture pixels.
 */
export function useMapView(size: number, startX: number, startY: number, fit: number) {
  const clampCentre = (value: number): number => Math.min(size, Math.max(0, value));
  const [view, setView] = useState<MapView>({ zoom: OPENS_AT, centreX: startX, centreY: startY });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const scale = fit * view.zoom;

  const onWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      const fromMiddleX = event.clientX - box.left - box.width / 2;
      const fromMiddleY = event.clientY - box.top - box.height / 2;
      setView((current) => {
        const zoom = Math.min(
          CLOSEST,
          Math.max(1, current.zoom * Math.exp(-event.deltaY * 0.0015)),
        );
        const before = fit * current.zoom;
        const after = fit * zoom;
        return {
          zoom,
          centreX: clampCentre(current.centreX + fromMiddleX / before - fromMiddleX / after),
          centreY: clampCentre(current.centreY + fromMiddleY / before - fromMiddleY / after),
        };
      });
    },
    [fit],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current = { x: event.clientX, y: event.clientY };
    setView((current) => ({
      ...current,
      centreX: clampCentre(current.centreX - dx / scale),
      centreY: clampCentre(current.centreY - dy / scale),
    }));
  };
  const onPointerUp = (): void => {
    drag.current = null;
  };
  return { view, scale, handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp } };
}
