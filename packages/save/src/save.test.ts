import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "@gargotte/engine";
import {
  clearGameState,
  clearRoomState,
  loadGameState,
  loadRoomState,
  saveGameState,
  saveRoomState,
} from "./index";

describe("sauvegarde locale", () => {
  beforeEach(async () => {
    await clearGameState();
    await clearRoomState();
  });

  it("restaure un état versionné", async () => {
    const state = { ...createInitialGameState(12), phase: "menu" as const };
    await saveGameState(state);

    await expect(loadGameState()).resolves.toEqual(state);
  });
});
describe("sauvegarde tactique", () => {
  it("sauvegarde, restaure et supprime une salle complète", async () => {
    const room = {
      version: 1 as const,
      scenarioId: "s",
      width: 1,
      height: 1,
      obstacles: [],
      heroes: [],
      enemies: [],
      activeHeroId: null,
      phase: "heroes-turn" as const,
      turn: 2,
    };
    await saveRoomState({
      kind: "tactical-room",
      version: 1,
      room,
      selectedHeroIds: ["h"],
    });
    expect(await loadRoomState()).toMatchObject({ room: { turn: 2 } });
    await clearRoomState();
    expect(await loadRoomState()).toBe("legacy");
  });
});
