import {
  DEFAULT_SETTINGS,
  GRAPHICS_KEYS,
  QUALITY_PRESETS,
  type GameSettings,
  type QualityPreset,
} from "./gameSettings";

const STORAGE_KEY = "game.settings.v1";

let settings: GameSettings = loadSaved();
const listeners = new Set<() => void>();

export function readSettings(): GameSettings {
  return settings;
}

export function subscribeToSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Changing a graphics value by hand drops the preset to "custom". */
export function updateSettings(patch: Partial<GameSettings>): void {
  const touchedGraphics = GRAPHICS_KEYS.some((key) => key in patch);
  settings = {
    ...settings,
    ...patch,
    ...(touchedGraphics && !("qualityPreset" in patch) ? { qualityPreset: "custom" } : {}),
  };
  save();
  for (const listener of listeners) listener();
}

export function applyQualityPreset(preset: QualityPreset): void {
  if (preset === "custom") return;
  updateSettings({ ...QUALITY_PRESETS[preset], qualityPreset: preset });
}

export function resetSettings(): void {
  updateSettings({ ...DEFAULT_SETTINGS });
}

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private windows and blocked storage are fine; the settings just do not
    // survive a reload.
  }
}

/** Merged onto the defaults, so a saved file from an older build still loads. */
function loadSaved(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
