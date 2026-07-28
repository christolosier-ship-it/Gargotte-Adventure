import { describe, expect, it } from "vitest";
import {
  createExpeditionState,
  createRoomState,
  persistentHeroesFromRoom,
  startExpedition,
  synchronizeCurrentRoom,
  type RoomState,
} from "@gargotte/engine";
import {
  expeditionStateSchema,
  parseSavedExpeditionPayload,
} from "./expedition-schema";

function room(id = "salle-1"): RoomState {
  return createRoomState({
    scenarioId: id,
    width: 3,
    height: 2,
    obstacles: [],
    spawnPoints: [],
    heroes: [
      {
        id: "brunhilda",
        name: "Brünhilda",
        position: { column: 0, row: 0 },
        hp: 12,
        maxHp: 12,
        atk: 4,
        def: 2,
        range: 1,
      },
    ],
    creatureDefinitions: [
      {
        id: "gobelin",
        name: "Gobelin",
        maxHp: 2,
        atk: 1,
        def: 0,
        range: 1,
        blocksMovement: true,
      },
    ],
    enemies: [
      {
        id: `${id}-gobelin`,
        creatureId: "gobelin",
        position: { column: 2, row: 0 },
      },
    ],
  });
}

function activeExpedition() {
  const first = room();
  const state = createExpeditionState({
    id: "expedition-1",
    definitionId: "micro-donjon",
    selectedHeroIds: ["brunhilda"],
    orderedRoomIds: ["salle-1", "salle-2", "salle-3"],
    persistentHeroes: persistentHeroesFromRoom(first, ["brunhilda"]),
  });
  return startExpedition(state, "salle-1", first);
}

describe("sauvegarde d’expédition", () => {
  it("valide le payload version 1", () => {
    const expedition = activeExpedition();
    expect(
      parseSavedExpeditionPayload({
        kind: "expedition",
        version: 1,
        expedition,
        diagnosticMode: false,
      }),
    ).toEqual({
      kind: "expedition",
      version: 1,
      expedition,
      diagnosticMode: false,
    });
  });

  it("rejette une salle courante absente des états tactiques", () => {
    const expedition = activeExpedition();
    expect(
      expeditionStateSchema.safeParse({ ...expedition, roomStates: {} })
        .success,
    ).toBe(false);
  });

  it("rejette une liste de salles visitées dupliquée", () => {
    const expedition = activeExpedition();
    expect(
      expeditionStateSchema.safeParse({
        ...expedition,
        visitedRoomIds: ["salle-1", "salle-1"],
      }).success,
    ).toBe(false);
  });

  it("rejette une victoire globale sans troisième salle terminée", () => {
    const expedition = activeExpedition();
    expect(
      expeditionStateSchema.safeParse({
        ...expedition,
        status: "victory",
        result: {
          outcome: "victory",
          totalTurns: 1,
          defeatedEnemies: 1,
          heroes: expedition.persistentHeroes,
          rooms: [
            {
              roomId: "salle-1",
              turns: 1,
              finalBrouhahaLevel: 0,
              defeatedEnemies: 1,
              completed: true,
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it("accepte une salle locale victorieuse enregistrée comme terminée", () => {
    const expedition = activeExpedition();
    const first = expedition.roomStates["salle-1"]!;
    const victory: RoomState = {
      ...first,
      enemies: first.enemies.map((enemy) => ({
        ...enemy,
        hp: 0,
        alive: false,
      })),
      phase: "victory",
    };
    const completed = synchronizeCurrentRoom(expedition, victory);
    expect(expeditionStateSchema.parse(completed).completedRoomIds).toEqual([
      "salle-1",
    ]);
  });
});
