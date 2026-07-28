import { HERO_ACTIONS, withTerminalPhase, type RoomState } from "../tactical";
import type {
  ExpeditionResult,
  ExpeditionState,
  PersistentHeroState,
} from "./types";

export function createExpeditionState(input: {
  id: string;
  definitionId: string;
  selectedHeroIds: readonly string[];
  orderedRoomIds: readonly [string, string, string];
  persistentHeroes: readonly PersistentHeroState[];
}): ExpeditionState {
  assertUnique(input.selectedHeroIds, "héros sélectionnés");
  assertUnique(input.orderedRoomIds, "salles ordonnées");
  const persistentIds = input.persistentHeroes.map((hero) => hero.id);
  assertUnique(persistentIds, "héros persistants");
  if (
    input.selectedHeroIds.length === 0 ||
    input.selectedHeroIds.some((id) => !persistentIds.includes(id))
  )
    throw new Error(
      "L’état persistant doit contenir chaque héros sélectionné.",
    );

  return {
    version: 1,
    id: input.id,
    definitionId: input.definitionId,
    selectedHeroIds: [...input.selectedHeroIds],
    currentRoomId: null,
    orderedRoomIds: [...input.orderedRoomIds],
    visitedRoomIds: [],
    completedRoomIds: [],
    persistentHeroes: input.persistentHeroes.map((hero) => ({ ...hero })),
    roomStates: {},
    status: "preparation",
    result: null,
  };
}

export function persistentHeroesFromRoom(
  room: RoomState,
  selectedHeroIds: readonly string[],
): PersistentHeroState[] {
  return selectedHeroIds.map((id) => {
    const hero = room.heroes.find((candidate) => candidate.id === id);
    if (!hero) throw new Error(`Héros persistant absent de la salle: ${id}.`);
    return {
      id: hero.id,
      hp: hero.hp,
      maxHp: hero.maxHp,
      alive: hero.alive,
    };
  });
}

export function applyPersistentHeroesToRoom(
  room: RoomState,
  persistentHeroes: readonly PersistentHeroState[],
): RoomState {
  const byId = new Map(persistentHeroes.map((hero) => [hero.id, hero]));
  const next = {
    ...room,
    heroes: room.heroes.map((hero) => {
      const persistent = byId.get(hero.id);
      if (!persistent) return hero;
      const hp = Math.max(0, Math.min(persistent.hp, hero.maxHp));
      const alive = persistent.alive && hp > 0;
      return {
        ...hero,
        hp,
        alive,
        actionsRemaining: alive ? HERO_ACTIONS : 0,
        activationCompleted: !alive,
      };
    }),
    activeHeroId: null,
    enemyTurnRoster: [],
    phase: "heroes-turn" as const,
    turn: 1,
  };
  return withTerminalPhase(next);
}

export function startExpedition(
  state: ExpeditionState,
  roomId: string,
  room: RoomState,
): ExpeditionState {
  if (state.status !== "preparation")
    throw new Error("L’expédition est déjà commencée.");
  if (roomId !== state.orderedRoomIds[0])
    throw new Error("L’expédition doit commencer dans la première salle.");
  assertRoomIdentity(roomId, room);
  const started: ExpeditionState = {
    ...state,
    currentRoomId: roomId,
    visitedRoomIds: [roomId],
    roomStates: { [roomId]: room },
    persistentHeroes: persistentHeroesFromRoom(room, state.selectedHeroIds),
    status: "in-progress",
  };
  return synchronizeCurrentRoom(started, room);
}

export function synchronizeCurrentRoom(
  state: ExpeditionState,
  room: RoomState,
): ExpeditionState {
  if (!state.currentRoomId)
    throw new Error("Aucune salle courante à synchroniser.");
  assertRoomIdentity(state.currentRoomId, room);
  if (state.status === "victory" || state.status === "defeat") return state;

  const roomStates = { ...state.roomStates, [state.currentRoomId]: room };
  const persistentHeroes = persistentHeroesFromRoom(
    room,
    state.selectedHeroIds,
  );
  const completedRoomIds =
    room.phase === "victory"
      ? appendUnique(state.completedRoomIds, state.currentRoomId)
      : state.completedRoomIds;
  const next: ExpeditionState = {
    ...state,
    roomStates,
    persistentHeroes,
    completedRoomIds,
  };

  if (room.phase === "defeat")
    return {
      ...next,
      status: "defeat",
      result: createExpeditionResult(next, "defeat"),
    };

  if (
    room.phase === "victory" &&
    state.currentRoomId === state.orderedRoomIds.at(-1)
  )
    return {
      ...next,
      status: "victory",
      result: createExpeditionResult(next, "victory"),
    };

  return next;
}

export function getNextRoomId(state: ExpeditionState): string | null {
  if (!state.currentRoomId) return state.orderedRoomIds[0];
  const currentIndex = state.orderedRoomIds.indexOf(state.currentRoomId);
  return state.orderedRoomIds[currentIndex + 1] ?? null;
}

export function isTransitionAvailable(state: ExpeditionState): boolean {
  return (
    state.status === "in-progress" &&
    state.currentRoomId !== null &&
    state.completedRoomIds.includes(state.currentRoomId) &&
    getNextRoomId(state) !== null
  );
}

export function transitionExpedition(
  state: ExpeditionState,
  targetRoom: RoomState,
): ExpeditionState {
  if (!isTransitionAvailable(state))
    throw new Error("La sortie de la salle courante n’est pas disponible.");
  const targetRoomId = getNextRoomId(state);
  if (!targetRoomId) throw new Error("Aucune salle suivante n’est déclarée.");
  assertRoomIdentity(targetRoomId, targetRoom);

  return {
    ...state,
    currentRoomId: targetRoomId,
    visitedRoomIds: appendUnique(state.visitedRoomIds, targetRoomId),
    roomStates: { ...state.roomStates, [targetRoomId]: targetRoom },
    persistentHeroes: persistentHeroesFromRoom(
      targetRoom,
      state.selectedHeroIds,
    ),
  };
}

export function createExpeditionResult(
  state: ExpeditionState,
  outcome: ExpeditionResult["outcome"],
): ExpeditionResult {
  const rooms = state.orderedRoomIds.flatMap((roomId) => {
    const room = state.roomStates[roomId];
    return room
      ? [
          {
            roomId,
            turns: room.turn,
            finalBrouhahaLevel: room.brouhaha.level,
            defeatedEnemies: room.enemies.filter((enemy) => !enemy.alive)
              .length,
            completed: state.completedRoomIds.includes(roomId),
          },
        ]
      : [];
  });
  return {
    outcome,
    totalTurns: rooms.reduce((total, room) => total + room.turns, 0),
    defeatedEnemies: rooms.reduce(
      (total, room) => total + room.defeatedEnemies,
      0,
    ),
    heroes: state.persistentHeroes.map((hero) => ({ ...hero })),
    rooms,
  };
}

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function assertRoomIdentity(roomId: string, room: RoomState): void {
  if (room.scenarioId !== roomId)
    throw new Error(`Salle ${room.scenarioId} reçue à la place de ${roomId}.`);
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length)
    throw new Error(`La liste des ${label} contient des doublons.`);
}
