export type ShadowQuality = "off" | "low" | "high";
export type CloudQuality = "off" | "low" | "high";
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
  /** Metres. Where the fog closes in, and past which nothing is built. */
  renderDistance: number;

  /** Fraction of the window actually rendered, then upscaled. */
  renderScale: number;
  /** Renders fewer pixels, down to 70%, while frames run slower than 60 a second. */
  autoResolution: boolean;
  /** God rays and the starburst glare. The most expensive thing on screen. */
  sunEffects: boolean;
  shadowQuality: ShadowQuality;
  /** Real 3D clouds. After the sun effects, the most expensive thing on screen. */
  clouds: CloudQuality;
  /** Set by the presets; becomes "custom" the moment you change one by hand. */
  qualityPreset: QualityPreset;
};

export const SETTINGS_LIMITS = {
  fieldOfView: { min: 55, max: 100, step: 1 },
  mouseSensitivity: { min: 0.25, max: 3, step: 0.05 },
  headBobStrength: { min: 0, max: 1, step: 0.05 },
  renderScale: { min: 0.5, max: 1, step: 0.05 },
  travelSpeed: { min: 1, max: 8, step: 0.5 },
  renderDistance: { min: 300, max: 1200, step: 50 },
} as const;

export const DEFAULT_SETTINGS: GameSettings = {
  fieldOfView: 70,
  mouseSensitivity: 1,
  headBobStrength: 1,
  invertLook: false,
  clockFrozen: false,
  travelSpeed: 1,
  // The furthest, which is also exactly the view the island had before it was
  // a setting. Lowering it is for machines that need the frames.
  renderDistance: 1200,
  renderScale: 1,
  autoResolution: true,
  sunEffects: true,
  shadowQuality: "high",
  clouds: "high",
  qualityPreset: "high",
};

/**
 * What each preset means. Choosing one writes these four values. Even the low
 * preset keeps clouds, at a quarter of the screen's resolution: a sky with
 * none reads as broken, not as fast.
 */
export const QUALITY_PRESETS: Record<
  Exclude<QualityPreset, "custom">,
  Pick<GameSettings, "renderScale" | "sunEffects" | "shadowQuality" | "clouds">
> = {
  low: { renderScale: 0.6, sunEffects: false, shadowQuality: "off", clouds: "low" },
  medium: { renderScale: 0.8, sunEffects: false, shadowQuality: "low", clouds: "low" },
  high: { renderScale: 1, sunEffects: true, shadowQuality: "high", clouds: "high" },
};

/** Changing any of these by hand drops the preset to "custom". */
export const GRAPHICS_KEYS = ["renderScale", "sunEffects", "shadowQuality", "clouds"] as const;
