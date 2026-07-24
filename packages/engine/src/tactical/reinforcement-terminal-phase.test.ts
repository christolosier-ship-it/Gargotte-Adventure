import { describe, expect, it } from "vitest";
import type { BrouhahaReinforcementDefinition } from "./brouhaha-reinforcement-types";
import type { ChainReactionDefinition } from "./chain-reaction-types";
import { resolveChainReactions } from "./chain-reactions";
import { createRoomState } from "./room-state";
import type {
  BrouhahaEffectDefinition,
  CreatureDefinition,
  InteractableDefinition,
} from "./types";

const creature: CreatureDefinition = {
  id: "gobelin",
  name: "Gobelin",
  maxHp: 1,
  atk: 1,
  def: 0,
  range: 1,
  blocksMovement: true,
};

const objectDefinition: InteractableDefinition = {
  id: "pilier",
  name: "Pilier",
  kind: "pillar",
  initialStateId: "fissure",
  states: [
    {
      id: "fissure",
      label: "fissuré",
      blocksMovement: true,
      blocksLineOfSight: true,
    },
  ],
  interactions: [],
};

const effects: BrouhahaEffectDefinition[] = [
  {
    id: "echo",
    name: "Écho",
    description: "Un écho répond.",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 9,
  },
];

const reinforcement: BrouhahaReinforcementDefinition = {
  id: "seuil-un",
  threshold: 1,
  creatureId: creature.id,
  quantity: 1,
  candidateSpawnPointIds: ["entree"],
  failureMode: "all-or-nothing",
  maxActivations: 1,
};

const reaction: ChainReactionDefinition = {
  id: "pilier-explose",
  trigger: {
    type: "state-entered",
    interactableInstanceId: "pilier-1",
    stateId: "fissure",
  },
  actions: [
    {
      type: "damage",
      centerInstanceId: "pilier-1",
      radius: 2,
      amount: 2,
    },
    {
      type: "brouhaha",
      delta: 1,
      reason: "Le pilier s'effondre.",
    },
  ],
};

describe("phase terminale et renforts", () => {
  it("n'accorde pas la victoire si la même résolution fait entrer un renfort", () => {
    const room = createRoomState({
      scenarioId: "salle-test",
      width: 5,
      height: 3,
      obstacles: [],
      interactableDefinitions: [objectDefinition],
      interactables: [
        {
          id: "pilier-1",
          interactableId: objectDefinition.id,
          position: { column: 2, row: 1 },
          stateId: "fissure",
        },
      ],
      spawnPoints: [
        {
          id: "entree",
          position: { column: 4, row: 1 },
          tags: ["reinforcement"],
          enabled: true,
        },
      ],
      heroes: [
        {
          id: "hero",
          name: "Héroïne",
          position: { column: 0, row: 0 },
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
          id: "dernier-gobelin",
          creatureId: creature.id,
          position: { column: 3, row: 1 },
        },
      ],
    });

    const result = resolveChainReactions(
      room,
      [objectDefinition],
      effects,
      [reaction],
      [
        {
          trigger: reaction.trigger,
          parentReactionId: null,
        },
      ],
      {
        dungeonId: "bastognac",
        rootRequestId: "racine-test",
        creatureDefinitions: [creature],
        reinforcementDefinitions: [reinforcement],
      },
    );

    expect(
      result.state.enemies.find((enemy) => enemy.id === "dernier-gobelin")
        ?.alive,
    ).toBe(false);
    expect(result.state.enemies.filter((enemy) => enemy.alive)).toHaveLength(1);
    expect(result.state.phase).toBe("heroes-turn");
    expect(result.events.map((event) => event.type)).toContain(
      "reinforcement-resolved",
    );
  });
});
