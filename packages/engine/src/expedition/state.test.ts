import { describe, expect, it } from "vitest";
import { createRoomState, type RoomState } from "../tactical";
import {
  applyPersistentHeroesToRoom,
  createExpeditionState,
  isTransitionAvailable,
  persistentHeroesFromRoom,
  startExpedition,
  synchronizeCurrentRoom,
  transitionExpedition,
} from "./state";

const roomIds = ["salle-1", "salle-2", "salle-3"] as const;

function room(id: string): RoomState {
  return createRoomState({
    scenarioId: id,
    width: 4,
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
        position: { column: 3, row: 0 },
      },
    ],
  });
}

function initialState(firstRoom: RoomState) {
  return createExpeditionState({
    id: "expedition-1",
    definitionId: "micro-donjon-bastognac",
    selectedHeroIds: ["brunhilda"],
    orderedRoomIds: roomIds,
    persistentHeroes: persistentHeroesFromRoom(firstRoom, ["brunhilda"]),
  });
}

function victorious(source: RoomState): RoomState {
  return {
    ...source,
    enemies: source.enemies.map((enemy) => ({
      ...enemy,
      hp: 0,
      alive: false,
    })),
    phase: "victory",
  };
}

describe("état d’expédition", () => {
  it("démarre dans la première salle et conserve l’état tactique local", () => {
    const first = room(roomIds[0]);
    const started = startExpedition(initialState(first), roomIds[0], first);

    expect(started.status).toBe("in-progress");
    expect(started.currentRoomId).toBe(roomIds[0]);
    expect(started.visitedRoomIds).toEqual([roomIds[0]]);
    expect(started.roomStates[roomIds[0]]).toBe(first);
  });

  it("enregistre la victoire locale avant de rendre la transition disponible", () => {
    const first = room(roomIds[0]);
    const started = startExpedition(initialState(first), roomIds[0], first);
    const completed = synchronizeCurrentRoom(started, victorious(first));

    expect(completed.completedRoomIds).toEqual([roomIds[0]]);
    expect(completed.status).toBe("in-progress");
    expect(completed.result).toBeNull();
    expect(isTransitionAvailable(completed)).toBe(true);
  });

  it("transfère uniquement les PV persistants vers la salle suivante", () => {
    const first = room(roomIds[0]);
    const wounded = {
      ...first,
      heroes: first.heroes.map((hero) => ({ ...hero, hp: 7 })),
    };
    const completed = synchronizeCurrentRoom(
      startExpedition(initialState(first), roomIds[0], first),
      victorious(wounded),
    );
    const second = applyPersistentHeroesToRoom(
      room(roomIds[1]),
      completed.persistentHeroes,
    );
    const transitioned = transitionExpedition(completed, second);

    expect(transitioned.currentRoomId).toBe(roomIds[1]);
    expect(transitioned.visitedRoomIds).toEqual([roomIds[0], roomIds[1]]);
    expect(transitioned.roomStates[roomIds[0]]?.phase).toBe("victory");
    expect(transitioned.roomStates[roomIds[1]]?.heroes[0]?.hp).toBe(7);
    expect(transitioned.roomStates[roomIds[1]]?.brouhaha.level).toBe(0);
  });

  it("refuse une transition avant la complétion locale", () => {
    const first = room(roomIds[0]);
    const started = startExpedition(initialState(first), roomIds[0], first);
    expect(() => transitionExpedition(started, room(roomIds[1]))).toThrow(
      /sortie.*disponible/,
    );
  });

  it("marque la troisième salle terminée avant la victoire globale", () => {
    const first = room(roomIds[0]);
    let state = synchronizeCurrentRoom(
      startExpedition(initialState(first), roomIds[0], first),
      victorious(first),
    );
    const second = applyPersistentHeroesToRoom(
      room(roomIds[1]),
      state.persistentHeroes,
    );
    state = transitionExpedition(state, second);
    state = synchronizeCurrentRoom(state, victorious(second));
    const third = applyPersistentHeroesToRoom(
      room(roomIds[2]),
      state.persistentHeroes,
    );
    state = transitionExpedition(state, third);
    state = synchronizeCurrentRoom(state, victorious(third));

    expect(state.status).toBe("victory");
    expect(state.completedRoomIds).toEqual([...roomIds]);
    expect(state.result?.outcome).toBe("victory");
    expect(state.result?.rooms.at(-1)?.completed).toBe(true);
  });

  it("rend la défaite globale terminale et produit un résultat", () => {
    const first = room(roomIds[0]);
    const started = startExpedition(initialState(first), roomIds[0], first);
    const defeatedRoom: RoomState = {
      ...first,
      heroes: first.heroes.map((hero) => ({
        ...hero,
        hp: 0,
        alive: false,
      })),
      phase: "defeat",
    };
    const defeated = synchronizeCurrentRoom(started, defeatedRoom);

    expect(defeated.status).toBe("defeat");
    expect(defeated.result?.heroes[0]?.alive).toBe(false);
    expect(isTransitionAvailable(defeated)).toBe(false);
  });

  it("reste idempotent lors d’une seconde synchronisation terminale", () => {
    const first = room(roomIds[0]);
    const started = startExpedition(initialState(first), roomIds[0], first);
    const once = synchronizeCurrentRoom(started, victorious(first));
    const twice = synchronizeCurrentRoom(once, victorious(first));

    expect(twice.completedRoomIds).toEqual([roomIds[0]]);
  });
});
