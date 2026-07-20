import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "@gargotte/engine";
import { clearGameState, loadGameState, saveGameState } from "./index";

describe("sauvegarde locale", () => {
  beforeEach(async () => {
    await clearGameState();
  });

  it("restaure un état versionné", async () => {
    const state = { ...createInitialGameState(12), phase: "menu" as const };
    await saveGameState(state);

    await expect(loadGameState()).resolves.toEqual(state);
  });
});
