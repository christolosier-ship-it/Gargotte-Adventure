import type { TacticalRoomDefinition } from "@gargotte/content-schema";
import {
  applyPersistentHeroesToRoom,
  createRoomState,
  spawnCreatures,
  type CreatureDefinition,
  type InteractableDefinition,
  type PersistentHeroState,
  type RoomState,
  type TacticalEvent,
} from "@gargotte/engine";

export interface BuiltTacticalRoom {
  state: RoomState;
  events: TacticalEvent[];
}

export function buildTacticalRoom(
  definition: TacticalRoomDefinition,
  creatureDefinitions: readonly CreatureDefinition[],
  interactableDefinitions: readonly InteractableDefinition[],
  selectedHeroIds: readonly string[],
): RoomState {
  return buildTacticalRoomWithEvents(
    definition,
    creatureDefinitions,
    interactableDefinitions,
    selectedHeroIds,
  ).state;
}

export function buildTacticalRoomWithEvents(
  definition: TacticalRoomDefinition,
  creatureDefinitions: readonly CreatureDefinition[],
  interactableDefinitions: readonly InteractableDefinition[],
  selectedHeroIds: readonly string[],
  persistentHeroes: readonly PersistentHeroState[] = [],
): BuiltTacticalRoom {
  const heroes = definition.heroes.filter((hero) =>
    selectedHeroIds.includes(hero.id),
  );
  let state = createRoomState({
    scenarioId: definition.id,
    width: definition.grid.width,
    height: definition.grid.height,
    obstacles: definition.obstacles,
    interactableDefinitions: [...interactableDefinitions],
    interactables: definition.interactables,
    spawnPoints: definition.spawnPoints,
    heroes,
    creatureDefinitions: [...creatureDefinitions],
    enemies: [],
  });

  const events: TacticalEvent[] = [];
  for (const initial of definition.initialSpawns) {
    const result = spawnCreatures(state, creatureDefinitions, {
      id: initial.id,
      source: { type: "scenario", id: definition.id },
      creatureId: initial.creatureId,
      quantity: initial.quantity,
      candidateSpawnPointIds: initial.candidateSpawnPointIds,
      failureMode: initial.failureMode,
    });
    if (result.created.length !== initial.quantity)
      throw new Error(
        `${definition.id}: population initiale incomplète ${initial.id}.`,
      );
    state = result.state;
    events.push(...result.events);
  }

  if (persistentHeroes.length > 0)
    state = applyPersistentHeroesToRoom(state, persistentHeroes);

  return { state, events };
}
