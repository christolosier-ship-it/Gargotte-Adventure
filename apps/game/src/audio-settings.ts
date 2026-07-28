import type { AudioSettings } from "@gargotte/audio";

export function parseStoredAudioSettings(
  stored: string | null,
): Partial<AudioSettings> {
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!isRecord(parsed)) return {};

    const settings: Partial<AudioSettings> = {};
    if (
      typeof parsed.masterVolume === "number" &&
      Number.isFinite(parsed.masterVolume)
    )
      settings.masterVolume = parsed.masterVolume;
    if (typeof parsed.muted === "boolean") settings.muted = parsed.muted;
    return settings;
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
