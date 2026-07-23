import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInitialGameState,
  createRoomState,
  spawnCreatures,
  type CreatureDefinition,
} from "@gargotte/engine";
import {
  clearGameState,
  clearRoomState,
  loadGameState,
  loadRoomState,
  saveGameState,
  saveRoomState,
} from "./index";

const enemyDefinition: CreatureDefinition = {
  id: "gobelin-test",
  name: "Gobelin Test",
  maxHp: 5,
  atk: 2,
  def: 0,
  range: 1,
  blocksMovement: true,
};

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

function createTestRoom() {
  return createRoomState({
    scenarioId: "s",
    width: 8,
    height: 4,
    obstacles: [{ column: 3, row: 1 }],
    spawnPoints: [
      {
        id: "renfort",
        position: { column: 6, row: 0 },
        tags: ["reinforcement"],
        enabled: true,
      },
    ],
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
    creatureDefinitions: [enemyDefinition],
    enemies: [
      {
        id: "e",
        creatureId: enemyDefinition.id,
        position: { column: 4, row: 0 },
      },
    ],
  });
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

  it("rejette un état d'application incomplet malgré une phase plausible", async () => {
    await putRawSave("autosave", { phase: "menu" });
    await expect(loadGameState()).resolves.toBeNull();
  });
});

describe("sauvegarde tactique", () => {
  it("restaure exactement instances, points et compteur après un spawn", async () => {
    const initial = createTestRoom();
    const spawned = spawnCreatures(initial, [enemyDefinition], {
      id: "renfort-1",
      source: { type: "test", id: "save-test" },
      creatureId: enemyDefinition.id,
      quantity: 1,
      candidateSpawnPointIds: ["renfort"],
      failureMode: "all-or-nothing",
    }).state;
    const room = {
      ...spawned,
      activeHeroId: "h",
      turn: 3,
      heroes: spawned.heroes.map((hero) => ({
        ...hero,
        actionsRemaining: 1,
      })),
    };
    const payload = {
      kind: "tactical-room" as const,
      version: 2 as const,
      room,
      selectedHeroIds: ["h"],
    };
    await saveRoomState(payload);
    await expect(loadRoomState()).resolves.toEqual(payload);
  });

  it("migre une sauvegarde tactique version 1 vers les instances version 2", async () => {
    const current = createTestRoom();
    const legacyRoom = {
      version: 1,
      scenarioId: current.scenarioId,
      width: current.width,
      height: current.height,
      obstacles: current.obstacles,
      heroes: current.heroes,
      enemies: current.enemies.map(
        ({ creatureId: _creatureId, ...enemy }) => enemy,
      ),
      activeHeroId: current.activeHeroId,
      phase: current.phase,
      turn: current.turn,
    };
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 1,
      room: legacyRoom,
      selectedHeroIds: ["h"],
    });

    const migrated = await loadRoomState();
    expect(migrated).not.toBeNull();
    expect(migrated).not.toBe("legacy");
    if (!migrated || migrated === "legacy") return;
    expect(migrated.version).toBe(2);
    expect(migrated.room.version).toBe(2);
    expect(migrated.room.enemies[0]?.creatureId).toBe("e");
    expect(migrated.room.spawnPoints).toEqual([]);
    expect(migrated.room.nextEnemyInstanceSequence).toBe(1);
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

  it("rejette une corruption profonde des instances et coordonnées", async () => {
    const initial = createTestRoom();
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 2,
      room: {
        ...initial,
        enemies: [
          {
            ...initial.enemies[0],
            creatureId: "",
            hp: 99,
            position: { column: 99, row: 0 },
          },
        ],
      },
      selectedHeroIds: ["h"],
    });
    await expect(loadRoomState()).resolves.toBeNull();
  });

  it("rejette une sélection absente de la salle", async () => {
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 2,
      room: createTestRoom(),
      selectedHeroIds: ["fantome"],
    });
    await expect(loadRoomState()).resolves.toBeNull();
  });

  it("supprime la sauvegarde sans créer un faux héritage", async () => {
    const room = createTestRoom();
    await saveRoomState({
      kind: "tactical-room",
      version: 2,
      room,
      selectedHeroIds: ["h"],
    });
    await clearRoomState();
    await expect(loadRoomState()).resolves.toBeNull();
  });
});
