export type ShadowQuality = "off" | "low" | "high";
export type QualityPreset = "low" | "medium" | "high" | "custom";

export type GameSettings = {
  /** Vertical field of view in degrees. Wider shows more and feels faster. */
  fieldOfView: number;
  /** Multiplier on the base look speed. 1 is the built-in feel. */
  mouseSensitivity: number;
  /** 0 removes the bounce entirely, 1 is full strength. */
  headBobStrength: number;
  invertLook: boolean;
  /** Holds the sun and moon still without pausing the game. */
  clockFrozen: boolean;
  /** Multiplies walking and running. The island is two kilometres across. */
  travelSpeed: number;

  /** Fraction of the window actually rendered, then upscaled. */
  renderScale: number;
  /** God rays and the starburst glare. The most expensive thing on screen. */
  sunEffects: boolean;
  shadowQuality: ShadowQuality;
  /** Set by the presets; becomes "custom" the moment you change one by hand. */
  qualityPreset: QualityPreset;
};

export const SETTINGS_LIMITS = {
  fieldOfView: { min: 55, max: 100, step: 1 },
  mouseSensitivity: { min: 0.25, max: 3, step: 0.05 },
  headBobStrength: { min: 0, max: 1, step: 0.05 },
  renderScale: { min: 0.5, max: 1, step: 0.05 },
  travelSpeed: { min: 1, max: 8, step: 0.5 },
} as const;

export const DEFAULT_SETTINGS: GameSettings = {
  fieldOfView: 70,
  mouseSensitivity: 1,
  headBobStrength: 1,
  invertLook: false,
  clockFrozen: false,
  travelSpeed: 1,
  renderScale: 1,
  sunEffects: true,
  shadowQuality: "high",
  qualityPreset: "high",
};

/** What each preset means. Choosing one writes these three values. */
export const QUALITY_PRESETS: Record<
  Exclude<QualityPreset, "custom">,
  Pick<GameSettings, "renderScale" | "sunEffects" | "shadowQuality">
> = {
  low: { renderScale: 0.6, sunEffects: false, shadowQuality: "off" },
  medium: { renderScale: 0.8, sunEffects: false, shadowQuality: "low" },
  high: { renderScale: 1, sunEffects: true, shadowQuality: "high" },
};

/** Changing any of these by hand drops the preset to "custom". */
export const GRAPHICS_KEYS = ["renderScale", "sunEffects", "shadowQuality"] as const;
