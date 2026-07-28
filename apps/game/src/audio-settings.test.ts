import { describe, expect, it } from "vitest";
import { parseStoredAudioSettings } from "./audio-settings";

describe("préférences audio persistées", () => {
  it("conserve uniquement les champs valides", () => {
    expect(
      parseStoredAudioSettings(
        JSON.stringify({ masterVolume: 0.35, muted: false, ignored: true }),
      ),
    ).toEqual({ masterVolume: 0.35, muted: false });
  });

  it("omet les champs absents, invalides ou non finis", () => {
    expect(parseStoredAudioSettings(JSON.stringify({ muted: "non" }))).toEqual(
      {},
    );
    expect(
      parseStoredAudioSettings(JSON.stringify({ masterVolume: null })),
    ).toEqual({});
    expect(parseStoredAudioSettings("null")).toEqual({});
    expect(parseStoredAudioSettings("{json cassé")).toEqual({});
  });
});
