import { describe, expect, it } from "vitest";
import { changeBrouhaha } from "./brouhaha";
import type { BrouhahaReinforcementDefinition } from "./brouhaha-reinforcement-types";
import { resolveBrouhahaReinforcements } from "./brouhaha-reinforcements";
import { createRoomState } from "./room-state";
import type {
  BrouhahaEffectDefinition,
  CreatureDefinition,
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

const effects: BrouhahaEffectDefinition[] = [
  {
    id: "echo",
    name: "Écho",
    description: "La salle répond.",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 12,
  },
  {
    id: "fracas",
    name: "Fracas",
    description: "Les murs tremblent.",
    scope: { type: "universal" },
    minLevel: 10,
    maxLevel: 12,
  },
];

const reinforcements: BrouhahaReinforcementDefinition[] = [
  {
    id: "a-seuil-un",
    threshold: 1,
    creatureId: creature.id,
    quantity: 1,
    candidateSpawnPointIds: ["est-haut", "est-bas"],
    failureMode: "all-or-nothing",
    maxActivations: 2,
  },
  {
    id: "b-seuil-deux",
    threshold: 2,
    creatureId: creature.id,
    quantity: 2,
    candidateSpawnPointIds: ["est-haut", "est-bas"],
    failureMode: "partial",
    maxActivations: 1,
  },
];

function room(): RoomState {
  return createRoomState({
    scenarioId: "salle-test",
    width: 5,
    height: 3,
    obstacles: [],
    spawnPoints: [
      {
        id: "est-haut",
        position: { column: 4, row: 0 },
        tags: ["reinforcement"],
        enabled: true,
      },
      {
        id: "est-bas",
        position: { column: 4, row: 2 },
        tags: ["reinforcement"],
        enabled: true,
      },
    ],
    heroes: [
      {
        id: "hero",
        name: "Héroïne",
        position: { column: 0, row: 1 },
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
        id: "gobelin-initial",
        creatureId: creature.id,
        position: { column: 3, row: 1 },
      },
    ],
  });
}

function change(
  state: RoomState,
  id: string,
  delta: number,
  definitions = reinforcements,
) {
  return changeBrouhaha(
    state,
    effects,
    {
      id,
      delta,
      source: { type: "test", id: "renforts" },
      reason: "Contrôle des seuils",
    },
    {
      dungeonId: "bastognac",
      creatureDefinitions: [creature],
      reinforcementDefinitions: definitions,
    },
  );
}

describe("renforts déclenchés par le Brouhaha", () => {
  it("résout plusieurs seuils dans un ordre stable et explique le partiel", () => {
    const result = change(room(), "brouhaha-plus-deux", 2);

    expect(result.rejection).toBeNull();
    expect(
      result.state.brouhahaReinforcementHistory.map((entry) => [
        entry.reinforcementDefinitionId,
        entry.result,
      ]),
    ).toEqual([
      ["a-seuil-un", "succeeded"],
      ["b-seuil-deux", "partial"],
    ]);
    expect(result.state.enemies).toHaveLength(3);
    expect(result.state.nextBrouhahaReinforcementSequence).toBe(3);
    expect(result.events.map((event) => event.type)).toEqual([
      "brouhaha-change-requested",
      "brouhaha-level-changed",
      "brouhaha-effect-resolved",
      "reinforcement-triggered",
      "spawn-requested",
      "creature-instantiated",
      "spawn-succeeded",
      "reinforcement-resolved",
      "reinforcement-triggered",
      "spawn-requested",
      "creature-instantiated",
      "spawn-succeeded",
      "spawn-rejected",
      "reinforcement-resolved",
    ]);
  });

  it("ne déclenche rien lors d'une baisse ou sans franchissement", () => {
    const raised = change(room(), "montee", 2).state;
    const lowered = change(raised, "baisse", -1, []).state;
    expect(lowered.brouhahaReinforcementHistory).toHaveLength(2);

    const sameThreshold = resolveBrouhahaReinforcements(
      lowered,
      [creature],
      reinforcements,
      { requestId: "sans-franchissement", previousLevel: 1, level: 1 },
    );
    expect(sameThreshold.state).toBe(lowered);
    expect(sameThreshold.history).toEqual([]);
  });

  it("consomme une activation refusée et respecte ensuite la limite", () => {
    const blocked = {
      ...room(),
      heroes: [
        {
          ...room().heroes[0]!,
          position: { column: 4, row: 0 },
        },
      ],
      enemies: [
        {
          ...room().enemies[0]!,
          position: { column: 4, row: 2 },
        },
      ],
    };
    const definition = [{ ...reinforcements[0]!, maxActivations: 1 }];
    const rejected = change(blocked, "premiere-montee", 1, definition);

    expect(rejected.state.brouhahaReinforcementHistory[0]).toMatchObject({
      reinforcementDefinitionId: "a-seuil-un",
      activation: 1,
      result: "rejected",
      createdInstanceIds: [],
    });
    expect(rejected.state.processedSpawnRequestIds).toEqual([]);

    const lowered = change(rejected.state, "redescente", -1, definition).state;
    const raisedAgain = change(lowered, "seconde-montee", 1, definition);
    expect(raisedAgain.state.brouhahaReinforcementHistory).toHaveLength(1);
    expect(
      raisedAgain.events.some(
        (event) => event.type === "reinforcement-triggered",
      ),
    ).toBe(false);
  });

  it("reste idempotent pour une même demande de Brouhaha", () => {
    const first = change(room(), "demande-stable", 1);
    const duplicate = change(first.state, "demande-stable", 1);

    expect(duplicate.state).toBe(first.state);
    expect(first.state.brouhahaReinforcementHistory).toHaveLength(1);
    expect(duplicate.rejection?.reason).toBe("duplicate-request");
  });

  it("réactive une règle après baisse avec un identifiant déterministe", () => {
    const first = change(room(), "montee-un", 1);
    const lowered = change(first.state, "baisse-un", -1).state;
    const second = change(lowered, "montee-deux", 1);

    expect(
      second.state.brouhahaReinforcementHistory.map((entry) => entry.id),
    ).toEqual([
      "reinforcement-montee-un-a-seuil-un-1",
      "reinforcement-montee-deux-a-seuil-un-2",
    ]);
  });

  it("retourne exactement le même résultat pour les mêmes entrées", () => {
    const current = room();
    expect(change(current, "deterministe", 2)).toEqual(
      change(current, "deterministe", 2),
    );
  });
});
