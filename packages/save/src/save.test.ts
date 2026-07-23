import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  changeBrouhaha,
  createInitialGameState,
  createRoomState,
  interactWithObject,
  spawnCreatures,
  type BrouhahaEffectDefinition,
  type CreatureDefinition,
  type InteractableDefinition,
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

const objectDefinitions: InteractableDefinition[] = [
  {
    id: "tonneau-test",
    name: "Tonneau Test",
    kind: "barrel",
    initialStateId: "intact",
    states: [
      {
        id: "intact",
        label: "intact",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
      {
        id: "brise",
        label: "brisé",
        blocksMovement: false,
        blocksLineOfSight: false,
      },
    ],
    interactions: [
      {
        id: "briser",
        label: "Briser",
        fromStateId: "intact",
        toStateId: "brise",
        brouhahaDelta: 1,
        reason: "Objet brisé",
      },
    ],
  },
];

const brouhahaEffects: BrouhahaEffectDefinition[] = [
  {
    id: "universel-bas",
    name: "Écho",
    description: "Un écho répond.",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 9,
  },
  {
    id: "universel-haut-a",
    name: "Panique",
    description: "Le donjon panique.",
    scope: { type: "universal" },
    minLevel: 10,
    maxLevel: 12,
  },
  {
    id: "universel-haut-b",
    name: "Vacarme",
    description: "Le vacarme répond.",
    scope: { type: "universal" },
    minLevel: 10,
    maxLevel: 12,
  },
];

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
    interactableDefinitions: objectDefinitions,
    interactables: [
      {
        id: "tonneau-1",
        interactableId: "tonneau-test",
        position: { column: 2, row: 1 },
        stateId: "intact",
      },
    ],
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
        position: { column: 1, row: 1 },
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
  it("restaure exactement objets, spawn, Brouhaha et compteurs", async () => {
    const initial = { ...createTestRoom(), activeHeroId: "h" };
    const interacted = interactWithObject(
      initial,
      objectDefinitions,
      brouhahaEffects,
      {
        id: "interaction-objet-1",
        heroId: "h",
        interactableInstanceId: "tonneau-1",
        interactionId: "briser",
      },
      { dungeonId: "bastognac" },
    ).state;
    const spawned = spawnCreatures(interacted, [enemyDefinition], {
      id: "renfort-1",
      source: { type: "test", id: "save-test" },
      creatureId: enemyDefinition.id,
      quantity: 1,
      candidateSpawnPointIds: ["renfort"],
      failureMode: "all-or-nothing",
    }).state;
    const noisy = changeBrouhaha(
      spawned,
      brouhahaEffects,
      {
        id: "bruit-2",
        delta: 2,
        source: { type: "test", id: "save-test" },
        reason: "Test de sauvegarde",
      },
      { dungeonId: "bastognac" },
    ).state;
    const room = {
      ...noisy,
      turn: 3,
      heroes: noisy.heroes.map((hero) => ({
        ...hero,
        actionsRemaining: 1,
      })),
    };
    const payload = {
      kind: "tactical-room" as const,
      version: 4 as const,
      room,
      selectedHeroIds: ["h"],
    };
    await saveRoomState(payload);
    await expect(loadRoomState()).resolves.toEqual(payload);
  });

  it("migre une sauvegarde version 3 vers les objets version 4", async () => {
    const current = createTestRoom();
    const {
      interactables: _interactables,
      processedInteractableRequestIds: _processed,
      nextInteractableInteractionSequence: _nextSequence,
      ...legacyRoom
    } = current;
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 3,
      room: { ...legacyRoom, version: 3 },
      selectedHeroIds: ["h"],
    });

    const migrated = await loadRoomState();
    expect(migrated).not.toBeNull();
    expect(migrated).not.toBe("legacy");
    if (!migrated || migrated === "legacy") return;
    expect(migrated.version).toBe(4);
    expect(migrated.room.version).toBe(4);
    expect(migrated.room.interactables).toEqual([]);
    expect(migrated.room.processedInteractableRequestIds).toEqual([]);
    expect(migrated.room.nextInteractableInteractionSequence).toBe(1);
  });

  it("migre une sauvegarde version 2 vers le Brouhaha et les objets", async () => {
    const current = createTestRoom();
    const {
      brouhaha: _brouhaha,
      interactables: _interactables,
      processedInteractableRequestIds: _processed,
      nextInteractableInteractionSequence: _nextSequence,
      ...legacyRoom
    } = current;
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 2,
      room: { ...legacyRoom, version: 2 },
      selectedHeroIds: ["h"],
    });

    const migrated = await loadRoomState();
    expect(migrated).not.toBeNull();
    expect(migrated).not.toBe("legacy");
    if (!migrated || migrated === "legacy") return;
    expect(migrated.version).toBe(4);
    expect(migrated.room.brouhaha).toEqual({
      level: 0,
      processedRequestIds: [],
      nextResolutionSequence: 1,
      history: [],
    });
    expect(migrated.room.interactables).toEqual([]);
  });

  it("migre une sauvegarde version 1 vers les instances, Brouhaha et objets", async () => {
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
    expect(migrated.version).toBe(4);
    expect(migrated.room.enemies[0]?.creatureId).toBe("e");
    expect(migrated.room.spawnPoints).toEqual([]);
    expect(migrated.room.nextEnemyInstanceSequence).toBe(1);
    expect(migrated.room.brouhaha.level).toBe(0);
    expect(migrated.room.interactables).toEqual([]);
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

  it("rejette une corruption profonde des objets", async () => {
    const initial = createTestRoom();
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 4,
      room: {
        ...initial,
        processedInteractableRequestIds: ["doublon", "doublon"],
      },
      selectedHeroIds: ["h"],
    });
    await expect(loadRoomState()).resolves.toBeNull();
  });

  it("rejette une sélection absente de la salle", async () => {
    await putRawSave("room-autosave", {
      kind: "tactical-room",
      version: 4,
      room: createTestRoom(),
      selectedHeroIds: ["fantome"],
    });
    await expect(loadRoomState()).resolves.toBeNull();
  });

  it("supprime la sauvegarde sans créer un faux héritage", async () => {
    const room = createTestRoom();
    await saveRoomState({
      kind: "tactical-room",
      version: 4,
      room,
      selectedHeroIds: ["h"],
    });
    await clearRoomState();
    await expect(loadRoomState()).resolves.toBeNull();
  });
});
