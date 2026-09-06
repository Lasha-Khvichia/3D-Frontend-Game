/**
 * The layer for detail only worth drawing from close up.
 *
 * The mini-map shows 90 m of ground in 220 pixels, so a stone standing 4 cm off
 * a wall is far smaller than one pixel there. Drawing it costs a draw call and
 * changes nothing anyone can see.
 *
 * The grass is here for the same reason but at a very different scale: it is
 * over a million triangles, and the mini-map was pushing every one of them to
 * fill a 220 pixel square over a ground plane that is already green.
 *
 * Babylon renders a mesh when `mesh.layerMask & camera.layerMask` is non-zero.
 * Meshes and cameras both default to `0x0fffffff`, so putting fine detail on
 * bit 0 alone keeps it visible to every normal camera, and dropping bit 0 from
 * one camera's mask hides it from that camera only.
 */
export const FINE_DETAIL_LAYER = 0x00000001;

/** A camera mask that skips fine detail and shows everything else. */
export const WITHOUT_FINE_DETAIL = 0x0ffffffe;
