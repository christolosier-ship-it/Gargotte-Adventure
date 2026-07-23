import type { TacticalRoomDefinition } from "@gargotte/content-schema";
import {
  createRoomState,
  type CreatureDefinition,
  type InteractableDefinition,
  type RoomState,
} from "@gargotte/engine";

export function buildTacticalRoom(
  definition: TacticalRoomDefinition,
  creatureDefinitions: readonly CreatureDefinition[],
  interactableDefinitions: readonly InteractableDefinition[],
  selectedHeroIds: readonly string[],
): RoomState {
  const heroes = definition.heroes.filter((hero) =>
    selectedHeroIds.includes(hero.id),
  );
  return createRoomState({
    scenarioId: definition.id,
    width: definition.grid.width,
    height: definition.grid.height,
    obstacles: definition.obstacles,
    interactableDefinitions: [...interactableDefinitions],
    interactables: definition.interactables,
    spawnPoints: definition.spawnPoints,
    heroes,
    creatureDefinitions: [...creatureDefinitions],
    enemies: definition.enemies,
  });
}
