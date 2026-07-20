import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState, createRoomState } from "@gargotte/engine";
import {
  clearGameState,
  clearRoomState,
  loadGameState,
  loadRoomState,
  saveGameState,
  saveRoomState,
} from "./index";

async function putRawSave(id: string, state: unknown): Promise<void> {
  const request = indexedDB.open("gargotte-adventure", 1);
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  const transaction = database.transaction("saves", "readwrite");
  transaction.objectStore("saves").put({
    id,
    schemaVersion: 1,
    updatedAt: "2026-07-20T00:00:00.000Z",
    state,
  });
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

beforeEach(async () => {
  await clearRoomState();
  await clearGameState();
});

describe("sauvegarde locale", () => {
  it("restaure un état d'application versionné", async () => {
    const state = { ...createInitialGameState(12), phase: "menu" as const };
    await saveGameState(state);
    await expect(loadGameState()).resolves.toEqual(state);
  });
});

describe("sauvegarde tactique", () => {
  it("restaure exactement une salle après plusieurs actions", async () => {
    const initial = createRoomState({
      scenarioId: "s",
      width: 8,
      height: 4,
      obstacles: [{ column: 3, row: 1 }],
      heroes: [
        {
          id: "h",
          name: "H",
          position: { column: 2, row: 0 },
          hp: 7,
          maxHp: 10,
          atk: 4,
          def: 1,
          range: 1,
        },
      ],
      enemies: [
        {
          id: "e",
          name: "E",
          position: { column: 4, row: 0 },
          hp: 2,
          maxHp: 5,
          atk: 2,
          def: 0,
          range: 1,
        },
      ],
    });
    const room = {
      ...initial,
      activeHeroId: "h",
      turn: 3,
      heroes: initial.heroes.map((hero) => ({
        ...hero,
        actionsRemaining: 1,
      })),
    };
    const payload = {
      kind: "tactical-room" as const,
      version: 1 as const,
      room,
      selectedHeroIds: ["h"],
    };
    await saveRoomState(payload);
    await expect(loadRoomState()).resolves.toEqual(payload);
  });

  it("détecte une ancienne sauvegarde Sprint 0", async () => {
    await saveGameState(createInitialGameState(4));
    await expect(loadRoomState()).resolves.toBe("legacy");
  });

  it("rejette un payload corrompu ou d'une mauvaise version", async () => {
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 99,
      room: "cassée",
      selectedHeroIds: [],
    });
    await expect(loadRoomState()).resolves.toBeNull();
    await putRawSave("room-autosave", "pas un objet");
    await expect(loadRoomState()).resolves.toBeNull();
  });

  it("supprime la sauvegarde sans créer un faux héritage", async () => {
    const room = createRoomState({
      scenarioId: "s",
      width: 2,
      height: 1,
      obstacles: [],
      heroes: [
        {
          id: "h",
          name: "H",
          position: { column: 0, row: 0 },
          hp: 5,
          maxHp: 5,
          atk: 2,
          def: 0,
          range: 1,
        },
      ],
      enemies: [
        {
          id: "e",
          name: "E",
          position: { column: 1, row: 0 },
          hp: 3,
          maxHp: 3,
          atk: 1,
          def: 0,
          range: 1,
        },
      ],
    });
    await saveRoomState({
      kind: "tactical-room",
      version: 1,
      room,
      selectedHeroIds: ["h"],
    });
    await clearRoomState();
    await expect(loadRoomState()).resolves.toBeNull();
  });
});
