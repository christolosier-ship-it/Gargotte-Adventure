import { createInitialBrouhahaState } from "./brouhaha";
import type {
  CreatureDefinition,
  EnemyState,
  HeroState,
  InitialCreaturePlacement,
  InitialInteractablePlacement,
  InteractableDefinition,
  InteractableInstance,
  RoomState,
  SpawnPoint,
} from "./types";

export const HERO_ACTIONS = 3;

export function createRoomState(input: {
  scenarioId: string;
  width: number;
  height: number;
  obstacles: { column: number; row: number }[];
  interactableDefinitions?: InteractableDefinition[];
  interactables?: InitialInteractablePlacement[];
  spawnPoints: SpawnPoint[];
  heroes: Omit<
    HeroState,
    | "kind"
    | "alive"
    | "blocksMovement"
    | "actionsRemaining"
    | "activationCompleted"
  >[];
  creatureDefinitions: CreatureDefinition[];
  enemies: InitialCreaturePlacement[];
}): RoomState {
  const creatureDefinitions = new Map(
    input.creatureDefinitions.map((definition) => [definition.id, definition]),
  );
  const interactableDefinitions = new Map(
    (input.interactableDefinitions ?? []).map((definition) => [
      definition.id,
      definition,
    ]),
  );

  return {
    version: 4,
    scenarioId: input.scenarioId,
    width: input.width,
    height: input.height,
    obstacles: input.obstacles,
    interactables: (input.interactables ?? []).map((placement) =>
      createInitialInteractable(placement, interactableDefinitions),
    ),
    processedInteractableRequestIds: [],
    nextInteractableInteractionSequence: 1,
    spawnPoints: input.spawnPoints,
    processedSpawnRequestIds: [],
    nextEnemyInstanceSequence: 1,
    brouhaha: createInitialBrouhahaState(),
    heroes: input.heroes.map((hero) => ({
      ...hero,
      kind: "hero",
      alive: hero.hp > 0,
      blocksMovement: true,
      actionsRemaining: HERO_ACTIONS,
      activationCompleted: false,
    })),
    enemies: input.enemies.map((placement) =>
      createInitialEnemy(placement, creatureDefinitions),
    ),
    activeHeroId: null,
    phase: "heroes-turn",
    turn: 1,
  };
}

function createInitialEnemy(
  placement: InitialCreaturePlacement,
  definitions: ReadonlyMap<string, CreatureDefinition>,
): EnemyState {
  const definition = definitions.get(placement.creatureId);
  if (!definition)
    throw new Error(
      `Définition de créature absente pour ${placement.creatureId}.`,
    );

  return {
    id: placement.id,
    creatureId: definition.id,
    name: definition.name,
    kind: "enemy",
    position: placement.position,
    hp: definition.maxHp,
    maxHp: definition.maxHp,
    atk: definition.atk,
    def: definition.def,
    range: definition.range,
    alive: definition.maxHp > 0,
    blocksMovement: definition.blocksMovement,
  };
}

function createInitialInteractable(
  placement: InitialInteractablePlacement,
  definitions: ReadonlyMap<string, InteractableDefinition>,
): InteractableInstance {
  const definition = definitions.get(placement.interactableId);
  if (!definition)
    throw new Error(
      `Définition d'objet absente pour ${placement.interactableId}.`,
    );
  const state = definition.states.find(
    (candidate) => candidate.id === placement.stateId,
  );
  if (!state)
    throw new Error(
      `État ${placement.stateId} absent pour ${placement.interactableId}.`,
    );

  return {
    id: placement.id,
    interactableId: definition.id,
    name: definition.name,
    kind: definition.kind,
    position: placement.position,
    stateId: state.id,
    blocksMovement: state.blocksMovement,
    blocksLineOfSight: state.blocksLineOfSight,
  };
}

export function withTerminalPhase(state: RoomState): RoomState {
  if (state.enemies.every((enemy) => !enemy.alive))
    return { ...state, phase: "victory", activeHeroId: null };
  if (state.heroes.every((hero) => !hero.alive))
    return { ...state, phase: "defeat", activeHeroId: null };
  return state;
}

export function restoreHeroActions(state: RoomState): RoomState {
  return {
    ...state,
    heroes: state.heroes.map((hero) =>
      hero.alive
        ? {
            ...hero,
            actionsRemaining: HERO_ACTIONS,
            activationCompleted: false,
          }
        : hero,
    ),
    activeHeroId: null,
  };
}
