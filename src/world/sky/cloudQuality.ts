export type { CloudQuality } from "../../settings/gameSettings";

/**
 * Share of the screen's width and height the clouds are traced at, and how
 * many steps each ray takes toward the eye and toward the light. Soft things
 * lose nothing to a smaller target, and a quarter of the pixels is a quarter
 * of the cost.
 */
export const CLOUD_QUALITY = {
  low: { scale: 0.25, steps: 40, lightSteps: 3 },
  high: { scale: 0.5, steps: 72, lightSteps: 5 },
} as const;

/** How much of the last frame each new frame keeps: the noise averages out over about seven. */
export const CLOUD_HISTORY_KEEP = 0.86;
