import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  changeBrouhaha,
  createInitialGameState,
  createRoomState,
  type BrouhahaEffectDefinition,
  type BrouhahaReinforcementDefinition,
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
import { parseSavedRoomPayload } from "./saved-room-schema";

const creature: CreatureDefinition = {
  id: "gobelin-test",
  name: "Gobelin Test",
  maxHp: 5,
  atk: 2,
  def: 0,
  range: 1,
  blocksMovement: true,
};

const effects: BrouhahaEffectDefinition[] = [
  {
    id: "echo",
    name: "Écho",
    description: "Un écho répond.",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 12,
  },
  {
    id: "fracas",
    name: "Fracas",
    description: "Le donjon tremble.",
    scope: { type: "universal" },
    minLevel: 10,
    maxLevel: 12,
  },
];

const reinforcement: BrouhahaReinforcementDefinition = {
  id: "seuil-test",
  threshold: 1,
  creatureId: creature.id,
  quantity: 1,
  candidateSpawnPointIds: ["renfort"],
  failureMode: "all-or-nothing",
  maxActivations: 2,
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
    updatedAt: "2026-07-24T00:00:00.000Z",
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
    scenarioId: "salle-test",
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
        id: "hero",
        name: "Héroïne",
        position: { column: 1, row: 1 },
        hp: 7,
        maxHp: 10,
        atk: 4,
        def: 1,
        range: 1,
      },
    ],
    creatureDefinitions: [creature],
    enemies: [
      {
        id: "ennemi-initial",
        creatureId: creature.id,
        position: { column: 4, row: 0 },
      },
    ],
  });
}

function currentPayload() {
  const room = changeBrouhaha(
    createTestRoom(),
    effects,
    {
      id: "brouhaha-save-1",
      delta: 1,
      source: { type: "test", id: "save-test" },
      reason: "Test de sauvegarde",
    },
    {
      dungeonId: "bastognac",
      creatureDefinitions: [creature],
      reinforcementDefinitions: [reinforcement],
    },
  ).state;
  return {
    kind: "tactical-room" as const,
    version: 6 as const,
    room,
    selectedHeroIds: ["hero"],
  };
}

function legacyV5() {
  const current = createTestRoom();
  const {
    nextBrouhahaReinforcementSequence: _next,
    brouhahaReinforcementHistory: _history,
    ...room
  } = current;
  return {
    kind: "tactical-room",
    version: 5,
    room: { ...room, version: 5 },
    selectedHeroIds: ["hero"],
  };
}

function legacyV4() {
  const current = legacyV5().room;
  const {
    nextChainReactionSequence: _next,
    chainReactionHistory: _history,
    ...room
  } = current;
  return {
    kind: "tactical-room",
    version: 4,
    room: { ...room, version: 4 },
    selectedHeroIds: ["hero"],
  };
}

function legacyV3() {
  const current = legacyV4().room;
  const {
    interactables: _objects,
    processedInteractableRequestIds: _processed,
    nextInteractableInteractionSequence: _next,
    ...room
  } = current;
  return {
    kind: "tactical-room",
    version: 3,
    room: { ...room, version: 3 },
    selectedHeroIds: ["hero"],
  };
}

function legacyV2() {
  const current = legacyV3().room;
  const { brouhaha: _brouhaha, ...room } = current;
  return {
    kind: "tactical-room",
    version: 2,
    room: { ...room, version: 2 },
    selectedHeroIds: ["hero"],
  };
}

function legacyV1() {
  const current = createTestRoom();
  return {
    kind: "tactical-room",
    version: 1,
    room: {
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
    },
    selectedHeroIds: ["hero"],
  };
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

  it("rejette un état d'application incomplet", async () => {
    await putRawSave("autosave", { phase: "menu" });
    await expect(loadGameState()).resolves.toBeNull();
  });
});

describe("sauvegarde tactique version 6", () => {
  it("restaure exactement l'historique et les compteurs de renfort", async () => {
    const payload = currentPayload();
    await saveRoomState(payload);
    await expect(loadRoomState()).resolves.toEqual(payload);
    expect(payload.room.brouhahaReinforcementHistory[0]).toMatchObject({
      reinforcementDefinitionId: "seuil-test",
      activation: 1,
      result: "succeeded",
    });
    expect(payload.room.nextBrouhahaReinforcementSequence).toBe(2);
  });

  it.each([
    ["5", legacyV5],
    ["4", legacyV4],
    ["3", legacyV3],
    ["2", legacyV2],
    ["1", legacyV1],
  ])("migre la version %s sans renfort rétroactif", (_version, factory) => {
    const migrated = parseSavedRoomPayload(factory());
    expect(migrated?.version).toBe(6);
    expect(migrated?.room.version).toBe(6);
    expect(migrated?.room.nextBrouhahaReinforcementSequence).toBe(1);
    expect(migrated?.room.brouhahaReinforcementHistory).toEqual([]);
  });

  it("préserve les fondations lors de la migration version 5", () => {
    const migrated = parseSavedRoomPayload(legacyV5());
    expect(migrated?.room.nextChainReactionSequence).toBe(1);
    expect(migrated?.room.chainReactionHistory).toEqual([]);
    expect(migrated?.room.brouhaha.level).toBe(0);
    expect(migrated?.room.spawnPoints).toHaveLength(1);
  });

  it("rejette un historique de renfort corrompu", () => {
    const payload = currentPayload();
    const entry = payload.room.brouhahaReinforcementHistory[0]!;
    expect(
      parseSavedRoomPayload({
        ...payload,
        room: {
          ...payload.room,
          nextBrouhahaReinforcementSequence: 2,
          brouhahaReinforcementHistory: [entry, entry],
        },
      }),
    ).toBeNull();
  });

  it("rejette une prochaine séquence incohérente", () => {
    const payload = currentPayload();
    expect(
      parseSavedRoomPayload({
        ...payload,
        room: {
          ...payload.room,
          nextBrouhahaReinforcementSequence: 1,
        },
      }),
    ).toBeNull();
  });

  it("rejette un payload invalide et une sélection absente", () => {
    expect(parseSavedRoomPayload({ version: 99 })).toBeNull();
    expect(
      parseSavedRoomPayload({
        ...currentPayload(),
        selectedHeroIds: ["fantome"],
      }),
    ).toBeNull();
  });

  it("détecte une ancienne sauvegarde Sprint 0", async () => {
    await saveGameState(createInitialGameState(4));
    await expect(loadRoomState()).resolves.toBe("legacy");
  });

  it("supprime la sauvegarde sans créer un faux héritage", async () => {
    await saveRoomState(currentPayload());
    await clearRoomState();
    await expect(loadRoomState()).resolves.toBeNull();
  });
});
