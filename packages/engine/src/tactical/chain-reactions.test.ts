import { describe, expect, it } from "vitest";
import { resolveChainReactions } from "./chain-reactions";
import { interactWithObject } from "./interactables";
import { createRoomState } from "./room-state";
import type {
  BrouhahaEffectDefinition,
  ChainReactionDefinition,
  CreatureDefinition,
  InteractableDefinition,
  RoomState,
} from "./types";

const creature: CreatureDefinition = {
  id: "gobelin",
  name: "Gobelin",
  maxHp: 5,
  atk: 2,
  def: 0,
  range: 1,
  blocksMovement: true,
};

const definitions: InteractableDefinition[] = [
  {
    id: "table",
    name: "Table",
    kind: "table",
    initialStateId: "debout",
    states: [
      {
        id: "debout",
        label: "debout",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
      {
        id: "renversee",
        label: "renversée",
        blocksMovement: true,
        blocksLineOfSight: false,
      },
    ],
    interactions: [
      {
        id: "renverser",
        label: "Pousser et renverser",
        fromStateId: "debout",
        toStateId: "renversee",
        brouhahaDelta: 0,
        reason: "La table tombe.",
        movement: { type: "push", distance: 1 },
      },
    ],
  },
  {
    id: "pilier",
    name: "Pilier",
    kind: "pillar",
    initialStateId: "intact",
    states: [
      {
        id: "intact",
        label: "intact",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
      {
        id: "fissure",
        label: "fissuré",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
    ],
    interactions: [
      {
        id: "fissurer",
        label: "Fissurer",
        fromStateId: "intact",
        toStateId: "fissure",
        brouhahaDelta: 1,
        reason: "Le pilier craque.",
      },
    ],
  },
  {
    id: "grille",
    name: "Grille",
    kind: "gate",
    initialStateId: "fermee",
    states: [
      {
        id: "fermee",
        label: "fermée",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
      {
        id: "ouverte",
        label: "ouverte",
        blocksMovement: false,
        blocksLineOfSight: false,
      },
    ],
    interactions: [
      {
        id: "ouvrir",
        label: "Ouvrir",
        fromStateId: "fermee",
        toStateId: "ouverte",
        brouhahaDelta: 0,
        reason: "La grille s'ouvre.",
      },
      {
        id: "fermer",
        label: "Fermer",
        fromStateId: "ouverte",
        toStateId: "fermee",
        brouhahaDelta: 0,
        reason: "La grille se ferme.",
      },
    ],
  },
];

const effects: BrouhahaEffectDefinition[] = [
  {
    id: "echo",
    name: "Écho",
    description: "Le donjon répond.",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 9,
  },
];

const reactions: ChainReactionDefinition[] = [
  {
    id: "table-percute-pilier",
    trigger: {
      type: "moved",
      interactableInstanceId: "table-1",
      position: { column: 3, row: 1 },
    },
    actions: [
      {
        type: "transition",
        targetInstanceId: "pilier-1",
        interactionId: "fissurer",
      },
      {
        type: "damage",
        centerInstanceId: "pilier-1",
        radius: 3,
        amount: 2,
      },
    ],
  },
  {
    id: "pilier-libere-grille",
    trigger: {
      type: "state-entered",
      interactableInstanceId: "pilier-1",
      stateId: "fissure",
    },
    actions: [
      {
        type: "transition",
        targetInstanceId: "grille-1",
        interactionId: "ouvrir",
      },
      {
        type: "brouhaha",
        delta: 1,
        reason: "Le mécanisme cède.",
      },
    ],
  },
];

function room(obstacles: { column: number; row: number }[] = []): RoomState {
  const state = createRoomState({
    scenarioId: "salle-test",
    width: 7,
    height: 3,
    obstacles,
    interactableDefinitions: definitions,
    interactables: [
      {
        id: "table-1",
        interactableId: "table",
        position: { column: 2, row: 1 },
        stateId: "debout",
      },
      {
        id: "pilier-1",
        interactableId: "pilier",
        position: { column: 4, row: 1 },
        stateId: "intact",
      },
      {
        id: "grille-1",
        interactableId: "grille",
        position: { column: 5, row: 1 },
        stateId: "fermee",
      },
    ],
    spawnPoints: [],
    heroes: [
      {
        id: "hero",
        name: "Héroïne",
        position: { column: 1, row: 1 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 1,
        range: 1,
      },
    ],
    creatureDefinitions: [creature],
    enemies: [
      {
        id: "gobelin-1",
        creatureId: creature.id,
        position: { column: 6, row: 2 },
      },
    ],
  });
  return { ...state, activeHeroId: "hero" };
}

const request = {
  id: "interaction-1",
  heroId: "hero",
  interactableInstanceId: "table-1",
  interactionId: "renverser",
};

const context = { dungeonId: "bastognac" };

describe("réactions en chaîne déterministes", () => {
  it("pousse, fissure, blesse, ouvre et ordonne plusieurs Brouhaha", () => {
    const result = interactWithObject(
      room(),
      definitions,
      effects,
      request,
      context,
      reactions,
    );

    expect(result.rejection).toBeNull();
    expect(result.state.interactables).toMatchObject([
      { id: "table-1", position: { column: 3, row: 1 }, stateId: "renversee" },
      { id: "pilier-1", stateId: "fissure" },
      { id: "grille-1", stateId: "ouverte", blocksMovement: false },
    ]);
    expect(result.state.heroes[0]).toMatchObject({ hp: 8, actionsRemaining: 2 });
    expect(result.state.brouhaha.history.map((entry) => entry.requestId)).toEqual([
      "reaction-1-brouhaha",
      "reaction-4-brouhaha",
    ]);
    expect(result.state.brouhaha.level).toBe(2);
    expect(result.state.chainReactionHistory.map((entry) => entry.actionType)).toEqual([
      "transition",
      "damage",
      "transition",
      "brouhaha",
    ]);
    expect(result.state.nextChainReactionSequence).toBe(5);
    expect(result.events.map((event) => event.type)).toContain(
      "chain-reaction-damage-applied",
    );
  });

  it("retourne exactement le même résultat pour les mêmes entrées", () => {
    const current = room();
    expect(
      interactWithObject(current, definitions, effects, request, context, reactions),
    ).toEqual(
      interactWithObject(current, definitions, effects, request, context, reactions),
    );
  });

  it("refuse une poussée bloquée sans mutation", () => {
    const current = room([{ column: 3, row: 1 }]);
    const result = interactWithObject(
      current,
      definitions,
      effects,
      request,
      context,
      reactions,
    );

    expect(result.state).toBe(current);
    expect(result.rejection?.reason).toBe("movement-blocked");
    expect(current.heroes[0]?.actionsRemaining).toBe(3);
  });

  it("interrompt explicitement un cycle de transitions", () => {
    const current = room();
    const opened = {
      ...current,
      interactables: current.interactables.map((instance) =>
        instance.id === "grille-1"
          ? {
              ...instance,
              stateId: "ouverte",
              blocksMovement: false,
              blocksLineOfSight: false,
            }
          : instance,
      ),
    };
    const cyclic: ChainReactionDefinition[] = [
      {
        id: "a-fermer",
        trigger: {
          type: "state-entered",
          interactableInstanceId: "grille-1",
          stateId: "ouverte",
        },
        actions: [
          {
            type: "transition",
            targetInstanceId: "grille-1",
            interactionId: "fermer",
          },
        ],
      },
      {
        id: "b-ouvrir",
        trigger: {
          type: "state-entered",
          interactableInstanceId: "grille-1",
          stateId: "fermee",
        },
        actions: [
          {
            type: "transition",
            targetInstanceId: "grille-1",
            interactionId: "ouvrir",
          },
        ],
      },
    ];
    const result = resolveChainReactions(
      opened,
      definitions,
      effects,
      cyclic,
      [
        {
          trigger: {
            type: "state-entered",
            interactableInstanceId: "grille-1",
            stateId: "ouverte",
          },
          parentReactionId: null,
        },
      ],
      { dungeonId: "bastognac", rootRequestId: "cycle-test" },
    );

    expect(result.guarded).toBe(true);
    expect(result.history.at(-1)).toMatchObject({
      actionType: "guard",
      outcome: "guarded",
      details: ["cycle-detected"],
    });
    expect(result.events.at(-1)).toMatchObject({
      type: "chain-reaction-guarded",
      reason: "cycle-detected",
    });
  });
});
